import { useState, useContext } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, ActivityIndicator, StatusBar,
} from 'react-native';
import { useTheme, radius, shadow } from '../utils/theme';
import { AuthContext } from '../AuthContext';

export default function SignUpScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const { signup }         = useContext(AuthContext);

  const [form, setForm]   = useState({ email: '', password: '', confirmPassword: '', firstName: '', lastName: '', gender: 'male', age: '', conditions: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  function set(key, val) { setForm(p => ({ ...p, [key]: val })); }

  async function handleSignUp() {
    if (!form.email || !form.password) { setError('กรุณากรอกอีเมลและรหัสผ่าน'); return; }
    if (form.password.length < 6)      { setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'); return; }
    if (form.password !== form.confirmPassword) { setError('รหัสผ่านไม่ตรงกัน'); return; }
    setLoading(true); setError('');
    const result = await signup({ ...form, email: form.email.trim().toLowerCase(), age: form.age ? parseInt(form.age) : null });
    setLoading(false);
    if (!result.success) setError(result.error ?? 'เกิดข้อผิดพลาด');
  }

  function Input({ label, ...props }) {
    return (
      <View style={{ marginBottom: 14 }}>
        <Text style={[styles.label, { color: colors.ink }]}>{label}</Text>
        <TextInput style={[styles.input, { backgroundColor: colors.surfaceMuted, color: colors.ink }]} placeholderTextColor={colors.inkFaint} {...props} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        <View style={styles.logoWrap}>
          <View style={[styles.logoBox, { backgroundColor: colors.primarySoft }]}>
            <Text style={{ fontSize: 40 }}>🫁</Text>
          </View>
          <Text style={[styles.title, { color: colors.ink }]}>สร้างบัญชีผู้ใช้</Text>
          <Text style={[styles.sub, { color: colors.inkMuted }]}>เริ่มต้นติดตามการนอนหลับของคุณ</Text>
        </View>

        <View style={[styles.form, { backgroundColor: colors.surface }, !isDark && shadow.card]}>
          <Text style={[styles.sectionLabel, { color: colors.primary }]}>บัญชี</Text>

          <Input label="อีเมล" placeholder="name@email.com" value={form.email} onChangeText={v => set('email', v)} keyboardType="email-address" autoCapitalize="none" />
          <Input label="รหัสผ่าน" placeholder="อย่างน้อย 6 ตัวอักษร" value={form.password} onChangeText={v => set('password', v)} secureTextEntry />
          <Input label="ยืนยันรหัสผ่าน" placeholder="กรอกรหัสผ่านอีกครั้ง" value={form.confirmPassword} onChangeText={v => set('confirmPassword', v)} secureTextEntry />

          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Text style={[styles.sectionLabel, { color: colors.primary }]}>ข้อมูลส่วนตัว</Text>

          <Input label="ชื่อ" placeholder="ชื่อจริง" value={form.firstName} onChangeText={v => set('firstName', v)} />
          <Input label="นามสกุล" placeholder="นามสกุล" value={form.lastName} onChangeText={v => set('lastName', v)} />

          <Text style={[styles.label, { color: colors.ink }]}>เพศ</Text>
          <View style={styles.genderRow}>
            {[['male', 'ชาย'], ['female', 'หญิง']].map(([val, label]) => (
              <TouchableOpacity
                key={val}
                style={[styles.genderBtn, { borderColor: form.gender === val ? colors.primary : colors.border, backgroundColor: form.gender === val ? colors.primarySoft : colors.surfaceMuted }]}
                onPress={() => set('gender', val)}
              >
                <Text style={[styles.genderText, { color: form.gender === val ? colors.primary : colors.inkMuted }]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Input label="อายุ (ปี)" placeholder="เช่น 35" value={form.age} onChangeText={v => set('age', v)} keyboardType="numeric" />

          <Text style={[styles.label, { color: colors.ink }]}>โรคประจำตัว (ถ้ามี)</Text>
          <TextInput
            style={[styles.input, styles.textarea, { backgroundColor: colors.surfaceMuted, color: colors.ink }]}
            placeholder="ระบุโรคประจำตัว"
            placeholderTextColor={colors.inkFaint}
            value={form.conditions}
            onChangeText={v => set('conditions', v)}
            multiline
            numberOfLines={3}
          />

          {error ? <Text style={[styles.error, { color: colors.riskSevere }]}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
            activeOpacity={0.85}
            onPress={handleSignUp}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color={colors.onPrimary} />
              : <Text style={[styles.submitText, { color: colors.onPrimary }]}>ลงทะเบียน</Text>
            }
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
          <Text style={[styles.loginText, { color: colors.inkMuted }]}>
            มีบัญชีอยู่แล้ว?{' '}
            <Text style={[{ color: colors.primary, fontWeight: '700' }]}>เข้าสู่ระบบ</Text>
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1 },
  scroll:    { padding: 24 },
  logoWrap:  { alignItems: 'center', marginBottom: 24, marginTop: 8 },
  logoBox:   { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  title:     { fontSize: 24, fontWeight: '800', marginBottom: 6 },
  sub:       { fontSize: 13, textAlign: 'center' },
  form:      { borderRadius: radius.xl, padding: 22, marginBottom: 16 },
  sectionLabel:{ fontSize: 13, fontWeight: '700', marginBottom: 14 },
  divider:   { height: 1, marginVertical: 18 },
  label:     { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  input:     { borderRadius: radius.md, padding: 16, fontSize: 15 },
  textarea:  { height: 90, textAlignVertical: 'top' },
  genderRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  genderBtn: { flex: 1, paddingVertical: 14, borderRadius: radius.md, alignItems: 'center', borderWidth: 1.5 },
  genderText:{ fontSize: 15, fontWeight: '600' },
  error:     { fontSize: 13, marginTop: 8, marginBottom: 4 },
  submitBtn: { borderRadius: radius.lg, paddingVertical: 17, alignItems: 'center', marginTop: 16 },
  submitText:{ fontSize: 16, fontWeight: '700' },
  loginLink: { alignItems: 'center', paddingVertical: 12 },
  loginText: { fontSize: 14 },
});