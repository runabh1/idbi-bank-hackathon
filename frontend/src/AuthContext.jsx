import React, { createContext, useContext, useState, useEffect } from 'react';
import api from './api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('creditpulse_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      return null;
    }
  });

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('creditpulse_user', JSON.stringify(userData));
  };

  const logout = async () => {
    if (user && user.is_session_user) {
      try {
        await api.delete(`/auth/session-user/${user.id}`);
      } catch (err) {
        console.error("Failed to delete session user:", err);
      }
    }
    setUser(null);
    localStorage.removeItem('creditpulse_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
