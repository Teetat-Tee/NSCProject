import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { colors, radius, shadow } from '../utils/theme';

const HOSPITALS = [
  {
    name: 'โรงพยาบาลมหาราชนครเชียงใหม่',
    nameEn: 'Maharaj Nakorn Chiang Mai Hospital',
    type: 'รัฐบาล',
    address: '110 ถ.อินทรวโรรส ต.ศรีภูมิ อ.เมือง เชียงใหม่',
    phone: '053-936-150',
    hours: 'เปิด 24 ชั่วโมง',
    note: 'โรงพยาบาลรัฐ มีแผนกตรวจการนอนหลับ',
    color: colors.riskNormal,
    emoji: '🏥',
  },
  {
    name: 'โรงพยาบาลเชียงใหม่ราม',
    nameEn: 'Chiangmai Ram Hospital',
    type: 'เอกชน',
    address: '8 ถ.บุญเรืองฤทธิ์ ต.ศรีภูมิ อ.เมือง เชียงใหม่',
    phone: '052-004-699',
    hours: 'เปิด 24 ชั่วโมง',
    note: 'โรงพยาบาลเอกชน บริการครบวงจร',
    color: colors.primary,
    emoji: '🏨',
  },
  {
    name: 'โรงพยาบาลกรุงเทพเชียงใหม่',
    nameEn: 'Bangkok Hospital Chiang Mai',
    type: 'เอกชน',
    address: '88/8-9 ซูเปอร์ไฮเวย์ลำปาง-เชียงใหม่ ต.หนองป่าครั่ง',
    phone: '052-089-888',
    hours: 'เปิด 24 ชั่วโมง',
    note: 'มีแผนก ENT เชี่ยวชาญด้านการนอนหลับ',
    color: colors.riskMild,
    emoji: '🏦',
  },
  {
    name: 'โรงพยาบาลราชเวชเชียงใหม่',
    nameEn: 'Rajavej Chiang Mai Hospital',
    type: 'เอกชน',
    address: '316/1 ถ.เชียงใหม่-ลำพูน ต.วัดเกต อ.เมือง เชียงใหม่',
    phone: '052-011-999',
    hours: 'เปิด 24 ชั่วโมง',
    note: 'บริการตรวจสุขภาพครบวงจร',
    color: '#9D7FC4',
    emoji: '🏣',
  },
  {
    name: 'โรงพยาบาลเชียงใหม่เมดิคอลเซ็นเตอร์',
    nameEn: 'Chiang Mai Medical Center',
    type: 'เอกชน',
    address: '21 ถ.นันทาราม ต.หายยา อ.เมือง เชียงใหม่',
    phone: '053-270-145',
    hours: 'เปิด 24 ชั่วโมง',
    note: 'โรงพยาบาลเอกชนขนาดกลาง',
    color: colors.riskModerate,
    emoji: '🏪',
  },
];

export default function HospitalScreen() {
  function callHospital(phone) {
    Linking.openURL(`tel:${phone.replace(/-/g, '')}`);
  }

  function openMap(name) {
    const query = encodeURIComponent(name + ' เชียงใหม่');
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        <Text style={styles.title}>โรงพยาบาลใกล้เคียง</Text>
        <Text style={styles.sub}>เชียงใหม่ — แนะนำสำหรับตรวจ OSA</Text>

        <View style={styles.tipBox}>
          <Text style={styles.tipText}>
            💡 หากผล AHI ≥ 15 ควรพบแพทย์เพื่อตรวจ PSG จริงที่โรงพยาบาล
          </Text>
        </View>

        {HOSPITALS.map((h, i) => (
          <View key={i} style={styles.card}>
            <View style={[styles.cardAccent, { backgroundColor: h.color }]} />

            <View style={styles.cardHeader}>
              <View style={[styles.emojiBox, { backgroundColor: h.color + '22' }]}>
                <Text style={styles.cardEmoji}>{h.emoji}</Text>
              </View>
              <View style={styles.cardTitleBox}>
                <Text style={styles.cardName}>{h.name}</Text>
                <View style={[styles.typeBadge, { backgroundColor: h.color + '22' }]}>
                  <Text style={[styles.typeText, { color: h.color }]}>{h.type}</Text>
                </View>
              </View>
            </View>

            <Text style={styles.address}>📍 {h.address}</Text>
            <Text style={styles.hours}>🕐 {h.hours}</Text>
            <Text style={styles.note}>ℹ️ {h.note}</Text>

            <View style={styles.btnRow}>
              <TouchableOpacity
                style={[styles.callBtn, { backgroundColor: h.color }]}
                activeOpacity={0.85}
                onPress={() => callHospital(h.phone)}
              >
                <Text style={styles.callBtnText}>📞 {h.phone}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.mapBtn} activeOpacity={0.7} onPress={() => openMap(h.nameEn)}>
                <Text style={styles.mapBtnText}>🗺️ แผนที่</Text>
              </TouchableOpacity>
            </View>

          </View>
        ))}

        <Text style={styles.disclaimer}>
          * ข้อมูลโรงพยาบาลอาจมีการเปลี่ยนแปลง กรุณาโทรยืนยันก่อนเดินทาง
        </Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, padding: 20 },
  title: { color: colors.ink, fontSize: 25, fontWeight: '700' },
  sub: { color: colors.inkMuted, fontSize: 14, marginBottom: 18 },

  tipBox: {
    backgroundColor: colors.riskNormalSoft, borderRadius: radius.md,
    padding: 15, marginBottom: 20, borderLeftWidth: 3, borderLeftColor: colors.riskNormal,
  },
  tipText: { color: colors.riskNormal, fontSize: 13, lineHeight: 20, fontWeight: '500' },

  card: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: 18, marginBottom: 14, overflow: 'hidden', ...shadow.card,
  },
  cardAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },

  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  emojiBox: {
    width: 48, height: 48, borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  cardEmoji: { fontSize: 24 },
  cardTitleBox: { flex: 1 },
  cardName: { color: colors.ink, fontSize: 15, fontWeight: '700', marginBottom: 6 },
  typeBadge: { alignSelf: 'flex-start', borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3 },
  typeText: { fontSize: 11, fontWeight: '700' },

  address: { color: colors.inkMuted, fontSize: 13, marginBottom: 5 },
  hours: { color: colors.inkMuted, fontSize: 13, marginBottom: 5 },
  note: { color: colors.inkFaint, fontSize: 12, marginBottom: 14 },

  btnRow: { flexDirection: 'row', gap: 10 },
  callBtn: { flex: 1, borderRadius: radius.md, padding: 13, alignItems: 'center' },
  callBtnText: { color: colors.onPrimary, fontWeight: '700', fontSize: 13 },
  mapBtn: {
    backgroundColor: colors.surfaceMuted, borderRadius: radius.md,
    padding: 13, alignItems: 'center', paddingHorizontal: 18,
  },
  mapBtnText: { color: colors.ink, fontSize: 13, fontWeight: '600' },

  disclaimer: { color: colors.inkFaint, fontSize: 11, textAlign: 'center', fontStyle: 'italic' },
});