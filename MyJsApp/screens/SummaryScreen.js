import { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, StatusBar, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  Flame, ChevronLeft, ChevronRight,
  AlertTriangle, Volume2, Smartphone, Bed, Clock,
} from 'lucide-react-native';
import { useTheme, radius, shadow, riskTokens } from '../utils/theme';
import { getAllSessions, getLatestSession, getOverallStats } from '../utils/sessionStorage';

const MONTHS_TH = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
const MONTHS_FULL_TH = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
const DAYS_TH = ['วันอาทิตย์','วันจันทร์','วันอังคาร','วันพุธ','วันพฤหัสบดี','วันศุกร์','วันเสาร์'];

export default function SummaryScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const [tab, setTab]         = useState('latest');
  const [latest, setLatest]   = useState(null);
  const [sessions, setSessions] = useState([]);
  const [stats, setStats]     = useState({ totalNights: 0, avgSleepHours: 0, streak: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const now = new Date();
  const [viewYear, setViewYear]   = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  async function loadData() {
    try {
      const [l, s, st] = await Promise.all([
        getLatestSession(),
        getAllSessions(),
        getOverallStats(),
      ]);
      setLatest(l);
      setSessions(s || []);
      setStats(st || { totalNights: 0, avgSleepHours: 0, streak: 0 });
    } catch(e) {
      console.error('loadData error:', e);
    }
  }

  useFocusEffect(useCallback(() => { loadData(); }, []));

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  const monthSessions = sessions.filter(s => {
    if (!s.date) return false;
    const d = new Date(s.date);
    return d.getFullYear() === viewYear && d.getMonth() === viewMonth;
  });

  const riskColor = (label) => {
    const t = riskTokens(label, isDark);
    return t.color;
  };

  function formatDate(dateStr) {
    const d = new Date(dateStr);
    return `${DAYS_TH[d.getDay()]}ที่ ${d.getDate()} ${MONTHS_FULL_TH[d.getMonth()]}`;
  }

  function formatDateShort(dateStr) {
    const d = new Date(dateStr);
    return `${DAYS_TH[d.getDay()].slice(3, 5)}. ${d.getDate()} ${MONTHS_TH[d.getMonth()]}.`;
  }

  function formatDuration(sec) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return `${h}ชม. ${m}น.`;
  }

  const c = colors;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: c.ink }]}>สรุปผล</Text>
            <Text style={[styles.sub, { color: c.inkMuted }]}>
              บันทึกแล้ว {stats.totalNights} คืน · เฉลี่ย {stats.avgSleepHours} ชม./คืน
            </Text>
          </View>
          {stats.streak > 0 && (
            <View style={[styles.streakBadge, { backgroundColor: c.riskMildSoft }]}>
              <Flame color={c.riskMild} size={16} strokeWidth={2} />
              <Text style={[styles.streakText, { color: c.riskMild }]}>{stats.streak}</Text>
            </View>
          )}
        </View>

        {/* Tab */}
        <View style={[styles.tabWrap, { backgroundColor: c.surfaceMuted }]}>
          {[['latest', 'คืนล่าสุด'], ['history', 'ประวัติ']].map(([key, label]) => (
            <TouchableOpacity
              key={key}
              style={[styles.tab, tab === key && { backgroundColor: c.surface }, !isDark && tab === key && shadow.card]}
              onPress={() => setTab(key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, { color: tab === key ? c.primary : c.inkMuted, fontWeight: tab === key ? '700' : '400' }]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Latest Night ── */}
        {tab === 'latest' && (
          latest ? (
            <>
              <Text style={[styles.dateLabel, { color: c.inkMuted }]}>{formatDate(latest.date)}</Text>

              {/* AHI Card */}
              <View style={[styles.ahiCard, { backgroundColor: c.surface }, !isDark && shadow.card]}>
                <View style={styles.ahiLeft}>
                  <Text style={[styles.ahiLabel, { color: c.inkFaint }]}>AHI</Text>
                  <Text style={[styles.ahiVal, { color: riskColor(latest.riskLabel) }]}>{latest.ahi ?? 0}</Text>
                  <Text style={[styles.ahiUnit, { color: c.inkFaint }]}>ครั้ง/ชั่วโมง</Text>
                </View>
                <View style={[styles.ahiDivider, { backgroundColor: c.border }]} />
                <View style={styles.ahiRight}>
                  <View style={[styles.riskBadge, { backgroundColor: riskColor(latest.riskLabel) + '20', borderColor: riskColor(latest.riskLabel) + '60', borderWidth: 1 }]}>
                    <Text style={[styles.riskText, { color: riskColor(latest.riskLabel) }]}>{latest.riskLabel}</Text>
                  </View>
                  <View style={styles.durationRow}>
                    <Bed color={c.inkFaint} size={14} strokeWidth={2} />
                    <Text style={[styles.durationText, { color: c.inkMuted }]}>{formatDuration(latest.duration || 0)}</Text>
                  </View>
                </View>
              </View>

              {/* Stats */}
              <View style={[styles.statsRow]}>
                {[
                  { Icon: AlertTriangle, color: c.apnea,    val: latest.apneaCount ?? 0, label: 'หยุดหายใจ' },
                  { Icon: Volume2,       color: c.snore,    val: latest.snoreCount ?? 0, label: 'เสียงกรน' },
                  { Icon: Smartphone,    color: c.movement, val: latest.moveCount  ?? 0, label: 'ขยับตัว' },
                ].map((s, i) => (
                  <View key={i} style={[styles.statCard, { backgroundColor: c.surface }, !isDark && shadow.card]}>
                    <View style={[styles.statIcon, { backgroundColor: s.color + '18' }]}>
                      <s.Icon color={s.color} size={18} strokeWidth={2} />
                    </View>
                    <Text style={[styles.statVal, { color: s.color }]}>{s.val}</Text>
                    <Text style={[styles.statLabel, { color: c.inkFaint }]}>{s.label}</Text>
                  </View>
                ))}
              </View>

              {/* Wellness */}
              {(latest.wellnessPct ?? 0) > 0 && (
                <View style={[styles.wellCard, { backgroundColor: c.surface }, !isDark && shadow.card]}>
                  <Text style={[styles.wellTitle, { color: c.ink }]}>คะแนนความสดชื่นหลังตื่นนอน</Text>
                  <View style={[styles.wellBar, { backgroundColor: c.surfaceMuted }]}>
                    <View style={[styles.wellFill, { width: `${latest.wellnessPct}%`, backgroundColor: c.primary }]} />
                  </View>
                  <Text style={[styles.wellPct, { color: c.primary }]}>{latest.wellnessPct}%</Text>
                </View>
              )}

              {/* Timeline */}
              <View style={[styles.timelineCard, { backgroundColor: c.surface }, !isDark && shadow.card]}>
                <Text style={[styles.timelineTitle, { color: c.ink }]}>ไทม์ไลน์</Text>
                {(latest.events ?? []).length === 0
                  ? <Text style={[styles.noEvent, { color: c.inkFaint }]}>ไม่มีเหตุการณ์ที่บันทึกไว้</Text>
                  : (latest.events ?? []).slice(0, 10).map((ev, i) => {
                      const evColor = ev.type === 'apnea' ? c.apnea : ev.type === 'snore' ? c.snore : c.movement;
                      return (
                        <View key={i} style={[styles.evRow, { borderLeftColor: evColor, backgroundColor: c.surfaceMuted }]}>
                          <Text style={[styles.evTime, { color: c.inkFaint }]}>{ev.time ?? ev.time_str}</Text>
                          <Text style={[styles.evMsg, { color: c.ink }]}>{ev.msg}</Text>
                        </View>
                      );
                    })
                }
              </View>

              {/* Buttons */}
              <TouchableOpacity
                style={[styles.recordBtn, { backgroundColor: colors.primary, shadowColor: colors.primaryDeep }]}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('ResultExport', {
                  session: latest,
                  duration: latest.duration,
                  events: latest.events ?? [],
                  ahi: latest.ahi,
                  riskLabel: latest.riskLabel,
                  wellnessPct: latest.wellnessPct ?? 0,
                })}
              >
                <Text style={[styles.recordBtnText, { color: colors.onPrimary }]}>ส่งออกรายงาน PDF</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={[styles.emptyCard, { backgroundColor: c.surface }, !isDark && shadow.card]}>
              <Bed color={c.inkFaint} size={48} strokeWidth={1.5} style={{ marginBottom: 12 }} />
              <Text style={[styles.emptyTitle, { color: c.ink }]}>ยังไม่มีข้อมูล</Text>
              <Text style={[styles.emptySub, { color: c.inkMuted }]}>เริ่มบันทึกการนอนคืนแรกของคุณ</Text>
              <TouchableOpacity
                style={[styles.recordBtn, { backgroundColor: c.primary, marginTop: 20 }]}
                onPress={() => navigation.navigate('Record')}
              >
                <Text style={[styles.recordBtnText, { color: c.onPrimary }]}>เริ่มบันทึก</Text>
              </TouchableOpacity>
            </View>
          )
        )}

        {/* ── History ── */}
        {tab === 'history' && (
          <>
            {/* Month Picker */}
            <View style={[styles.monthPicker, { backgroundColor: c.surface }, !isDark && shadow.card]}>
              <TouchableOpacity onPress={prevMonth} style={styles.monthBtn}>
                <ChevronLeft color={c.primary} size={20} strokeWidth={2} />
              </TouchableOpacity>
              <Text style={[styles.monthLabel, { color: c.ink }]}>
                {MONTHS_FULL_TH[viewMonth]} {viewYear + 543}
              </Text>
              <TouchableOpacity onPress={nextMonth} style={styles.monthBtn}>
                <ChevronRight color={c.primary} size={20} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            {/* AHI Chart */}
            <View style={[styles.chartCard, { backgroundColor: c.surface }, !isDark && shadow.card]}>
              <Text style={[styles.chartTitle, { color: c.ink }]}>แนวโน้ม AHI รายคืน</Text>
              {monthSessions.length > 0 ? (
                <View style={styles.chartBars}>
                  {monthSessions.slice(0, 8).map((s, i) => {
                    const maxAhi = Math.max(...monthSessions.map(x => x.ahi ?? 0), 1);
                    const barH   = Math.max(((s.ahi ?? 0) / maxAhi) * 60, 4);
                    const rc     = riskColor(s.riskLabel);
                    return (
                      <View key={i} style={styles.chartBarWrap}>
                        <View style={[styles.chartBar, { height: barH, backgroundColor: rc }]} />
                        <Text style={[styles.chartBarLabel, { color: c.inkFaint }]}>
                          {new Date(s.date + 'T00:00:00').getDate()}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <Text style={[styles.noEvent, { color: c.inkFaint }]}>ไม่มีข้อมูลในเดือนนี้</Text>
              )}
              <View style={styles.legend}>
                {[['ปกติ', c.riskNormal], ['เล็กน้อย', c.riskMild], ['ปานกลาง', c.riskModerate], ['รุนแรง', c.riskSevere]].map(([l, col]) => (
                  <View key={l} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: col }]} />
                    <Text style={[styles.legendText, { color: c.inkFaint }]}>{l}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Session List */}
            <Text style={[styles.listTitle, { color: c.inkMuted }]}>บันทึกรายวัน ({monthSessions.length})</Text>
            {monthSessions.length === 0
              ? <Text style={[styles.noEvent, { color: c.inkFaint }]}>ไม่มีข้อมูลในเดือนนี้</Text>
              : monthSessions.map((s, i) => {
                  const rc = riskColor(s.riskLabel);
                  return (
                    <TouchableOpacity
                      key={i}
                      style={[styles.sessionRow, { backgroundColor: c.surface, borderLeftColor: rc }, !isDark && shadow.card]}
                      activeOpacity={0.75}
                      onPress={() => navigation.navigate('Result', {
                        session: s, duration: s.duration, events: s.events ?? [],
                        ahi: s.ahi, riskLabel: s.riskLabel, wellnessPct: s.wellnessPct ?? 0,
                      })}
                    >
                      <View style={styles.sessionLeft}>
                        <Text style={[styles.sessionDate, { color: c.ink }]}>{formatDateShort(s.date)}</Text>
                        <View style={styles.sessionMeta}>
                          <Bed color={c.inkFaint} size={12} strokeWidth={2} />
                          <Text style={[styles.sessionMetaText, { color: c.inkFaint }]}>{formatDuration(s.duration || 0)}</Text>
                          <AlertTriangle color={c.apnea} size={12} strokeWidth={2} />
                          <Text style={[styles.sessionMetaText, { color: c.inkFaint }]}>{s.apneaCount ?? 0}</Text>
                          <Volume2 color={c.snore} size={12} strokeWidth={2} />
                          <Text style={[styles.sessionMetaText, { color: c.inkFaint }]}>{s.snoreCount ?? 0}</Text>
                        </View>
                      </View>
                      <View style={styles.sessionRight}>
                        <Text style={[styles.sessionAhi, { color: rc }]}>{s.ahi ?? 0}</Text>
                        <Text style={[styles.sessionAhiLabel, { color: c.inkFaint }]}>AHI</Text>
                        <ChevronRight color={c.inkFaint} size={16} strokeWidth={2} />
                      </View>
                    </TouchableOpacity>
                  );
                })
            }
          </>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1 },
  scroll: { padding: 22 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  title:  { fontSize: 26, fontWeight: '800', marginBottom: 4 },
  sub:    { fontSize: 13 },
  streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill },
  streakText:  { fontSize: 14, fontWeight: '700' },
  tabWrap: { flexDirection: 'row', borderRadius: radius.lg, padding: 4, marginBottom: 20 },
  tab:     { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: radius.md },
  tabText: { fontSize: 14 },
  dateLabel: { fontSize: 13, marginBottom: 12 },
  ahiCard:   { borderRadius: radius.lg, padding: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  ahiLeft:   { flex: 1, alignItems: 'center' },
  ahiLabel:  { fontSize: 12, marginBottom: 4 },
  ahiVal:    { fontSize: 52, fontWeight: '800' },
  ahiUnit:   { fontSize: 11, marginTop: 2 },
  ahiDivider:{ width: 1, height: 80, marginHorizontal: 20 },
  ahiRight:  { flex: 1, alignItems: 'center', gap: 12 },
  riskBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: radius.pill },
  riskText:  { fontSize: 14, fontWeight: '700' },
  durationRow:{ flexDirection: 'row', alignItems: 'center', gap: 6 },
  durationText:{ fontSize: 13 },
  statsRow:  { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard:  { flex: 1, borderRadius: radius.lg, padding: 14, alignItems: 'center', gap: 6 },
  statIcon:  { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statVal:   { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: 11 },
  wellCard:  { borderRadius: radius.lg, padding: 18, marginBottom: 16 },
  wellTitle: { fontSize: 14, fontWeight: '600', marginBottom: 12 },
  wellBar:   { height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  wellFill:  { height: '100%', borderRadius: 4 },
  wellPct:   { fontSize: 18, fontWeight: '700', textAlign: 'right' },
  timelineCard: { borderRadius: radius.lg, padding: 18, marginBottom: 16 },
  timelineTitle:{ fontSize: 14, fontWeight: '700', marginBottom: 12 },
  noEvent:      { fontSize: 13, fontStyle: 'italic' },
  evRow:  { borderLeftWidth: 3, paddingLeft: 10, paddingVertical: 8, paddingRight: 10, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6, borderRadius: 8 },
  evTime: { fontSize: 11 },
  evMsg:  { fontSize: 12, fontWeight: '600' },
  recordBtn:     { borderRadius: radius.lg, paddingVertical: 18, alignItems: 'center', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 4 },
  recordBtnText: { fontSize: 16, fontWeight: '700' },
  emptyCard:  { borderRadius: radius.xl, padding: 32, alignItems: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptySub:   { fontSize: 14, textAlign: 'center' },
  monthPicker:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: radius.lg, paddingVertical: 14, paddingHorizontal: 16, marginBottom: 16 },
  monthBtn:   { padding: 4 },
  monthLabel: { fontSize: 16, fontWeight: '600' },
  chartCard:  { borderRadius: radius.lg, padding: 18, marginBottom: 16 },
  chartTitle: { fontSize: 14, fontWeight: '700', marginBottom: 16 },
  chartBars:  { flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 70, marginBottom: 12 },
  chartBarWrap:{ flex: 1, alignItems: 'center', gap: 4 },
  chartBar:   { width: '100%', borderRadius: 4, minHeight: 4 },
  chartBarLabel:{ fontSize: 10 },
  legend:     { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot:  { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11 },
  listTitle:  { fontSize: 12, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10 },
  sessionRow: { borderRadius: radius.lg, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 10, borderLeftWidth: 4 },
  sessionLeft:{ flex: 1 },
  sessionDate:{ fontSize: 15, fontWeight: '600', marginBottom: 6 },
  sessionMeta:{ flexDirection: 'row', alignItems: 'center', gap: 6 },
  sessionMetaText:{ fontSize: 12 },
  sessionRight:{ alignItems: 'center', flexDirection: 'row', gap: 4 },
  sessionAhi: { fontSize: 24, fontWeight: '800' },
  sessionAhiLabel:{ fontSize: 11 },
});