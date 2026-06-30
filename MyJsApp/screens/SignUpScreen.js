import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { AuthContext } from '../AuthContext';
import { colors, radius, shadow } from '../utils/theme';

export default function SignUpScreen({ navigation }) {
  const { signup } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    email: '', password: '', confirmPassword: '',
    firstName: '', lastName: '', gender: 'ชาย', age: '', conditions: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignUp() {
    setError('');

    if (!formData.firstName || !formData.age) {
      setError('กรุณากรอกชื่อและอายุครับ');
      return;
    }
    if (!formData.email.trim()) {
      setError('กรุณากรอกอีเมล');
      return;
    }
    if (!formData.password) {
      setError('กรุณากรอกรหัสผ่าน');
      return;
    }
    if (formData.password.length < 6) {
      setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('รหัสผ่านทั้งสองช่องไม่ตรงกัน');
      return;
    }

    setLoading(true);
    const result = await signup({
      email: formData.email,
      password: formData.password,
      firstName: formData.firstName,
      lastName: formData.lastName,
      gender: formData.gender,
      age: formData.age,
      conditions: formData.conditions,
    });
    setLoading(false);

    if (!result.success) {
      setError(result.error || 'สมัครสมาชิกไม่สำเร็จ');
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.logoBox}>
        <Text style={styles.logoEmoji}>🫁</Text>
      </View>
      <Text style={styles.title}>สร้างบัญชีผู้ใช้</Text>
      <Text style={styles.subtitle}>เริ่มต้นติดตามการนอนหลับของคุณ</Text>

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>บัญชี</Text>
        <Text style={styles.label}>อีเมล</Text>
        <TextInput
          style={styles.input}
          placeholder="name@email.com"
          placeholderTextColor={colors.inkFaint}
          value={formData.email}
          onChangeText={(text) => setFormData({ ...formData, email: text })}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.label}>รหัสผ่าน</Text>
        <TextInput
          style={styles.input}
          placeholder="อย่างน้อย 6 ตัวอักษร"
          placeholderTextColor={colors.inkFaint}
          secureTextEntry
          value={formData.password}
          onChangeText={(text) => setFormData({ ...formData, password: text })}
        />

        <Text style={styles.label}>ยืนยันรหัสผ่าน</Text>
        <TextInput
          style={styles.input}
          placeholder="กรอกรหัสผ่านอีกครั้ง"
          placeholderTextColor={colors.inkFaint}
          secureTextEntry
          value={formData.confirmPassword}
          onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
        />

        <View style={styles.sectionDivider} />
        <Text style={styles.sectionLabel}>ข้อมูลส่วนตัว</Text>

        <Text style={styles.label}>ชื่อ</Text>
        <TextInput
          style={styles.input}
          placeholder="ชื่อจริง"
          placeholderTextColor={colors.inkFaint}
          value={formData.firstName}
          onChangeText={(text) => setFormData({ ...formData, firstName: text })}
        />

        <Text style={styles.label}>นามสกุล</Text>
        <TextInput
          style={styles.input}
          placeholder="นามสกุล"
          placeholderTextColor={colors.inkFaint}
          value={formData.lastName}
          onChangeText={(text) => setFormData({ ...formData, lastName: text })}
        />

        <Text style={styles.label}>เพศ</Text>
        <View style={styles.genderContainer}>
          <TouchableOpacity
            style={[styles.genderButton, formData.gender === 'ชาย' && styles.genderButtonActive]}
            activeOpacity={0.7}
            onPress={() => setFormData({ ...formData, gender: 'ชาย' })}
          >
            <Text style={[styles.genderText, formData.gender === 'ชาย' && styles.genderTextActive]}>ชาย</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.genderButton, formData.gender === 'หญิง' && styles.genderButtonActive]}
            activeOpacity={0.7}
            onPress={() => setFormData({ ...formData, gender: 'หญิง' })}
          >
            <Text style={[styles.genderText, formData.gender === 'หญิง' && styles.genderTextActive]}>หญิง</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>อายุ (ปี)</Text>
        <TextInput
          style={styles.input}
          placeholder="เช่น 35"
          keyboardType="numeric"
          placeholderTextColor={colors.inkFaint}
          value={formData.age}
          onChangeText={(text) => setFormData({ ...formData, age: text })}
        />

        <Text style={styles.label}>โรคประจำตัว (ถ้ามี)</Text>
        <TextInput
          style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
          placeholder="ระบุโรคประจำตัว"
          multiline
          placeholderTextColor={colors.inkFaint}
          value={formData.conditions}
          onChangeText={(text) => setFormData({ ...formData, conditions: text })}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          activeOpacity={0.85}
          onPress={handleSignUp}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={styles.buttonText}>ลงทะเบียน</Text>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 22, marginBottom: 30 }}>
        <Text style={styles.linkText}>มีบัญชีอยู่แล้ว? <Text style={styles.linkTextBold}>เข้าสู่ระบบ</Text></Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: colors.bg, padding: 24, justifyContent: 'center' },
  logoBox: {
    width: 64, height: 64, borderRadius: radius.lg, backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 14,
  },
  logoEmoji: { fontSize: 28 },
  title: { fontSize: 24, fontWeight: '700', color: colors.ink, textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 14, color: colors.inkMuted, textAlign: 'center', marginBottom: 24 },

  card: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: 22, ...shadow.raised },
  sectionLabel: { color: colors.primaryDeep, fontSize: 12, fontWeight: '700', marginBottom: 12, letterSpacing: 0.5 },
  sectionDivider: { height: 1, backgroundColor: colors.border, marginVertical: 18 },

  label: { color: colors.inkMuted, fontSize: 13, marginBottom: 7, marginLeft: 2 },
  input: {
    backgroundColor: colors.surfaceMuted, color: colors.ink, padding: 14,
    borderRadius: radius.md, marginBottom: 14, fontSize: 15,
  },

  genderContainer: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  genderButton: {
    flex: 1, backgroundColor: colors.surfaceMuted, padding: 14, borderRadius: radius.md,
    alignItems: 'center', borderWidth: 1.5, borderColor: 'transparent',
  },
  genderButtonActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  genderText: { color: colors.inkMuted, fontSize: 15, fontWeight: '600' },
  genderTextActive: { color: colors.primaryDeep },

  errorText: { color: colors.riskSevere, fontSize: 13, marginBottom: 10, textAlign: 'center' },
  button: {
    backgroundColor: colors.primary, padding: 16, borderRadius: radius.md, alignItems: 'center', marginTop: 6,
    shadowColor: colors.primaryDeep, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22, shadowRadius: 12, elevation: 4,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: colors.onPrimary, fontSize: 17, fontWeight: '700' },
  linkText: { color: colors.inkMuted, textAlign: 'center', fontSize: 14 },
  linkTextBold: { color: colors.primary, fontWeight: '700' },
});