
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
  country?: string;
  balance?: number;
  createdAt?: any; // Firestore Timestamp
}

interface AuthContextType {
  user: User | null;
  login: (userData: User, isNewUser?: boolean) => Promise<void>;
  logout: () => void;
  balance: number;
  currency: string;
  setCurrency: (currency: string) => Promise<void>;
  updateBalance: (amount: number) => Promise<void>;
  loadingAuth: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [balance, setLocalBalance] = useState<number>(0);
  const [currency, setLocalCurrency] = useState<string>('USD');
  const [loadingAuth, setLoadingAuth] = useState(true);

  const fetchUserDocument = useCallback(async (uid: string): Promise<User | null> => {
    if (!uid) return null;
    const userDocRef = doc(db, "users", uid);
    try {
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        return { id: uid, ...userDocSnap.data() } as User;
      }
      console.warn("User document not found in Firestore for UID:", uid);
      return null;
    } catch (error) {
      console.error("Error fetching user document:", error);
      return null;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    setLoadingAuth(true);

    const performAuthCheck = async () => {
      try {
        const storedUserString = localStorage.getItem('betbabu-user');
        if (storedUserString) {
          const storedUserMinimal = JSON.parse(storedUserString) as { id: string, name?: string, email?: string, phone?: string, currency?: string };
          if (storedUserMinimal && storedUserMinimal.id) {
            const firestoreUser = await fetchUserDocument(storedUserMinimal.id);
            if (isMounted) {
              if (firestoreUser) {
                setUser(firestoreUser);
                setLocalCurrency(firestoreUser.currency || 'USD');
                setLocalBalance(firestoreUser.balance || 0);
              } else {
                // User in localStorage but not in Firestore or fetch failed
                localStorage.removeItem('betbabu-user');
                setUser(null);
                setLocalCurrency('USD');
                setLocalBalance(0);
              }
            }
          } else {
            // Invalid stored data
            if (isMounted) {
              localStorage.removeItem('betbabu-user');
              setUser(null);
              setLocalCurrency('USD');
              setLocalBalance(0);
            }
          }
        } else {
          // No user in localStorage
          if (isMounted) {
            setUser(null);
            setLocalCurrency('USD');
            setLocalBalance(0);
          }
        }
      } catch (error) {
        console.error("AuthContext initial check error:", error);
        if (isMounted) {
          localStorage.removeItem('betbabu-user');
          setUser(null);
          setLocalCurrency('USD');
          setLocalBalance(0);
        }
      } finally {
        if (isMounted) {
          setLoadingAuth(false);
        }
      }
    };

    performAuthCheck();

    return () => {
      isMounted = false;
    };
  }, [fetchUserDocument]);

  const login = async (userData: User, isNewUser: boolean = false) => {
    setLoadingAuth(true);
    try {
      let finalUserData: User | null = null;

      if (isNewUser) {
        const userDocRef = doc(db, "users", userData.id);
        const initialBalance = 0;
        const newUserDocData = {
          name: userData.name || '',
          email: userData.email || '',
          phone: userData.phone || '',
          currency: userData.currency,
          country: userData.country || '',
          balance: initialBalance,
          isVerified: false,
          createdAt: serverTimestamp(),
        };
        await setDoc(userDocRef, newUserDocData);
        finalUserData = { 
          ...userData, 
          ...newUserDocData,
          id: userData.id 
        };
      } else {
        const firestoreUser = await fetchUserDocument(userData.id);
        if (firestoreUser) {
          finalUserData = { ...firestoreUser, ...userData, id: firestoreUser.id }; // Prioritize Firestore, then allow userData to override (e.g. if local form data is more recent for non-auth fields)
        } else {
          console.error("Login failed: User document not found in Firestore for ID:", userData.id);
          throw new Error("User data not found. Please check your credentials or sign up.");
        }
      }
      
      if (finalUserData) {
        setUser(finalUserData);
        setLocalCurrency(finalUserData.currency);
        setLocalBalance(finalUserData.balance || 0);
        localStorage.setItem('betbabu-user', JSON.stringify({ 
          id: finalUserData.id, 
          name: finalUserData.name,
          email: finalUserData.email,
          phone: finalUserData.phone,
          currency: finalUserData.currency 
        }));
      } else {
         // Should not happen if logic above is correct, but as a safeguard:
        throw new Error("Failed to establish user session.");
      }

    } catch (error) {
      console.error("Error during login/signup in AuthContext:", error);
      setUser(null);
      setLocalBalance(0);
      setLocalCurrency('USD');
      localStorage.removeItem('betbabu-user');
      throw error; 
    } finally {
      setLoadingAuth(false);
    }
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
      const updatedUser = { ...user, currency: newCurrency };
      setUser(updatedUser);
      setLocalCurrency(newCurrency);
      const userDocRef = doc(db, "users", user.id);
      try {
        await updateDoc(userDocRef, { currency: newCurrency });
        localStorage.setItem('betbabu-user', JSON.stringify({ id: updatedUser.id, currency: updatedUser.currency, name: updatedUser.name, email: updatedUser.email, phone: updatedUser.phone }));
      } catch (error) {
        console.error("Failed to update currency in Firestore:", error);
      }
    }
  };
  
  const updateBalance = async (amountChange: number) => {
    if (user) {
      const newBalance = (balance || 0) + amountChange; // Use context balance directly
      const updatedUser = { ...user, balance: newBalance };
      setUser(updatedUser);
      setLocalBalance(newBalance);
      const userDocRef = doc(db, "users", user.id);
      try {
        await updateDoc(userDocRef, { balance: newBalance });
      } catch (error) {
        console.error("Failed to update balance in Firestore:", error);
      }
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

