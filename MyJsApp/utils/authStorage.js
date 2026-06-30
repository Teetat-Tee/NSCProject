// ============================================================
// authStorage.js — เก็บบัญชีผู้ใช้แบบ local (AsyncStorage)
// ============================================================
//
// ออกแบบแยก data layer ออกจาก UI โดยเจตนา เพื่อให้สลับไปใช้
// backend จริง (เช่น Firebase Auth, REST API) ในอนาคตได้ง่าย
// แค่เปลี่ยน implementation ข้างในไฟล์นี้ ไม่ต้องแก้ UI เลย
//
// ⚠️ ข้อจำกัดด้านความปลอดภัย:
// การ hash รหัสผ่านด้วยวิธีนี้ (SHA-256 แบบไม่มี salt) เหมาะสำหรับ
// การพัฒนา/ทดสอบเท่านั้น ไม่ใช่มาตรฐานความปลอดภัยระดับ production
// เมื่อต่อ backend จริง ควรใช้ bcrypt/argon2 ฝั่งเซิร์ฟเวอร์แทน
// และไม่ควรเก็บรหัสผ่าน (แม้ hash แล้ว) ไว้บนเครื่องผู้ใช้
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

const USERS_KEY = 'osa_users_v1';
const SESSION_KEY = 'osa_auth_session_v1'; // เก็บ email ของคนที่ login ค้างอยู่

async function hashPassword(password) {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    password
  );
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

async function getAllUsers() {
  try {
    const raw = await AsyncStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('getAllUsers error:', e);
    return [];
  }
}

async function saveAllUsers(users) {
  await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
}

/**
 * สมัครสมาชิกใหม่
 * @returns {object} { success: true, user } หรือ { success: false, error }
 */
export async function signUp({ email, password, firstName, lastName, gender, age, conditions }) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !password) {
    return { success: false, error: 'กรุณากรอกอีเมลและรหัสผ่าน' };
  }
  if (password.length < 6) {
    return { success: false, error: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' };
  }

  const users = await getAllUsers();
  const exists = users.find((u) => u.email === normalizedEmail);
  if (exists) {
    return { success: false, error: 'อีเมลนี้ถูกใช้สมัครไว้แล้ว' };
  }

  const passwordHash = await hashPassword(password);
  const newUser = {
    email: normalizedEmail,
    passwordHash,
    firstName: firstName || '',
    lastName: lastName || '',
    gender: gender || '',
    age: age || '',
    conditions: conditions || '',
    createdAt: Date.now(),
  };

  users.push(newUser);
  await saveAllUsers(users);
  await AsyncStorage.setItem(SESSION_KEY, normalizedEmail);

  const { passwordHash: _omit, ...publicUser } = newUser;
  return { success: true, user: publicUser };
}

/**
 * เข้าสู่ระบบด้วย email + password
 * @returns {object} { success: true, user } หรือ { success: false, error }
 */
export async function login({ email, password }) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !password) {
    return { success: false, error: 'กรุณากรอกอีเมลและรหัสผ่าน' };
  }

  const users = await getAllUsers();
  const user = users.find((u) => u.email === normalizedEmail);
  if (!user) {
    return { success: false, error: 'ไม่พบบัญชีนี้ในระบบ' };
  }

  const passwordHash = await hashPassword(password);
  if (passwordHash !== user.passwordHash) {
    return { success: false, error: 'รหัสผ่านไม่ถูกต้อง' };
  }

  await AsyncStorage.setItem(SESSION_KEY, normalizedEmail);

  const { passwordHash: _omit, ...publicUser } = user;
  return { success: true, user: publicUser };
}

/** ออกจากระบบ — ลบ session ที่ค้างไว้ */
export async function logout() {
  await AsyncStorage.removeItem(SESSION_KEY);
}

/**
 * เช็คว่ามี session ค้างอยู่ไหม (สำหรับ auto-login ตอนเปิดแอป)
 * @returns {object|null} user ที่ login ค้างไว้ หรือ null ถ้าไม่มี
 */
export async function getCurrentSession() {
  try {
    const email = await AsyncStorage.getItem(SESSION_KEY);
    if (!email) return null;

    const users = await getAllUsers();
    const user = users.find((u) => u.email === email);
    if (!user) return null;

    const { passwordHash: _omit, ...publicUser } = user;
    return publicUser;
  } catch (e) {
    console.error('getCurrentSession error:', e);
    return null;
  }
}

/** อัปเดตข้อมูลโปรไฟล์ของ user ที่ login อยู่ */
export async function updateProfile(email, updates) {
  const normalizedEmail = normalizeEmail(email);
  const users = await getAllUsers();
  const idx = users.findIndex((u) => u.email === normalizedEmail);
  if (idx === -1) return { success: false, error: 'ไม่พบบัญชีผู้ใช้' };

  users[idx] = { ...users[idx], ...updates, email: normalizedEmail };
  await saveAllUsers(users);

  const { passwordHash: _omit, ...publicUser } = users[idx];
  return { success: true, user: publicUser };
}