
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
    if (!uid) return null; // Prevent fetching with undefined/null uid
    const userDocRef = doc(db, "users", uid);
    try {
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        return { id: uid, ...userDocSnap.data() } as User;
      }
      return null;
    } catch (error) {
      console.error("Error fetching user document:", error);
      return null; // Return null on error to handle gracefully
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    setLoadingAuth(true);
    const storedUserString = localStorage.getItem('betbabu-user');

    const cleanup = () => {
      if (isMounted) {
        setUser(null);
        setLocalBalance(0);
        setLocalCurrency('USD');
        setLoadingAuth(false);
      }
    };

    if (storedUserString) {
      try {
        const storedUserMinimal = JSON.parse(storedUserString) as { id: string, name?: string, email?: string, phone?: string, currency?: string };
        if (storedUserMinimal && storedUserMinimal.id) {
          fetchUserDocument(storedUserMinimal.id).then(firestoreUser => {
            if (!isMounted) return;
            if (firestoreUser) {
              setUser(firestoreUser);
              setLocalCurrency(firestoreUser.currency || 'USD');
              setLocalBalance(firestoreUser.balance || 0);
            } else {
              // User in localStorage but not in Firestore
              localStorage.removeItem('betbabu-user');
              setUser(null);
            }
          }).catch(() => {
            // Error fetching document
            if (isMounted) {
              localStorage.removeItem('betbabu-user');
              setUser(null);
            }
          }).finally(() => {
            if (isMounted) setLoadingAuth(false);
          });
        } else {
          localStorage.removeItem('betbabu-user'); // Invalid stored data
          cleanup();
        }
      } catch (error) { // JSON.parse error or other
        localStorage.removeItem('betbabu-user');
        cleanup();
      }
    } else {
      // No user in localStorage
      cleanup();
    }
    return () => { isMounted = false; };
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
          // avatarUrl can be added later or taken from userData if provided
        };
        await setDoc(userDocRef, newUserDocData);
        // Construct finalUserData with the ID from userData and data written
        finalUserData = { 
          ...userData, // Contains id, and potentially name, email, phone if passed
          ...newUserDocData, // Contains fresh data like balance, isVerified, createdAt
          id: userData.id // Ensure the original ID is preserved
        };
      } else { // Existing user
        const firestoreUser = await fetchUserDocument(userData.id);
        if (firestoreUser) {
          // Merge incoming userData (e.g., from login form) with authoritative Firestore data
          finalUserData = { ...userData, ...firestoreUser, id: firestoreUser.id };
        } else {
          console.error("Login failed: User document not found in Firestore for ID:", userData.id);
          throw new Error("User data not found. Please check your credentials or sign up.");
        }
      }

      // If finalUserData is successfully determined (not null)
      setUser(finalUserData);
      setLocalCurrency(finalUserData!.currency);
      setLocalBalance(finalUserData!.balance || 0);
      // Store minimal, non-sensitive info for re-hydration hint
      localStorage.setItem('betbabu-user', JSON.stringify({ 
        id: finalUserData!.id, 
        name: finalUserData!.name,
        email: finalUserData!.email,
        phone: finalUserData!.phone,
        currency: finalUserData!.currency 
      }));

    } catch (error) {
      console.error("Error during login/signup:", error);
      setUser(null);
      setLocalBalance(0);
      setLocalCurrency('USD');
      localStorage.removeItem('betbabu-user');
      throw error; // Re-throw so the calling page (Login/Signup) can handle it (e.g., show toast)
    } finally {
      setLoadingAuth(false);
    }
  };

  const logout = () => {
    setUser(null);
    setLocalBalance(0);
    setLocalCurrency('USD');
    localStorage.removeItem('betbabu-user');
    setLoadingAuth(false); // Ensure loading is false on logout
  };

  const setCurrency = async (newCurrency: string) => {
    if (user) {
      // setLoadingAuth(true); // Optional: manage loading state for this specific action
      const updatedUser = { ...user, currency: newCurrency };
      setUser(updatedUser);
      setLocalCurrency(newCurrency);
      const userDocRef = doc(db, "users", user.id);
      try {
        await updateDoc(userDocRef, { currency: newCurrency });
        localStorage.setItem('betbabu-user', JSON.stringify({ id: updatedUser.id, currency: updatedUser.currency, name: updatedUser.name, email: updatedUser.email, phone: updatedUser.phone }));
      } catch (error) {
        console.error("Failed to update currency in Firestore:", error);
        // Optionally revert local state or notify user
      } finally {
        // setLoadingAuth(false);
      }
    }
  };
  
  const updateBalance = async (amountChange: number) => {
    if (user) {
      // setLoadingAuth(true); // Optional: manage loading state
      const newBalance = (user.balance || 0) + amountChange;
      const updatedUser = { ...user, balance: newBalance };
      setUser(updatedUser);
      setLocalBalance(newBalance);
      const userDocRef = doc(db, "users", user.id);
      try {
        await updateDoc(userDocRef, { balance: newBalance });
      } catch (error) {
        console.error("Failed to update balance in Firestore:", error);
        // Optionally revert local state or notify user
      } finally {
        // setLoadingAuth(false);
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
