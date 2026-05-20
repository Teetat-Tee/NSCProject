import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { AuthContext } from '../AuthContext';

export default function LoginScreen({ navigation }) {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    // สมมติว่าล็อกอินสำเร็จ (เนื่องจากยังไม่ได้ต่อ Backend)
    // เราจะจำลองข้อมูล userData ขึ้นมาเพื่อให้เข้าแอปได้ก่อน
    const dummyUserData = {
      firstName: 'สมชาย',
      lastName: 'ใจดี',
      gender: 'ชาย',
      age: '35',
      conditions: 'ความดันโลหิตสูง'
    };
    login(dummyUserData);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>เข้าสู่ระบบ</Text>
      
      <TextInput 
        style={styles.input} 
        placeholder="อีเมล" 
        placeholderTextColor="#94a3b8"
        value={email}
        onChangeText={setEmail}
      />
      
      <TextInput 
        style={styles.input} 
        placeholder="รหัสผ่าน" 
        placeholderTextColor="#94a3b8"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>เข้าสู่ระบบ</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => navigation.navigate('SignUp')} style={{ marginTop: 20 }}>
        <Text style={styles.linkText}>ยังไม่มีบัญชี? สร้างบัญชีใหม่</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 20, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 30, textAlign: 'center' },
  input: { backgroundColor: '#1e293b', color: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, fontSize: 16 },
  button: { backgroundColor: '#38bdf8', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  linkText: { color: '#38bdf8', textAlign: 'center', fontSize: 16 }
});