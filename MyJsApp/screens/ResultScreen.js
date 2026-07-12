import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, StatusBar } from 'react-native';
import { Clock, AlertTriangle, FileText, Home } from 'lucide-react-native';
import { useTheme, radius, shadow, riskTokens } from '../utils/theme';

export default function ResultScreen({ navigation, route }) {
  const { colors } = useTheme();
  const { session, duration = 0, events = [], ahi = 0, riskLabel = 'ปกติ', wellnessPct = 0 } = route.params ?? {};
  const risk  = riskTokens(riskLabel);
  const hours = Math.floor(duration / 3600);
  const mins  = Math.floor((duration % 3600) / 60);
  const apnea = events.filter(e => e.type === 'apnea').length;

  const stats = [
    { Icon: Clock,         label: 'เวลานอน',  value: `${hours}ชม. ${mins}น.`, color: colors.primary },
    { Icon: AlertTriangle, label: 'หยุดหายใจ', value: `${apnea} ครั้ง`,       color: colors.apnea },
  ];

  const evColor = (type) => type === 'apnea' ? colors.apnea : colors.inkFaint;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={[styles.ahiCard, { backgroundColor: risk.soft }]}>
          <Text style={[styles.ahiLabel, { color: risk.color }]}>AHI</Text>
          <Text style={[styles.ahiVal, { color: risk.color }]}>{ahi}</Text>
          <Text style={[styles.ahiUnit, { color: risk.color }]}>ครั้ง/ชั่วโมง</Text>
          <View style={[styles.riskBadge, { backgroundColor: risk.color }]}>
            <Text style={styles.riskBadgeText}>ระดับ: {riskLabel}</Text>
          </View>
          <Text style={[styles.riskDesc, { color: risk.color }]}>
            {riskLabel === 'ปกติ'    ? 'การนอนปกติ ไม่พบความผิดปกติ' :
             riskLabel === 'เล็กน้อย' ? 'OSA เล็กน้อย ควรติดตามอาการ' :
             riskLabel === 'ปานกลาง' ? 'OSA ปานกลาง ควรปรึกษาแพทย์' :
             'OSA รุนแรง ควรพบแพทย์โดยด่วน'}
          </Text>
        </View>

        <View style={[styles.statsCard, { backgroundColor: colors.surface }, shadow.card]}>
          {stats.map((s, i) => (
            <View key={i} style={[styles.statItem, i < stats.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
              <View style={[styles.statIcon, { backgroundColor: s.color + '18' }]}>
                <s.Icon color={s.color} size={18} strokeWidth={2} />
              </View>
              <Text style={[styles.statLabel, { color: colors.inkMuted }]}>{s.label}</Text>
              <Text style={[styles.statVal, { color: colors.ink }]}>{s.value}</Text>
            </View>
          ))}
        </View>

        {wellnessPct > 0 && (
          <View style={[styles.wellnessCard, { backgroundColor: colors.surface }, shadow.card]}>
            <Text style={[styles.wellnessTitle, { color: colors.ink }]}>คะแนนความสดชื่นหลังตื่นนอน</Text>
            <View style={[styles.wellnessBar, { backgroundColor: colors.surfaceMuted }]}>
              <View style={[styles.wellnessFill, { width: `${wellnessPct}%`, backgroundColor: colors.primary }]} />
            </View>
            <Text style={[styles.wellnessPct, { color: colors.primary }]}>{wellnessPct}%</Text>
          </View>
        )}

        {events.length > 0 && (
          <View style={[styles.timelineCard, { backgroundColor: colors.surface }, shadow.card]}>
            <Text style={[styles.timelineTitle, { color: colors.ink }]}>ไทม์ไลน์</Text>
            {events.slice(0, 10).map((ev, i) => (
              <View key={i} style={[styles.evRow, { borderLeftColor: evColor(ev.type), backgroundColor: colors.surfaceMuted }]}>
                <Text style={[styles.evTime, { color: colors.inkFaint }]}>{ev.time ?? ev.time_str}</Text>
                <Text style={[styles.evMsg, { color: colors.ink }]}>{ev.msg}</Text>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={[styles.pdfBtn, { backgroundColor: colors.primary, shadowColor: colors.primaryDeep }]}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('ResultExport', { session, duration, events, ahi, riskLabel, wellnessPct })}
        >
          <FileText color={colors.onPrimary} size={20} strokeWidth={2} />
          <Text style={[styles.btnText, { color: colors.onPrimary }]}>สร้างรายงาน PDF</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.homeBtn, { backgroundColor: colors.surfaceMuted }]}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('HomeMain')}
        >
          <Home color={colors.inkMuted} size={18} strokeWidth={2} />
          <Text style={[styles.homeBtnText, { color: colors.inkMuted }]}>กลับหน้าหลัก</Text>
        </TouchableOpacity>

        <Text style={[styles.disclaimer, { color: colors.inkFaint }]}>
          ผลนี้เป็นการคัดกรองเบื้องต้นเท่านั้น ไม่ใช่การวินิจฉัยทางการแพทย์
        </Text>
        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1 },
  scroll:  { padding: 22 },
  ahiCard: { borderRadius: radius.xl, padding: 28, alignItems: 'center', marginBottom: 16 },
  ahiLabel:{ fontSize: 14, fontWeight: '600', marginBottom: 4 },
  ahiVal:  { fontSize: 72, fontWeight: '800', lineHeight: 80 },
  ahiUnit: { fontSize: 14, marginBottom: 14 },
  riskBadge:    { paddingHorizontal: 16, paddingVertical: 6, borderRadius: radius.pill, marginBottom: 8 },
  riskBadgeText:{ color: '#fff', fontWeight: '700', fontSize: 14 },
  riskDesc:     { fontSize: 13, textAlign: 'center' },
  statsCard:    { borderRadius: radius.lg, overflow: 'hidden', marginBottom: 16 },
  statItem:     { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  statIcon:     { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statLabel:    { flex: 1, fontSize: 14 },
  statVal:      { fontSize: 15, fontWeight: '700' },
  wellnessCard: { borderRadius: radius.lg, padding: 18, marginBottom: 16 },
  wellnessTitle:{ fontSize: 14, fontWeight: '600', marginBottom: 12 },
  wellnessBar:  { height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  wellnessFill: { height: '100%', borderRadius: 4 },
  wellnessPct:  { fontSize: 22, fontWeight: '700', textAlign: 'right' },
  timelineCard: { borderRadius: radius.lg, padding: 18, marginBottom: 16 },
  timelineTitle:{ fontSize: 14, fontWeight: '700', marginBottom: 12 },
  evRow:  { borderLeftWidth: 3, paddingLeft: 10, paddingVertical: 8, paddingRight: 10, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6, borderRadius: 8 },
  evTime: { fontSize: 11 },
  evMsg:  { fontSize: 12, fontWeight: '600' },
  pdfBtn: { borderRadius: radius.lg, paddingVertical: 19, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 12, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 14, elevation: 6 },
  homeBtn:{ borderRadius: radius.lg, paddingVertical: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 16 },
  btnText:     { fontSize: 16, fontWeight: '700' },
  homeBtnText: { fontSize: 15, fontWeight: '600' },
  disclaimer:  { fontSize: 11, textAlign: 'center', lineHeight: 17 },
});