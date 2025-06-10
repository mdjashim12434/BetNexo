
'use client';

import type React from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { db, doc, getDoc, setDoc, updateDoc, serverTimestamp } from '@/lib/firebase'; // Import Firestore functions

export interface User {
  id: string; // Firebase UID
  name?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  isVerified?: boolean;
  currency: string;
  country?: string; // Added country
  balance?: number; // Balance now primarily from Firestore
  createdAt?: any; // Firestore Timestamp
}

interface AuthContextType {
  user: User | null;
  login: (userData: User, isNewUser?: boolean) => Promise<void>; // Modified to be async and handle new user flag
  logout: () => void;
  balance: number; // Still kept for quick UI updates, but sourced from Firestore
  currency: string;
  setCurrency: (currency: string) => Promise<void>; // Made async
  updateBalance: (amount: number) => Promise<void>; // Made async to update Firestore
  loadingAuth: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [balance, setLocalBalance] = useState<number>(0);
  const [currency, setLocalCurrency] = useState<string>('USD');
  const [loadingAuth, setLoadingAuth] = useState(true);

  const fetchUserDocument = useCallback(async (uid: string): Promise<User | null> => {
    const userDocRef = doc(db, "users", uid);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      return { id: uid, ...userDocSnap.data() } as User;
    }
    return null;
  }, []);

  useEffect(() => {
    setLoadingAuth(true);
    const storedUserString = localStorage.getItem('betbabu-user');
    if (storedUserString) {
      const storedUser = JSON.parse(storedUserString) as User;
      fetchUserDocument(storedUser.id).then(firestoreUser => {
        if (firestoreUser) {
          setUser(firestoreUser);
          setLocalCurrency(firestoreUser.currency || 'USD');
          setLocalBalance(firestoreUser.balance || 0);
        } else {
          // User in localStorage but not in Firestore, treat as logged out or handle error
          localStorage.removeItem('betbabu-user');
          setUser(null);
        }
      }).catch(() => {
         localStorage.removeItem('betbabu-user');
         setUser(null);
      }).finally(() => {
        setLoadingAuth(false);
      });
    } else {
      setLoadingAuth(false);
    }
  }, [fetchUserDocument]);

  const login = async (userData: User, isNewUser: boolean = false) => {
    setLoadingAuth(true);
    let fullUserData = { ...userData };

    if (isNewUser) {
      const userDocRef = doc(db, "users", userData.id);
      const initialBalance = 0; // New users start with 0 balance
      const newUserDoc = {
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        currency: userData.currency,
        country: userData.country || '',
        balance: initialBalance,
        isVerified: false,
        createdAt: serverTimestamp(),
      };
      await setDoc(userDocRef, newUserDoc);
      fullUserData = { ...userData, ...newUserDoc, balance: initialBalance, isVerified: false };
    } else {
      const firestoreUser = await fetchUserDocument(userData.id);
      if (firestoreUser) {
        fullUserData = { ...userData, ...firestoreUser };
      } else {
         // This case should ideally not happen if signup creates the doc
         // For safety, we could create it here too or throw an error
         console.error("User document not found for existing user:", userData.id);
         setLoadingAuth(false);
         return;
      }
    }
    
    setUser(fullUserData);
    setLocalCurrency(fullUserData.currency);
    setLocalBalance(fullUserData.balance || 0);
    localStorage.setItem('betbabu-user', JSON.stringify({ id: fullUserData.id, currency: fullUserData.currency, name: fullUserData.name, email: fullUserData.email, phone: fullUserData.phone })); // Store minimal info
    setLoadingAuth(false);
  };

  const logout = () => {
    setUser(null);
    setLocalBalance(0);
    setLocalCurrency('USD');
    localStorage.removeItem('betbabu-user');
    setLoadingAuth(false);
  };

  const setCurrency = async (newCurrency: string) => {
    if (user) {
      setLoadingAuth(true);
      const updatedUser = { ...user, currency: newCurrency };
      setUser(updatedUser);
      setLocalCurrency(newCurrency);
      const userDocRef = doc(db, "users", user.id);
      await updateDoc(userDocRef, { currency: newCurrency });
      localStorage.setItem('betbabu-user', JSON.stringify({ id: updatedUser.id, currency: updatedUser.currency, name: updatedUser.name, email: updatedUser.email, phone: updatedUser.phone }));
      setLoadingAuth(false);
    }
  };
  
  const updateBalance = async (amountChange: number) => {
    if (user) {
      setLoadingAuth(true);
      const newBalance = (user.balance || 0) + amountChange;
      const updatedUser = { ...user, balance: newBalance };
      setUser(updatedUser);
      setLocalBalance(newBalance);
      const userDocRef = doc(db, "users", user.id);
      await updateDoc(userDocRef, { balance: newBalance });
      setLoadingAuth(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, balance, currency, setCurrency, updateBalance, loadingAuth }}>
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
