import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  getLatestSession, getSessionsByMonth, getOverallStats,
} from '../utils/sessionStorage';
import { colors, radius, shadow, riskTokens } from '../utils/theme';

const VIEW = { LATEST: 'latest', HISTORY: 'history' };

export default function SummaryScreen({ navigation }) {
  const [view, setView] = useState(VIEW.LATEST);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [latest, setLatest] = useState(null);
  const [stats, setStats] = useState({ totalNights: 0, avgSleepHours: 0, streak: 0 });
  const [monthSessions, setMonthSessions] = useState([]);
  const [cursorDate, setCursorDate] = useState(new Date());

  useFocusEffect(
    useCallback(() => {
      loadAll(cursorDate);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  async function loadAll(forMonth) {
    setLoading(true);
    const [latestSession, overallStats] = await Promise.all([
      getLatestSession(),
      getOverallStats(),
    ]);
    setLatest(latestSession);
    setStats(overallStats);
    await loadMonth(forMonth);
    setLoading(false);
  }

  async function loadMonth(date) {
    const sessions = await getSessionsByMonth(date.getFullYear(), date.getMonth() + 1);
    setMonthSessions(sessions.sort((a, b) => b.timestamp - a.timestamp));
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadAll(cursorDate);
    setRefreshing(false);
  }

  function changeMonth(delta) {
    const next = new Date(cursorDate);
    next.setMonth(next.getMonth() + delta);
    setCursorDate(next);
    loadMonth(next);
  }

  function formatDuration(sec) {
    return `${Math.floor(sec / 3600)}ชม. ${Math.floor((sec % 3600) / 60)}น.`;
  }

  function monthLabel(date) {
    return date.toLocaleDateString('th-TH', { year: 'numeric', month: 'long' });
  }

  function dayLabel(dateString) {
    const d = new Date(dateString + 'T00:00:00');
    return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', weekday: 'short' });
  }

  const trendData = [...monthSessions].sort((a, b) => a.timestamp - b.timestamp);
  const maxAhi = Math.max(...trendData.map(s => s.ahi), 5);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingBox}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.pageTitle}>สรุปผล</Text>
            <Text style={styles.pageSub}>
              {stats.totalNights > 0
                ? `บันทึกแล้ว ${stats.totalNights} คืน · เฉลี่ย ${stats.avgSleepHours} ชม./คืน`
                : 'ยังไม่มีข้อมูลการนอน'}
            </Text>
          </View>
          {stats.streak > 0 && (
            <View style={styles.streakBadge}>
              <Text style={styles.streakEmoji}>🔥</Text>
              <Text style={styles.streakNum}>{stats.streak}</Text>
            </View>
          )}
        </View>

        <View style={styles.segment}>
          <TouchableOpacity
            style={[styles.segmentBtn, view === VIEW.LATEST && styles.segmentBtnActive]}
            onPress={() => setView(VIEW.LATEST)}
          >
            <Text style={[styles.segmentText, view === VIEW.LATEST && styles.segmentTextActive]}>
              คืนล่าสุด
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentBtn, view === VIEW.HISTORY && styles.segmentBtnActive]}
            onPress={() => setView(VIEW.HISTORY)}
          >
            <Text style={[styles.segmentText, view === VIEW.HISTORY && styles.segmentTextActive]}>
              ประวัติ
            </Text>
          </TouchableOpacity>
        </View>

        {view === VIEW.LATEST ? (
          <LatestView latest={latest} formatDuration={formatDuration} navigation={navigation} />
        ) : (
          <HistoryView
            cursorDate={cursorDate}
            monthLabel={monthLabel}
            changeMonth={changeMonth}
            trendData={trendData}
            maxAhi={maxAhi}
            monthSessions={monthSessions}
            dayLabel={dayLabel}
            formatDuration={formatDuration}
            navigation={navigation}
          />
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function LatestView({ latest, formatDuration, navigation }) {
  if (!latest) {
    return (
      <View style={styles.emptyBox}>
        <Text style={styles.emptyIcon}>🌙</Text>
        <Text style={styles.emptyTitle}>ยังไม่มีข้อมูลการนอน</Text>
        <Text style={styles.emptySub}>เริ่มบันทึกการนอนคืนแรกของคุณได้เลย</Text>
        <TouchableOpacity
          style={styles.emptyBtn}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Home', { screen: 'Record' })}
        >
          <Text style={styles.emptyBtnText}>เริ่มบันทึก</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const riskUi = riskTokens(latest.riskLabel);
  const sessionDate = new Date(latest.timestamp).toLocaleDateString('th-TH', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return (
    <View>
      <Text style={styles.sessionDate}>{sessionDate}</Text>

      <View style={styles.heroCard}>
        <View style={styles.heroLeft}>
          <Text style={styles.heroLabel}>AHI</Text>
          <Text style={[styles.heroValue, { color: riskUi.color }]}>{latest.ahi}</Text>
          <Text style={styles.heroUnit}>ครั้ง/ชั่วโมง</Text>
        </View>
        <View style={styles.heroDivider} />
        <View style={styles.heroRight}>
          <View style={[styles.riskPill, { backgroundColor: riskUi.soft, borderColor: riskUi.color }]}>
            <Text style={[styles.riskPillText, { color: riskUi.color }]}>{latest.riskLabel}</Text>
          </View>
          <Text style={styles.heroDuration}>🛏️ {formatDuration(latest.duration)}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statIcon}>⚠️</Text>
          <Text style={[styles.statVal, { color: colors.apnea }]}>{latest.apneaCount}</Text>
          <Text style={styles.statLabel}>หยุดหายใจ</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statIcon}>🔊</Text>
          <Text style={[styles.statVal, { color: colors.snore }]}>{latest.snoreCount}</Text>
          <Text style={styles.statLabel}>เสียงกรน</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statIcon}>📳</Text>
          <Text style={[styles.statVal, { color: colors.movement }]}>{latest.moveCount}</Text>
          <Text style={styles.statLabel}>ขยับตัว</Text>
        </View>
      </View>

      {latest.survey && (
        <View style={styles.wellnessCard}>
          <Text style={styles.wellnessLabel}>คะแนนความสดชื่นหลังตื่นนอน</Text>
          <View style={styles.wellnessBarTrack}>
            <View style={[styles.wellnessBarFill, { width: `${latest.survey.wellnessPercent}%` }]} />
          </View>
          <Text style={styles.wellnessPercent}>{latest.survey.wellnessPercent}%</Text>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>ไทม์ไลน์</Text>
        {latest.events.length === 0 ? (
          <Text style={styles.noEvent}>ไม่มีเหตุการณ์ที่บันทึกไว้</Text>
        ) : latest.events.map((ev, i) => (
          <View key={i} style={[styles.evRow, { borderLeftColor:
            ev.type === 'apnea' ? colors.apnea : ev.type === 'snore' ? colors.snore : colors.movement
          }]}>
            <Text style={styles.evTime}>{ev.time}</Text>
            <Text style={styles.evMsg}>{ev.msg}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={styles.exportBtn}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('ResultExport', {
          riskLevel: latest.riskLabel,
          ahiValue: latest.ahi,
          sleepDuration: formatDuration(latest.duration),
          riskColor: riskUi.color,
          apneaCount: latest.apneaCount,
          snoreCount: latest.snoreCount,
          events: latest.events,
        })}
      >
        <Text style={styles.exportBtnText}>📄 สร้างรายงาน PDF</Text>
      </TouchableOpacity>

      <Text style={styles.disclaimer}>
        * ผลนี้เป็นการคัดกรองเบื้องต้นด้วยเทคโนโลยีการประมวลผลสัญญาณ เท่านั้น ไม่ใช่การวินิจฉัยทางการแพทย์
      </Text>
    </View>
  );
}

function HistoryView({
  cursorDate, monthLabel, changeMonth, trendData, maxAhi,
  monthSessions, dayLabel, formatDuration, navigation,
}) {
  return (
    <View>
      <View style={styles.monthPicker}>
        <TouchableOpacity style={styles.monthArrow} onPress={() => changeMonth(-1)}>
          <Text style={styles.monthArrowText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.monthLabel}>{monthLabel(cursorDate)}</Text>
        <TouchableOpacity style={styles.monthArrow} onPress={() => changeMonth(1)}>
          <Text style={styles.monthArrowText}>›</Text>
        </TouchableOpacity>
      </View>

      {monthSessions.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyIcon}>📅</Text>
          <Text style={styles.emptyTitle}>ไม่มีข้อมูลเดือนนี้</Text>
          <Text style={styles.emptySub}>ลองเลือกเดือนอื่น หรือเริ่มบันทึกการนอนคืนนี้</Text>
        </View>
      ) : (
        <>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>แนวโน้ม AHI รายคืน</Text>
            <View style={styles.trendChart}>
              {trendData.map((s) => {
                const heightPct = Math.max((s.ahi / maxAhi) * 100, 6);
                const riskUi = riskTokens(s.riskLabel);
                return (
                  <View key={s.id} style={styles.trendCol}>
                    <View style={styles.trendTrack}>
                      <View style={[styles.trendBar, { height: `${heightPct}%`, backgroundColor: riskUi.color }]} />
                    </View>
                    <Text style={styles.trendLabel}>{new Date(s.timestamp).getDate()}</Text>
                  </View>
                );
              })}
            </View>
            <View style={styles.trendLegendRow}>
              {['ปกติ', 'เล็กน้อย', 'ปานกลาง', 'รุนแรง'].map((label) => {
                const ui = riskTokens(label);
                return (
                  <View key={label} style={styles.legendItem}>
                    <View style={[styles.dot, { backgroundColor: ui.color }]} />
                    <Text style={styles.legendText}>{label}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          <Text style={styles.listSectionTitle}>บันทึกรายวัน ({monthSessions.length})</Text>
          {monthSessions.map((s) => {
            const riskUi = riskTokens(s.riskLabel);
            return (
              <TouchableOpacity
                key={s.id}
                style={styles.dayRow}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('Home', {
                  screen: 'Result',
                  params: { sessionId: s.id },
                })}
              >
                <View style={[styles.dayRowAccent, { backgroundColor: riskUi.color }]} />
                <View style={styles.dayRowContent}>
                  <Text style={styles.dayRowDate}>{dayLabel(s.date)}</Text>
                  <Text style={styles.dayRowSub}>
                    🛏️ {formatDuration(s.duration)} · ⚠️ {s.apneaCount} · 🔊 {s.snoreCount}
                  </Text>
                </View>
                <View style={styles.dayRowRight}>
                  <Text style={[styles.dayRowAhi, { color: riskUi.color }]}>{s.ahi}</Text>
                  <Text style={styles.dayRowAhiLabel}>AHI</Text>
                </View>
                <Text style={styles.arrow}>›</Text>
              </TouchableOpacity>
            );
          })}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, padding: 16 },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  pageTitle: { color: colors.ink, fontSize: 25, fontWeight: '700' },
  pageSub: { color: colors.inkMuted, fontSize: 13, marginTop: 3 },
  streakBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.surface, borderRadius: radius.pill,
    paddingHorizontal: 12, paddingVertical: 7, ...shadow.card,
  },
  streakEmoji: { fontSize: 14 },
  streakNum: { color: colors.riskMild, fontWeight: '700', fontSize: 14 },

  segment: { flexDirection: 'row', backgroundColor: colors.surfaceMuted, borderRadius: radius.md, padding: 4, marginBottom: 20 },
  segmentBtn: { flex: 1, paddingVertical: 11, borderRadius: 12, alignItems: 'center' },
  segmentBtnActive: { backgroundColor: colors.surface, ...shadow.card },
  segmentText: { color: colors.inkFaint, fontSize: 14, fontWeight: '600' },
  segmentTextActive: { color: colors.primaryDeep },

  sessionDate: { color: colors.inkMuted, fontSize: 13, marginBottom: 10, textTransform: 'capitalize' },

  heroCard: {
    flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.xl,
    padding: 22, marginBottom: 16, alignItems: 'center', ...shadow.raised,
  },
  heroLeft: { flex: 1 },
  heroLabel: { color: colors.inkFaint, fontSize: 12, letterSpacing: 1 },
  heroValue: { fontSize: 44, fontWeight: '700', lineHeight: 50 },
  heroUnit: { color: colors.inkFaint, fontSize: 12 },
  heroDivider: { width: 1, height: 60, backgroundColor: colors.border, marginHorizontal: 18 },
  heroRight: { flex: 1, gap: 9 },
  riskPill: { borderWidth: 1.5, borderRadius: radius.pill, paddingVertical: 6, paddingHorizontal: 13, alignSelf: 'flex-start' },
  riskPillText: { fontWeight: '700', fontSize: 13 },
  heroDuration: { color: colors.inkMuted, fontSize: 13 },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statBox: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.md, padding: 14, alignItems: 'center', ...shadow.card },
  statIcon: { fontSize: 20, marginBottom: 6 },
  statVal: { fontSize: 21, fontWeight: '700' },
  statLabel: { color: colors.inkFaint, fontSize: 11, marginTop: 3 },

  wellnessCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 18, marginBottom: 16, ...shadow.card },
  wellnessLabel: { color: colors.inkMuted, fontSize: 13, marginBottom: 12 },
  wellnessBarTrack: { height: 8, backgroundColor: colors.surfaceMuted, borderRadius: 4, overflow: 'hidden' },
  wellnessBarFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 4 },
  wellnessPercent: { color: colors.primaryDeep, fontSize: 13, fontWeight: '700', marginTop: 8, textAlign: 'right' },

  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 18, marginBottom: 16, ...shadow.card },
  cardTitle: { color: colors.inkMuted, fontSize: 13, fontWeight: '600', marginBottom: 14 },
  noEvent: { color: colors.inkFaint, fontStyle: 'italic' },
  evRow: {
    borderLeftWidth: 3, paddingLeft: 12, paddingVertical: 9, paddingRight: 12,
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6,
    backgroundColor: colors.surfaceMuted, borderRadius: 8,
  },
  evTime: { color: colors.inkFaint, fontSize: 12 },
  evMsg: { color: colors.ink, fontSize: 13, fontWeight: '500' },

  exportBtn: {
    backgroundColor: colors.primary, paddingVertical: 16, borderRadius: radius.lg,
    alignItems: 'center', marginBottom: 16,
    shadowColor: colors.primaryDeep, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2, shadowRadius: 12, elevation: 4,
  },
  exportBtnText: { color: colors.onPrimary, fontSize: 15, fontWeight: '700' },
  disclaimer: { color: colors.inkFaint, fontSize: 11, textAlign: 'center', fontStyle: 'italic' },

  emptyBox: { alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 14 },
  emptyTitle: { color: colors.ink, fontSize: 17, fontWeight: '700', marginBottom: 6 },
  emptySub: { color: colors.inkMuted, fontSize: 13, textAlign: 'center', marginBottom: 22 },
  emptyBtn: {
    backgroundColor: colors.primary, borderRadius: radius.lg, paddingVertical: 13, paddingHorizontal: 26,
    shadowColor: colors.primaryDeep, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 4,
  },
  emptyBtnText: { color: colors.onPrimary, fontWeight: '700' },

  monthPicker: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surface, borderRadius: radius.lg, paddingHorizontal: 8, paddingVertical: 10,
    marginBottom: 16, ...shadow.card,
  },
  monthArrow: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  monthArrowText: { color: colors.primary, fontSize: 24, fontWeight: '700' },
  monthLabel: { color: colors.ink, fontSize: 15, fontWeight: '600', textTransform: 'capitalize' },

  trendChart: { flexDirection: 'row', height: 110, alignItems: 'flex-end', gap: 4, marginBottom: 14 },
  trendCol: { flex: 1, alignItems: 'center', maxWidth: 24 },
  trendTrack: { flex: 1, width: '70%', justifyContent: 'flex-end' },
  trendBar: { width: '100%', borderRadius: 4, minHeight: 4 },
  trendLabel: { color: colors.inkFaint, fontSize: 9, marginTop: 6 },
  trendLegendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: colors.inkMuted, fontSize: 10 },

  listSectionTitle: { color: colors.inkMuted, fontSize: 13, fontWeight: '600', marginBottom: 10, marginTop: 4 },
  dayRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderRadius: radius.md, padding: 14, marginBottom: 9, overflow: 'hidden', ...shadow.card,
  },
  dayRowAccent: { width: 4, height: '100%', borderRadius: 2, position: 'absolute', left: 0, top: 0, bottom: 0 },
  dayRowContent: { flex: 1, marginLeft: 10 },
  dayRowDate: { color: colors.ink, fontSize: 14, fontWeight: '600', textTransform: 'capitalize' },
  dayRowSub: { color: colors.inkFaint, fontSize: 11, marginTop: 3 },
  dayRowRight: { alignItems: 'center', marginRight: 8 },
  dayRowAhi: { fontSize: 18, fontWeight: '700' },
  dayRowAhiLabel: { color: colors.inkFaint, fontSize: 9 },
  arrow: { color: colors.inkFaint, fontSize: 20 },
});