
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
  login: (userData: { id: string; email?: string; phone?: string; name?: string; currency: string; country?: string; emailVerified?: boolean, role?: 'Admin' | 'User' | 'Agent' }, isNewUser?: boolean) => Promise<User | null>;
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
        // Ensure currency and role have default values if missing
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
              // fetchUserDocument now ensures currency and role defaults
              setUser({ ...firestoreUser, emailVerified: fbUser.emailVerified });
              setLocalCurrency(firestoreUser.currency); // Already ensured by fetchUserDocument
              setLocalBalance(firestoreUser.balance || 0);
              localStorage.setItem('betbabu-user-uid', fbUser.uid); 
            } else {
              console.warn("Firestore document missing for authenticated Firebase user:", fbUser.uid, "User might need to complete signup or document was removed.");
              // Consider creating a minimal user doc here if appropriate for your app flow,
              // or guide user to signup completion. For now, clearing session.
              setUser(null);
              localStorage.removeItem('betbabu-user-uid');
            }
          } else {
            setUser(null); 
            localStorage.removeItem('betbabu-user-uid');
            console.log("User email not verified, clearing app user state but retaining Firebase user for potential actions.");
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

  const login = async (userDataFromAuth: { id: string; email?: string; phone?: string; name?: string; currency: string; country?: string; emailVerified?: boolean, role?: 'Admin' | 'User' | 'Agent' }, isNewUser: boolean = false): Promise<User | null> => {
    setLoadingAuth(true);
    try {
      let finalUserData: User | null = null;
      const uid = userDataFromAuth.id;
      const defaultCurrency = userDataFromAuth.currency || 'USD';
      const defaultRole = userDataFromAuth.role || 'User';

      if (isNewUser) {
        const userDocRef = doc(db, "users", uid);
        const initialBalance = 0;
        const newUserDocData: Omit<User, 'id' | 'emailVerified' | 'avatarUrl' | 'isVerified'> & { createdAt: any, isVerified: boolean, role: 'Admin' | 'User' | 'Agent', currency: string } = {
          name: userDataFromAuth.name || '',
          email: userDataFromAuth.email || '', 
          phone: userDataFromAuth.phone || '',
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
          emailVerified: userDataFromAuth.emailVerified, 
        };
      } else {
        const firestoreUser = await fetchUserDocument(uid); // fetchUserDocument ensures defaults
        if (firestoreUser) {
          finalUserData = { ...firestoreUser, id: uid, emailVerified: userDataFromAuth.emailVerified };
        } else {
          console.error("Login failed: User document not found in Firestore for UID:", uid);
          throw new Error("User data not found. Your account might not be fully set up or was removed.");
        }
      }
      
      if (finalUserData) {
        setUser(finalUserData); // finalUserData already has ensured currency and role
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
      // setUser, setFirebaseUser, etc. are handled by onAuthStateChanged
    } catch (error) {
      console.error("Firebase signOut error:", error);
      // Fallback state cleanup if onAuthStateChanged doesn't fire or has issues
      setUser(null);
      setFirebaseUser(null);
      setLocalBalance(0);
      setLocalCurrency('USD');
      localStorage.removeItem('betbabu-user-uid');
    } finally {
      setLoadingAuth(false); 
    }
  };

  const setCurrency = async (newCurrency: string) => {
    if (user) {
      const originalUserCurrency = user.currency; // Store original currency for revert
      const updatedUser = { ...user, currency: newCurrency };
      setUser(updatedUser); 
      setLocalCurrency(newCurrency);
      const userDocRef = doc(db, "users", user.id);
      try {
        await updateDoc(userDocRef, { currency: newCurrency });
      } catch (error) {
        console.error("Failed to update currency in Firestore:", error);
        // Revert optimistic update if Firestore fails
        setUser({ ...user, currency: originalUserCurrency }); 
        setLocalCurrency(originalUserCurrency);
      }
    }
  };
  
  const updateBalance = async (amountChange: number) => {
    if (user) {
      const currentBalance = user.balance || 0;
      const newBalance = currentBalance + amountChange;
      const originalUserBalance = user.balance; // For potential revert

      setUser({ ...user, balance: newBalance }); 
      setLocalBalance(newBalance);
      const userDocRef = doc(db, "users", user.id);
      try {
        await updateDoc(userDocRef, { balance: newBalance });
      } catch (error) {
        console.error("Failed to update balance in Firestore:", error);
        // Revert optimistic update
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

    