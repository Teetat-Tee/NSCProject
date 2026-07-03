import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Linking, StatusBar } from 'react-native';
import { useTheme, radius, shadow } from '../utils/theme';

const HOSPITALS = [
  { name: 'โรงพยาบาลมหาราชนครเชียงใหม่', type: 'รัฐบาล', typeColor: '#2E7D32', address: '110 ถ.อินทรวโรรส ต.ศรีภูมิ อ.เมือง เชียงใหม่', hours: 'เปิด 24 ชั่วโมง', info: 'โรงพยาบาลรัฐ มีแผนกตรวจการนอนหลับ', phone: '053936150', accent: '#2E7D32' },
  { name: 'โรงพยาบาลเชียงใหม่ราม', type: 'เอกชน', typeColor: '#1565C0', address: '8 ถ.บุญเรืองฤทธิ์ ต.ศรีภูมิ อ.เมือง เชียงใหม่', hours: 'เปิด 24 ชั่วโมง', info: 'โรงพยาบาลเอกชน บริการครบวงจร', phone: '052004699', accent: '#1565C0' },
  { name: 'โรงพยาบาลกรุงเทพเชียงใหม่', type: 'เอกชน', typeColor: '#E65100', address: '88/8-9 ซ.เปอร์ไฮเวย์ลำปาง-เชียงใหม่ ต.หนองป่าครั่ง', hours: 'เปิด 24 ชั่วโมง', info: 'เครือโรงพยาบาลกรุงเทพ', phone: '052089888', accent: '#E65100' },
  { name: 'โรงพยาบาลเชียงใหม่เมดิคอล', type: 'เอกชน', typeColor: '#6A1B9A', address: '21 ถ.นิมมานเหมินทร์ อ.เมือง เชียงใหม่', hours: 'จ-ศ 8:00-20:00', info: 'คลินิกเฉพาะทาง', phone: '053215777', accent: '#6A1B9A' },
  { name: 'โรงพยาบาลราชเวชเชียงใหม่', type: 'เอกชน', typeColor: '#00695C', address: '311 ถ.ช้างคลาน อ.เมือง เชียงใหม่', hours: 'เปิด 24 ชั่วโมง', info: 'บริการครบวงจร ใจกลางเมือง', phone: '053898898', accent: '#00695C' },
];

export default function HospitalScreen() {
  const { colors, isDark } = useTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <Text style={[styles.title, { color: colors.ink }]}>โรงพยาบาลใกล้เคียง</Text>
        <Text style={[styles.sub, { color: colors.inkMuted }]}>เชียงใหม่ — แนะนำสำหรับตรวจ OSA</Text>

        <View style={[styles.tip, { backgroundColor: colors.riskNormalSoft, borderColor: colors.riskNormal + '40' }]}>
          <Text style={{ fontSize: 16 }}>💡</Text>
          <Text style={[styles.tipText, { color: colors.riskNormal }]}>
            หากผล AHI ≥ 15 ควรพบแพทย์เพื่อตรวจ PSG จริงที่โรงพยาบาล
          </Text>
        </View>

        {HOSPITALS.map((h, i) => (
          <View key={i} style={[styles.card, { backgroundColor: colors.surface, borderLeftColor: h.accent }, !isDark && shadow.card]}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: h.accent + '20' }]}>
                <Text style={{ fontSize: 24 }}>🏥</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.hospitalName, { color: colors.ink }]}>{h.name}</Text>
                <View style={[styles.typeBadge, { backgroundColor: h.typeColor + '20' }]}>
                  <Text style={[styles.typeText, { color: h.typeColor }]}>{h.type}</Text>
                </View>
              </View>
            </View>

            <View style={styles.details}>
              <Text style={[styles.detail, { color: colors.inkMuted }]}>📍 {h.address}</Text>
              <Text style={[styles.detail, { color: colors.inkMuted }]}>🕐 {h.hours}</Text>
              <Text style={[styles.detail, { color: colors.inkMuted }]}>ℹ️ {h.info}</Text>
            </View>

            <View style={styles.buttons}>
              <TouchableOpacity
                style={[styles.callBtn, { backgroundColor: h.accent }]}
                activeOpacity={0.8}
                onPress={() => Linking.openURL(`tel:${h.phone}`)}
              >
                <Text style={styles.callText}>📞 {h.phone.replace(/(\d{3})(\d{3})(\d{3})/, '$1-$2-$3')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.mapBtn, { backgroundColor: colors.surfaceMuted }]}
                activeOpacity={0.8}
                onPress={() => Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(h.name + ' ' + h.address)}`)}
              >
                <Text style={[styles.mapText, { color: colors.inkMuted }]}>🗺️ แผนที่</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1 },
  scroll: { padding: 22 },
  title:  { fontSize: 26, fontWeight: '800', marginBottom: 4 },
  sub:    { fontSize: 13, marginBottom: 18 },
  tip:    { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: radius.md, borderWidth: 1, marginBottom: 20 },
  tipText:{ flex: 1, fontSize: 13, lineHeight: 20, fontWeight: '500' },
  card: { borderRadius: radius.lg, padding: 18, marginBottom: 16, borderLeftWidth: 4 },
  cardHeader:{ flexDirection: 'row', gap: 14, alignItems: 'flex-start', marginBottom: 14 },
  iconBox:   { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  hospitalName:{ fontSize: 16, fontWeight: '700', marginBottom: 6, lineHeight: 22 },
  typeBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.pill },
  typeText:  { fontSize: 12, fontWeight: '600' },
  details:   { gap: 6, marginBottom: 16 },
  detail:    { fontSize: 13, lineHeight: 19 },
  buttons:   { flexDirection: 'row', gap: 10 },
  callBtn:   { flex: 1, paddingVertical: 12, borderRadius: radius.lg, alignItems: 'center' },
  callText:  { color: '#fff', fontWeight: '700', fontSize: 14 },
  mapBtn:    { paddingHorizontal: 20, paddingVertical: 12, borderRadius: radius.lg, alignItems: 'center' },
  mapText:   { fontWeight: '600', fontSize: 14 },
});