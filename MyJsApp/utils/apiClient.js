// ============================================================
// utils/apiClient.js — API client กลางสำหรับเรียก server
// ============================================================
import AsyncStorage from '@react-native-async-storage/async-storage';

// เปลี่ยน URL ตรงนี้เมื่อ tunnel URL เปลี่ยน
export const SERVER_URL = 'https://osa-detect-server.onrender.com';

const TOKEN_KEY = 'osa_jwt_token';

// ============================================================
// Token management
// ============================================================
export async function getToken() {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function setToken(token) {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function removeToken() {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

// ============================================================
// Base fetch wrapper
// ============================================================
export async function apiFetch(path, options = {}) {
  const token = await getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${SERVER_URL}${path}`, {
    ...options,
    headers,
  });

  // เช็ค content-type ก่อน parse
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await response.text();
    throw new Error(`Server returned non-JSON response: ${text.slice(0, 100)}`);
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `HTTP ${response.status}`);
  }

  return data;
}

// multipart/form-data (สำหรับอัปโหลดไฟล์เสียง)
export async function apiUpload(path, formData) {
  const token = await getToken();

  const response = await fetch(`${SERVER_URL}${path}`, {
    method:  'POST',
    body:    formData,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  return response.json();
}