import { useState, useContext } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, Alert, Modal, StatusBar,
} from 'react-native';
import { AuthContext } from '../AuthContext';
import { useTheme, radius } from '../utils/theme';

const CONDITIONS = [
  { key: 'hypertension',  label: 'ความดันโลหิตสูง' },
  { key: 'diabetes',      label: 'เบาหวาน' },
  { key: 'heartDisease',  label: 'โรคหัวใจ' },
  { key: 'obesity',       label: 'ภาวะน้ำหนักเกิน/โรคอ้วน' },
  { key: 'asthma',        label: 'โรคหอบหืด/ภูมิแพ้ทางเดินหายใจ' },
  { key: 'insomnia',      label: 'นอนไม่หลับเรื้อรัง' },
];

const DISCLAIMER_TEXT = `ซอฟต์แวร์นี้เป็นผลงานที่พัฒนาขึ้นโดย นายวรพล พงษ์ธนพิบูล, นายธีธัช ศุนวัต, นายกานตวิชญ์ ใจสิน จาก โรงเรียนปรินส์รอยแยลส์วิทยาลัย ภายใต้การดูแลของ อาจารย์โอบนิธิ เงินกลั่น ภายใต้โครงการ OSA-DETECT ซึ่งสนับสนุนโดย สำนักงานพัฒนาวิทยาศาสตร์และเทคโนโลยีแห่งชาติ

โดยมีวัตถุประสงค์เพื่อส่งเสริมให้นักเรียนและนักศึกษาได้เรียนรู้และฝึกทักษะในการพัฒนาซอฟต์แวร์ ลิขสิทธิ์ของซอฟต์แวร์นี้จึงเป็นของผู้พัฒนา ซึ่งผู้พัฒนาได้อนุญาตให้สำนักงานพัฒนาวิทยาศาสตร์และเทคโนโลยีแห่งชาติเผยแพร่ซอฟต์แวร์นี้ตาม "ต้นฉบับ" โดยไม่มีการแก้ไขดัดแปลงใด ๆ ทั้งสิ้น ให้แก่บุคคลทั่วไปได้ใช้เพื่อประโยชน์ส่วนบุคคลหรือประโยชน์ทางการศึกษาที่ไม่มีวัตถุประสงค์ในเชิงพาณิชย์โดยไม่คิดค่าตอบแทนการใช้ซอฟต์แวร์

ดังนั้น สำนักงานพัฒนาวิทยาศาสตร์และเทคโนโลยีแห่งชาติ จึงไม่มีหน้าที่ในการดูแล บำรุงรักษา จัดการอบรมการใช้งาน หรือพัฒนาประสิทธิภาพซอฟต์แวร์ รวมทั้งไม่รับรองความถูกต้องหรือประสิทธิภาพการทำงานของซอฟต์แวร์ ตลอดจนไม่รับประกันความเสียหายต่าง ๆ อันเกิดจากการใช้ซอฟต์แวร์นี้ทั้งสิ้น

⚠️ แอปพลิเคชันนี้ไม่ใช่อุปกรณ์ทางการแพทย์ ผลการวิเคราะห์เป็นเพียงการคัดกรองเบื้องต้นเท่านั้น ไม่สามารถใช้ทดแทนการวินิจฉัยโรคโดยแพทย์ผู้เชี่ยวชาญได้`;

function Field({ label, value, onChangeText, placeholder, keyboardType = 'default', secureTextEntry = false, colors: c }) {
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: c.inkMuted }]}>{label}</Text>
      <TextInput
        style={[styles.input, { backgroundColor: c.surfaceMuted, color: c.ink, borderColor: c.border }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={c.inkFaint}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        autoCapitalize="none"
      />
    </View>
  );
}

export default function SignUpScreen({ navigation }) {
  const { colors }  = useTheme();
  const { signup }  = useContext(AuthContext);

  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [confirm,    setConfirm]    = useState('');
  const [firstName,  setFirstName]  = useState('');
  const [lastName,   setLastName]   = useState('');
  const [age,        setAge]        = useState('');
  const [gender,     setGender]     = useState('');
  const [conditions, setConditions] = useState({});
  const [loading,    setLoading]    = useState(false);
  const [showCond,   setShowCond]   = useState(false);
  const [otherCondition, setOtherCondition] = useState('');

  // Disclaimer modal
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [pendingData,    setPendingData]    = useState(null);

  const c = colors;

  function toggleCondition(key) {
    setConditions(prev => ({ ...prev, [key]: !prev[key] }));
  }

  function conditionsToString() {
    const selected = Object.entries(conditions)
      .filter(([k, v]) => v && k !== 'other')
      .map(([k]) => CONDITIONS.find(c => c.key === k)?.label || k);
    if (conditions.other && otherCondition.trim()) {
      selected.push(otherCondition.trim());
    }
    return selected.join(', ');
  }

  // กด "สร้างบัญชี" → แสดง Disclaimer ก่อน
  async function handleSubmit() {
    if (!email || !password || !firstName || !lastName) {
      Alert.alert('ข้อมูลไม่ครบ', 'กรุณากรอกอีเมล รหัสผ่าน ชื่อ และนามสกุล');
      return;
    }
    if (password !== confirm) {
      Alert.alert('รหัสผ่านไม่ตรงกัน', 'กรุณาตรวจสอบรหัสผ่านอีกครั้ง');
      return;
    }
    if (password.length < 6) {
      Alert.alert('รหัสผ่านสั้นเกินไป', 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }

    // เก็บข้อมูลไว้ก่อน แล้วแสดง Disclaimer
    setPendingData({
      email:      email.trim().toLowerCase(),
      password,
      firstName:  firstName.trim(),
      lastName:   lastName.trim(),
      gender,
      age:        age ? parseInt(age, 10) : null,
      conditions: conditionsToString(),
    });
    setShowDisclaimer(true);
  }

  // กด "รับทราบและยืนยัน" → สมัครสมาชิกจริง
  async function handleAcceptDisclaimer() {
    setShowDisclaimer(false);
    setLoading(true);
    try {
      const result = await signup(pendingData);
      if (!result.success) {
        Alert.alert('สมัครสมาชิกไม่สำเร็จ', result.error || 'เกิดข้อผิดพลาด');
      }
    } catch (e) {
      Alert.alert('เกิดข้อผิดพลาด', e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.bg }]}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        <Text style={[styles.title, { color: c.ink }]}>สร้างบัญชีใหม่</Text>
        <Text style={[styles.sub, { color: c.inkMuted }]}>กรอกข้อมูลเพื่อเริ่มต้นใช้งาน OSA Detect</Text>

        <View style={[styles.card, { backgroundColor: c.surface }]}>
          <Text style={[styles.section, { color: c.inkFaint }]}>ข้อมูลบัญชี</Text>
          <Field colors={c} label="อีเมล *"     value={email}    onChangeText={setEmail}    placeholder="example@email.com" keyboardType="email-address" />
          <Field colors={c} label="รหัสผ่าน *"  value={password} onChangeText={setPassword} placeholder="อย่างน้อย 6 ตัวอักษร" secureTextEntry />
          <Field colors={c} label="ยืนยันรหัสผ่าน *" value={confirm} onChangeText={setConfirm} placeholder="กรอกรหัสผ่านอีกครั้ง" secureTextEntry />
        </View>

        <View style={[styles.card, { backgroundColor: c.surface }]}>
          <Text style={[styles.section, { color: c.inkFaint }]}>ข้อมูลส่วนตัว</Text>
          <Field colors={c} label="ชื่อ *"     value={firstName} onChangeText={setFirstName} placeholder="ชื่อจริง" />
          <Field colors={c} label="นามสกุล *"  value={lastName}  onChangeText={setLastName}  placeholder="นามสกุล" />
          <Field colors={c} label="อายุ"       value={age}       onChangeText={setAge}       placeholder="อายุ (ปี)" keyboardType="numeric" />

          <View style={styles.field}>
            <Text style={[styles.label, { color: c.inkMuted }]}>เพศ</Text>
            <View style={styles.genderRow}>
              {[{ val: 'male', label: 'ชาย' }, { val: 'female', label: 'หญิง' }].map(g => (
                <TouchableOpacity
                  key={g.val}
                  style={[styles.genderBtn, { borderColor: c.border, backgroundColor: c.surfaceMuted },
                    gender === g.val && { borderColor: c.primary, backgroundColor: c.primarySoft }]}
                  onPress={() => setGender(g.val)}
                >
                  <Text style={[styles.genderText, { color: gender === g.val ? c.primary : c.inkMuted,
                    fontWeight: gender === g.val ? '700' : '400' }]}>{g.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: c.surface }]}>
          <Text style={[styles.section, { color: c.inkFaint }]}>โรคประจำตัว (ถ้ามี)</Text>
          <Text style={[styles.condNote, { color: c.inkFaint }]}>ใช้เพื่อวิเคราะห์ความเสี่ยง OSA เท่านั้น</Text>

          {/* Dropdown toggle */}
          <TouchableOpacity
            style={[styles.dropdown, { backgroundColor: c.surfaceMuted, borderColor: c.border }]}
            onPress={() => setShowCond(prev => !prev)}
            activeOpacity={0.8}
          >
            <Text style={[styles.dropdownText, { color: Object.values(conditions).some(Boolean) ? c.ink : c.inkFaint }]}>
              {Object.entries(conditions).filter(([k,v]) => v && k !== 'other').map(([k]) =>
                CONDITIONS.find(x => x.key === k)?.label).filter(Boolean).join(', ') ||
                (conditions.other ? '' : 'เลือกโรคประจำตัว (ถ้ามี)')}
            </Text>
            <Text style={{ color: c.inkFaint, fontSize: 16 }}>{showCond ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {/* Dropdown list */}
          {showCond && (
            <View style={[styles.dropdownList, { backgroundColor: c.surfaceMuted, borderColor: c.border }]}>
              {CONDITIONS.map((cond, i) => (
                <TouchableOpacity
                  key={cond.key}
                  style={[styles.condRow, { borderBottomColor: c.border,
                    borderBottomWidth: i < CONDITIONS.length - 1 ? 1 : 0 }]}
                  onPress={() => toggleCondition(cond.key)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.condLabel, { color: c.ink }]}>{cond.label}</Text>
                  <View style={[styles.checkbox,
                    { borderColor: conditions[cond.key] ? c.primary : c.border,
                      backgroundColor: conditions[cond.key] ? c.primary : 'transparent' }]}>
                    {conditions[cond.key] && <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>✓</Text>}
                  </View>
                </TouchableOpacity>
              ))}

              {/* อื่นๆ */}
              <TouchableOpacity
                style={[styles.condRow, { borderBottomWidth: 0 }]}
                onPress={() => toggleCondition('other')}
                activeOpacity={0.7}
              >
                <Text style={[styles.condLabel, { color: c.ink }]}>อื่นๆ</Text>
                <View style={[styles.checkbox,
                  { borderColor: conditions.other ? c.primary : c.border,
                    backgroundColor: conditions.other ? c.primary : 'transparent' }]}>
                  {conditions.other && <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>✓</Text>}
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* กรอก อื่นๆ */}
          {conditions.other && (
            <TextInput
              style={[styles.input, { backgroundColor: c.surfaceMuted, color: c.ink, borderColor: c.border, marginTop: 10 }]}
              value={otherCondition}
              onChangeText={setOtherCondition}
              placeholder="ระบุโรคประจำตัวอื่นๆ"
              placeholderTextColor={c.inkFaint}
            />
          )}
        </View>

        <TouchableOpacity
          style={[styles.btn, { backgroundColor: loading ? c.primarySoft : c.primary }]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Text style={[styles.btnText, { color: c.onPrimary }]}>
            {loading ? 'กำลังสร้างบัญชี...' : 'สร้างบัญชี'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.loginBtn} onPress={() => navigation.navigate('Login')}>
          <Text style={[styles.loginText, { color: c.inkFaint }]}>
            มีบัญชีอยู่แล้ว? <Text style={{ color: c.primary, fontWeight: '600' }}>เข้าสู่ระบบ</Text>
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Disclaimer Modal ── */}
      <Modal visible={showDisclaimer} transparent animationType="slide" onRequestClose={() => setShowDisclaimer(false)}>
        <View style={styles.overlay}>
          <View style={[styles.sheet, { backgroundColor: c.surface }]}>
            <View style={[styles.sheetHandle, { backgroundColor: c.border }]} />

            <Text style={[styles.sheetTitle, { color: c.ink }]}>ข้อตกลงในการใช้ซอฟต์แวร์</Text>
            <Text style={[styles.sheetSub, { color: c.inkFaint }]}>กรุณาอ่านและยืนยันก่อนเริ่มใช้งาน</Text>

            <ScrollView style={styles.disclaimerScroll} showsVerticalScrollIndicator={false}>
              <Text style={[styles.disclaimerText, { color: c.inkMuted }]}>
                {DISCLAIMER_TEXT}
              </Text>
            </ScrollView>

            <TouchableOpacity
              style={[styles.acceptBtn, { backgroundColor: c.primary }]}
              onPress={handleAcceptDisclaimer}
              activeOpacity={0.85}
            >
              <Text style={[styles.btnText, { color: c.onPrimary }]}>รับทราบและยืนยัน</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowDisclaimer(false)}>
              <Text style={[styles.cancelText, { color: c.inkFaint }]}>ยกเลิก</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1 },
  scroll: { padding: 22 },
  title:  { fontSize: 26, fontWeight: '800', marginBottom: 4 },
  sub:    { fontSize: 13, marginBottom: 24 },
  card:   { borderRadius: radius.lg, padding: 16, marginBottom: 16 },
  section:{ fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 12 },
  field:  { marginBottom: 14 },
  label:  { fontSize: 13, fontWeight: '500', marginBottom: 6 },
  input:  { borderRadius: radius.md, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  genderRow: { flexDirection: 'row', gap: 10 },
  genderBtn: { flex: 1, paddingVertical: 12, borderRadius: radius.md, borderWidth: 1.5, alignItems: 'center' },
  genderText:{ fontSize: 15 },
  condNote:  { fontSize: 12, marginBottom: 10 },
  dropdown:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: radius.md, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12 },
  dropdownText: { fontSize: 15, flex: 1, marginRight: 8 },
  dropdownList: { borderRadius: radius.md, borderWidth: 1, marginTop: 8, overflow: 'hidden' },
  condRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1 },
  condLabel: { fontSize: 14, fontWeight: '500', flex: 1 },
  checkbox:  { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  btn:       { borderRadius: radius.lg, paddingVertical: 18, alignItems: 'center', marginBottom: 12 },
  btnText:   { fontSize: 16, fontWeight: '700' },
  loginBtn:  { alignItems: 'center', paddingVertical: 8 },
  loginText: { fontSize: 14 },
  overlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet:     { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40, maxHeight: '85%' },
  sheetHandle:  { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetTitle:   { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  sheetSub:     { fontSize: 13, marginBottom: 16 },
  disclaimerScroll: { maxHeight: 320, marginBottom: 20 },
  disclaimerText:   { fontSize: 13, lineHeight: 21 },
  acceptBtn:  { borderRadius: radius.lg, paddingVertical: 16, alignItems: 'center', marginBottom: 10 },
  cancelBtn:  { paddingVertical: 10, alignItems: 'center' },
  cancelText: { fontSize: 14 },
});