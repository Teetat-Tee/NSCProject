import { useState, useCallback, useContext } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  ScrollView, Alert, Modal, StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  User, Target, ChevronRight, LogOut, Info,
  Stethoscope, Shield, Moon, UserCircle, X,
} from 'lucide-react-native';
import { useTheme, radius, shadow } from '../utils/theme';
import { getPreferences, updatePreferences } from '../utils/preferencesStorage';
import { AuthContext } from '../AuthContext';

const SLEEP_GOALS = [6, 7, 7.5, 8, 8.5, 9];

export default function SettingsScreen({ navigation }) {
  const { colors, isDark }   = useTheme();
  const { userData, logout } = useContext(AuthContext);
  const [prefs, setPrefs]    = useState({ sleepGoalHours: 8 });
  const [showGoal, setShowGoal]   = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  useFocusEffect(useCallback(() => {
    getPreferences().then(setPrefs).catch(() => {});
  }, []));

  async function setPref(key, val) {
    const next = { ...prefs, [key]: val };
    setPrefs(next);
    await updatePreferences(next);
  }

  function handleLogout() {
    Alert.alert('ออกจากระบบ', 'ยืนยันการออกจากระบบ?', [
      { text: 'ยกเลิก', style: 'cancel' },
      { text: 'ออกจากระบบ', style: 'destructive', onPress: logout },
    ]);
  }

  const name = [userData?.firstName, userData?.lastName].filter(Boolean).join(' ') || userData?.email || 'ผู้ใช้';
  const c = colors;

  function Row({ icon, label, sub, onPress, danger, last }) {
    return (
      <TouchableOpacity
        style={[styles.row, !last && { borderBottomWidth: 1, borderBottomColor: c.border }]}
        activeOpacity={onPress ? 0.7 : 1}
        onPress={onPress}
        disabled={!onPress}
      >
        <View style={[styles.rowIcon, { backgroundColor: danger ? c.riskSevereSoft : c.surfaceMuted }]}>
          {icon}
        </View>
        <View style={styles.rowContent}>
          <Text style={[styles.rowLabel, { color: danger ? c.riskSevere : c.ink }]}>{label}</Text>
          {sub && <Text style={[styles.rowSub, { color: c.inkFaint }]}>{sub}</Text>}
        </View>
        {onPress && !danger && <ChevronRight color={c.inkFaint} size={16} strokeWidth={2} />}
      </TouchableOpacity>
    );
  }

  function Section({ title, children }) {
    return (
      <View style={styles.section}>
        {title ? <Text style={[styles.sectionTitle, { color: c.inkFaint }]}>{title}</Text> : null}
        <View style={[styles.sectionCard, { backgroundColor: c.surface }, !isDark && shadow.card]}>
          {children}
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <Text style={[styles.pageTitle, { color: c.ink }]}>การตั้งค่า</Text>
        <Text style={[styles.pageSub, { color: c.inkMuted }]}>ปรับแต่งการติดตามการนอนของคุณ</Text>

        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: c.primary }]}>
          <View style={styles.profileTop}>
            <View style={[styles.profileAvatar, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <UserCircle color="rgba(255,255,255,0.9)" size={36} strokeWidth={1.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.profileName}>{name}</Text>
              <Text style={styles.profileSub}>
                {userData?.age ? `${userData.age} ปี · ${userData?.gender === 'male' ? 'ชาย' : 'หญิง'}` : userData?.email}
              </Text>
            </View>
          </View>
        </View>

        <Section title="บัญชีผู้ใช้">
          <Row icon={<User color={c.primary} size={18} strokeWidth={2} />} label="ข้อมูลโปรไฟล์" sub={userData?.email} onPress={() => {}} />
          <Row icon={<Shield color={c.primary} size={18} strokeWidth={2} />} label="ข้อมูลสุขภาพ" sub={userData?.conditions ? 'กรอกแล้ว' : 'ยังไม่ได้กรอก'} onPress={() => {}} last />
        </Section>

        <Section title="การนอนหลับ">
          <Row icon={<Target color={c.primary} size={18} strokeWidth={2} />} label="เป้าหมายการนอน" sub={`${prefs.sleepGoalHours} ชั่วโมง/คืน`} onPress={() => setShowGoal(true)} last />
        </Section>

        <Section title="เครื่องมือนักพัฒนา">
          <Row icon={<Stethoscope color={c.primary} size={18} strokeWidth={2} />} label="ทดสอบความแม่นยำ" sub="วัด Precision / Recall ของระบบ DSP" onPress={() => navigation.navigate('AccuracyTest')} last />
        </Section>

        <Section title="เกี่ยวกับ">
          <Row icon={<Info color={c.primary} size={18} strokeWidth={2} />} label="เกี่ยวกับ OSA Detect" sub="เวอร์ชัน 1.0.0" onPress={() => setShowAbout(true)} last />
        </Section>

        <Section title="">
          <Row icon={<LogOut color={c.riskSevere} size={18} strokeWidth={2} />} label="ออกจากระบบ" danger onPress={handleLogout} last />
        </Section>

        <Text style={[styles.disclaimer, { color: c.inkFaint }]}>
          OSA Detect ไม่ใช่อุปกรณ์ทางการแพทย์{'\n'}ผลลัพธ์เป็นเพียงการคัดกรองเบื้องต้นเท่านั้น
        </Text>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Sleep Goal Modal */}
      <Modal visible={showGoal} transparent animationType="fade" onRequestClose={() => setShowGoal(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowGoal(false)}>
          <View style={[styles.picker, { backgroundColor: c.surface }]}>
            <View style={styles.pickerHeader}>
              <Text style={[styles.pickerTitle, { color: c.ink }]}>เป้าหมายการนอน</Text>
              <TouchableOpacity onPress={() => setShowGoal(false)}>
                <X color={c.inkFaint} size={20} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            {SLEEP_GOALS.map(h => (
              <TouchableOpacity
                key={h}
                style={[styles.pickerRow, { borderBottomColor: c.border, borderBottomWidth: 1 }, prefs.sleepGoalHours === h && { backgroundColor: c.primarySoft }]}
                onPress={() => { setPref('sleepGoalHours', h); setShowGoal(false); }}
              >
                <Moon color={prefs.sleepGoalHours === h ? c.primary : c.inkFaint} size={16} strokeWidth={2} />
                <Text style={[styles.pickerText, { color: prefs.sleepGoalHours === h ? c.primary : c.ink, fontWeight: prefs.sleepGoalHours === h ? '700' : '400' }]}>
                  {h} ชั่วโมง
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* About Modal */}
      <Modal visible={showAbout} transparent animationType="fade" onRequestClose={() => setShowAbout(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowAbout(false)}>
          <View style={[styles.aboutCard, { backgroundColor: c.surface }]}>
            <Info color={c.primary} size={32} strokeWidth={1.5} style={{ marginBottom: 12 }} />
            <Text style={[styles.aboutTitle, { color: c.ink }]}>OSA Detect</Text>
            <Text style={[styles.aboutVer, { color: c.inkFaint }]}>เวอร์ชัน 1.0.0</Text>
            <Text style={[styles.aboutBody, { color: c.inkMuted }]}>
              แอปพลิเคชันคัดกรองภาวะหยุดหายใจขณะหลับ{'\n\n'}
              พัฒนาโดยนักเรียนโรงเรียนปรินส์รอยแยลส์วิทยาลัย เชียงใหม่{'\n'}
              โครงการ NSC 2026
            </Text>
            <TouchableOpacity style={[styles.aboutClose, { backgroundColor: c.primary }]} onPress={() => setShowAbout(false)}>
              <Text style={{ color: c.onPrimary, fontWeight: '600' }}>ปิด</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:     { flex: 1 },
  scroll:   { padding: 22 },
  pageTitle:{ fontSize: 26, fontWeight: '800', marginBottom: 4 },
  pageSub:  { fontSize: 13, marginBottom: 20 },
  profileCard: { borderRadius: radius.xl, padding: 22, marginBottom: 24 },
  profileTop:  { flexDirection: 'row', alignItems: 'center', gap: 14 },
  profileAvatar:{ width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  profileName: { color: '#fff', fontSize: 17, fontWeight: '700' },
  profileSub:  { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 3 },
  section:      { marginBottom: 20 },
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8, marginLeft: 4 },
  sectionCard:  { borderRadius: radius.lg, overflow: 'hidden' },
  row:       { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  rowIcon:   { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowContent:{ flex: 1 },
  rowLabel:  { fontSize: 15, fontWeight: '500' },
  rowSub:    { fontSize: 12, marginTop: 2 },
  disclaimer:{ fontSize: 11, textAlign: 'center', lineHeight: 17, marginTop: 8 },
  overlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 },
  picker:    { borderRadius: radius.xl, overflow: 'hidden' },
  pickerHeader:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingBottom: 8 },
  pickerTitle: { fontSize: 16, fontWeight: '700' },
  pickerRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16 },
  pickerText:  { fontSize: 15, flex: 1 },
  aboutCard:  { borderRadius: radius.xl, padding: 28, alignItems: 'center' },
  aboutTitle: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  aboutVer:   { fontSize: 13, marginBottom: 16 },
  aboutBody:  { fontSize: 14, lineHeight: 22, textAlign: 'center', marginBottom: 24 },
  aboutClose: { paddingVertical: 12, paddingHorizontal: 32, borderRadius: radius.lg },
});