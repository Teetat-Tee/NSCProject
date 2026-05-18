// screens/ResultScreen.js
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

export default function ResultScreen({ route, navigation }) {
  const { duration, events, chunkCount } = route.params;

  // ---- คำนวณ pseudo-AHI ----
  const hours = duration / 3600;
  const apneaCount = events.filter(e => e.type === 'apnea').length;
  const snoreCount = events.filter(e => e.type === 'snore').length;
  const moveCount  = events.filter(e => e.type === 'movement').length;
  const ahi = hours > 0 ? (apneaCount / hours).toFixed(1) : 0;

  // ---- ระดับความเสี่ยง ----
  function getRiskLevel(ahi) {
    if (ahi < 5)  return { level: 'ปกติ',        color: '#22c55e', emoji: '✅', detail: 'ไม่พบความผิดปกติ' };
    if (ahi < 15) return { level: 'เล็กน้อย',    color: '#f59e0b', emoji: '⚠️', detail: 'ควรปรับพฤติกรรมการนอน' };
    if (ahi < 30) return { level: 'ปานกลาง',     color: '#f97316', emoji: '🔶', detail: 'ควรปรึกษาแพทย์' };
    return          { level: 'รุนแรง',           color: '#ef4444', emoji: '🚨', detail: 'ควรพบแพทย์โดยด่วน' };
  }

  const risk = getRiskLevel(Number(ahi));

  function formatDuration(sec) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return `${h} ชม. ${m} นาที`;
  }

  return (
    <ScrollView style={styles.container}>

      {/* Risk Badge */}
      <View style={[styles.riskCard, { borderColor: risk.color }]}>
        <Text style={styles.riskEmoji}>{risk.emoji}</Text>
        <Text style={styles.riskLevel}>ระดับ: {risk.level}</Text>
        <Text style={[styles.ahiText, { color: risk.color }]}>
          AHI = {ahi}
        </Text>
        <Text style={styles.ahiSub}>ครั้ง/ชั่วโมง</Text>
        <Text style={styles.riskDetail}>{risk.detail}</Text>
      </View>

      {/* สรุปตัวเลข */}
      <View style={styles.statsRow}>
        <StatBox label="เวลานอน"     value={formatDuration(duration)} />
        <StatBox label="หยุดหายใจ"  value={`${apneaCount} ครั้ง`} color="#ef4444" />
        <StatBox label="เสียงกรน"   value={`${snoreCount} ครั้ง`} color="#f59e0b" />
        <StatBox label="ขยับตัว"    value={`${moveCount} ครั้ง`}  color="#60a5fa" />
      </View>

      {/* Timeline events */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Timeline</Text>
        {events.length === 0 ? (
          <Text style={styles.noEvent}>ไม่มี event ที่ตรวจพบ</Text>
        ) : (
          events.slice().reverse().map((ev, i) => (
            <View key={i} style={[
              styles.eventRow,
              ev.type === 'apnea'    && { borderLeftColor: '#ef4444' },
              ev.type === 'snore'    && { borderLeftColor: '#f59e0b' },
              ev.type === 'movement' && { borderLeftColor: '#60a5fa' },
            ]}>
              <Text style={styles.eventTime}>{ev.time}</Text>
              <Text style={styles.eventMsg}>{ev.message}</Text>
            </View>
          ))
        )}
      </View>

      {/* คำแนะนำ */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>คำแนะนำ</Text>
        <Advice ahi={Number(ahi)} />
      </View>

      {/* ปุ่มกลับ */}
      <TouchableOpacity
        style={styles.homeBtn}
        onPress={() => navigation.navigate('Home')}
      >
        <Text style={styles.homeBtnText}>🏠 กลับหน้าหลัก</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

// ---- Component ย่อย ----
function StatBox({ label, value, color = '#e0e0ff' }) {
  return (
    <View style={styles.statBox}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Advice({ ahi }) {
  const tips = ahi < 5 ? [
    'การนอนของคุณอยู่ในเกณฑ์ปกติ',
    'นอนหลับให้ครบ 7–8 ชั่วโมงต่อคืน',
    'หลีกเลี่ยงแอลกอฮอล์ก่อนนอน',
  ] : ahi < 15 ? [
    'ลองนอนตะแคงแทนนอนหงาย',
    'ลดน้ำหนักถ้า BMI เกิน 25',
    'หลีกเลี่ยงยาที่ทำให้ง่วง',
    'ติดตามผลต่อเนื่องทุกสัปดาห์',
  ] : [
    'ควรพบแพทย์เพื่อตรวจ PSG จริง',
    'อาจต้องใช้เครื่อง CPAP',
    'ห้ามขับรถระยะไกลเพียงลำพัง',
    'แจ้งคนในครอบครัวให้รับทราบ',
  ];

  return (
    <View>
      {tips.map((tip, i) => (
        <Text key={i} style={styles.tip}>• {tip}</Text>
      ))}
      <Text style={styles.disclaimer}>
        * ผลนี้เป็นการคัดกรองเบื้องต้นด้วย AI เท่านั้น{'\n'}
        ไม่สามารถใช้แทนการวินิจฉัยทางการแพทย์ได้
      </Text>
    </View>
  );
}

// ---- Styles ----
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', padding: 20 },
  riskCard: {
    alignItems: 'center', borderWidth: 2,
    borderRadius: 20, padding: 24, marginBottom: 20,
    backgroundColor: '#16213e',
  },
  riskEmoji: { fontSize: 48, marginBottom: 8 },
  riskLevel: { color: '#e0e0ff', fontSize: 18, fontWeight: 'bold' },
  ahiText: { fontSize: 52, fontWeight: 'bold', marginVertical: 4 },
  ahiSub: { color: '#9090bb', fontSize: 13 },
  riskDetail: { color: '#9090bb', marginTop: 8, fontSize: 14 },
  statsRow: {
    flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'space-between', marginBottom: 20,
  },
  statBox: {
    width: '48%', backgroundColor: '#16213e',
    borderRadius: 12, padding: 14,
    alignItems: 'center', marginBottom: 10,
  },
  statValue: { fontSize: 18, fontWeight: 'bold' },
  statLabel: { color: '#9090bb', fontSize: 12, marginTop: 4 },
  section: {
    backgroundColor: '#16213e', borderRadius: 12,
    padding: 16, marginBottom: 16,
  },
  sectionTitle: { color: '#e0e0ff', fontWeight: 'bold', fontSize: 16, marginBottom: 12 },
  noEvent: { color: '#6060aa', fontStyle: 'italic' },
  eventRow: {
    borderLeftWidth: 3, paddingLeft: 10,
    paddingVertical: 6, marginBottom: 6,
    flexDirection: 'row', justifyContent: 'space-between',
  },
  eventTime: { color: '#6060aa', fontSize: 12 },
  eventMsg: { color: '#e0e0ff', fontSize: 13 },
  tip: { color: '#9090bb', fontSize: 14, marginBottom: 8, lineHeight: 22 },
  disclaimer: {
    color: '#6060aa', fontSize: 12,
    marginTop: 12, lineHeight: 18, fontStyle: 'italic',
  },
  homeBtn: {
    backgroundColor: '#4f46e5', borderRadius: 50,
    padding: 18, alignItems: 'center', marginBottom: 40,
  },
  homeBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});