import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert } from 'react-native';
import {
  useAudioRecorder,
  useAudioRecorderState,
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
} from 'expo-audio';
import { CalibrationEngine, OSADetector, SAMPLE_INTERVAL } from '../utils/modelHelper';

// ============================================================
// AccuracyTestScreen
// ใช้สำหรับทดสอบความแม่นยำของ DSP engine:
//   1. อัดเสียงพร้อมเก็บผลที่ระบบตรวจจับได้ (predicted events)
//   2. ฟังเสียงที่อัดไว้ แล้ว "label" ด้วยตัวเอง (ground truth)
//      ว่าจริง ๆ แล้วช่วงไหนเป็นอะไร
//   3. เทียบ predicted vs ground truth -> คำนวณ accuracy/precision/recall
// ============================================================

const TOLERANCE_MS = 5000; // ถือว่า "ตรงกัน" ถ้าเวลาห่างกันไม่เกิน 5 วินาที

const recordingOptions = {
  ...RecordingPresets.LOW_QUALITY,
  isMeteringEnabled: true,
};

export default function AccuracyTestScreen({ navigation }) {
  const [phase, setPhase] = useState('idle'); // idle | calibrating | testing | reviewing
  const [elapsed, setElapsed] = useState(0);
  const [predictedEvents, setPredictedEvents] = useState([]);
  const [groundTruthEvents, setGroundTruthEvents] = useState([]);
  const [calibProgress, setCalibProgress] = useState(0);
  const [results, setResults] = useState(null);

  const audioRecorder = useAudioRecorder(recordingOptions);
  const recorderState = useAudioRecorderState(audioRecorder, SAMPLE_INTERVAL);

  const timerRef = useRef(null);
  const calibEngineRef = useRef(null);
  const detectorRef = useRef(null);
  const predictedRef = useRef([]);
  const groundTruthRef = useRef([]);
  const phaseRef = useRef('idle'); // ใช้ใน effect เพื่อเลี่ยง stale closure

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      if (audioRecorder.isRecording) {
        audioRecorder.stop().catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ทุกครั้งที่ metering อัปเดต
  useEffect(() => {
    const db = typeof recorderState?.metering === 'number' ? recorderState.metering : null;
    if (db === null) return;

    if (phaseRef.current === 'calibrating' && calibEngineRef.current) {
      calibEngineRef.current.addSample(db);
      setCalibProgress(calibEngineRef.current.progress());

      if (calibEngineRef.current.isDone()) {
        const calibration = calibEngineRef.current.finalize();
        detectorRef.current = new OSADetector(calibration, (ev) => {
          predictedRef.current = [...predictedRef.current, ev];
          setPredictedEvents([...predictedRef.current]);
        });
        setPhase('testing');
        setElapsed(0);
        timerRef.current = setInterval(() => setElapsed(p => p + 1), 1000);
      }
    } else if (phaseRef.current === 'testing' && detectorRef.current) {
      detectorRef.current.addSample(db);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recorderState?.metering]);

  async function startTest() {
    try {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
        Alert.alert('ต้องการสิทธิ์ไมโครโฟน', 'กรุณาอนุญาตให้แอปเข้าถึงไมโครโฟน');
        return;
      }

      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
      });

      await audioRecorder.prepareToRecordAsync(recordingOptions);
      audioRecorder.record();

      calibEngineRef.current = new CalibrationEngine();
      predictedRef.current = [];
      groundTruthRef.current = [];
      setPredictedEvents([]);
      setGroundTruthEvents([]);
      setResults(null);
      setCalibProgress(0);
      setPhase('calibrating');
    } catch (err) {
      Alert.alert('เกิดข้อผิดพลาด', err.message);
    }
  }

  // ผู้ใช้กดปุ่ม label ตามจริงขณะทดสอบ (ground truth)
  function labelGroundTruth(type) {
    if (phase !== 'testing') return;
    const now = Date.now();
    const time = new Date(now).toLocaleTimeString('th-TH');
    const ev = { type, time, timestamp: now };
    groundTruthRef.current = [...groundTruthRef.current, ev];
    setGroundTruthEvents([...groundTruthRef.current]);
  }

  async function stopTest() {
    clearInterval(timerRef.current);
    if (detectorRef.current) detectorRef.current.flush();

    try {
      await audioRecorder.stop();
    } catch (e) {}

    computeAccuracy();
    setPhase('reviewing');
  }

  // เทียบ predicted vs ground truth ด้วย time-window matching
  function computeAccuracy() {
    const predicted = predictedRef.current;
    const truth = groundTruthRef.current;

    let truePositives = 0;
    const matchedTruthIdx = new Set();

    predicted.forEach((p) => {
      let bestIdx = -1;
      let bestDiff = Infinity;
      truth.forEach((t, idx) => {
        if (matchedTruthIdx.has(idx)) return;
        if (t.type !== p.type) return;
        const diff = Math.abs(t.timestamp - p.timestamp);
        if (diff <= TOLERANCE_MS && diff < bestDiff) {
          bestDiff = diff;
          bestIdx = idx;
        }
      });
      if (bestIdx !== -1) {
        matchedTruthIdx.add(bestIdx);
        truePositives++;
      }
    });

    const falsePositives = predicted.length - truePositives;
    const falseNegatives = truth.length - matchedTruthIdx.size;

    const precision = predicted.length > 0 ? truePositives / predicted.length : 0;
    const recall = truth.length > 0 ? truePositives / truth.length : 0;
    const f1 = (precision + recall) > 0 ? (2 * precision * recall) / (precision + recall) : 0;

    setResults({
      truePositives,
      falsePositives,
      falseNegatives,
      precision: (precision * 100).toFixed(1),
      recall: (recall * 100).toFixed(1),
      f1: (f1 * 100).toFixed(1),
      predictedCount: predicted.length,
      truthCount: truth.length,
    });
  }

  function reset() {
    setPhase('idle');
    setPredictedEvents([]);
    setGroundTruthEvents([]);
    setResults(null);
    setElapsed(0);
  }

  function formatTime(s) {
    const m = String(Math.floor(s / 60)).padStart(2, '0');
    const sc = String(s % 60).padStart(2, '0');
    return `${m}:${sc}`;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>🧪 ทดสอบความแม่นยำ (Accuracy Test)</Text>
        <Text style={styles.subtitle}>
          สำหรับนักพัฒนา: บันทึกเสียงพร้อม label เหตุการณ์จริงด้วยตนเอง
          เพื่อเปรียบเทียบกับผลที่ระบบ DSP ตรวจจับได้
        </Text>

        {phase === 'idle' && (
          <TouchableOpacity style={styles.startBtn} onPress={startTest}>
            <Text style={styles.startBtnText}>เริ่มทดสอบ</Text>
          </TouchableOpacity>
        )}

        {phase === 'calibrating' && (
          <View style={styles.calibBox}>
            <Text style={styles.calibText}>กำลังวัดระดับเสียงห้อง... {Math.round(calibProgress * 100)}%</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${calibProgress * 100}%` }]} />
            </View>
          </View>
        )}

        {phase === 'testing' && (
          <View>
            <View style={styles.timerBox}>
              <Text style={styles.timerText}>{formatTime(elapsed)}</Text>
              <Text style={styles.timerSub}>กำลังทดสอบ — กดปุ่มด้านล่างทันทีที่ได้ยิน/เห็นเหตุการณ์จริง</Text>
            </View>

            <Text style={styles.sectionLabel}>Ground Truth (กดตามจริง)</Text>
            <View style={styles.labelRow}>
              <TouchableOpacity style={[styles.labelBtn, { backgroundColor: '#f59e0b' }]} onPress={() => labelGroundTruth('snore')}>
                <Text style={styles.labelBtnText}>🔊 กรน</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.labelBtn, { backgroundColor: '#ef4444' }]} onPress={() => labelGroundTruth('apnea')}>
                <Text style={styles.labelBtnText}>⚠️ หยุดหายใจ</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.labelBtn, { backgroundColor: '#38bdf8' }]} onPress={() => labelGroundTruth('movement')}>
                <Text style={styles.labelBtnText}>📳 ขยับตัว</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.compareRow}>
              <View style={styles.compareCol}>
                <Text style={styles.compareTitle}>ระบบตรวจพบ ({predictedEvents.length})</Text>
                {predictedEvents.slice().reverse().map((ev, i) => (
                  <Text key={i} style={styles.compareItem}>{ev.time} - {ev.msg}</Text>
                ))}
              </View>
              <View style={styles.compareCol}>
                <Text style={styles.compareTitle}>Ground Truth ({groundTruthEvents.length})</Text>
                {groundTruthEvents.slice().reverse().map((ev, i) => (
                  <Text key={i} style={styles.compareItem}>{ev.time} - {ev.type}</Text>
                ))}
              </View>
            </View>

            <TouchableOpacity style={styles.stopBtn} onPress={stopTest}>
              <Text style={styles.startBtnText}>⏹ หยุดและดูผลทดสอบ</Text>
            </TouchableOpacity>
          </View>
        )}

        {phase === 'reviewing' && results && (
          <View>
            <View style={styles.resultsBox}>
              <Text style={styles.resultsTitle}>ผลการทดสอบความแม่นยำ</Text>

              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Precision (ความแม่นยำ)</Text>
                <Text style={styles.metricValue}>{results.precision}%</Text>
              </View>
              <Text style={styles.metricDesc}>จากที่ระบบตรวจพบทั้งหมด มีกี่% ที่ตรงกับความจริง</Text>

              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Recall (ความครอบคลุม)</Text>
                <Text style={styles.metricValue}>{results.recall}%</Text>
              </View>
              <Text style={styles.metricDesc}>จากเหตุการณ์จริงทั้งหมด ระบบจับได้กี่%</Text>

              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>F1 Score</Text>
                <Text style={styles.metricValue}>{results.f1}%</Text>
              </View>
              <Text style={styles.metricDesc}>ค่าเฉลี่ยถ่วงน้ำหนักของ Precision และ Recall</Text>

              <View style={styles.divider} />

              <Text style={styles.confusionTitle}>รายละเอียด</Text>
              <Text style={styles.confusionItem}>✅ ตรวจถูกต้อง (True Positive): {results.truePositives}</Text>
              <Text style={styles.confusionItem}>❌ ตรวจผิด/ไม่มีจริง (False Positive): {results.falsePositives}</Text>
              <Text style={styles.confusionItem}>⚠️ พลาดไม่จับ (False Negative): {results.falseNegatives}</Text>
              <Text style={styles.confusionItem}>📊 ระบบตรวจพบทั้งหมด: {results.predictedCount}</Text>
              <Text style={styles.confusionItem}>📋 เหตุการณ์จริงทั้งหมด: {results.truthCount}</Text>
            </View>

            <Text style={styles.note}>
              * ผลทดสอบนี้ใช้สำหรับการพัฒนาและปรับจูน threshold ใน modelHelper.js เท่านั้น
              ความแม่นยำขึ้นอยู่กับสภาพแวดล้อมขณะทดสอบและความแม่นยำของการ label ด้วยมือ
            </Text>

            <TouchableOpacity style={styles.startBtn} onPress={reset}>
              <Text style={styles.startBtnText}>ทดสอบใหม่</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>ย้อนกลับ</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f172a' },
  container: { flex: 1, padding: 20 },
  title: { color: '#f1f5f9', fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { color: '#64748b', fontSize: 13, marginBottom: 24, lineHeight: 20 },

  startBtn: { backgroundColor: '#38bdf8', borderRadius: 14, padding: 18, alignItems: 'center', marginBottom: 16 },
  startBtnText: { color: '#0f172a', fontSize: 16, fontWeight: 'bold' },
  stopBtn: { backgroundColor: '#ef4444', borderRadius: 14, padding: 18, alignItems: 'center', marginTop: 16 },
  backBtn: { paddingVertical: 12, alignItems: 'center' },
  backBtnText: { color: '#64748b', fontSize: 14 },

  calibBox: { backgroundColor: '#1e293b', borderRadius: 16, padding: 20, marginBottom: 16 },
  calibText: { color: '#f1f5f9', fontSize: 14, marginBottom: 10, textAlign: 'center' },
  progressTrack: { height: 8, backgroundColor: '#0f172a', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#38bdf8' },

  timerBox: { backgroundColor: '#1e293b', borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 16 },
  timerText: { color: '#f1f5f9', fontSize: 36, fontWeight: 'bold' },
  timerSub: { color: '#64748b', fontSize: 12, marginTop: 6, textAlign: 'center' },

  sectionLabel: { color: '#94a3b8', fontSize: 13, marginBottom: 8 },
  labelRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  labelBtn: { flex: 1, borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  labelBtnText: { color: '#0f172a', fontWeight: 'bold', fontSize: 13 },

  compareRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  compareCol: { flex: 1, backgroundColor: '#1e293b', borderRadius: 12, padding: 12, minHeight: 150 },
  compareTitle: { color: '#94a3b8', fontSize: 12, fontWeight: 'bold', marginBottom: 8 },
  compareItem: { color: '#e2e8f0', fontSize: 11, marginBottom: 4 },

  resultsBox: { backgroundColor: '#1e293b', borderRadius: 16, padding: 20, marginBottom: 16 },
  resultsTitle: { color: '#f1f5f9', fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  metricRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  metricLabel: { color: '#e2e8f0', fontSize: 14, fontWeight: '600' },
  metricValue: { color: '#38bdf8', fontSize: 18, fontWeight: 'bold' },
  metricDesc: { color: '#64748b', fontSize: 11, marginBottom: 14 },
  divider: { height: 1, backgroundColor: '#334155', marginVertical: 10 },
  confusionTitle: { color: '#94a3b8', fontSize: 13, fontWeight: 'bold', marginBottom: 8 },
  confusionItem: { color: '#e2e8f0', fontSize: 12, marginBottom: 6 },

  note: { color: '#475569', fontSize: 11, textAlign: 'center', fontStyle: 'italic', marginBottom: 16, lineHeight: 16 },
});