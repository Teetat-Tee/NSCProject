import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { AuthContext } from '../AuthContext';
import { colors, radius, shadow } from '../utils/theme';

export default function LoginScreen({ navigation }) {
  const { loginWithCredentials } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError('');
    if (!email.trim() || !password) {
      setError('กรุณากรอกอีเมลและรหัสผ่าน');
      return;
    }
    setLoading(true);
    const result = await loginWithCredentials(email, password);
    setLoading(false);
    if (!result.success) {
      setError(result.error || 'เข้าสู่ระบบไม่สำเร็จ');
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <View style={styles.logoBox}>
          <Text style={styles.logoEmoji}>🫁</Text>
        </View>
        <Text style={styles.title}>ยินดีต้อนรับกลับ</Text>
        <Text style={styles.subtitle}>เข้าสู่ระบบเพื่อดูข้อมูลการนอนของคุณ</Text>

        <View style={styles.card}>
          <Text style={styles.label}>อีเมล</Text>
          <TextInput
            style={styles.input}
            placeholder="name@email.com"
            placeholderTextColor={colors.inkFaint}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.label}>รหัสผ่าน</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={colors.inkFaint}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            activeOpacity={0.85}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <Text style={styles.buttonText}>เข้าสู่ระบบ</Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('SignUp')} style={{ marginTop: 24 }}>
          <Text style={styles.linkText}>ยังไม่มีบัญชี? <Text style={styles.linkTextBold}>สร้างบัญชีใหม่</Text></Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  logoBox: {
    width: 72, height: 72, borderRadius: radius.xl, backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 18,
  },
  logoEmoji: { fontSize: 32 },
  title: { fontSize: 26, fontWeight: '700', color: colors.ink, textAlign: 'center', marginBottom: 6 },
  subtitle: { fontSize: 14, color: colors.inkMuted, textAlign: 'center', marginBottom: 30 },

  card: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: 22, ...shadow.raised },
  label: { color: colors.inkMuted, fontSize: 13, fontWeight: '600', marginBottom: 8, marginLeft: 2 },
  input: {
    backgroundColor: colors.surfaceMuted, color: colors.ink, padding: 15,
    borderRadius: radius.md, marginBottom: 16, fontSize: 15,
  },
  errorText: { color: colors.riskSevere, fontSize: 13, marginBottom: 12, textAlign: 'center' },
  button: {
    backgroundColor: colors.primary, padding: 16, borderRadius: radius.md, alignItems: 'center',
    shadowColor: colors.primaryDeep, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22, shadowRadius: 12, elevation: 4,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: colors.onPrimary, fontSize: 17, fontWeight: '700' },
  linkText: { color: colors.inkMuted, textAlign: 'center', fontSize: 14 },
  linkTextBold: { color: colors.primary, fontWeight: '700' },
});