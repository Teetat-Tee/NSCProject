import { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { Accelerometer } from 'expo-sensors';
import { analyzeAudio } from '../utils/modelHelper';

export default function RecordScreen({ navigation }) {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [events, setEvents] = useState([]);
  const [accel, setAccel] = useState({ x: 0, y: 0, z: 0 });
  const timerRef = useRef(null);
  const chunkRef = useRef(null);
  const eventsRef = useRef([]);

  useEffect(() => {
    Accelerometer.setUpdateInterval(500);
    const sub = Accelerometer.addListener(({ x, y, z }) => {
      setAccel({ x, y, z });
      if (isRecording && Math.sqrt(x*x+y*y+z*z) > 1.5) {
        addEvent('movement', 'ขยับตัว');
      }
    });
    return () => sub.remove();
  }, [isRecording]);

  function addEvent(type, msg) {
    const time = new Date().toLocaleTimeString('th-TH');
    const ev = { type, msg, time };
    eventsRef.current = [ev, ...eventsRef.current];
    setEvents([...eventsRef.current]);
  }

  async function startRecording() {
    setIsRecording(true);
    setElapsed(0);
    setEvents([]);
    eventsRef.current = [];

    timerRef.current = setInterval(() => setElapsed(p => p + 1), 1000);

    chunkRef.current = setInterval(async () => {
      const result = await analyzeAudio(null);
      if (result.label === 'snore') addEvent('snore', `เสียงกรน ${(result.confidence*100).toFixed(0)}%`);
      if (result.label === 'apnea') addEvent('apnea', `⚠️ หยุดหายใจ ${(result.confidence*100).toFixed(0)}%`);
    }, 10000);
  }

  function stopRecording() {
    setIsRecording(false);
    clearInterval(timerRef.current);
    clearInterval(chunkRef.current);
    navigation.navigate('Survey', { duration: elapsed, events: eventsRef.current });
  }

  function formatTime(s) {
    const h = String(Math.floor(s/3600)).padStart(2,'0');
    const m = String(Math.floor((s%3600)/60)).padStart(2,'0');
    const sc = String(s%60).padStart(2,'0');
    return `${h}:${m}:${sc}`;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        <View style={styles.timerBox}>
          <Text style={styles.timerLabel}>กำลังบันทึก</Text>
          <Text style={styles.timer}>{formatTime(elapsed)}</Text>
          <View style={styles.miniStats}>
            <Text style={styles.mini}>🔊 {events.filter(e=>e.type==='snore').length}</Text>
            <Text style={styles.mini}>⚠️ {events.filter(e=>e.type==='apnea').length}</Text>
            <Text style={styles.mini}>📳 {Math.abs(accel.z).toFixed(1)}g</Text>
          </View>
        </View>

        <View style={styles.logBox}>
          <Text style={styles.logTitle}>Event Log</Text>
          <ScrollView>
            {events.length === 0
              ? <Text style={styles.noEvent}>รอตรวจจับ...</Text>
              : events.map((ev, i) => (
                <View key={i} style={[
                  styles.evRow,
                  ev.type==='apnea' && { borderLeftColor: '#ef4444' },
                  ev.type==='snore' && { borderLeftColor: '#f59e0b' },
                  ev.type==='movement' && { borderLeftColor: '#38bdf8' },
                ]}>
                  <Text style={styles.evTime}>{ev.time}</Text>
                  <Text style={styles.evMsg}>{ev.msg}</Text>
                </View>
              ))
            }
          </ScrollView>
        </View>

        {!isRecording
          ? <TouchableOpacity style={styles.startBtn} onPress={startRecording}>
              <Text style={styles.btnText}>🎙️ เริ่มบันทึก</Text>
            </TouchableOpacity>
          : <TouchableOpacity style={styles.stopBtn} onPress={stopRecording}>
              <Text style={styles.btnText}>⏹ หยุดและดูผล</Text>
            </TouchableOpacity>
        }

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f172a' },
  container: { flex: 1, padding: 20 },
  timerBox: { backgroundColor: '#1e293b', borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 16 },
  timerLabel: { color: '#64748b', fontSize: 13 },
  timer: { color: '#f1f5f9', fontSize: 52, fontWeight: 'bold' },
  miniStats: { flexDirection: 'row', gap: 20, marginTop: 12 },
  mini: { color: '#94a3b8', fontSize: 14 },
  logBox: { flex: 1, backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginBottom: 16 },
  logTitle: { color: '#f1f5f9', fontWeight: 'bold', marginBottom: 10 },
  noEvent: { color: '#475569', fontStyle: 'italic' },
  evRow: { borderLeftWidth: 3, borderLeftColor: '#475569', paddingLeft: 10, paddingVertical: 6, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  evTime: { color: '#64748b', fontSize: 12 },
  evMsg: { color: '#e2e8f0', fontSize: 13 },
  startBtn: { backgroundColor: '#38bdf8', borderRadius: 50, padding: 18, alignItems: 'center' },
  stopBtn: { backgroundColor: '#ef4444', borderRadius: 50, padding: 18, alignItems: 'center' },
  btnText: { color: '#0f172a', fontSize: 18, fontWeight: 'bold' },
});