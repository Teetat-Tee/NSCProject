import { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  ScrollView, Alert, Modal, Animated, Easing, StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Accelerometer } from 'expo-sensors';
import {
  useAudioRecorder,
  useAudioRecorderState,
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
} from 'expo-audio';
import { CalibrationEngine, OSADetector, SAMPLE_INTERVAL } from '../utils/modelHelper';
import { colors, radius, shadow } from '../utils/theme';

const PHASE = {
  IDLE: 'idle',
  CALIBRATING: 'calibrating',
  RECORDING: 'recording',
};

const recordingOptions = {
  ...RecordingPresets.LOW_QUALITY,
  isMeteringEnabled: true,
};

// ============================================================
// โทนสีโหมดกลางคืน (red-on-black) — ใช้เฉพาะตอน calibrate/recording
// อิงหลัก night vision: แสงแดงรบกวนการมองเห็นในที่มืดน้อยที่สุด
// ไม่กระตุ้นการตื่นตัว/กด melatonin เท่าแสงขาว-ฟ้า
// ============================================================
const night = {
  bg: '#0A0505',
  surface: '#160B0B',
  surfaceMuted: '#1F0F0F',
  border: '#3A1414',
  red: '#B33A3A',
  redDim: '#7A2828',
  redFaint: '#4D1C1C',
  text: '#D98080',
  textMuted: '#8A4A4A',
};

export default function RecordScreen({ navigation }) {
  const [phase, setPhase] = useState(PHASE.IDLE);
  const [elapsed, setElapsed] = useState(0);
  const [events, setEvents] = useState([]);
  const [accel, setAccel] = useState({ x: 0, y: 0, z: 0 });
  const [calibProgress, setCalibProgress] = useState(0);
  const [currentDb, setCurrentDb] = useState(null);
  const [micError, setMicError] = useState(null);
  const [instructionsVisible, setInstructionsVisible] = useState(false);

  const audioRecorder = useAudioRecorder(recordingOptions);
  const recorderState = useAudioRecorderState(audioRecorder, SAMPLE_INTERVAL);

  const timerRef = useRef(null);
  const eventsRef = useRef([]);
  const calibEngineRef = useRef(null);
  const detectorRef = useRef(null);

  const isCalibrating = phase === PHASE.CALIBRATING;
  const isRecording = phase === PHASE.RECORDING;
  const isActive = isCalibrating || isRecording;
  const isNight = isActive; // โหมดกลางคืนเปิดทันทีที่เริ่ม calibrate/recording

  // ---------------- Breath pulse animation ----------------
  const pulseAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    let loop;
    if (isActive) {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      );
      loop.start();
    } else {
      pulseAnim.setValue(0);
    }
    return () => loop && loop.stop();
  }, [isActive]);

  const ringScale1 = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] });
  const ringOpacity1 = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] });
  const ringScale2 = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.7] });
  const ringOpacity2 = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.18, 0] });

  useEffect(() => {
    // Record อยู่ใน HomeStack ซึ่งอยู่ใน Tab.Navigator อีกชั้น
    // ต้องไต่ parent ขึ้นไปจนกว่าจะเจอ navigator ที่มี setOptions รองรับ tabBarStyle
    const tabNavigator = navigation.getParent('RootTabs') || navigation.getParent();
    if (!tabNavigator) return;

    const defaultTabBarStyle = {
      backgroundColor: colors.surface,
      borderTopColor: colors.border,
      borderTopWidth: 1,
      height: 64,
      paddingBottom: 8,
      paddingTop: 8,
      ...shadow.card,
    };

    if (isActive) {
      tabNavigator.setOptions({ tabBarStyle: { display: 'none' } });
    } else {
      tabNavigator.setOptions({ tabBarStyle: defaultTabBarStyle });
    }

    return () => {
      tabNavigator.setOptions({ tabBarStyle: defaultTabBarStyle });
    };
  }, [isActive, navigation]);

  // ป้องกัน error 'NativeSharedObjectNotFoundException':
  // audioRecorder (native object ของ expo-audio) จะถูกทำลายเมื่อ component
  // ไม่ได้อยู่ใน focus แล้ว (เช่น navigate ไป Survey/Result) แต่ React Navigation
  // ไม่ unmount หน้าที่ค้างอยู่ใน stack ทันที ทำให้ effect cleanup แบบ
  // useEffect([]) เดิมอาจรันหลัง native object ถูกเก็บไปแล้ว
  // ใช้ useFocusEffect แทน เพื่อให้ cleanup ทำงานทันทีที่ "เสียโฟกัส" จริง ๆ
  useFocusEffect(
    useCallback(() => {
      return () => {
        clearInterval(timerRef.current);
        try {
          if (audioRecorder?.isRecording) {
            audioRecorder.stop().catch(() => {});
          }
        } catch (e) {
          // native object อาจถูกทำลายไปแล้ว — เพิกเฉยได้อย่างปลอดภัย
        }
      };
    }, [audioRecorder])
  );

  // ---------------- Accelerometer ----------------
  useEffect(() => {
    Accelerometer.setUpdateInterval(500);
    const sub = Accelerometer.addListener(({ x, y, z }) => setAccel({ x, y, z }));
    return () => sub.remove();
  }, []);

  // (cleanup ตอน unmount/เสียโฟกัส ย้ายไปอยู่ใน useFocusEffect ด้านบนแล้ว
  // เพื่อแก้ NativeSharedObjectNotFoundException)

  useEffect(() => {
    const db = typeof recorderState?.metering === 'number' ? recorderState.metering : null;
    if (db === null) return;
    setCurrentDb(db);

    if (phase === PHASE.CALIBRATING && calibEngineRef.current) {
      calibEngineRef.current.addSample(db);
      setCalibProgress(calibEngineRef.current.progress());
      if (calibEngineRef.current.isDone()) finishCalibrationAndStartDetection();
    } else if (phase === PHASE.RECORDING && detectorRef.current) {
      detectorRef.current.addSample(db);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recorderState?.metering]);

  function addEvent(ev) {
    eventsRef.current = [ev, ...eventsRef.current];
    setEvents([...eventsRef.current]);
  }

  function handlePressStart() {
    setInstructionsVisible(true);
  }

  async function handleConfirmAndStart() {
    setInstructionsVisible(false);
    setMicError(null);

    try {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
        setMicError('ไม่ได้รับอนุญาตให้ใช้ไมโครโฟน กรุณาเปิดสิทธิ์ในการตั้งค่า');
        Alert.alert('ต้องการสิทธิ์ไมโครโฟน', 'กรุณาอนุญาตให้แอปเข้าถึงไมโครโฟนเพื่อบันทึกเสียง');
        return;
      }

      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
      await audioRecorder.prepareToRecordAsync(recordingOptions);
      audioRecorder.record();

      // โหมดกลางคืนเปิดทันที ณ จุดนี้ (isNight ผูกกับ isActive อยู่แล้ว)
      calibEngineRef.current = new CalibrationEngine();
      setCalibProgress(0);
      setPhase(PHASE.CALIBRATING);
      setEvents([]);
      eventsRef.current = [];
    } catch (err) {
      console.error('Start recording error:', err);
      setMicError('ไม่สามารถเริ่มบันทึกเสียงได้ กรุณาลองใหม่');
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถเข้าถึงไมโครโฟนได้: ' + err.message);
    }
  }

  function finishCalibrationAndStartDetection() {
    const calibration = calibEngineRef.current.finalize();
    detectorRef.current = new OSADetector(calibration, (ev) => addEvent(ev));
    setPhase(PHASE.RECORDING);
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed((p) => p + 1), 1000);
  }

  async function stopRecording() {
    clearInterval(timerRef.current);
    if (detectorRef.current) detectorRef.current.flush();
    try {
      if (audioRecorder?.isRecording) {
        await audioRecorder.stop();
      }
    } catch (e) {
      // native object อาจถูกทำลายไปแล้ว — ดำเนินการต่อได้อย่างปลอดภัย
    }

    const finalEvents = eventsRef.current;
    const finalDuration = elapsed;
    setPhase(PHASE.IDLE);
    navigation.navigate('Survey', { duration: finalDuration, events: finalEvents });
  }

  function formatTime(s) {
    const h = String(Math.floor(s / 3600)).padStart(2, '0');
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
    const sc = String(s % 60).padStart(2, '0');
    return `${h}:${m}:${sc}`;
  }

  // ---------------- เลือกชุดสีตามโหมด ----------------
  const t = isNight ? {
    bg: night.bg, surface: night.surface, surfaceMuted: night.surfaceMuted,
    border: night.border, ink: night.text, inkMuted: night.textMuted,
    inkFaint: night.redFaint, primary: night.red, primaryDeep: night.redDim,
    onPrimary: night.bg,
  } : {
    bg: colors.bg, surface: colors.surface, surfaceMuted: colors.surfaceMuted,
    border: colors.border, ink: colors.ink, inkMuted: colors.inkMuted,
    inkFaint: colors.inkFaint, primary: colors.primary, primaryDeep: colors.primaryDeep,
    onPrimary: colors.onPrimary,
  };

  function eventColorFor(type) {
    if (isNight) return night.red;
    if (type === 'apnea') return colors.apnea;
    if (type === 'snore') return colors.snore;
    return colors.movement;
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
      <StatusBar barStyle={isNight ? 'light-content' : 'dark-content'} />
      <View style={styles.container}>

        <View style={[
          styles.heroBox,
          { backgroundColor: t.surface },
          isNight ? styles.heroBoxNight : shadow.raised,
        ]}>
          {isActive && (
            <>
              <Animated.View style={[styles.pulseRing, {
                backgroundColor: t.primary,
                transform: [{ scale: ringScale2 }], opacity: ringOpacity2,
              }]} />
              <Animated.View style={[styles.pulseRing, {
                backgroundColor: t.primary,
                transform: [{ scale: ringScale1 }], opacity: ringOpacity1,
              }]} />
            </>
          )}

          <View style={[
            styles.coreCircle,
            { backgroundColor: isRecording ? t.primary : (isNight ? night.surfaceMuted : colors.primarySoft) },
          ]}>
            <Text style={[styles.coreEmoji, isNight && { opacity: 0.85 }]}>
              {isCalibrating ? '🤫' : '🫁'}
            </Text>
          </View>

          {isCalibrating ? (
            <>
              <Text style={[styles.heroTitle, { color: t.inkMuted }]}>กำลังวัดระดับเสียงห้อง</Text>
              <Text style={[styles.heroSub, { color: t.inkFaint }]}>
                กรุณาอยู่นิ่ง ๆ สักครู่ ({Math.round(calibProgress * 100)}%)
              </Text>
              <View style={[styles.progressTrack, { backgroundColor: t.surfaceMuted }]}>
                <View style={[styles.progressFill, { width: `${calibProgress * 100}%`, backgroundColor: t.primary }]} />
              </View>
            </>
          ) : (
            <>
              <Text style={[styles.heroTitle, { color: t.inkMuted }]}>
                {isRecording ? 'กำลังบันทึก' : 'พร้อมเริ่มบันทึก'}
              </Text>
              <Text style={[styles.timer, { color: t.ink }]}>{formatTime(elapsed)}</Text>
            </>
          )}

          {currentDb !== null && isActive && (
            <Text style={[styles.dbReading, { color: t.primary }]}>{currentDb.toFixed(1)} dB</Text>
          )}

          {isRecording && (
            <View style={styles.miniStats}>
              <View style={[styles.miniChip, { backgroundColor: t.surfaceMuted }]}>
                <Text style={[styles.miniChipText, { color: t.inkMuted }]}>🔊 {events.filter(e => e.type === 'snore').length}</Text>
              </View>
              <View style={[styles.miniChip, { backgroundColor: t.surfaceMuted }]}>
                <Text style={[styles.miniChipText, { color: t.inkMuted }]}>⚠️ {events.filter(e => e.type === 'apnea').length}</Text>
              </View>
              <View style={[styles.miniChip, { backgroundColor: t.surfaceMuted }]}>
                <Text style={[styles.miniChipText, { color: t.inkMuted }]}>📳 {Math.abs(accel.z).toFixed(1)}g</Text>
              </View>
            </View>
          )}
        </View>

        {micError && (
          <View style={[styles.errorBox, isNight && { backgroundColor: night.surfaceMuted, borderColor: night.red }]}>
            <Text style={[styles.errorText, isNight && { color: night.red }]}>{micError}</Text>
          </View>
        )}

        <View style={[styles.logBox, { backgroundColor: t.surface }, !isNight && shadow.card]}>
          <Text style={[styles.logTitle, { color: t.ink }]}>บันทึกเหตุการณ์</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {events.length === 0
              ? <Text style={[styles.noEvent, { color: t.inkFaint }]}>{isCalibrating ? 'กำลังเตรียมระบบ...' : 'รอตรวจจับ...'}</Text>
              : events.map((ev, i) => (
                <View key={i} style={[
                  styles.evRow,
                  { borderLeftColor: eventColorFor(ev.type), backgroundColor: t.surfaceMuted },
                ]}>
                  <Text style={[styles.evTime, { color: t.inkFaint }]}>{ev.time}</Text>
                  <Text style={[styles.evMsg, { color: t.ink }]}>{ev.msg}</Text>
                </View>
              ))
            }
          </ScrollView>
        </View>

        {!isActive
          ? <TouchableOpacity style={styles.startBtn} activeOpacity={0.85} onPress={handlePressStart}>
              <Text style={styles.btnText}>🎙️ เริ่มบันทึก</Text>
            </TouchableOpacity>
          : isCalibrating
            ? <View style={[styles.calibratingBtn, { backgroundColor: t.surfaceMuted }]}>
                <Text style={[styles.calibratingBtnText, { color: t.inkMuted }]}>กำลังตั้งค่า...</Text>
              </View>
            : <TouchableOpacity
                style={[styles.stopBtn, { backgroundColor: t.primary }]}
                activeOpacity={0.85}
                onPress={stopRecording}
              >
                <Text style={[styles.btnText, isNight && { color: night.bg }]}>⏹ หยุดและดูผล</Text>
              </TouchableOpacity>
        }

      </View>

      <Modal
        visible={instructionsVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setInstructionsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalIcon}>📱</Text>
              <Text style={styles.modalTitle}>ก่อนเริ่มบันทึก</Text>

              {[
                ['📏', 'วางมือถือห่างจากศีรษะ 30–60 ซม.', 'วางบนโต๊ะข้างเตียงหรือหมอนข้าง หันไมโครโฟนเข้าหาตัว'],
                ['🪑', 'วางบนพื้นแข็ง ไม่ใช่บนที่นอนโดยตรง', 'ป้องกันการสั่น/กระแทกจากการขยับตัวที่ทำให้ตรวจจับผิดพลาด'],
                ['🤫', 'อยู่นิ่งและเงียบช่วง 8 วินาทีแรก', 'ระบบจะวัดระดับเสียงห้องเพื่อตั้งค่าความไวอัตโนมัติ'],
                ['🔋', 'เสียบชาร์จและเปิดแอปไว้ตลอดคืน', 'การบันทึกเสียงต่อเนื่องใช้แบตเตอรี่พอสมควร'],
                ['🌙', 'หน้าจอจะมืดลงเองเมื่อเริ่มบันทึก', 'ป้องกันแสงรบกวนการนอนของคุณและคนข้างเคียง'],
              ].map(([emoji, heading, body], i) => (
                <View key={i} style={styles.instructionRow}>
                  <View style={styles.instructionIconBox}>
                    <Text style={styles.instructionEmoji}>{emoji}</Text>
                  </View>
                  <View style={styles.instructionTextBox}>
                    <Text style={styles.instructionHeading}>{heading}</Text>
                    <Text style={styles.instructionBody}>{body}</Text>
                  </View>
                </View>
              ))}

              <View style={styles.disclaimerBox}>
                <Text style={styles.disclaimerText}>
                  ⚠️ ผลที่ได้เป็นการคัดกรองเบื้องต้นด้วยเทคโนโลยีประมวลผลสัญญาณเสียงเท่านั้น
                  ไม่สามารถใช้ทดแทนการวินิจฉัยทางการแพทย์ได้
                </Text>
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.confirmBtn} activeOpacity={0.85} onPress={handleConfirmAndStart}>
              <Text style={styles.confirmBtnText}>รับทราบ เริ่มบันทึก</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setInstructionsVisible(false)}>
              <Text style={styles.cancelBtnText}>ยกเลิก</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, padding: 20 },

  heroBox: { borderRadius: radius.xl, paddingVertical: 32, alignItems: 'center', marginBottom: 16 },
  heroBoxNight: { borderWidth: 1, borderColor: night.border },
  pulseRing: { position: 'absolute', top: 16, width: 96, height: 96, borderRadius: 48 },
  coreCircle: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  coreEmoji: { fontSize: 36 },

  heroTitle: { fontSize: 14, fontWeight: '500', marginBottom: 6 },
  heroSub: { fontSize: 12, marginBottom: 16 },
  timer: { fontSize: 48, fontWeight: '700', letterSpacing: 1 },
  dbReading: { fontSize: 13, fontWeight: '600', marginTop: 10 },

  progressTrack: { width: '70%', height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },

  miniStats: { flexDirection: 'row', gap: 8, marginTop: 16 },
  miniChip: { borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
  miniChipText: { fontSize: 12, fontWeight: '600' },

  errorBox: {
    backgroundColor: colors.riskSevereSoft, borderRadius: radius.md,
    padding: 12, marginBottom: 14, borderWidth: 1, borderColor: colors.riskSevere + '40',
  },
  errorText: { color: colors.riskSevere, fontSize: 13, textAlign: 'center' },

  logBox: { flex: 1, borderRadius: radius.lg, padding: 18, marginBottom: 16 },
  logTitle: { fontWeight: '700', fontSize: 15, marginBottom: 12 },
  noEvent: { fontStyle: 'italic', fontSize: 13 },
  evRow: {
    borderLeftWidth: 3, paddingLeft: 12, paddingVertical: 8, paddingRight: 12,
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6, borderRadius: 8,
  },
  evTime: { fontSize: 12 },
  evMsg: { fontSize: 13, fontWeight: '500' },

  startBtn: {
    backgroundColor: colors.primary, borderRadius: radius.lg, paddingVertical: 19, alignItems: 'center',
    shadowColor: colors.primaryDeep, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25, shadowRadius: 16, elevation: 6,
  },
  stopBtn: { borderRadius: radius.lg, paddingVertical: 19, alignItems: 'center' },
  calibratingBtn: { borderRadius: radius.lg, paddingVertical: 19, alignItems: 'center' },
  calibratingBtnText: { fontSize: 16, fontWeight: '600' },
  btnText: { color: colors.onPrimary, fontSize: 17, fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(43,43,46,0.5)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: colors.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, maxHeight: '85%',
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 16 },
  modalIcon: { fontSize: 36, textAlign: 'center', marginBottom: 6 },
  modalTitle: { color: colors.ink, fontSize: 19, fontWeight: '700', textAlign: 'center', marginBottom: 22 },

  instructionRow: { flexDirection: 'row', marginBottom: 16, alignItems: 'flex-start' },
  instructionIconBox: {
    width: 38, height: 38, borderRadius: 12, backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center', marginRight: 12, ...shadow.card,
  },
  instructionEmoji: { fontSize: 18 },
  instructionTextBox: { flex: 1, paddingTop: 2 },
  instructionHeading: { color: colors.ink, fontSize: 14, fontWeight: '600', marginBottom: 3 },
  instructionBody: { color: colors.inkMuted, fontSize: 12, lineHeight: 17 },

  disclaimerBox: {
    backgroundColor: colors.riskSevereSoft, borderRadius: radius.md, padding: 13,
    marginTop: 6, marginBottom: 16, borderWidth: 1, borderColor: colors.riskSevere + '30',
  },
  disclaimerText: { color: colors.riskSevere, fontSize: 11, lineHeight: 16 },

  confirmBtn: { backgroundColor: colors.primary, borderRadius: radius.lg, paddingVertical: 17, alignItems: 'center', marginTop: 4 },
  confirmBtnText: { color: colors.onPrimary, fontSize: 16, fontWeight: '700' },
  cancelBtn: { paddingVertical: 14, alignItems: 'center' },
  cancelBtnText: { color: colors.inkFaint, fontSize: 14 },
});