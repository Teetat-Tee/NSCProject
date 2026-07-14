import { useState, useCallback, useContext } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  ScrollView, Alert, Modal, StatusBar, TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  User, Target, ChevronRight, LogOut, Info,
  Stethoscope, Moon, UserCircle, X, Save,
} from 'lucide-react-native';
import { useTheme, radius, shadow } from '../utils/theme';
import { getPreferences, updatePreferences } from '../utils/preferencesStorage';
import { AuthContext } from '../AuthContext';

const SLEEP_GOALS = [6, 7, 7.5, 8, 8.5, 9];

// ── Sub-components ออกมาข้างนอก ─────────────────────────────
function Row({ icon, label, sub, onPress, danger, last, colors: c }) {
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

function Section({ title, children, colors: c, isDark }) {
  return (
    <View style={styles.section}>
      {title ? <Text style={[styles.sectionTitle, { color: c.inkFaint }]}>{title}</Text> : null}
      <View style={[styles.sectionCard, { backgroundColor: c.surface }, !isDark && shadow.card]}>
        {children}
      </View>
    </View>
  );
}

function Field({ label, value, onChangeText, placeholder, keyboardType = 'default', colors: c }) {
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: c.inkFaint }]}>{label}</Text>
      <TextInput
        style={[styles.fieldInput, { backgroundColor: c.surfaceMuted, color: c.ink, borderColor: c.border }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={c.inkFaint}
        keyboardType={keyboardType}
      />
    </View>
  );
}
// ────────────────────────────────────────────────────────────

export default function SettingsScreen({ navigation }) {
  const { colors, isDark }     = useTheme();
  const { userData, logout, updateProfile } = useContext(AuthContext);
  const [prefs, setPrefs]      = useState({ sleepGoalHours: 8 });
  const [showGoal,    setShowGoal]    = useState(false);
  const [showAbout,   setShowAbout]   = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const [editFirstName,  setEditFirstName]  = useState('');
  const [editLastName,   setEditLastName]   = useState('');
  const [editAge,        setEditAge]        = useState('');
  const [editGender,     setEditGender]     = useState('');
  const [editConditions, setEditConditions] = useState('');
  const [saving,         setSaving]         = useState(false);

  useFocusEffect(useCallback(() => {
    getPreferences().then(setPrefs).catch(() => {});
  }, []));

  async function setPref(key, val) {
    const next = { ...prefs, [key]: val };
    setPrefs(next);
    await updatePreferences(next);
  }

  function openProfile() {
    setEditFirstName(userData?.firstName   || '');
    setEditLastName(userData?.lastName     || '');
    setEditAge(userData?.age ? String(userData.age) : '');
    setEditGender(userData?.gender         || '');
    setEditConditions(userData?.conditions || '');
    setShowProfile(true);
  }

  async function saveProfile() {
    setSaving(true);
    const result = await updateProfile({
      firstName:  editFirstName.trim(),
      lastName:   editLastName.trim(),
      age:        editAge ? parseInt(editAge, 10) : null,
      gender:     editGender,
      conditions: editConditions.trim(),
    });
    setSaving(false);
    if (result?.success === false) {
      Alert.alert('เกิดข้อผิดพลาด', result.error || 'บันทึกไม่สำเร็จ');
      return;
    }
    setShowProfile(false);
  }

  function handleLogout() {
    Alert.alert('ออกจากระบบ', 'ยืนยันการออกจากระบบ?', [
      { text: 'ยกเลิก', style: 'cancel' },
      { text: 'ออกจากระบบ', style: 'destructive', onPress: logout },
    ]);
  }

  const name = [userData?.firstName, userData?.lastName].filter(Boolean).join(' ') || userData?.email || 'ผู้ใช้';
  const c = colors;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <Text style={[styles.pageTitle, { color: c.ink }]}>การตั้งค่า</Text>
        <Text style={[styles.pageSub, { color: c.inkMuted }]}>ปรับแต่งการติดตามการนอนของคุณ</Text>

        <View style={[styles.profileCard, { backgroundColor: c.primary }]}>
          <View style={styles.profileTop}>
            <View style={[styles.profileAvatar, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <UserCircle color="rgba(255,255,255,0.9)" size={36} strokeWidth={1.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.profileName}>{name}</Text>
              <Text style={styles.profileSub}>
                {userData?.age
                  ? `${userData.age} ปี · ${userData?.gender === 'male' ? 'ชาย' : 'หญิง'}`
                  : userData?.email}
              </Text>
            </View>
          </View>
        </View>

        <Section title="บัญชีผู้ใช้" colors={c} isDark={isDark}>
          <Row colors={c} icon={<User color={c.primary} size={18} strokeWidth={2} />}
            label="ข้อมูลโปรไฟล์" sub={userData?.email} onPress={openProfile} last />
        </Section>

        <Section title="การนอนหลับ" colors={c} isDark={isDark}>
          <Row colors={c} icon={<Target color={c.primary} size={18} strokeWidth={2} />}
            label="เป้าหมายการนอน" sub={`${prefs.sleepGoalHours} ชั่วโมง/คืน`}
            onPress={() => setShowGoal(true)} last />
        </Section>

        <Section title="เกี่ยวกับ" colors={c} isDark={isDark}>
          <Row colors={c} icon={<Info color={c.primary} size={18} strokeWidth={2} />}
            label="เกี่ยวกับ OSA Detect" sub="เวอร์ชัน 1.0.0"
            onPress={() => setShowAbout(true)} last />
        </Section>

        <Section title="" colors={c} isDark={isDark}>
          <Row colors={c} icon={<LogOut color={c.riskSevere} size={18} strokeWidth={2} />}
            label="ออกจากระบบ" danger onPress={handleLogout} last />
        </Section>

        <Text style={[styles.disclaimer, { color: c.inkFaint }]}>
          OSA Detect ไม่ใช่อุปกรณ์ทางการแพทย์{'\n'}ผลลัพธ์เป็นเพียงการคัดกรองเบื้องต้นเท่านั้น
        </Text>
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Sleep Goal Modal */}
<Modal visible={showAbout} transparent animationType="fade" onRequestClose={() => setShowAbout(false)}>
  <View style={styles.aboutOverlay}>
    <View style={[styles.aboutCard, { backgroundColor: c.surface }]}>
      <View style={styles.aboutHeader}>
        <Info color={c.primary} size={28} strokeWidth={1.5} />
        <Text style={[styles.aboutTitle, { color: c.ink }]}>OSA Detect</Text>
        <Text style={[styles.aboutVer, { color: c.inkFaint }]}>เวอร์ชัน 1.0.0</Text>
      </View>
      <ScrollView style={styles.aboutScroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.aboutLicense, { color: c.inkMuted }]}>
          ซอฟต์แวร์นี้เป็นผลงานที่พัฒนาขึ้นโดย นายวรพล พงษ์ธนพิบูล, นายธีธัช ศุนวัต, นายกานตวิชญ์ ใจสิน จาก โรงเรียนปรินส์รอยแยลส์วิทยาลัย ภายใต้การดูแลของ อาจารย์โอบนิธิ เงินกลั่น ภายใต้โครงการ OSA-DETECT ซึ่งสนับสนุนโดย สำนักงานพัฒนาวิทยาศาสตร์และเทคโนโลยีแห่งชาติ{'\n\n'}โดยมีวัตถุประสงค์เพื่อส่งเสริมให้นักเรียนและนักศึกษาได้เรียนรู้และฝึกทักษะในการพัฒนาซอฟต์แวร์ ลิขสิทธิ์ของซอฟต์แวร์นี้จึงเป็นของผู้พัฒนา ซึ่งผู้พัฒนาได้อนุญาตให้สำนักงานพัฒนาวิทยาศาสตร์และเทคโนโลยีแห่งชาติเผยแพร่ซอฟต์แวร์นี้ตาม "ต้นฉบับ" โดยไม่มีการแก้ไขดัดแปลงใด ๆ ทั้งสิ้น ให้แก่บุคคลทั่วไปได้ใช้เพื่อประโยชน์ส่วนบุคคลหรือประโยชน์ทางการศึกษาที่ไม่มีวัตถุประสงค์ในเชิงพาณิชย์โดยไม่คิดค่าตอบแทนการใช้ซอฟต์แวร์{'\n\n'}ดังนั้น สำนักงานพัฒนาวิทยาศาสตร์และเทคโนโลยีแห่งชาติ จึงไม่มีหน้าที่ในการดูแล บำรุงรักษา จัดการอบรมการใช้งาน หรือพัฒนาประสิทธิภาพซอฟต์แวร์ รวมทั้งไม่รับรองความถูกต้องหรือประสิทธิภาพการทำงานของซอฟต์แวร์ ตลอดจนไม่รับประกันความเสียหายต่าง ๆ อันเกิดจากการใช้ซอฟต์แวร์นี้ทั้งสิ้น
        </Text>
      </ScrollView>
      <TouchableOpacity style={[styles.aboutClose, { backgroundColor: c.primary }]} onPress={() => setShowAbout(false)}>
        <Text style={{ color: c.onPrimary, fontWeight: '600' }}>ปิด</Text>
      </TouchableOpacity>
    </View>
  </View>
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

      {/* Profile Modal (bottom sheet) */}
      <Modal visible={showProfile} transparent animationType="slide" onRequestClose={() => setShowProfile(false)}>
        <View style={styles.sheetOverlay}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setShowProfile(false)} />
          <View style={[styles.sheet, { backgroundColor: c.surface }]}>
            <View style={[styles.sheetHandle, { backgroundColor: c.border }]} />
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: c.ink }]}>ข้อมูลโปรไฟล์</Text>
              <TouchableOpacity onPress={() => setShowProfile(false)} hitSlop={8}>
                <X color={c.inkFaint} size={20} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled">

              {/* email read-only */}
              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { color: c.inkFaint }]}>อีเมล</Text>
                <View style={[styles.fieldInput, styles.fieldReadOnly,
                  { backgroundColor: c.surfaceMuted, borderColor: c.border }]}>
                  <Text style={{ color: c.inkMuted, fontSize: 15 }}>{userData?.email || '—'}</Text>
                </View>
              </View>

              <Field colors={c} label="ชื่อ" value={editFirstName}
                onChangeText={setEditFirstName} placeholder="ชื่อจริง" />
              <Field colors={c} label="นามสกุล" value={editLastName}
                onChangeText={setEditLastName} placeholder="นามสกุล" />
              <Field colors={c} label="อายุ" value={editAge}
                onChangeText={setEditAge} placeholder="อายุ (ปี)" keyboardType="numeric" />

              {/* Gender picker */}
              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { color: c.inkFaint }]}>เพศ</Text>
                <View style={styles.genderRow}>
                  {[{ val: 'male', label: 'ชาย' }, { val: 'female', label: 'หญิง' }].map(g => (
                    <TouchableOpacity
                      key={g.val}
                      style={[styles.genderBtn,
                        { borderColor: c.border, backgroundColor: c.surfaceMuted },
                        editGender === g.val && { borderColor: c.primary, backgroundColor: c.primarySoft },
                      ]}
                      onPress={() => setEditGender(g.val)}
                    >
                      <Text style={[styles.genderText,
                        { color: editGender === g.val ? c.primary : c.inkMuted,
                          fontWeight: editGender === g.val ? '700' : '400' }]}>
                        {g.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <Field colors={c} label="โรคประจำตัว" value={editConditions}
                onChangeText={setEditConditions} placeholder="เช่น ความดัน, เบาหวาน (ถ้ามี)" />

              <View style={{ height: 16 }} />
            </ScrollView>

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: saving ? c.primarySoft : c.primary }]}
              onPress={saveProfile}
              disabled={saving}
              activeOpacity={0.85}
            >
              <Save color={c.onPrimary} size={16} strokeWidth={2} style={{ marginRight: 8 }} />
              <Text style={[styles.saveBtnText, { color: c.onPrimary }]}>
                {saving ? 'กำลังบันทึก...' : 'บันทึก'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:          { flex: 1 },
  scroll:        { padding: 22 },
  pageTitle:     { fontSize: 26, fontWeight: '800', marginBottom: 4 },
  pageSub:       { fontSize: 13, marginBottom: 20 },
  profileCard:   { borderRadius: radius.xl, padding: 22, marginBottom: 24 },
  profileTop:    { flexDirection: 'row', alignItems: 'center', gap: 14 },
  profileAvatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  profileName:   { color: '#fff', fontSize: 17, fontWeight: '700' },
  profileSub:    { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 3 },
  section:       { marginBottom: 20 },
  sectionTitle:  { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8, marginLeft: 4 },
  sectionCard:   { borderRadius: radius.lg, overflow: 'hidden' },
  row:           { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  rowIcon:       { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowContent:    { flex: 1 },
  rowLabel:      { fontSize: 15, fontWeight: '500' },
  rowSub:        { fontSize: 12, marginTop: 2 },
  disclaimer:    { fontSize: 11, textAlign: 'center', lineHeight: 17, marginTop: 8 },
  overlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 },
  picker:        { borderRadius: radius.xl, overflow: 'hidden' },
  pickerHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingBottom: 8 },
  pickerTitle:   { fontSize: 16, fontWeight: '700' },
  pickerRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16 },
  pickerText:    { fontSize: 15, flex: 1 },
  aboutOverlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  aboutCard:     { borderRadius: radius.xl, padding: 24, maxHeight: '80%' },
  aboutHeader:   { alignItems: 'center', marginBottom: 16, gap: 4 },
  aboutTitle:    { fontSize: 20, fontWeight: '800', marginTop: 8 },
  aboutVer:      { fontSize: 12 },
  aboutScroll:   { maxHeight: 300, marginBottom: 16 },
  aboutLicense:  { fontSize: 13, lineHeight: 20 },
  aboutBody:     { fontSize: 14, lineHeight: 22, textAlign: 'center', marginBottom: 24 },
  aboutClose:    { paddingVertical: 12, paddingHorizontal: 32, borderRadius: radius.lg, alignItems: 'center' },
  sheetOverlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet:         { borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, maxHeight: '85%', paddingBottom: 40 },
  sheetHandle:   { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  sheetHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  sheetTitle:    { fontSize: 18, fontWeight: '700' },
  field:         { marginBottom: 16 },
  fieldLabel:    { fontSize: 12, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 },
  fieldInput:    { borderRadius: radius.md, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  fieldReadOnly: { justifyContent: 'center' },
  genderRow:     { flexDirection: 'row', gap: 10 },
  genderBtn:     { flex: 1, paddingVertical: 12, borderRadius: radius.md, borderWidth: 1.5, alignItems: 'center' },
  genderText:    { fontSize: 15 },
  saveBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 20, marginTop: 12, paddingVertical: 14, borderRadius: radius.lg },
  saveBtnText:   { fontSize: 16, fontWeight: '700' },
});