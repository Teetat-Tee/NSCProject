import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { calculateAHI, classifyRisk } from '../utils/modelHelper';
import { getSessionById, getLatestSession } from '../utils/sessionStorage';
import { colors, radius, shadow, riskTokens, eventColor } from '../utils/theme';

const DEMO_EVENTS = [
  { type: 'snore', msg: 'เสียงกรน 88%', time: '23:12:04' },
  { type: 'apnea', msg: '⚠️ หยุดหายใจ 76%', time: '01:34:22' },
  { type: 'snore', msg: 'เสียงกรน 91%', time: '02:11:08' },
  { type: 'apnea', msg: '⚠️ หยุดหายใจ 82%', time: '04:05:17' },
  { type: 'movement', msg: 'ขยับตัว', time: '04:47:33' },
];

export default function ResultScreen({ route, navigation }) {
  const isDemoMode = route?.params?.demo === true;
  const sessionId = route?.params?.sessionId;
  const directDuration = route?.params?.duration;
  const directEvents = route?.params?.events;

  const [loading, setLoading] = useState(true);
  const [duration, setDuration] = useState(directDuration || 28800);
  const [events, setEvents] = useState(directEvents || DEMO_EVENTS);
  const [noData, setNoData] = useState(false);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  async function loadData() {
    setLoading(true);

    if (sessionId) {
      const session = await getSessionById(sessionId);
      if (session) {
        setDuration(session.duration);
        setEvents(session.events);
        setNoData(false);
        setLoading(false);
        return;
      }
    }

    if (directDuration !== undefined && directEvents !== undefined) {
      setDuration(directDuration);
      setEvents(directEvents);
      setNoData(false);
      setLoading(false);
      return;
    }

    if (isDemoMode) {
      const latest = await getLatestSession();
      if (latest) {
        setDuration(latest.duration);
        setEvents(latest.events);
        setNoData(false);
      } else {
        setNoData(true);
      }
      setLoading(false);
      return;
    }

    setNoData(true);
    setLoading(false);
  }

  const apneaCount = events.filter(e => e.type === 'apnea').length;
  const snoreCount = events.filter(e => e.type === 'snore').length;
  const moveCount  = events.filter(e => e.type === 'movement').length;
  const ahi = calculateAHI(apneaCount, duration);
  const risk = classifyRisk(ahi);
  const riskUi = riskTokens(risk.label);

  const hours_arr = ['23','0','1','2','3','4','5','6'];
  const barData = hours_arr.map(h =>
    events.filter(e => parseInt(e.time?.split(':')[0]) === parseInt(h)).length
  );
  const maxBar = Math.max(...barData, 1);

  function formatDuration(sec) {
    return `${Math.floor(sec/3600)}ชม. ${Math.floor((sec%3600)/60)}น.`;
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingBox}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (noData) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.emptyBox}>
          <Text style={styles.emptyIcon}>🌙</Text>
          <Text style={styles.emptyTitle}>ยังไม่มีข้อมูลการนอน</Text>
          <Text style={styles.emptySub}>เริ่มบันทึกการนอนคืนแรกของคุณได้เลย</Text>
          <TouchableOpacity
            style={styles.emptyBtn}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Home', { screen: 'HomeMain' })}
          >
            <Text style={styles.emptyBtnText}>ไปหน้าหลัก</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        <Text style={styles.title}>ผลลัพธ์</Text>

        {/* Bar Chart */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>ระดับเสียงกรนรายชั่วโมง</Text>
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
                      hasApnea && { backgroundColor: colors.apnea },
                    ]} />
                  </View>
                  <Text style={styles.barLabel}>{hours_arr[i]}</Text>
                </View>
              );
            })}
          </View>
          <View style={styles.legend}>
            {[[colors.movement,'กรน'],[colors.snore,'ดัง'],[colors.apnea,'หยุดหายใจ']].map(([c,l]) => (
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
            <View style={[styles.donutRing, { borderColor: riskUi.color, backgroundColor: riskUi.soft }]}>
              <Text style={[styles.donutNum, { color: riskUi.color }]}>{ahi}</Text>
            </View>
            <Text style={styles.donutLabel}>AHI</Text>
          </View>
        </View>

        {/* Risk */}
        <View style={[styles.riskBadge, { borderColor: riskUi.color, backgroundColor: riskUi.soft }]}>
          <Text style={[styles.riskText, { color: riskUi.color }]}>ระดับ: {risk.label}</Text>
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
            { label: 'หยุดหายใจ', val: apneaCount, color: colors.apnea, icon: '⚠️' },
            { label: 'เสียงกรน',  val: snoreCount,  color: colors.snore, icon: '🔊' },
            { label: 'ขยับตัว',   val: moveCount,   color: colors.movement, icon: '📳' },
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
          <Text style={styles.cardTitle}>ไทม์ไลน์</Text>
          {events.length === 0 ? (
            <Text style={styles.noEvent}>ไม่มีเหตุการณ์ที่บันทึกไว้</Text>
          ) : events.map((ev, i) => (
            <View key={i} style={[styles.evRow, { borderLeftColor: eventColor(ev.type) }]}>
              <Text style={styles.evTime}>{ev.time}</Text>
              <Text style={styles.evMsg}>{ev.msg}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity 
          style={styles.exportBtn}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('ResultExport', {
            riskLevel: risk.label,
            ahiValue: ahi,
            sleepDuration: formatDuration(duration),
            riskColor: riskUi.color,
            apneaCount: apneaCount,
            snoreCount: snoreCount,
            events: events
          })}
        >
          <Text style={styles.exportBtnText}>📄 สร้างรายงาน PDF (Detailed Report)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.homeBtn}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('HomeMain')}
        >
          <Text style={styles.homeBtnText}>🏠 กลับหน้าหลัก</Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          * ผลนี้เป็นการคัดกรองเบื้องต้นด้วยเทคโนโลยีการประมวลผลสัญญาณ เท่านั้น ไม่ใช่การวินิจฉัยทางการแพทย์
        </Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, padding: 18 },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  emptyIcon: { fontSize: 56, marginBottom: 12 },
  emptyTitle: { color: colors.ink, fontSize: 18, fontWeight: '700', marginBottom: 6 },
  emptySub: { color: colors.inkMuted, fontSize: 13, textAlign: 'center', marginBottom: 24 },
  emptyBtn: { backgroundColor: colors.primary, borderRadius: radius.lg, paddingVertical: 14, paddingHorizontal: 28 },
  emptyBtnText: { color: colors.onPrimary, fontWeight: '700' },

  title: { color: colors.ink, fontSize: 22, fontWeight: '700', marginBottom: 18 },

  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 18, marginBottom: 14, ...shadow.card },
  cardTitle: { color: colors.inkMuted, fontSize: 13, fontWeight: '600', marginBottom: 14 },
  chart: { flexDirection: 'row', height: 120, alignItems: 'flex-end', gap: 4 },
  barCol: { flex: 1, alignItems: 'center' },
  barTrack: { flex: 1, width: '80%', justifyContent: 'flex-end' },
  bar: { width: '100%', backgroundColor: colors.movement, borderRadius: 4, minHeight: 4 },
  barLabel: { color: colors.inkFaint, fontSize: 10, marginTop: 6 },
  legend: { flexDirection: 'row', gap: 14, marginTop: 14 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  legendText: { color: colors.inkMuted, fontSize: 11 },

  summaryRow: {
    flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: 18, marginBottom: 14, alignItems: 'center', justifyContent: 'space-between',
    ...shadow.card,
  },
  summaryItem: { alignItems: 'center', flex: 1 },
  summaryIcon: { fontSize: 22, marginBottom: 6 },
  summaryVal: { color: colors.ink, fontSize: 13, fontWeight: '700' },
  summaryLabel: { color: colors.inkFaint, fontSize: 11, marginTop: 2 },
  donut: { alignItems: 'center', flex: 1 },
  donutRing: { width: 72, height: 72, borderRadius: 36, borderWidth: 4, alignItems: 'center', justifyContent: 'center' },
  donutNum: { fontSize: 21, fontWeight: '700' },
  donutLabel: { color: colors.inkFaint, fontSize: 11, marginTop: 6 },

  riskBadge: { borderWidth: 1.5, borderRadius: radius.lg, padding: 16, marginBottom: 14 },
  riskText: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  riskSub: { color: colors.inkMuted, fontSize: 13 },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statBox: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.md, padding: 14, alignItems: 'center', ...shadow.card },
  statIcon: { fontSize: 20, marginBottom: 6 },
  statVal: { fontSize: 21, fontWeight: '700' },
  statLabel: { color: colors.inkFaint, fontSize: 11, marginTop: 3 },

  evRow: {
    borderLeftWidth: 3, paddingLeft: 12, paddingVertical: 9, paddingRight: 12,
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6,
    backgroundColor: colors.surfaceMuted, borderRadius: 8,
  },
  evTime: { color: colors.inkFaint, fontSize: 12 },
  evMsg: { color: colors.ink, fontSize: 13, fontWeight: '500' },
  noEvent: { color: colors.inkFaint, fontStyle: 'italic' },

  exportBtn: {
    backgroundColor: colors.primary, paddingVertical: 16, borderRadius: radius.lg,
    alignItems: 'center', marginTop: 6, marginBottom: 16,
    shadowColor: colors.primaryDeep, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2, shadowRadius: 12, elevation: 4,
  },
  exportBtnText: { color: colors.onPrimary, fontSize: 15, fontWeight: '700' },
  homeBtn: {
    paddingVertical: 14, borderRadius: radius.lg, alignItems: 'center',
    marginBottom: 16, backgroundColor: colors.surfaceMuted,
  },
  homeBtnText: { color: colors.ink, fontSize: 14, fontWeight: '600' },
  disclaimer: { color: colors.inkFaint, fontSize: 11, textAlign: 'center', fontStyle: 'italic' },
});