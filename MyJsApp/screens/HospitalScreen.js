import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Linking } from 'react-native';

const HOSPITALS = [
  {
    name: 'โรงพยาบาลมหาราชนครเชียงใหม่',
    nameEn: 'Maharaj Nakorn Chiang Mai Hospital',
    type: 'รัฐบาล',
    address: '110 ถ.อินทรวโรรส ต.ศรีภูมิ อ.เมือง เชียงใหม่',
    phone: '053-936-150',
    hours: 'เปิด 24 ชั่วโมง',
    note: 'โรงพยาบาลรัฐ มีแผนกตรวจการนอนหลับ',
    color: '#22c55e',
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
    color: '#38bdf8',
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
    color: '#f59e0b',
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
    color: '#a78bfa',
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
    color: '#f97316',
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
      <ScrollView style={styles.container}>

        <Text style={styles.title}>โรงพยาบาลใกล้เคียง</Text>
        <Text style={styles.sub}>เชียงใหม่ — แนะนำสำหรับตรวจ OSA</Text>

        {/* คำแนะนำ */}
        <View style={styles.tipBox}>
          <Text style={styles.tipText}>
            💡 หากผล AHI ≥ 15 ควรพบแพทย์เพื่อตรวจ PSG จริงที่โรงพยาบาล
          </Text>
        </View>

        {HOSPITALS.map((h, i) => (
          <View key={i} style={[styles.card, { borderLeftColor: h.color }]}>

            {/* Header */}
            <View style={styles.cardHeader}>
              <Text style={styles.cardEmoji}>{h.emoji}</Text>
              <View style={styles.cardTitleBox}>
                <Text style={styles.cardName}>{h.name}</Text>
                <View style={[styles.typeBadge, { backgroundColor: h.color + '30' }]}>
                  <Text style={[styles.typeText, { color: h.color }]}>{h.type}</Text>
                </View>
              </View>
            </View>

            {/* Info */}
            <Text style={styles.address}>📍 {h.address}</Text>
            <Text style={styles.hours}>🕐 {h.hours}</Text>
            <Text style={styles.note}>ℹ️ {h.note}</Text>

            {/* Buttons */}
            <View style={styles.btnRow}>
              <TouchableOpacity
                style={[styles.callBtn, { backgroundColor: h.color }]}
                onPress={() => callHospital(h.phone)}
              >
                <Text style={styles.callBtnText}>📞 {h.phone}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.mapBtn}
                onPress={() => openMap(h.nameEn)}
              >
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
  safe: { flex: 1, backgroundColor: '#0f172a' },
  container: { flex: 1, padding: 20 },
  title: { color: '#f1f5f9', fontSize: 24, fontWeight: 'bold' },
  sub: { color: '#64748b', fontSize: 14, marginBottom: 16 },
  tipBox: {
    backgroundColor: '#1e3a2a', borderRadius: 12,
    padding: 14, marginBottom: 20, borderLeftWidth: 3, borderLeftColor: '#22c55e',
  },
  tipText: { color: '#86efac', fontSize: 13, lineHeight: 20 },
  card: {
    backgroundColor: '#1e293b', borderRadius: 16,
    padding: 16, marginBottom: 14, borderLeftWidth: 4,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  cardEmoji: { fontSize: 32, marginRight: 12 },
  cardTitleBox: { flex: 1 },
  cardName: { color: '#f1f5f9', fontSize: 15, fontWeight: 'bold', marginBottom: 4 },
  typeBadge: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  typeText: { fontSize: 11, fontWeight: '600' },
  address: { color: '#94a3b8', fontSize: 13, marginBottom: 4 },
  hours: { color: '#94a3b8', fontSize: 13, marginBottom: 4 },
  note: { color: '#64748b', fontSize: 12, marginBottom: 12 },
  btnRow: { flexDirection: 'row', gap: 8 },
  callBtn: {
    flex: 1, borderRadius: 10,
    padding: 12, alignItems: 'center',
  },
  callBtnText: { color: '#0f172a', fontWeight: 'bold', fontSize: 13 },
  mapBtn: {
    backgroundColor: '#334155', borderRadius: 10,
    padding: 12, alignItems: 'center', paddingHorizontal: 16,
  },
  mapBtnText: { color: '#f1f5f9', fontSize: 13 },
  disclaimer: { color: '#475569', fontSize: 11, textAlign: 'center', fontStyle: 'italic' },
});