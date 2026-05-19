import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';

export default function ResultScreen({ route, navigation }) {
  const isDemoMode = route?.params?.demo === true;
  const duration = route?.params?.duration || 28800;
  const events = route?.params?.events || [
    { type: 'snore', msg: 'เสียงกรน 88%', time: '23:12:04' },
    { type: 'apnea', msg: '⚠️ หยุดหายใจ 76%', time: '01:34:22' },
    { type: 'snore', msg: 'เสียงกรน 91%', time: '02:11:08' },
    { type: 'apnea', msg: '⚠️ หยุดหายใจ 82%', time: '04:05:17' },
    { type: 'movement', msg: 'ขยับตัว', time: '04:47:33' },
  ];

  const hours = Math.max(duration / 3600, 0.1);
  const apneaCount = events.filter(e => e.type === 'apnea').length;
  const snoreCount = events.filter(e => e.type === 'snore').length;
  const moveCount  = events.filter(e => e.type === 'movement').length;
  const ahi = (apneaCount / hours).toFixed(1);

  function getRisk(v) {
    v = Number(v);
    if (v < 5)  return { label: 'ปกติ',     color: '#22c55e' };
    if (v < 15) return { label: 'เล็กน้อย', color: '#f59e0b' };
    if (v < 30) return { label: 'ปานกลาง', color: '#f97316' };
    return              { label: 'รุนแรง',  color: '#ef4444' };
  }
  const risk = getRisk(ahi);

  const hours_arr = ['23','0','1','2','3','4','5','6'];
  const barData = hours_arr.map(h =>
    events.filter(e => parseInt(e.time?.split(':')[0]) === parseInt(h)).length
  );
  const maxBar = Math.max(...barData, 1);

  function formatDuration(sec) {
    return `${Math.floor(sec/3600)}ชม. ${Math.floor((sec%3600)/60)}น.`;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container}>

        <View style={styles.header}>
          <Text style={styles.title}>ผลลัพธ์</Text>
          <Text style={styles.demo}>{isDemoMode ? 'ตัวอย่าง' : ''}</Text>
        </View>

        {/* Bar Chart */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Snoring Level</Text>
          <View style={styles.chart}>
            {barData.map((val, i) => {
              const hasApnea = events.some(e =>
                parseInt(e.time?.split(':')[0]) === parseInt(hours_arr[i]) && e.type === 'apnea'
              );
              return (
                <View key={i} style={styles.barCol}>
                  <View style={styles.barTrack}>
                    <View style={[
                      styles.bar,
                      { height: `${Math.max((val/maxBar)*100, 5)}%` },
                      hasApnea && { backgroundColor: '#ef4444' },
                    ]} />
                  </View>
                  <Text style={styles.barLabel}>{hours_arr[i]}</Text>
                </View>
              );
            })}
          </View>
          <View style={styles.legend}>
            {[['#38bdf8','กรน'],['#f59e0b','ดัง'],['#ef4444','หยุดหายใจ']].map(([c,l]) => (
              <View key={l} style={styles.legendItem}>
                <View style={[styles.dot, { backgroundColor: c }]} />
                <Text style={styles.legendText}>{l}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Summary */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryIcon}>⏰</Text>
            <Text style={styles.summaryVal}>{formatDuration(duration)}</Text>
            <Text style={styles.summaryLabel}>เวลานอน</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryIcon}>🔊</Text>
            <Text style={styles.summaryVal}>{snoreCount} ครั้ง</Text>
            <Text style={styles.summaryLabel}>เสียงกรน</Text>
          </View>
          <View style={styles.donut}>
            <View style={[styles.donutRing, { borderColor: risk.color }]}>
              <Text style={[styles.donutNum, { color: risk.color }]}>{ahi}</Text>
            </View>
            <Text style={styles.donutLabel}>AHI</Text>
          </View>
        </View>

        {/* Risk */}
        <View style={[styles.riskBadge, { borderColor: risk.color }]}>
          <Text style={[styles.riskText, { color: risk.color }]}>ระดับ: {risk.label}</Text>
          <Text style={styles.riskSub}>
            {Number(ahi) < 5 ? 'การนอนปกติ ไม่พบความผิดปกติ'
            : Number(ahi) < 15 ? 'พบ OSA เล็กน้อย ควรปรับพฤติกรรม'
            : Number(ahi) < 30 ? 'พบ OSA ปานกลาง ควรปรึกษาแพทย์'
            : 'พบ OSA รุนแรง ควรพบแพทย์โดยด่วน'}
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: 'หยุดหายใจ', val: apneaCount, color: '#ef4444', icon: '⚠️' },
            { label: 'เสียงกรน',  val: snoreCount,  color: '#f59e0b', icon: '🔊' },
            { label: 'ขยับตัว',   val: moveCount,   color: '#38bdf8', icon: '📳' },
          ].map((s,i) => (
            <View key={i} style={styles.statBox}>
              <Text style={styles.statIcon}>{s.icon}</Text>
              <Text style={[styles.statVal, { color: s.color }]}>{s.val}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Timeline */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Timeline</Text>
          {events.map((ev, i) => (
            <View key={i} style={[
              styles.evRow,
              ev.type==='apnea' && { borderLeftColor: '#ef4444' },
              ev.type==='snore' && { borderLeftColor: '#f59e0b' },
              ev.type==='movement' && { borderLeftColor: '#38bdf8' },
            ]}>
              <Text style={styles.evTime}>{ev.time}</Text>
              <Text style={styles.evMsg}>{ev.msg}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.disclaimer}>
          * ผลนี้เป็นการคัดกรองเบื้องต้นด้วย AI เท่านั้น ไม่ใช่การวินิจฉัยทางการแพทย์
        </Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f172a' },
  container: { flex: 1, padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { color: '#f1f5f9', fontSize: 20, fontWeight: 'bold' },
  demo: { color: '#475569', fontSize: 13 },
  card: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginBottom: 12 },
  cardTitle: { color: '#94a3b8', fontSize: 13, marginBottom: 12 },
  chart: { flexDirection: 'row', height: 120, alignItems: 'flex-end', gap: 4 },
  barCol: { flex: 1, alignItems: 'center' },
  barTrack: { flex: 1, width: '80%', justifyContent: 'flex-end' },
  bar: { width: '100%', backgroundColor: '#38bdf8', borderRadius: 3, minHeight: 4 },
  barLabel: { color: '#475569', fontSize: 10, marginTop: 4 },
  legend: { flexDirection: 'row', gap: 12, marginTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { color: '#64748b', fontSize: 11 },
  summaryRow: { flexDirection: 'row', backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginBottom: 12, alignItems: 'center', justifyContent: 'space-between' },
  summaryItem: { alignItems: 'center', flex: 1 },
  summaryIcon: { fontSize: 22, marginBottom: 4 },
  summaryVal: { color: '#f1f5f9', fontSize: 13, fontWeight: '600' },
  summaryLabel: { color: '#64748b', fontSize: 11 },
  donut: { alignItems: 'center', flex: 1 },
  donutRing: { width: 70, height: 70, borderRadius: 35, borderWidth: 5, alignItems: 'center', justifyContent: 'center' },
  donutNum: { fontSize: 22, fontWeight: 'bold' },
  donutLabel: { color: '#64748b', fontSize: 11, marginTop: 4 },
  riskBadge: { borderWidth: 1.5, borderRadius: 12, padding: 14, marginBottom: 12, backgroundColor: '#1e293b' },
  riskText: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  riskSub: { color: '#94a3b8', fontSize: 13 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  statBox: { flex: 1, backgroundColor: '#1e293b', borderRadius: 12, padding: 12, alignItems: 'center' },
  statIcon: { fontSize: 20, marginBottom: 4 },
  statVal: { fontSize: 22, fontWeight: 'bold' },
  statLabel: { color: '#64748b', fontSize: 11, marginTop: 2 },
  evRow: { borderLeftWidth: 3, borderLeftColor: '#475569', paddingLeft: 10, paddingVertical: 6, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  evTime: { color: '#64748b', fontSize: 12 },
  evMsg: { color: '#e2e8f0', fontSize: 13 },
  disclaimer: { color: '#475569', fontSize: 11, textAlign: 'center', fontStyle: 'italic' },
});