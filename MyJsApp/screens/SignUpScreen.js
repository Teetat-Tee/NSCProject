import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { AuthContext } from '../AuthContext';

export default function SignUpScreen({ navigation }) {
  const { login } = useContext(AuthContext);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: 'ชาย', // กำหนดค่าเริ่มต้นเป็นชาย
    age: '',
    conditions: ''
  });

  const handleSignUp = () => {
    if (!formData.firstName || !formData.age) {
      alert("กรุณากรอกชื่อและอายุครับ");
      return;
    }
    login(formData);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>สร้างบัญชีผู้ใช้</Text>
      
      <TextInput 
        style={styles.input} 
        placeholder="ชื่อ" 
        placeholderTextColor="#94a3b8"
        value={formData.firstName}
        onChangeText={(text) => setFormData({...formData, firstName: text})}
      />
      
      <TextInput 
        style={styles.input} 
        placeholder="นามสกุล" 
        placeholderTextColor="#94a3b8"
        value={formData.lastName}
        onChangeText={(text) => setFormData({...formData, lastName: text})}
      />

      {/* ส่วนเลือกเพศที่ปรับใหม่ */}
      <Text style={styles.label}>เพศ</Text>
      <View style={styles.genderContainer}>
        <TouchableOpacity 
          style={[styles.genderButton, formData.gender === 'ชาย' && styles.genderButtonActive]}
          onPress={() => setFormData({...formData, gender: 'ชาย'})}
        >
          <Text style={[styles.genderText, formData.gender === 'ชาย' && styles.genderTextActive]}>ชาย</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.genderButton, formData.gender === 'หญิง' && styles.genderButtonActive]}
          onPress={() => setFormData({...formData, gender: 'หญิง'})}
        >
          <Text style={[styles.genderText, formData.gender === 'หญิง' && styles.genderTextActive]}>หญิง</Text>
        </TouchableOpacity>
      </View>

      <TextInput 
        style={styles.input} 
        placeholder="อายุ (ปี)" 
        keyboardType="numeric"
        placeholderTextColor="#94a3b8"
        value={formData.age}
        onChangeText={(text) => setFormData({...formData, age: text})}
      />

      <TextInput 
        style={[styles.input, { height: 80, textAlignVertical: 'top' }]} 
        placeholder="โรคประจำตัว (ถ้ามี)" 
        multiline
        placeholderTextColor="#94a3b8"
        value={formData.conditions}
        onChangeText={(text) => setFormData({...formData, conditions: text})}
      />

      <TouchableOpacity style={styles.button} onPress={handleSignUp}>
        <Text style={styles.buttonText}>ลงทะเบียน</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
        <Text style={styles.linkText}>มีบัญชีอยู่แล้ว? เข้าสู่ระบบ</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#0f172a', padding: 20, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 30, textAlign: 'center' },
  input: { backgroundColor: '#1e293b', color: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, fontSize: 16 },
  
  // สไตล์ใหม่สำหรับปุ่มเลือกเพศ
  label: { color: '#94a3b8', fontSize: 14, marginBottom: 8, marginLeft: 4 },
  genderContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  genderButton: { 
    flex: 1, 
    backgroundColor: '#1e293b', 
    padding: 15, 
    borderRadius: 10, 
    alignItems: 'center',
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: 'transparent'
  },
  genderButtonActive: {
    backgroundColor: '#0369a1', // สีฟ้าเข้มเมื่อถูกเลือก
    borderColor: '#38bdf8'
  },
  genderText: { color: '#94a3b8', fontSize: 16, fontWeight: 'bold' },
  genderTextActive: { color: '#fff' },
  
  button: { backgroundColor: '#38bdf8', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  linkText: { color: '#38bdf8', textAlign: 'center', fontSize: 16 }
});