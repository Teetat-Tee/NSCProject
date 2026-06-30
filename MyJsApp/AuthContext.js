import React, { createContext, useState, useEffect } from 'react';
import * as AuthStorage from './utils/authStorage';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    gender: '',
    age: '',
    conditions: '',
  });
  const [authLoading, setAuthLoading] = useState(true); // true ระหว่างเช็ค session ค้างตอนเปิดแอป

  // เช็ค session ที่ค้างไว้ทุกครั้งที่เปิดแอป (auto-login)
  useEffect(() => {
    (async () => {
      const session = await AuthStorage.getCurrentSession();
      if (session) {
        setUserData(session);
        setIsLoggedIn(true);
      }
      setAuthLoading(false);
    })();
  }, []);

  /**
   * สมัครสมาชิกใหม่
   * @returns {object} { success, error? }
   */
  const signup = async (formData) => {
    const result = await AuthStorage.signUp(formData);
    if (result.success) {
      setUserData(result.user);
      setIsLoggedIn(true);
    }
    return result;
  };

  /**
   * เข้าสู่ระบบด้วย email + password จริง
   * @returns {object} { success, error? }
   */
  const loginWithCredentials = async (email, password) => {
    const result = await AuthStorage.login({ email, password });
    if (result.success) {
      setUserData(result.user);
      setIsLoggedIn(true);
    }
    return result;
  };

  /** อัปเดตข้อมูลโปรไฟล์ของผู้ใช้ที่ login อยู่ */
  const updateProfile = async (updates) => {
    if (!userData.email) return { success: false, error: 'ยังไม่ได้เข้าสู่ระบบ' };
    const result = await AuthStorage.updateProfile(userData.email, updates);
    if (result.success) {
      setUserData(result.user);
    }
    return result;
  };

  const logout = async () => {
    await AuthStorage.logout();
    setUserData({ email: '', firstName: '', lastName: '', gender: '', age: '', conditions: '' });
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        userData,
        authLoading,
        signup,
        loginWithCredentials,
        updateProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};