// ============================================================
// sessionStorage.js — เก็บประวัติการนอนแต่ละคืนแบบถาวร
// ============================================================
//
// ใช้ @react-native-async-storage/async-storage
// เก็บข้อมูลย้อนหลังสูงสุด 90 วัน แล้วลบของเก่าทิ้งอัตโนมัติ
//
// โครงสร้าง session ที่เก็บ:
// {
//   id: string (timestamp-based unique id)
//   date: string (YYYY-MM-DD ของคืนที่บันทึก)
//   timestamp: number (เวลาบันทึกเสร็จ, ms)
//   duration: number (วินาที)
//   events: [{ type, msg, time, confidence?, timestamp? }]
//   ahi: number
//   riskLabel: string
//   riskColor: string
//   apneaCount, snoreCount, moveCount: number
//   survey: { answers, wellnessPercent } | null
// }
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { calculateAHI, classifyRisk } from './modelHelper';

const STORAGE_KEY = 'osa_sessions_v1';
const RETENTION_DAYS = 90;

function todayDateString(ts = Date.now()) {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * อ่าน session ทั้งหมดจาก storage (เรียงจากใหม่ -> เก่า)
 * และทำ auto-cleanup ลบของเก่าเกิน 90 วันทิ้งไปในตัว
 */
export async function getAllSessions() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    let sessions = JSON.parse(raw);
    if (!Array.isArray(sessions)) return [];

    const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
    const before = sessions.length;
    sessions = sessions.filter((s) => s.timestamp >= cutoff);

    // ถ้ามีของถูกลบออกไป ให้เขียนกลับเพื่อ sync storage ให้ตรงกับสิ่งที่ใช้จริง
    if (sessions.length !== before) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    }

    return sessions.sort((a, b) => b.timestamp - a.timestamp);
  } catch (e) {
    console.error('getAllSessions error:', e);
    return [];
  }
}

/**
 * บันทึก session ใหม่ลง storage
 * @param {object} params - { duration, events, survey }
 * @returns {object} session ที่บันทึกสำเร็จ (มี id แล้ว)
 */
export async function saveSession({ duration, events, survey = null }) {
  const apneaCount = events.filter((e) => e.type === 'apnea').length;
  const snoreCount = events.filter((e) => e.type === 'snore').length;
  const moveCount = events.filter((e) => e.type === 'movement').length;

  const ahi = calculateAHI(apneaCount, duration);
  const risk = classifyRisk(ahi);

  const now = Date.now();
  const session = {
    id: `session_${now}`,
    date: todayDateString(now),
    timestamp: now,
    duration,
    events,
    ahi,
    riskLabel: risk.label,
    riskColor: risk.color,
    apneaCount,
    snoreCount,
    moveCount,
    survey,
  };

  try {
    const existing = await getAllSessions();
    const updated = [session, ...existing];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return session;
  } catch (e) {
    console.error('saveSession error:', e);
    throw e;
  }
}

/** ดึง session ตาม id */
export async function getSessionById(id) {
  const sessions = await getAllSessions();
  return sessions.find((s) => s.id === id) || null;
}

/** ดึง session ล่าสุด (สำหรับหน้า Summary แบบ "วันนี้/คืนล่าสุด") */
export async function getLatestSession() {
  const sessions = await getAllSessions();
  return sessions[0] || null;
}

/** ดึง session ทั้งหมดของวันที่กำหนด (YYYY-MM-DD) */
export async function getSessionsByDate(dateString) {
  const sessions = await getAllSessions();
  return sessions.filter((s) => s.date === dateString);
}

/** ดึง session ทั้งหมดภายในเดือนที่กำหนด (year, month: 1-12) */
export async function getSessionsByMonth(year, month) {
  const sessions = await getAllSessions();
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  return sessions.filter((s) => s.date.startsWith(prefix));
}

/**
 * สรุปสถิติรวม (สำหรับ Settings: Nights / Avg Sleep / Streak)
 */
export async function getOverallStats() {
  const sessions = await getAllSessions();

  if (sessions.length === 0) {
    return { totalNights: 0, avgSleepHours: 0, streak: 0 };
  }

  const totalNights = sessions.length;
  const avgDuration = sessions.reduce((sum, s) => sum + s.duration, 0) / totalNights;
  const avgSleepHours = Math.round((avgDuration / 3600) * 10) / 10;

  // คำนวณ streak: นับจำนวนวันติดต่อกัน (นับจากวันล่าสุดย้อนหลัง) ที่มีการบันทึก
  const uniqueDates = [...new Set(sessions.map((s) => s.date))].sort().reverse();
  let streak = 0;
  let cursor = new Date();
  for (let i = 0; i < uniqueDates.length; i++) {
    const expected = todayDateString(cursor.getTime());
    if (uniqueDates[i] === expected) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  return { totalNights, avgSleepHours, streak };
}

/** ลบ session ทั้งหมด (ใช้สำหรับ debug/reset) */
export async function clearAllSessions() {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

export { todayDateString };