// ============================================================
// utils/preferencesStorage.js — Preferences ผ่าน server API
// ============================================================
import { apiFetch } from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCAL_KEY = 'osa_preferences_v2';

const DEFAULT_PREFS = {
  smartAlarmEnabled: true,
  smartAlarmTime:    '06:30',
  sleepGoalHours:    8,
};

export async function getPreferences() {
  try {
    const data = await apiFetch('/preferences');
    const prefs = { ...DEFAULT_PREFS, ...data.preferences };
    await AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(prefs));
    return prefs;
  } catch {
    // fallback: โหลดจาก local
    const raw = await AsyncStorage.getItem(LOCAL_KEY);
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : { ...DEFAULT_PREFS };
  }
}

export async function updatePreferences(updates) {
  const current = await getPreferences();
  const next    = { ...current, ...updates };

  // บันทึก local ก่อนเสมอ (เร็วกว่า)
  await AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(next));

  try {
    await apiFetch('/preferences', {
      method: 'PUT',
      body:   JSON.stringify(next),
    });
  } catch (err) {
    console.warn('updatePreferences server error:', err.message);
  }

  return next;
}