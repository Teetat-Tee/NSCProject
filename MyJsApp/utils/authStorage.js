// ============================================================
// utils/authStorage.js — Auth ผ่าน server API (PostgreSQL)
// แทนที่ AsyncStorage + SHA-256 เดิม
// ============================================================
import { apiFetch, setToken, removeToken, getToken } from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_KEY = 'osa_current_user';

// ============================================================
// สมัครสมาชิก
// ============================================================
export async function signUp({ email, password, firstName, lastName, gender, age, conditions }) {
  try {
    const data = await apiFetch('/auth/signup', {
      method: 'POST',
      body:   JSON.stringify({ email, password, firstName, lastName, gender, age, conditions }),
    });

    await setToken(data.token);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));
    return { success: true, user: data.user };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ============================================================
// เข้าสู่ระบบ
// ============================================================
export async function login({ email, password }) {
  try {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body:   JSON.stringify({ email, password }),
    });

    await setToken(data.token);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));
    return { success: true, user: data.user };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ============================================================
// ออกจากระบบ
// ============================================================
export async function logout() {
  await removeToken();
  await AsyncStorage.removeItem(USER_KEY);
}

// ============================================================
// เช็ค session ที่ค้างอยู่ (auto-login)
// ============================================================
export async function getCurrentSession() {
  try {
    const token = await getToken();
    if (!token) return null;

    // verify token กับ server
    const data = await apiFetch('/auth/me');
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));
    return data.user;
  } catch (err) {
    // token หมดอายุหรือ server ไม่ตอบ — ลองโหลดจาก cache
    const cached = await AsyncStorage.getItem(USER_KEY);
    return cached ? JSON.parse(cached) : null;
  }
}

// ============================================================
// อัปเดตโปรไฟล์
// ============================================================
export async function updateProfile(email, updates) {
  try {
    const data = await apiFetch('/auth/profile', {
      method: 'PUT',
      body:   JSON.stringify(updates),
    });
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));
    return { success: true, user: data.user };
  } catch (err) {
    return { success: false, error: err.message };
  }
}