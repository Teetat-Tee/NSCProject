import { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  ScrollView, Alert, Modal, Animated, Easing, StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Accelerometer } from 'expo-sensors';
import {
  useAudioRecorder, useAudioRecorderState,
  AudioModule, RecordingPresets, setAudioModeAsync,
} from 'expo-audio';
import { Mic } from 'lucide-react-native';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { CalibrationEngine, OSADetector, SAMPLE_INTERVAL } from '../utils/modelHelper';
import { colors as C, radius, shadow } from '../utils/theme';
import { getToken } from '../utils/apiClient';
import { File } from 'expo-file-system';

const SERVER_URL = 'https://osa-detect-server.onrender.com';
const CHUNK_SEC  = 30;
const PHASE = { IDLE: 'idle', CALIBRATING: 'calibrating', RECORDING: 'recording', ANALYZING: 'analyzing' };

const night = {
  bg: '#080404', surface: '#120808', surfaceMuted: '#1C0E0E',
  border: '#2E1010', accent: '#C0392B',
  text: '#E8C4C4', textMuted: '#9B6B6B', textFaint: '#5A3333',
};

export default function RecordScreen({ navigation }) {
  const [phase, setPhase]           = useState(PHASE.IDLE);
  const [elapsed, setElapsed]       = useState(0);
  const [events, setEvents]         = useState([]);
  const [calibPct, setCalibPct]     = useState(0);
  const [micError, setMicError]     = useState(null);
  const [showInstr, setShowInstr]   = useState(false);
  const [analyzingText, setAnalyzingText] = useState('');
  const [apneaCount, setApneaCount] = useState(0);
  const [accelZ, setAccelZ]         = useState(0);
  const [chunkCount, setChunkCount] = useState(0);

  const audioRecorder = useAudioRecorder({ ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true });
  const recorderState = useAudioRecorderState(audioRecorder, SAMPLE_INTERVAL);

  const timerRef      = useRef(null);
  const chunkTimerRef = useRef(null);
  const eventsRef     = useRef([]);
  const calibRef      = useRef(null);
  const detectorRef   = useRef(null);
  const batchRef      = useRef(0);
  const elapsedRef    = useRef(0);
  const chunkStartRef = useRef(0);
  const isStoppingRef = useRef(false);
  const tokenRef      = useRef(null);

  const isCalib     = phase === PHASE.CALIBRATING;
  const isRec       = phase === PHASE.RECORDING;
  const isAnalyzing = phase === PHASE.ANALYZING;
  const isActive    = isCalib || isRec || isAnalyzing;

  const t      = isActive ? night : null;
  const bg     = t ? t.bg           : C.bg;
  const surface= t ? t.surface      : C.surface;
  const surfMut= t ? t.surfaceMuted : C.surfaceMuted;
  const ink    = t ? t.text         : C.ink;
  const inkMut = t ? t.textMuted    : C.inkMuted;
  const inkFnt = t ? t.textFaint    : C.inkFaint;
  const accent = t ? t.accent       : C.primary;
  const onAcc  = '#fff';

  useEffect(() => {
    if (isActive) activateKeepAwakeAsync();
    else deactivateKeepAwake();
    return () => deactivateKeepAwake();
  }, [isActive]);

  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    let loop;
    if (isActive) {
      const dur = isRec ? 4000 : 2200;
      loop = Animated.loop(Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: dur, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: dur, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]));
      loop.start();
    } else { pulse.setValue(0); }
    return () => loop?.stop();
  }, [isActive, isRec]);

  const s1 = pulse.interpolate({ inputRange: [0,1], outputRange: [1, 1.4] });
  const o1 = pulse.interpolate({ inputRange: [0,1], outputRange: [0.3, 0] });
  const s2 = pulse.interpolate({ inputRange: [0,1], outputRange: [1, 1.8] });
  const o2 = pulse.interpolate({ inputRange: [0,1], outputRange: [0.15, 0] });

  const defaultTab = {
    position: 'absolute', bottom: 24, left: 20, right: 20, height: 72,
    borderRadius: radius.xl, backgroundColor: C.surface, borderTopWidth: 0,
    paddingBottom: 8, paddingTop: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12, shadowRadius: 20, elevation: 12,
  };
  useEffect(() => {
    const nav = navigation.getParent('RootTabs') || navigation.getParent();
    if (!nav) return;
    nav.setOptions({ tabBarStyle: isActive ? { display: 'none' } : defaultTab });
    return () => nav.setOptions({ tabBarStyle: defaultTab });
  }, [isActive]);

  useFocusEffect(useCallback(() => {
    return () => {
      clearInterval(timerRef.current);
      clearTimeout(chunkTimerRef.current);
      try { audioRecorder?.isRecording && audioRecorder.stop().catch(() => {}); } catch {}
    };
  }, [audioRecorder]));

  useEffect(() => {
    Accelerometer.setUpdateInterval(isRec ? 2000 : 500);
    const sub = Accelerometer.addListener(({ z }) => setAccelZ(Math.abs(z)));
    return () => sub.remove();
  }, [isRec]);

  useEffect(() => {
    const db = typeof recorderState?.metering === 'number' ? recorderState.metering : null;
    if (db === null) return;
    if (isCalib && calibRef.current) {
      calibRef.current.addSample(db);
      setCalibPct(calibRef.current.progress());
      if (calibRef.current.isDone()) finishCalib();
    } else if (isRec && detectorRef.current) {
      detectorRef.current.addSample(db);
      batchRef.current++;
      if (batchRef.current >= 3) {
        batchRef.current = 0;
        const ev = eventsRef.current;
        setEvents([...ev]);
        setApneaCount(ev.filter(e => e.type === 'apnea').length);
      }
    }
  }, [recorderState?.metering]);

  function addEvent(ev) {
    eventsRef.current = [ev, ...eventsRef.current];
  }

  async function sendChunk(uri, chunkStart) {
    console.log('[CHUNK] sendChunk uri:', uri);
    try {
      if (!tokenRef.current) tokenRef.current = await getToken();
      console.log('[CHUNK] token ok');

      // อ่านไฟล์เป็น base64 (stable กว่า FormData บน iOS)
      const file = new File(uri);
      const b64 = await file.base64();
      console.log('[CHUNK] base64 size:', b64.length);

      console.log('[CHUNK] fetching...');
      const controller = new AbortController();
      const tid = setTimeout(() => {
        console.warn('[CHUNK] TIMEOUT 120s');
        controller.abort();
      }, 120000);

      const res = await fetch(`${SERVER_URL}/analyze_base64`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenRef.current}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ audio_base64: b64, chunk_start: chunkStart }),
        signal: controller.signal,
      });
      clearTimeout(tid);
      console.log('[CHUNK] status:', res.status);

      const data = await res.json();
      console.log('[CHUNK] response:', JSON.stringify(data));

      if (data.success && data.events?.length > 0) {
        for (const ev of data.events) {
          eventsRef.current = [ev, ...eventsRef.current];
        }
        setEvents([...eventsRef.current]);
        setApneaCount(eventsRef.current.filter(e => e.type === 'apnea').length);
      }
      setChunkCount(c => c + 1);
    } catch (err) {
      console.warn('[CHUNK] send failed:', err.message);
    }
  }

  async function rotateChunk() {
    if (isStoppingRef.current) return;
    try {
      const chunkStart = chunkStartRef.current;
      chunkStartRef.current = elapsedRef.current;

      // 1. หยุดบันทึก + เก็บ uri
      await audioRecorder.stop();
      const uri = audioRecorder.uri ?? null;
      console.log('[CHUNK] uri after stop:', uri);

      // 2. deactivate audio session เพื่อให้ iOS ยอมส่ง network
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: false });

      // 3. await sendChunk — ต้องรอให้ส่งเสร็จก่อน reactivate
      //    เพราะ iOS block network ถ้า audio session active
      if (uri) {
        await sendChunk(uri, chunkStart);
      }

      // 4. reactivate แล้วเริ่ม chunk ใหม่
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await audioRecorder.prepareToRecordAsync({ ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true });
      audioRecorder.record();
      console.log('[CHUNK] new chunk recording started');

      // ตั้ง timer chunk ถัดไป
      chunkTimerRef.current = setTimeout(rotateChunk, CHUNK_SEC * 1000);
    } catch (err) {
      console.warn('[CHUNK] rotate error:', err.message);
      // พยายาม reactivate แล้วบันทึกต่อ
      try {
        await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
        await audioRecorder.prepareToRecordAsync({ ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true });
        audioRecorder.record();
      } catch {}
      chunkTimerRef.current = setTimeout(rotateChunk, CHUNK_SEC * 1000);
    }
  }

  async function handleStart() {
    setShowInstr(false);
    setMicError(null);
    try {
      const { granted } = await AudioModule.requestRecordingPermissionsAsync();
      if (!granted) { Alert.alert('ต้องการสิทธิ์ไมโครโฟน'); return; }
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
      await audioRecorder.prepareToRecordAsync({ ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true });
      audioRecorder.record();

      calibRef.current      = new CalibrationEngine();
      eventsRef.current     = [];
      tokenRef.current      = null;
      isStoppingRef.current = false;
      setEvents([]); setApneaCount(0); setCalibPct(0); setChunkCount(0);
      elapsedRef.current    = 0;
      chunkStartRef.current = 0;
      setElapsed(0);
      setPhase(PHASE.CALIBRATING);
    } catch (e) {
      setMicError('ไม่สามารถเริ่มบันทึกได้ กรุณาลองใหม่');
    }
  }

  function finishCalib() {
    detectorRef.current   = new OSADetector(calibRef.current.finalize(), addEvent);
    elapsedRef.current    = 0;
    chunkStartRef.current = 0;
    setElapsed(0);
    timerRef.current = setInterval(() => {
      elapsedRef.current += 1;
      setElapsed(elapsedRef.current);
    }, 1000);
    chunkTimerRef.current = setTimeout(rotateChunk, CHUNK_SEC * 1000);
    setPhase(PHASE.RECORDING);
  }

  async function handleStop() {
    isStoppingRef.current = true;
    clearInterval(timerRef.current);
    clearTimeout(chunkTimerRef.current);
    detectorRef.current?.flush?.();

    const dur = elapsedRef.current;
    setPhase(PHASE.ANALYZING);
    setAnalyzingText('กำลังส่ง chunk สุดท้าย...');

    try {
      let uri = null;
      if (audioRecorder?.isRecording) {
        await audioRecorder.stop();
        uri = audioRecorder.uri ?? null;
      }
      if (uri) await sendChunk(uri, chunkStartRef.current);
    } catch {}

    const allEvents = [...eventsRef.current];
    const apnea     = allEvents.filter(e => e.type === 'apnea').length;
    const ahi       = dur > 0 ? Math.round((apnea / (dur / 3600)) * 10) / 10 : 0;
    const riskLabel = ahi < 5 ? 'ปกติ' : ahi < 15 ? 'เล็กน้อย' : ahi < 30 ? 'ปานกลาง' : 'รุนแรง';

    setPhase(PHASE.IDLE);
    navigation.navigate('Survey', { duration: dur, events: allEvents, engine: 'ai-server', ahi, riskLabel });
  }

  function fmt(s) {
    return `${String(Math.floor(s/3600)).padStart(2,'0')}:${String(Math.floor((s%3600)/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]}>
      <StatusBar barStyle={isActive ? 'light-content' : 'dark-content'} backgroundColor={bg} />
      <View style={styles.root}>

        <View style={[styles.hero, { backgroundColor: surface }, !isActive && shadow.raised, isActive && { borderWidth: 1, borderColor: night.border }]}>
          {isActive && (
            <>
              <Animated.View style={[styles.ring, { backgroundColor: accent, transform: [{ scale: s2 }], opacity: o2 }]} />
              <Animated.View style={[styles.ring, { backgroundColor: accent, transform: [{ scale: s1 }], opacity: o1 }]} />
            </>
          )}
          <View style={[styles.core, { backgroundColor: isRec ? accent : surfMut }]}>
            <Mic color={isRec ? onAcc : inkMut} size={34} strokeWidth={1.8} />
          </View>

          {isCalib && (
            <View style={styles.phaseBlock}>
              <Text style={[styles.phaseLabel, { color: inkMut }]}>กำลังปรับตั้งค่าห้อง</Text>
              <Text style={[styles.phaseSub, { color: inkFnt }]}>อยู่นิ่งๆ สักครู่</Text>
              <View style={[styles.track, { backgroundColor: surfMut }]}>
                <View style={[styles.trackFill, { width: `${calibPct * 100}%`, backgroundColor: accent }]} />
              </View>
              <Text style={[styles.phasePct, { color: accent }]}>{Math.round(calibPct * 100)}%</Text>
            </View>
          )}

          {isAnalyzing && (
            <View style={styles.phaseBlock}>
              <Text style={[styles.phaseLabel, { color: inkMut }]}>กำลังสรุปผล</Text>
              <Text style={[styles.phaseSub, { color: inkFnt }]}>{analyzingText}</Text>
            </View>
          )}

          {!isCalib && !isAnalyzing && (
            <View style={styles.phaseBlock}>
              <Text style={[styles.phaseLabel, { color: inkMut }]}>{isRec ? 'กำลังบันทึก' : 'พร้อมบันทึก'}</Text>
              <Text style={[styles.timer, { color: ink }]}>{fmt(elapsed)}</Text>
            </View>
          )}

          {isRec && (
            <View style={styles.chips}>
              {[
                { label: `${apneaCount} หยุดหายใจ`, color: accent },
                { label: `${chunkCount} chunk`, color: inkMut },
                { label: `${accelZ.toFixed(1)}g`, color: inkMut },
              ].map((c, i) => (
                <View key={i} style={[styles.chip, { backgroundColor: surfMut }]}>
                  <View style={[styles.chipDot, { backgroundColor: c.color }]} />
                  <Text style={[styles.chipText, { color: inkMut }]}>{c.label}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={[styles.log, { backgroundColor: surface }, !isActive && shadow.card]}>
          <View style={styles.logHeader}>
            <Text style={[styles.logTitle, { color: ink }]}>เหตุการณ์</Text>
            {isRec && (
              <View style={[styles.engineBadge, { backgroundColor: surfMut }]}>
                <View style={[styles.badgeDot, { backgroundColor: accent }]} />
                <Text style={[styles.badgeText, { color: inkMut }]}>AI real-time</Text>
              </View>
            )}
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {events.length === 0 ? (
              <Text style={[styles.logEmpty, { color: inkFnt }]}>
                {isCalib ? 'กำลังตั้งค่า...' : isAnalyzing ? 'กำลังสรุปผล...' : isRec ? 'AI จะแสดงผลทุก 30 วินาที' : 'เหตุการณ์จะปรากฏที่นี่'}
              </Text>
            ) : events.map((ev, i) => (
              <View key={i} style={[styles.evRow, {
                borderLeftColor: ev.type === 'apnea' ? accent : inkFnt,
                backgroundColor: surfMut,
              }]}>
                <Text style={[styles.evTime, { color: inkFnt }]}>{ev.time}</Text>
                <Text style={[styles.evMsg, { color: ink }]}>{ev.msg}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {micError && <Text style={[styles.error, { color: C.riskSevere }]}>{micError}</Text>}

        {phase === PHASE.IDLE && (
          <TouchableOpacity style={[styles.startBtn, { backgroundColor: C.primary, shadowColor: C.primaryDeep }]} activeOpacity={0.88} onPress={() => setShowInstr(true)}>
            <Mic color={C.onPrimary} size={22} strokeWidth={2} />
            <Text style={[styles.btnText, { color: C.onPrimary }]}>เริ่มบันทึก</Text>
          </TouchableOpacity>
        )}
        {(isCalib || isAnalyzing) && (
          <View style={[styles.disabledBtn, { backgroundColor: surfMut }]}>
            <Text style={[styles.disabledText, { color: inkMut }]}>{isCalib ? 'กำลังตั้งค่า...' : 'กำลังสรุปผล...'}</Text>
          </View>
        )}
        {isRec && (
          <TouchableOpacity style={[styles.stopBtn, { backgroundColor: accent }]} activeOpacity={0.85} onPress={handleStop}>
            <Text style={[styles.btnText, { color: onAcc }]}>หยุดและดูผล</Text>
          </TouchableOpacity>
        )}
      </View>

      <Modal visible={showInstr} animationType="slide" transparent onRequestClose={() => setShowInstr(false)}>
        <View style={styles.overlay}>
          <View style={[styles.sheet, { backgroundColor: C.bg }]}>
            <View style={[styles.handle, { backgroundColor: C.border }]} />
            <Text style={[styles.sheetTitle, { color: C.ink }]}>ก่อนเริ่มบันทึก</Text>
            {[
              ['📏', 'วางมือถือห่าง 30–60 ซม.', 'วางบนโต๊ะข้างเตียง หันไมโครโฟนเข้าหาตัว'],
              ['🤫', 'อยู่นิ่ง 8 วินาทีแรก', 'ระบบจะวัดเสียงห้องและตั้งค่าความไวอัตโนมัติ'],
              ['🔋', 'เสียบชาร์จทิ้งไว้', 'การบันทึกทั้งคืนใช้แบตเตอรี่มาก'],
              ['🌙', 'หน้าจอมืดอัตโนมัติ', 'ระบบจะเข้าโหมดกลางคืนเพื่อไม่รบกวนการนอน'],
            ].map(([e, h, b], i) => (
              <View key={i} style={styles.instrRow}>
                <View style={[styles.instrIcon, { backgroundColor: C.surfaceMuted }]}>
                  <Text style={{ fontSize: 18 }}>{e}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.instrHead, { color: C.ink }]}>{h}</Text>
                  <Text style={[styles.instrBody, { color: C.inkMuted }]}>{b}</Text>
                </View>
              </View>
            ))}
            <View style={[styles.warn, { backgroundColor: C.riskSevereSoft }]}>
              <Text style={[styles.warnText, { color: C.riskSevere }]}>ผลลัพธ์เป็นการคัดกรองเบื้องต้นเท่านั้น ไม่ใช่การวินิจฉัยทางการแพทย์</Text>
            </View>
            <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: C.primary }]} onPress={handleStart}>
              <Text style={[styles.btnText, { color: C.onPrimary }]}>เข้าใจแล้ว เริ่มบันทึก</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowInstr(false)}>
              <Text style={[styles.cancelText, { color: C.inkFaint }]}>ยกเลิก</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  root: { flex: 1, padding: 20, paddingBottom: 130 },
  hero:       { borderRadius: radius.xl, alignItems: 'center', paddingVertical: 32, marginBottom: 16, overflow: 'visible' },
  ring:       { position: 'absolute', width: 100, height: 100, borderRadius: 50 },
  core:       { width: 92, height: 92, borderRadius: 46, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  phaseBlock: { alignItems: 'center', width: '100%', paddingHorizontal: 24 },
  phaseLabel: { fontSize: 14, fontWeight: '500', marginBottom: 6 },
  phaseSub:   { fontSize: 12, marginBottom: 14 },
  phasePct:   { fontSize: 13, fontWeight: '700', marginTop: 8 },
  track:      { width: '70%', height: 6, borderRadius: 3, overflow: 'hidden' },
  trackFill:  { height: '100%', borderRadius: 3 },
  timer:      { fontSize: 52, fontWeight: '800', letterSpacing: 2 },
  chips:    { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 16, justifyContent: 'center' },
  chip:     { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill },
  chipDot:  { width: 6, height: 6, borderRadius: 3 },
  chipText: { fontSize: 11, fontWeight: '600' },
  log:        { flex: 1, borderRadius: radius.lg, padding: 16, marginBottom: 16 },
  logHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  logTitle:   { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  engineBadge:{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  badgeDot:   { width: 5, height: 5, borderRadius: 3 },
  badgeText:  { fontSize: 11, fontWeight: '600' },
  logEmpty:   { fontStyle: 'italic', fontSize: 13 },
  evRow:    { borderLeftWidth: 3, paddingLeft: 10, paddingVertical: 8, paddingRight: 10, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6, borderRadius: 8 },
  evTime:   { fontSize: 11 },
  evMsg:    { fontSize: 12, fontWeight: '600' },
  error:    { fontSize: 12, textAlign: 'center', marginBottom: 12 },
  startBtn:    { borderRadius: radius.lg, paddingVertical: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.28, shadowRadius: 16, elevation: 8 },
  stopBtn:     { borderRadius: radius.lg, paddingVertical: 20, alignItems: 'center', justifyContent: 'center' },
  disabledBtn: { borderRadius: radius.lg, paddingVertical: 20, alignItems: 'center' },
  disabledText:{ fontSize: 16, fontWeight: '600' },
  btnText:     { fontSize: 18, fontWeight: '700' },
  overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet:      { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 },
  handle:     { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 20, fontWeight: '800', marginBottom: 20 },
  instrRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 16 },
  instrIcon:  { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  instrHead:  { fontSize: 14, fontWeight: '600', marginBottom: 3 },
  instrBody:  { fontSize: 12, lineHeight: 17 },
  warn:       { borderRadius: radius.md, padding: 14, marginTop: 8, marginBottom: 20 },
  warnText:   { fontSize: 12, lineHeight: 17 },
  confirmBtn: { borderRadius: radius.lg, paddingVertical: 18, alignItems: 'center', marginBottom: 8 },
  cancelBtn:  { paddingVertical: 14, alignItems: 'center' },
  cancelText: { fontSize: 14 },
});