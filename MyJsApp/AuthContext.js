import React, { createContext, useState, useEffect } from 'react';
import * as AuthStorage from './utils/authStorage';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn]   = useState(false);
  const [userData, setUserData]       = useState({
    email: '', firstName: '', lastName: '', gender: '', age: '', conditions: '',
  });
  const [authLoading, setAuthLoading] = useState(true);

  // auto-login ตอนเปิดแอป
  useEffect(() => {
    (async () => {
      const session = await AuthStorage.getCurrentSession();
      if (session) {
        setUserData(normalizeUser(session));
        setIsLoggedIn(true);
      }
      setAuthLoading(false);
    })();
  }, []);

  function normalizeUser(u) {
    return {
      email:      u.email      ?? '',
      firstName:  u.firstName  ?? u.first_name  ?? '',
      lastName:   u.lastName   ?? u.last_name   ?? '',
      gender:     u.gender     ?? '',
      age:        u.age        ?? '',
      conditions: u.conditions ?? '',
    };
  }

  const signup = async (formData) => {
    const result = await AuthStorage.signUp(formData);
    if (result.success) {
      setUserData(normalizeUser(result.user));
      setIsLoggedIn(true);
    }
    return result;
  };

  const loginWithCredentials = async (email, password) => {
    const result = await AuthStorage.login({ email, password });
    if (result.success) {
      setUserData(normalizeUser(result.user));
      setIsLoggedIn(true);
    }
    return result;
  };

  const updateProfile = async (updates) => {
    if (!userData.email) return { success: false, error: 'ยังไม่ได้เข้าสู่ระบบ' };
    const result = await AuthStorage.updateProfile(userData.email, updates);
    if (result.success) {
      setUserData(normalizeUser(result.user));
    }
    return result;
  };

  const logout = async () => {
    await AuthStorage.logout();
    setUserData({ email: '', firstName: '', lastName: '', gender: '', age: '', conditions: '' });
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider value={{
      isLoggedIn, userData, authLoading,
      signup, loginWithCredentials, updateProfile, logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
};