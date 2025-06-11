
'use client';

import type React from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { db, doc, getDoc, setDoc, updateDoc, serverTimestamp, auth, signOut, onAuthStateChanged, type FirebaseUserType } from '@/lib/firebase';

export interface User {
  id: string; // Firebase UID
  name?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  isVerified?: boolean; // This is for identity verification (e.g., ID upload)
  emailVerified?: boolean; // From Firebase Auth
  currency: string;
  country?: string;
  balance?: number;
  createdAt?: any; // Firestore Timestamp
  role?: 'Admin' | 'User' | 'Agent';
}

interface AuthContextType {
  user: User | null;
  login: (userData: { id: string; email?: string; phone?: string; name?: string; currency?: string; country?: string; emailVerified?: boolean, role?: 'Admin' | 'User' | 'Agent' }, isNewUser?: boolean) => Promise<User | null>;
  logout: () => Promise<void>;
  balance: number;
  currency: string;
  setCurrency: (currency: string) => Promise<void>;
  updateBalance: (amount: number) => Promise<void>;
  loadingAuth: boolean;
  firebaseUser: FirebaseUserType | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUserType | null>(null);
  const [balance, setLocalBalance] = useState<number>(0);
  const [currency, setLocalCurrency] = useState<string>('USD'); // Default currency
  const [loadingAuth, setLoadingAuth] = useState(true);

  const fetchUserDocument = useCallback(async (uid: string): Promise<User | null> => {
    if (!uid) return null;
    const userDocRef = doc(db, "users", uid);
    try {
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const firestoreData = userDocSnap.data();
        const ensuredCurrency = firestoreData.currency || 'USD';
        const ensuredRole = firestoreData.role || 'User';
        return { 
          id: uid, 
          ...firestoreData, 
          currency: ensuredCurrency, 
          role: ensuredRole 
        } as User;
      }
      console.warn("User document not found in Firestore for UID:", uid);
      return null;
    } catch (error) {
      console.error("Error fetching user document:", error);
      return null;
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setLoadingAuth(true); 
      try {
        if (fbUser) {
          setFirebaseUser(fbUser);
          if (fbUser.emailVerified) { 
            const firestoreUser = await fetchUserDocument(fbUser.uid);
            if (firestoreUser) {
              setUser({ ...firestoreUser, emailVerified: fbUser.emailVerified });
              setLocalCurrency(firestoreUser.currency); 
              setLocalBalance(firestoreUser.balance || 0);
              localStorage.setItem('betbabu-user-uid', fbUser.uid); 
            } else {
              console.warn("AuthContext: Firestore document missing for authenticated and verified Firebase user:", fbUser.uid, "User might need to complete signup or document was removed.");
              setUser(null); 
              localStorage.removeItem('betbabu-user-uid');
            }
          } else {
            setUser(null); 
            localStorage.removeItem('betbabu-user-uid');
            console.log("AuthContext: User email not verified, app user state cleared.");
          }
        } else {
          setUser(null);
          setFirebaseUser(null);
          localStorage.removeItem('betbabu-user-uid');
        }
      } catch (error) {
        console.error("Error in onAuthStateChanged listener:", error);
        setUser(null); 
        setFirebaseUser(null);
        localStorage.removeItem('betbabu-user-uid');
      } finally {
        setLoadingAuth(false);
      }
    });

    return () => unsubscribe();
  }, [fetchUserDocument]);

  const login = async (userDataFromAuth: { id: string; email?: string; phone?: string; name?: string; currency?: string; country?: string; emailVerified?: boolean, role?: 'Admin' | 'User' | 'Agent' }, isNewUser: boolean = false): Promise<User | null> => {
    setLoadingAuth(true);
    try {
      let finalUserData: User | null = null;
      const uid = userDataFromAuth.id;
      const currentFbUser = auth.currentUser; // Get current Firebase user for potential prefill

      // Determine defaults carefully based on what's passed and what's in Firebase Auth
      const defaultCurrency = userDataFromAuth.currency || 'USD';
      const defaultRole = userDataFromAuth.role || 'User';
      const defaultName = userDataFromAuth.name || currentFbUser?.displayName || (currentFbUser?.email ? currentFbUser.email.split('@')[0] : 'User');
      const defaultEmail = userDataFromAuth.email || currentFbUser?.email || '';
      const defaultPhone = userDataFromAuth.phone || currentFbUser?.phoneNumber || '';
      
      let firestoreUser: User | null = null;

      if (isNewUser) {
        const userDocRef = doc(db, "users", uid);
        const initialBalance = 0;
        const newUserDocData: Omit<User, 'id' | 'emailVerified' | 'avatarUrl' | 'isVerified'> & { createdAt: any, isVerified: boolean, role: 'Admin' | 'User' | 'Agent', currency: string } = {
          name: defaultName,
          email: defaultEmail, 
          phone: defaultPhone,
          currency: defaultCurrency,
          country: userDataFromAuth.country || '',
          balance: initialBalance,
          isVerified: false, 
          createdAt: serverTimestamp(),
          role: defaultRole, 
        };
        await setDoc(userDocRef, newUserDocData);
        finalUserData = { 
          ...newUserDocData,
          id: uid,
          emailVerified: userDataFromAuth.emailVerified ?? currentFbUser?.emailVerified ?? false, 
        };
      } else {
        firestoreUser = await fetchUserDocument(uid);
        if (firestoreUser) {
          finalUserData = { ...firestoreUser, id: uid, emailVerified: userDataFromAuth.emailVerified ?? currentFbUser?.emailVerified ?? firestoreUser.emailVerified ?? false };
        } else {
          // Firestore document doesn't exist, but Firebase user does (isNewUser is false). Create it.
          console.warn(`AuthContext login: Firestore document not found for existing Firebase user ${uid}. Creating one.`);
          const userDocRef = doc(db, "users", uid);
          const docDataToSet: Omit<User, 'id' | 'emailVerified' | 'avatarUrl' | 'isVerified'> & { createdAt: any, isVerified: boolean, role: 'Admin' | 'User' | 'Agent', currency: string } = {
            name: defaultName,
            email: defaultEmail,
            phone: defaultPhone,
            currency: defaultCurrency,
            country: userDataFromAuth.country || '',
            balance: 0,
            isVerified: false,
            createdAt: serverTimestamp(),
            role: defaultRole,
          };
          await setDoc(userDocRef, docDataToSet);
          finalUserData = {
            ...docDataToSet,
            id: uid,
            emailVerified: userDataFromAuth.emailVerified ?? currentFbUser?.emailVerified ?? false,
          };
        }
      }
      
      if (finalUserData) {
        setUser(finalUserData);
        setLocalCurrency(finalUserData.currency); 
        setLocalBalance(finalUserData.balance || 0);
        localStorage.setItem('betbabu-user-uid', uid);
        return finalUserData;
      } else {
        throw new Error("Failed to establish user session in app context.");
      }

    } catch (error) {
      console.error("Error during app context login/signup:", error);
      setUser(null);
      setLocalBalance(0);
      setLocalCurrency('USD');
      localStorage.removeItem('betbabu-user-uid');
      throw error; 
    } finally {
      setLoadingAuth(false);
    }
  };

  const logout = async () => {
    setLoadingAuth(true);
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Firebase signOut error:", error);
      setUser(null);
      setFirebaseUser(null);
      setLocalBalance(0);
      setLocalCurrency('USD');
      localStorage.removeItem('betbabu-user-uid');
    } finally {
      // onAuthStateChanged will handle resetting state, so setLoadingAuth(false) there is key.
      // However, if signOut itself has an error before onAuthStateChanged fires,
      // we might need to ensure loadingAuth is false.
      // For now, let onAuthStateChanged handle it to avoid race conditions.
    }
  };

  const setCurrency = async (newCurrency: string) => {
    if (user) {
      const originalUserCurrency = user.currency; 
      const updatedUser = { ...user, currency: newCurrency };
      setUser(updatedUser); 
      setLocalCurrency(newCurrency);
      const userDocRef = doc(db, "users", user.id);
      try {
        await updateDoc(userDocRef, { currency: newCurrency });
      } catch (error) {
        console.error("Failed to update currency in Firestore:", error);
        setUser({ ...user, currency: originalUserCurrency }); 
        setLocalCurrency(originalUserCurrency);
      }
    }
  };
  
  const updateBalance = async (amountChange: number) => {
    if (user) {
      const currentBalance = user.balance || 0;
      const newBalance = currentBalance + amountChange;
      const originalUserBalance = user.balance; 

      setUser({ ...user, balance: newBalance }); 
      setLocalBalance(newBalance);
      const userDocRef = doc(db, "users", user.id);
      try {
        await updateDoc(userDocRef, { balance: newBalance });
      } catch (error) {
        console.error("Failed to update balance in Firestore:", error);
        setUser({ ...user, balance: originalUserBalance });
        setLocalBalance(originalUserBalance || 0);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, login, logout, balance, currency, setCurrency, updateBalance, loadingAuth }}>
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
