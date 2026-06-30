// ============================================================
// preferencesStorage.js — เก็บค่าตั้งค่าผู้ใช้แบบถาวร
// ============================================================
// ใช้สำหรับ Settings screen: Smart Alarm (on/off + เวลา),
// Sleep Goal (ชั่วโมง) — ปัจจุบันเป็นค่าที่ "เก็บไว้" เท่านั้น
// ยังไม่มีฟีเจอร์ปลุกจริง (รอ implement การแจ้งเตือนในอนาคต)
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFS_KEY = 'osa_preferences_v1';

const DEFAULT_PREFS = {
  smartAlarmEnabled: true,
  smartAlarmTime: '06:30', // HH:mm
  sleepGoalHours: 8,
};

export async function getPreferences() {
  try {
    const raw = await AsyncStorage.getItem(PREFS_KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch (e) {
    console.error('getPreferences error:', e);
    return { ...DEFAULT_PREFS };
  }
}

export async function updatePreferences(updates) {
  const current = await getPreferences();
  const next = { ...current, ...updates };
  await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(next));
  return next;
}