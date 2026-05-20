import React, { createContext, useState } from 'react';

// ต้องมี export const ทั้งสองบรรทัดนี้
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    gender: '',
    age: '',
    conditions: ''
  });

  const login = (data) => {
    setUserData(data);
    setIsLoggedIn(true);
  };

  const logout = () => {
    setUserData({ firstName: '', lastName: '', gender: '', age: '', conditions: '' });
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, userData, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};