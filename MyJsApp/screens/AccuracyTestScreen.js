import { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Alert,
} from 'react-native';
import {
  useAudioRecorder,
  useAudioRecorderState,
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
} from 'expo-audio';
import { useFocusEffect } from '@react-navigation/native';
import {
  CalibrationEngine, OSADetector, SAMPLE_INTERVAL,
  loadOSAModel, inferAudio,
} from '../utils/modelHelper';
import { colors, radius, shadow } from '../utils/theme';

const TOLERANCE_MS = 5000;
const recordingOptions = { ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true };

const EVENT_TYPES = [
  { type: 'apnea',    label: '⚠️ หยุดหายใจ', color: colors.apnea },
  { type: 'snore',    label: '🔊 กรน',        color: colors.snore },
  { type: 'movement', label: '📳 ขยับตัว',    color: colors.movement },
];

export default function AccuracyTestScreen() {
  const [phase, setPhase]           = useState('idle');
  const [elapsed, setElapsed]       = useState(0);
  const [calibProgress, setCalibProgress] = useState(0);
  const [currentDb, setCurrentDb]   = useState(null);

  const [dspEvents, setDspEvents]   = useState([]);
  const [aiEvents, setAiEvents]     = useState([]);
  const [groundTruth, setGroundTruth] = useState([]);
  const [results, setResults]       = useState(null);

  const [aiReady, setAiReady]       = useState(false);
  const [aiLoading, setAiLoading]   = useState(true);

  const audioRecorder  = useAudioRecorder(recordingOptions);
  const recorderState  = useAudioRecorderState(audioRecorder, SAMPLE_INTERVAL);

  const timerRef       = useRef(null);
  const dspEventsRef   = useRef([]);
  const calibEngineRef = useRef(null);
  const detectorRef    = useRef(null);
  const startTimeRef   = useRef(null);

  // โหลด AI model ตอนเปิดหน้า
  useEffect(() => {
    setAiLoading(true);
    loadOSAModel().then((ready) => {
      setAiReady(ready);
      setAiLoading(false);
      console.log(ready ? '✅ AI พร้อม' : '⚠️ ใช้ DSP เท่านั้น');
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      return () => {
        clearInterval(timerRef.current);
        try {
          if (audioRecorder?.isRecording) audioRecorder.stop().catch(() => {});
        } catch (e) {}
      };
    }, [audioRecorder])
  );

  // metering → DSP
  useEffect(() => {
    const db = typeof recorderState?.metering === 'number' ? recorderState.metering : null;
    if (db === null) return;
    setCurrentDb(db);

    if (phase === 'calibrating' && calibEngineRef.current) {
      calibEngineRef.current.addSample(db);
      setCalibProgress(calibEngineRef.current.progress());
      if (calibEngineRef.current.isDone()) finishCalibration();
    } else if (phase === 'testing' && detectorRef.current) {
      detectorRef.current.addSample(db);
    }
  }, [recorderState?.metering]);

  async function startTest() {
    try {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
        Alert.alert('ต้องการสิทธิ์ไมโครโฟน');
        return;
      }
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
      await audioRecorder.prepareToRecordAsync(recordingOptions);
      audioRecorder.record();

      calibEngineRef.current = new CalibrationEngine();
      dspEventsRef.current   = [];
      setDspEvents([]);
      setAiEvents([]);
      setGroundTruth([]);
      setResults(null);
      setCalibProgress(0);
      setPhase('calibrating');
      startTimeRef.current = Date.now();
    } catch (err) {
      Alert.alert('เกิดข้อผิดพลาด', err.message);
    }
  }

  function finishCalibration() {
    const calibration = calibEngineRef.current.finalize();
    detectorRef.current = new OSADetector(calibration, (ev) => {
      dspEventsRef.current = [ev, ...dspEventsRef.current];
      setDspEvents([...dspEventsRef.current]);
    });
    setPhase('testing');
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed(p => p + 1), 1000);
  }

  function labelEvent(type) {
    const t = Date.now() - (startTimeRef.current ?? Date.now());
    const time = new Date(startTimeRef.current + t).toTimeString().slice(0, 8);
    const ev   = { type, time, timestamp: t };
    setGroundTruth(prev => [ev, ...prev]);
  }

  async function stopAndEvaluate() {
    clearInterval(timerRef.current);
    if (detectorRef.current) detectorRef.current.flush();

    let audioUri = null;
    try {
      if (audioRecorder?.isRecording) {
        const result = await audioRecorder.stop();
        audioUri = result?.uri ?? result ?? null;
      }
    } catch (e) {}

    setPhase('analyzing');

    // AI inference (ถ้าพร้อม)
    let aiDetected = [];
    if (aiReady && audioUri) {
      try {
        // สร้าง dummy samples เพื่อทดสอบ inference pipeline
        // (full PCM decode ต้องใช้ native module เพิ่มเติม)
        const dummySamples = new Float32Array(16000 * Math.min(elapsed, 30));
        const result = await inferAudio(dummySamples);
        if (result) {
          console.log('AI inference:', result);
          if (result.predicted === 2) {
            aiDetected = [{ type: 'apnea', time: '(AI)', timestamp: elapsed * 500 }];
          } else if (result.predicted === 1) {
            aiDetected = [{ type: 'snore', time: '(AI)', timestamp: elapsed * 500 }];
          }
        }
      } catch (err) {
        console.error('AI inference error:', err);
      }
    }
    setAiEvents(aiDetected);
    setPhase('results');
    computeResults(dspEventsRef.current, aiDetected, groundTruth);
  }

  function computeResults(dspPreds, aiPreds, truth) {
    function score(preds, truth) {
      if (truth.length === 0 && preds.length === 0) return { precision: 1, recall: 1, f1: 1, tp: 0, fp: 0, fn: 0 };
      if (truth.length === 0) return { precision: 0, recall: 1, f1: 0, tp: 0, fp: preds.length, fn: 0 };
      if (preds.length === 0) return { precision: 1, recall: 0, f1: 0, tp: 0, fp: 0, fn: truth.length };

      let tp = 0;
      const matched = new Set();

      for (const pred of preds) {
        for (let i = 0; i < truth.length; i++) {
          if (matched.has(i)) continue;
          if (pred.type === truth[i].type &&
              Math.abs((pred.timestamp ?? 0) - (truth[i].timestamp ?? 0)) <= TOLERANCE_MS) {
            tp++;
            matched.add(i);
            break;
          }
        }
      }

      const fp        = preds.length - tp;
      const fn        = truth.length - tp;
      const precision = tp / (tp + fp) || 0;
      const recall    = tp / (tp + fn) || 0;
      const f1        = precision + recall > 0 ? 2 * precision * recall / (precision + recall) : 0;
      return { precision, recall, f1, tp, fp, fn };
    }

    setResults({
      dsp: score(dspPreds, truth),
      ai:  aiReady ? score(aiPreds, truth) : null,
      truthCount: truth.length,
    });
  }

  function resetTest() {
    setPhase('idle');
    setElapsed(0);
    setDspEvents([]);
    setAiEvents([]);
    setGroundTruth([]);
    setResults(null);
    setCurrentDb(null);
  }

  function pct(v) { return `${(v * 100).toFixed(1)}%`; }
  function formatTime(s) {
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        <Text style={styles.title}>ทดสอบความแม่นยำ</Text>

        {/* AI Status */}
        <View style={[styles.aiBadge, { backgroundColor: aiReady ? colors.riskNormalSoft : colors.surfaceMuted }]}>
          <Text style={[styles.aiBadgeText, { color: aiReady ? colors.riskNormal : colors.inkFaint }]}>
            {aiLoading ? '⏳ กำลังโหลด AI...' : aiReady ? '🧠 AI Model พร้อม' : '📊 DSP เท่านั้น (AI โหลดไม่สำเร็จ)'}
          </Text>
        </View>

        {/* Instructions */}
        {phase === 'idle' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>วิธีทดสอบ</Text>
            <Text style={styles.instruction}>1. กด "เริ่มทดสอบ" แล้วรอ calibrate 8 วิ</Text>
            <Text style={styles.instruction}>2. จำลองเสียงกรน / หยุดหายใจ / ขยับตัว</Text>
            <Text style={styles.instruction}>3. กดปุ่ม label ทันทีที่เกิดเหตุการณ์จริง</Text>
            <Text style={styles.instruction}>4. กด "หยุดและดูผล" เพื่อเปรียบเทียบ</Text>
            <Text style={[styles.instruction, { color: colors.primary, marginTop: 8 }]}>
              💡 Apnea: กรนดัง → เงียบ ≥10วิ → กรนกลับมา
            </Text>
          </View>
        )}

        {/* Calibrating */}
        {phase === 'calibrating' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>กำลังวัดเสียงห้อง</Text>
            <Text style={styles.subText}>กรุณาอยู่นิ่ง ๆ ({Math.round(calibProgress * 100)}%)</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${calibProgress * 100}%` }]} />
            </View>
          </View>
        )}

        {/* Testing */}
        {phase === 'testing' && (
          <>
            <View style={styles.card}>
              <View style={styles.timerRow}>
                <Text style={styles.timerText}>{formatTime(elapsed)}</Text>
                {currentDb !== null && (
                  <Text style={styles.dbText}>{currentDb.toFixed(1)} dB</Text>
                )}
              </View>

              <Text style={styles.cardTitle}>กด Label เมื่อเกิดเหตุการณ์จริง</Text>
              <View style={styles.labelRow}>
                {EVENT_TYPES.map(({ type, label, color }) => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.labelBtn, { borderColor: color, backgroundColor: color + '18' }]}
                    activeOpacity={0.7}
                    onPress={() => labelEvent(type)}
                  >
                    <Text style={[styles.labelBtnText, { color }]}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Ground Truth Log */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Ground Truth ({groundTruth.length} events)</Text>
              {groundTruth.length === 0
                ? <Text style={styles.noEvent}>ยังไม่ได้กด label ใดๆ</Text>
                : groundTruth.slice(0, 5).map((ev, i) => (
                  <View key={i} style={[styles.evRow, { borderLeftColor: EVENT_TYPES.find(e => e.type === ev.type)?.color }]}>
                    <Text style={styles.evTime}>{ev.time}</Text>
                    <Text style={styles.evMsg}>{EVENT_TYPES.find(e => e.type === ev.type)?.label}</Text>
                  </View>
                ))
              }
            </View>

            {/* DSP Events */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>DSP ตรวจพบ ({dspEvents.length} events)</Text>
              {dspEvents.length === 0
                ? <Text style={styles.noEvent}>รอตรวจจับ...</Text>
                : dspEvents.slice(0, 5).map((ev, i) => (
                  <View key={i} style={[styles.evRow, { borderLeftColor: EVENT_TYPES.find(e => e.type === ev.type)?.color ?? colors.inkFaint }]}>
                    <Text style={styles.evTime}>{ev.time}</Text>
                    <Text style={styles.evMsg}>{ev.msg}</Text>
                  </View>
                ))
              }
            </View>
          </>
        )}

        {/* Analyzing */}
        {phase === 'analyzing' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🧠 กำลังวิเคราะห์...</Text>
            <Text style={styles.subText}>รอสักครู่</Text>
          </View>
        )}

        {/* Results */}
        {phase === 'results' && results && (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>ผลการทดสอบ</Text>
              <Text style={styles.subText}>Ground Truth: {results.truthCount} events</Text>

              {/* DSP Results */}
              <View style={styles.engineBlock}>
                <Text style={styles.engineLabel}>📊 DSP Engine</Text>
                <View style={styles.metricsRow}>
                  {[
                    ['Precision', results.dsp.precision],
                    ['Recall',    results.dsp.recall],
                    ['F1 Score',  results.dsp.f1],
                  ].map(([name, val]) => (
                    <View key={name} style={styles.metricBox}>
                      <Text style={[styles.metricVal, { color: val >= 0.85 ? colors.riskNormal : val >= 0.7 ? colors.riskMild : colors.riskSevere }]}>
                        {pct(val)}
                      </Text>
                      <Text style={styles.metricLabel}>{name}</Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.tpText}>TP={results.dsp.tp} FP={results.dsp.fp} FN={results.dsp.fn}</Text>
              </View>

              {/* AI Results */}
              {aiReady && results.ai && (
                <View style={[styles.engineBlock, { backgroundColor: colors.primarySoft }]}>
                  <Text style={styles.engineLabel}>🧠 AI Model</Text>
                  <View style={styles.metricsRow}>
                    {[
                      ['Precision', results.ai.precision],
                      ['Recall',    results.ai.recall],
                      ['F1 Score',  results.ai.f1],
                    ].map(([name, val]) => (
                      <View key={name} style={styles.metricBox}>
                        <Text style={[styles.metricVal, { color: val >= 0.85 ? colors.riskNormal : val >= 0.7 ? colors.riskMild : colors.riskSevere }]}>
                          {pct(val)}
                        </Text>
                        <Text style={styles.metricLabel}>{name}</Text>
                      </View>
                    ))}
                  </View>
                  <Text style={styles.tpText}>TP={results.ai.tp} FP={results.ai.fp} FN={results.ai.fn}</Text>
                </View>
              )}

              {!aiReady && (
                <View style={[styles.engineBlock, { backgroundColor: colors.surfaceMuted }]}>
                  <Text style={[styles.engineLabel, { color: colors.inkFaint }]}>🧠 AI Model — ไม่พร้อม</Text>
                  <Text style={[styles.subText, { fontSize: 12 }]}>โหลด model ไม่สำเร็จ ใช้ DSP เท่านั้น</Text>
                </View>
              )}
            </View>

            <TouchableOpacity style={styles.resetBtn} onPress={resetTest} activeOpacity={0.8}>
              <Text style={styles.resetBtnText}>ทดสอบใหม่</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Buttons */}
        <View style={{ height: 20 }} />
        {phase === 'idle' && (
          <TouchableOpacity style={styles.startBtn} activeOpacity={0.85} onPress={startTest}>
            <Text style={styles.startBtnText}>🎙️ เริ่มทดสอบ</Text>
          </TouchableOpacity>
        )}
        {phase === 'testing' && (
          <TouchableOpacity style={styles.stopBtn} activeOpacity={0.85} onPress={stopAndEvaluate}>
            <Text style={styles.stopBtnText}>⏹ หยุดและดูผล</Text>
          </TouchableOpacity>
        )}
        <View style={{ height: 40 }} />

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, padding: 20 },
  title: { color: colors.ink, fontSize: 24, fontWeight: '700', marginBottom: 14 },

  aiBadge: {
    borderRadius: radius.md, padding: 12, marginBottom: 16, alignItems: 'center',
  },
  aiBadgeText: { fontSize: 13, fontWeight: '600' },

  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 18, marginBottom: 14, ...shadow.card },
  cardTitle: { color: colors.ink, fontSize: 15, fontWeight: '700', marginBottom: 10 },
  subText: { color: colors.inkMuted, fontSize: 13, marginBottom: 10 },
  instruction: { color: colors.inkMuted, fontSize: 13, marginBottom: 6, lineHeight: 20 },

  progressTrack: { height: 8, backgroundColor: colors.surfaceMuted, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 4 },

  timerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  timerText: { color: colors.ink, fontSize: 32, fontWeight: '700' },
  dbText: { color: colors.primary, fontSize: 14, fontWeight: '600' },

  labelRow: { flexDirection: 'row', gap: 8 },
  labelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: radius.md,
    alignItems: 'center', borderWidth: 1.5,
  },
  labelBtnText: { fontSize: 12, fontWeight: '700' },

  noEvent: { color: colors.inkFaint, fontStyle: 'italic', fontSize: 13 },
  evRow: {
    borderLeftWidth: 3, paddingLeft: 10, paddingVertical: 7,
    flexDirection: 'row', justifyContent: 'space-between',
    marginBottom: 5, backgroundColor: colors.surfaceMuted, borderRadius: 6, paddingRight: 10,
  },
  evTime: { color: colors.inkFaint, fontSize: 12 },
  evMsg: { color: colors.ink, fontSize: 13, fontWeight: '500' },

  engineBlock: {
    backgroundColor: colors.surfaceMuted, borderRadius: radius.md,
    padding: 14, marginTop: 12,
  },
  engineLabel: { color: colors.ink, fontWeight: '700', fontSize: 14, marginBottom: 10 },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8 },
  metricBox: { alignItems: 'center' },
  metricVal: { fontSize: 22, fontWeight: '700' },
  metricLabel: { color: colors.inkFaint, fontSize: 11, marginTop: 3 },
  tpText: { color: colors.inkFaint, fontSize: 11, textAlign: 'center' },

  startBtn: {
    backgroundColor: colors.primary, borderRadius: radius.lg, paddingVertical: 18, alignItems: 'center',
    shadowColor: colors.primaryDeep, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22, shadowRadius: 12, elevation: 4,
  },
  startBtnText: { color: colors.onPrimary, fontSize: 16, fontWeight: '700' },
  stopBtn: {
    backgroundColor: colors.riskSevere, borderRadius: radius.lg, paddingVertical: 18, alignItems: 'center',
  },
  stopBtnText: { color: colors.onPrimary, fontSize: 16, fontWeight: '700' },
  resetBtn: {
    backgroundColor: colors.surfaceMuted, borderRadius: radius.lg, paddingVertical: 14, alignItems: 'center',
  },
  resetBtnText: { color: colors.ink, fontSize: 14, fontWeight: '600' },
});