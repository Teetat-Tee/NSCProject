import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, Alert, ActivityIndicator, StatusBar,
} from 'react-native';
import { useTheme, radius, shadow } from '../utils/theme';
import { AuthContext } from '../AuthContext';
import { useContext } from 'react';

export default function LoginScreen({ navigation }) {
  const { colors, isDark }         = useTheme();
  const { loginWithCredentials }   = useContext(AuthContext);
  const [email, setEmail]          = useState('');
  const [password, setPassword]    = useState('');
  const [loading, setLoading]      = useState(false);
  const [error, setError]          = useState('');

  async function handleLogin() {
    if (!email || !password) { setError('กรุณากรอกอีเมลและรหัสผ่าน'); return; }
    setLoading(true); setError('');
    const result = await loginWithCredentials(email.trim().toLowerCase(), password);
    setLoading(false);
    if (!result.success) setError(result.error ?? 'เกิดข้อผิดพลาด');
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        <View style={styles.logoWrap}>
          <View style={[styles.logoBox, { backgroundColor: colors.primarySoft }]}>
            <Text style={{ fontSize: 48 }}>🫁</Text>
          </View>
          <Text style={[styles.title, { color: colors.ink }]}>ยินดีต้อนรับกลับ</Text>
          <Text style={[styles.sub, { color: colors.inkMuted }]}>เข้าสู่ระบบเพื่อดูข้อมูลการนอนของคุณ</Text>
        </View>

        <View style={[styles.form, { backgroundColor: colors.surface }, !isDark && shadow.card]}>
          <Text style={[styles.label, { color: colors.ink }]}>อีเมล</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surfaceMuted, color: colors.ink }]}
            placeholder="name@email.com"
            placeholderTextColor={colors.inkFaint}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={[styles.label, { color: colors.ink }]}>รหัสผ่าน</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surfaceMuted, color: colors.ink }]}
            placeholder="••••••••"
            placeholderTextColor={colors.inkFaint}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {error ? <Text style={[styles.error, { color: colors.riskSevere }]}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.loginBtn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
            activeOpacity={0.85}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color={colors.onPrimary} />
              : <Text style={[styles.loginText, { color: colors.onPrimary }]}>เข้าสู่ระบบ</Text>
            }
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.signupLink} onPress={() => navigation.navigate('SignUp')}>
          <Text style={[styles.signupText, { color: colors.inkMuted }]}>
            ยังไม่มีบัญชี?{' '}
            <Text style={[styles.signupHighlight, { color: colors.primary }]}>สร้างบัญชีใหม่</Text>
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1 },
  scroll:    { flexGrow: 1, padding: 24, justifyContent: 'center' },
  logoWrap:  { alignItems: 'center', marginBottom: 32 },
  logoBox:   { width: 90, height: 90, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  title:     { fontSize: 26, fontWeight: '800', marginBottom: 8 },
  sub:       { fontSize: 14, textAlign: 'center' },
  form:      { borderRadius: radius.xl, padding: 22, marginBottom: 20 },
  label:     { fontSize: 13, fontWeight: '600', marginBottom: 8, marginTop: 4 },
  input:     { borderRadius: radius.md, padding: 16, fontSize: 15, marginBottom: 4 },
  error:     { fontSize: 13, marginTop: 8, marginBottom: 4 },
  loginBtn:  { borderRadius: radius.lg, paddingVertical: 17, alignItems: 'center', marginTop: 16 },
  loginText: { fontSize: 16, fontWeight: '700' },
  signupLink:{ alignItems: 'center', paddingVertical: 12 },
  signupText:{ fontSize: 14 },
  signupHighlight:{ fontWeight: '700' },
});