import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, radius, shadow } from '../utils/theme';
import { getPreferences } from '../utils/preferencesStorage';

export default function HomeScreen({ navigation }) {
  const [alarm, setAlarm] = useState({ smartAlarmEnabled: true, smartAlarmTime: '06:30' });

  useFocusEffect(
    useCallback(() => {
      getPreferences().then(setAlarm);
    }, [])
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>สวัสดี</Text>
            <Text style={styles.appName}>OSA Detect</Text>
          </View>
          <TouchableOpacity
            style={styles.alarmPill}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Settings')}
          >
            <Text style={styles.alarmIcon}>{alarm.smartAlarmEnabled ? '⏰' : '🔕'}</Text>
            <Text style={styles.alarmText}>
              {alarm.smartAlarmEnabled ? alarm.smartAlarmTime : 'ปิดอยู่'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroGlow} />
          <Text style={styles.logo}>🫁</Text>
          <Text style={styles.zzz}>z  z  Z</Text>
          <Text style={styles.heroCaption}>พร้อมตรวจจับเสียงกรนและภาวะหยุดหายใจคืนนี้</Text>
        </View>

        <View style={styles.grid}>
          <TouchableOpacity
            style={styles.gridItem}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Summary')}
          >
            <View style={[styles.gridIconBox, { backgroundColor: colors.primarySoft }]}>
              <Text style={styles.gridIcon}>📊</Text>
            </View>
            <Text style={styles.gridLabel}>ผลลัพธ์</Text>
            <Text style={styles.gridSub}>ดูสรุปผล</Text>
          </TouchableOpacity>

          <View style={styles.gridItem}>
            <View style={[styles.gridIconBox, { backgroundColor: colors.surfaceMuted }]}>
              <Text style={styles.gridIcon}>🛏️</Text>
            </View>
            <Text style={styles.gridLabel}>เวลานอน</Text>
            <Text style={styles.gridSub}>ยังไม่ได้บันทึก</Text>
          </View>

          <View style={styles.gridItem}>
            <View style={[styles.gridIconBox, { backgroundColor: colors.surfaceMuted }]}>
              <Text style={styles.gridIcon}>💊</Text>
            </View>
            <Text style={styles.gridLabel}>วิธีรักษา</Text>
            <Text style={styles.gridSub}>ยังไม่ได้ตั้ง</Text>
          </View>

          <View style={styles.gridItem}>
            <View style={[styles.gridIconBox, { backgroundColor: colors.surfaceMuted }]}>
              <Text style={styles.gridIcon}>👃</Text>
            </View>
            <Text style={styles.gridLabel}>ปัจจัย</Text>
            <Text style={styles.gridSub}>ยังไม่ได้ตั้ง</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.startBtn}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Record')}
        >
          <Text style={styles.startIcon}>🎙️</Text>
          <Text style={styles.startText}>เริ่มบันทึกการนอน</Text>
        </TouchableOpacity>

        {/* Debug button — เอาออกหลัง debug เสร็จ */}
        <TouchableOpacity
          style={styles.debugBtn}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('ModelDebug')}
        >
          <Text style={styles.debugBtnText}>🔬 Debug AI Model</Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, padding: 22 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 18,
  },
  greeting: { color: colors.inkFaint, fontSize: 13, marginBottom: 2 },
  appName: { color: colors.ink, fontSize: 24, fontWeight: '700' },
  alarmPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.surface, borderRadius: radius.pill,
    paddingHorizontal: 14, paddingVertical: 8,
    ...shadow.card,
  },
  alarmIcon: { fontSize: 14 },
  alarmText: { color: colors.primaryDeep, fontWeight: '600', fontSize: 13 },

  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    paddingVertical: 36,
    alignItems: 'center',
    marginBottom: 22,
    overflow: 'hidden',
    ...shadow.raised,
  },
  heroGlow: {
    position: 'absolute', top: -60, width: 220, height: 220,
    borderRadius: 110, backgroundColor: colors.primarySoft, opacity: 0.6,
  },
  logo: { fontSize: 64, marginBottom: 6 },
  zzz: { color: colors.primary, fontSize: 20, fontWeight: '600', letterSpacing: 2, marginBottom: 10 },
  heroCaption: { color: colors.inkMuted, fontSize: 13, textAlign: 'center', paddingHorizontal: 30 },

  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'space-between', marginBottom: 26, gap: 12,
  },
  gridItem: {
    width: '47%', backgroundColor: colors.surface,
    borderRadius: radius.lg, padding: 18, alignItems: 'flex-start',
    ...shadow.card,
  },
  gridIconBox: {
    width: 44, height: 44, borderRadius: radius.sm,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  gridIcon: { fontSize: 20 },
  gridLabel: { color: colors.ink, fontSize: 15, fontWeight: '600' },
  gridSub: { color: colors.inkFaint, fontSize: 12, marginTop: 3 },

  startBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 19,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: colors.primaryDeep,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
    marginBottom: 12,
  },
  startIcon: { fontSize: 18 },
  startText: { color: colors.onPrimary, fontSize: 17, fontWeight: '700' },

  debugBtn: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  debugBtnText: { color: colors.inkMuted, fontSize: 13, fontWeight: '600' },
});