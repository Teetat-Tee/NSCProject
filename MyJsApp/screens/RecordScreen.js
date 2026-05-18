// screens/RecordScreen.js
import { analyzeChunk } from '../utils/modelHelper';
import { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, Alert, ScrollView
} from 'react-native';
const Audio = {
  requestPermissionsAsync: async () => ({ granted: true }),
  setAudioModeAsync: async () => {},
  Recording: {
    createAsync: async () => ({
      recording: {
        stopAndUnloadAsync: async () => {},
        getURI: () => 'mock://audio.wav',
      }
    })
  },
  RecordingOptionsPresets: { HIGH_QUALITY: {} }
};
import { Accelerometer } from 'expo-sensors';
import * as FileSystem from 'expo-file-system';

// ความถี่อ่าน accelerometer (ครั้งต่อวินาที)
const ACCEL_INTERVAL_MS = 500;
// บันทึกเสียงทีละกี่วินาที
const CHUNK_SECONDS = 30;

export default function RecordScreen({ navigation }) {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);      // วินาทีที่ผ่านไป
  const [accelData, setAccelData] = useState([]);          // log การเคลื่อนไหว
  const [events, setEvents] = useState([]);                // event ที่ตรวจพบ
  const [currentAccel, setCurrentAccel] = useState({ x: 0, y: 0, z: 0 });

  const recordingRef = useRef(null);   // เก็บ Audio.Recording object
  const timerRef = useRef(null);       // timer นับเวลา
  const accelRef = useRef([]);         // ref เก็บ accel ล่าสุด (ไม่ trigger re-render)
  const chunkCountRef = useRef(0);     // นับ chunk ที่บันทึกไปแล้ว

  // ---- ขอ Permission ----
  useEffect(() => {
    requestPermissions();
    return () => stopEverything();  // cleanup เมื่อออกจากหน้า
  }, []);

  async function requestPermissions() {
    const { granted } = await Audio.requestPermissionsAsync();
    if (!granted) {
      Alert.alert('ต้องการสิทธิ์ไมโครโฟน', 'กรุณาอนุญาตในการตั้งค่า');
    }
  }

  // ---- เริ่มบันทึก ----
  async function startRecording() {
    try {
      // ตั้งค่า Audio session
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      setIsRecording(true);
      setElapsedTime(0);
      setEvents([]);
      accelRef.current = [];
      chunkCountRef.current = 0;

      // เริ่มนับเวลา
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);

      // เริ่ม accelerometer
      Accelerometer.setUpdateInterval(ACCEL_INTERVAL_MS);
      Accelerometer.addListener(({ x, y, z }) => {
        setCurrentAccel({ x, y, z });
        const magnitude = Math.sqrt(x * x + y * y + z * z);
        const entry = { time: Date.now(), x, y, z, magnitude };
        accelRef.current.push(entry);
        setAccelData(prev => [...prev.slice(-20), entry]); // เก็บ 20 ล่าสุด

        // ถ้าขยับแรง — บันทึกเป็น movement event
        if (magnitude > 1.5) {
          addEvent('movement', `ขยับตัว (${magnitude.toFixed(2)}g)`);
        }
      });

      // เริ่มบันทึกเสียง chunk แรก
      await recordChunk();

    } catch (err) {
      console.error('startRecording error:', err);
      Alert.alert('เกิดข้อผิดพลาด', err.message);
    }
  }

  // ---- บันทึกเสียงทีละ chunk (30 วินาที) ----
  async function recordChunk() {
    if (!isRecording && chunkCountRef.current > 0) return;

    const { recording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );
    recordingRef.current = recording;

    // หลังจาก 30 วินาที → หยุดและเริ่ม chunk ใหม่
    setTimeout(async () => {
      await saveAndAnalyzeChunk();
      if (isRecording) await recordChunk();  // วนซ้ำ
    }, CHUNK_SECONDS * 1000);
  }

  // ---- หยุดและวิเคราะห์ chunk ----
  async function saveAndAnalyzeChunk() {
  if (!recordingRef.current) return;

  try {
    await recordingRef.current.stopAndUnloadAsync();
    const uri = recordingRef.current.getURI();
    chunkCountRef.current += 1;

    const destPath = `${FileSystem.documentDirectory}chunk_${chunkCountRef.current}.wav`;
    await FileSystem.moveAsync({ from: uri, to: destPath });

    // ยิง model จริง
    const result = await analyzeChunk(destPath);
    console.log(`Chunk ${chunkCountRef.current}:`, result);

    if (result.label === 'snore') {
      addEvent('snore', `เสียงกรน (${(result.confidence * 100).toFixed(0)}%)`);
    } else if (result.label === 'apnea') {
      addEvent('apnea', `หยุดหายใจ ⚠️ (${(result.confidence * 100).toFixed(0)}%)`);
    }

  } catch (err) {
    console.error('saveChunk error:', err);
  }
}

  // จำลอง event เพื่อทดสอบ UI ก่อน
  function simulateFakeEvent() {
    const rand = Math.random();
    if (rand < 0.3) addEvent('snore', 'ตรวจพบเสียงกรน');
    else if (rand < 0.4) addEvent('apnea', 'ตรวจพบการหยุดหายใจ ⚠️');
  }

  function addEvent(type, message) {
    const time = new Date().toLocaleTimeString('th-TH');
    setEvents(prev => [{ type, message, time }, ...prev]);
  }

  // ---- หยุดบันทึก ----
  async function stopRecording() {
    setIsRecording(false);
    clearInterval(timerRef.current);
    Accelerometer.removeAllListeners();

    if (recordingRef.current) {
      await recordingRef.current.stopAndUnloadAsync();
    }

    // ส่งข้อมูลไปหน้า Result
    navigation.navigate('Result', {
      duration: elapsedTime,
      events: events,
      accelData: accelRef.current,
      chunkCount: chunkCountRef.current,
    });
  }

  function stopEverything() {
    clearInterval(timerRef.current);
    Accelerometer.removeAllListeners();
    recordingRef.current?.stopAndUnloadAsync().catch(() => {});
  }

  // ---- แปลงวินาทีเป็น HH:MM:SS ----
  function formatTime(sec) {
    const h = Math.floor(sec / 3600).toString().padStart(2, '0');
    const m = Math.floor((sec % 3600) / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  }

  // ---- UI ----
  return (
    <View style={styles.container}>

      {/* นาฬิกานับเวลา */}
      <View style={styles.timerBox}>
        <Text style={styles.timerLabel}>เวลาที่บันทึก</Text>
        <Text style={styles.timerText}>{formatTime(elapsedTime)}</Text>
        <Text style={styles.chunkText}>
          บันทึกแล้ว {chunkCountRef.current} chunk
        </Text>
      </View>

      {/* Accelerometer realtime */}
      <View style={styles.accelBox}>
        <Text style={styles.sectionTitle}>การเคลื่อนไหว</Text>
        <Text style={styles.accelText}>
          X: {currentAccel.x.toFixed(3)}{'  '}
          Y: {currentAccel.y.toFixed(3)}{'  '}
          Z: {currentAccel.z.toFixed(3)}
        </Text>
      </View>

      {/* Event log */}
      <View style={styles.eventBox}>
        <Text style={styles.sectionTitle}>
          Event ที่ตรวจพบ ({events.length})
        </Text>
        <ScrollView style={{ maxHeight: 160 }}>
          {events.length === 0 ? (
            <Text style={styles.noEvent}>ยังไม่มี event...</Text>
          ) : (
            events.map((ev, i) => (
              <View key={i} style={[
                styles.eventRow,
                ev.type === 'apnea' && styles.eventApnea,
                ev.type === 'snore' && styles.eventSnore,
              ]}>
                <Text style={styles.eventTime}>{ev.time}</Text>
                <Text style={styles.eventMsg}>{ev.message}</Text>
              </View>
            ))
          )}
        </ScrollView>
      </View>

      {/* ปุ่ม Start / Stop */}
      {!isRecording ? (
        <TouchableOpacity style={styles.startBtn} onPress={startRecording}>
          <Text style={styles.btnText}>🎙️ เริ่มบันทึก</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.stopBtn} onPress={stopRecording}>
          <Text style={styles.btnText}>⏹️ หยุดและดูผล</Text>
        </TouchableOpacity>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#1a1a2e', padding: 20,
  },
  timerBox: {
    alignItems: 'center', marginBottom: 20,
    backgroundColor: '#16213e', borderRadius: 16, padding: 20,
  },
  timerLabel: { color: '#9090bb', fontSize: 13 },
  timerText: { color: '#e0e0ff', fontSize: 48, fontWeight: 'bold', fontVariant: ['tabular-nums'] },
  chunkText: { color: '#6060aa', fontSize: 12, marginTop: 4 },
  accelBox: {
    backgroundColor: '#16213e', borderRadius: 12,
    padding: 14, marginBottom: 16,
  },
  sectionTitle: { color: '#e0e0ff', fontWeight: 'bold', marginBottom: 8 },
  accelText: { color: '#7fdbff', fontFamily: 'monospace', fontSize: 13 },
  eventBox: {
    backgroundColor: '#16213e', borderRadius: 12,
    padding: 14, marginBottom: 20, flex: 1,
  },
  noEvent: { color: '#6060aa', fontStyle: 'italic' },
  eventRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 6, borderBottomColor: '#2a2a4a', borderBottomWidth: 1,
  },
  eventApnea: { backgroundColor: '#3a1a1a' },
  eventSnore: { backgroundColor: '#1a2a3a' },
  eventTime: { color: '#6060aa', fontSize: 12 },
  eventMsg: { color: '#e0e0ff', fontSize: 13 },
  startBtn: {
    backgroundColor: '#4f46e5', borderRadius: 50,
    padding: 18, alignItems: 'center',
  },
  stopBtn: {
    backgroundColor: '#dc2626', borderRadius: 50,
    padding: 18, alignItems: 'center',
  },
  btnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});