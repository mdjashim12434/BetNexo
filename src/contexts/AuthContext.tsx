'use client';

import type React from 'react';
import { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  isVerified?: boolean;
  currency: string;
}

interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  balance: number;
  currency: string;
  setCurrency: (currency: string) => void;
  updateBalance: (amount: number) => void; // For mock updates
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [balance, setBalance] = useState<number>(0); // Mock balance
  const [currency, setStoredCurrency] = useState<string>('USD'); // Default currency

  useEffect(() => {
    // Mock: try to load user from localStorage (e.g., after a page refresh)
    const storedUser = localStorage.getItem('betbabu-user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser) as User;
      setUser(parsedUser);
      setStoredCurrency(parsedUser.currency);
      // Mock: load balance for this user
      setBalance(parseFloat(localStorage.getItem(`betbabu-balance-${parsedUser.id}`) || '1000.00'));
    }
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    setStoredCurrency(userData.currency);
    localStorage.setItem('betbabu-user', JSON.stringify(userData));
    // Mock balance for new user
    const newBalance = 1000.00;
    setBalance(newBalance);
    localStorage.setItem(`betbabu-balance-${userData.id}`, newBalance.toString());
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('betbabu-user');
    // Optionally clear balance from local storage too
    if (user) {
      localStorage.removeItem(`betbabu-balance-${user.id}`);
    }
    setBalance(0);
  };

  const setCurrency = (newCurrency: string) => {
    setStoredCurrency(newCurrency);
    if (user) {
      const updatedUser = { ...user, currency: newCurrency };
      setUser(updatedUser);
      localStorage.setItem('betbabu-user', JSON.stringify(updatedUser));
    }
  };
  
  const updateBalance = (amount: number) => {
    // This is a mock update function
    setBalance(prev => {
      const newBalance = prev + amount;
      if (user) {
        localStorage.setItem(`betbabu-balance-${user.id}`, newBalance.toString());
      }
      return newBalance;
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, balance, currency, setCurrency, updateBalance }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
