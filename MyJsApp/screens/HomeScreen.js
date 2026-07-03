import { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Moon, BarChart2, Clock, Pill, Wind, ChevronRight, Mic } from 'lucide-react-native';
import { useTheme, radius, shadow } from '../utils/theme';

export default function HomeScreen({ navigation }) {
  const { colors, isDark } = useTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.greeting, { color: colors.inkFaint }]}>สวัสดี</Text>
          <Text style={[styles.appName, { color: colors.ink }]}>OSA Detect</Text>
        </View>

        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: colors.primary }, shadow.raised]}>
          <View style={[styles.heroGlow, { backgroundColor: 'rgba(255,255,255,0.1)' }]} />
          <Moon color="rgba(255,255,255,0.9)" size={52} strokeWidth={1.5} />
          <Text style={styles.zzz}>z  z  Z</Text>
          <Text style={styles.heroSub}>พร้อมตรวจจับเสียงกรนและภาวะหยุดหายใจคืนนี้</Text>
        </View>

        {/* Grid */}
        <View style={styles.grid}>
          {[
            { icon: <BarChart2 color={colors.primary} size={22} strokeWidth={2} />, bg: colors.primarySoft, label: 'ผลลัพธ์', sub: 'ดูสรุปผล', onPress: () => navigation.navigate('Summary') },
            { icon: <Clock color={colors.inkMuted} size={22} strokeWidth={2} />, bg: colors.surfaceMuted, label: 'เวลานอน', sub: 'ยังไม่ได้บันทึก', onPress: null },
            { icon: <Pill color={colors.inkMuted} size={22} strokeWidth={2} />, bg: colors.surfaceMuted, label: 'วิธีรักษา', sub: 'ยังไม่ได้ตั้ง', onPress: null },
            { icon: <Wind color={colors.inkMuted} size={22} strokeWidth={2} />, bg: colors.surfaceMuted, label: 'ปัจจัย', sub: 'ยังไม่ได้ตั้ง', onPress: null },
          ].map((item, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.gridItem, { backgroundColor: colors.surface }, !isDark && shadow.card]}
              activeOpacity={item.onPress ? 0.7 : 1}
              onPress={item.onPress ?? undefined}
              disabled={!item.onPress}
            >
              <View style={[styles.gridIcon, { backgroundColor: item.bg }]}>{item.icon}</View>
              <Text style={[styles.gridLabel, { color: colors.ink }]}>{item.label}</Text>
              <Text style={[styles.gridSub, { color: colors.inkFaint }]}>{item.sub}</Text>
              {item.onPress && <ChevronRight color={colors.inkFaint} size={14} style={styles.arrow} />}
            </TouchableOpacity>
          ))}
        </View>

        {/* Start Button */}
        <TouchableOpacity
          style={[styles.startBtn, { backgroundColor: colors.primary, shadowColor: colors.primaryDeep }]}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Record')}
        >
          <Mic color={colors.onPrimary} size={20} strokeWidth={2} />
          <Text style={[styles.startText, { color: colors.onPrimary }]}>เริ่มบันทึกการนอน</Text>
        </TouchableOpacity>

        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1 },
  scroll:  { padding: 22 },
  header:  { marginBottom: 20 },
  greeting:{ fontSize: 13, marginBottom: 2 },
  appName: { fontSize: 26, fontWeight: '800' },
  hero: {
    borderRadius: radius.xl, paddingVertical: 36,
    alignItems: 'center', marginBottom: 22, overflow: 'hidden',
  },
  heroGlow: { position: 'absolute', top: -60, width: 220, height: 220, borderRadius: 110 },
  zzz:     { color: 'rgba(255,255,255,0.85)', fontSize: 18, fontWeight: '600', letterSpacing: 3, marginTop: 10, marginBottom: 8 },
  heroSub: { color: 'rgba(255,255,255,0.75)', fontSize: 13, textAlign: 'center', paddingHorizontal: 30 },
  grid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  gridItem:{ width: '47%', borderRadius: radius.lg, padding: 18 },
  gridIcon:{ width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  gridLabel:{ fontSize: 15, fontWeight: '600', marginBottom: 3 },
  gridSub: { fontSize: 12 },
  arrow:   { position: 'absolute', top: 18, right: 14 },
  startBtn:{ borderRadius: radius.lg, paddingVertical: 19, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 6 },
  startText:{ fontSize: 17, fontWeight: '700' },
});