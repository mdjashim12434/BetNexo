
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
  role?: 'Admin' | 'User' | 'Agent'; // Added role
}

interface AuthContextType {
  user: User | null;
  login: (userData: User, isNewUser?: boolean) => Promise<void>; // This is now primarily for Firestore and app state
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
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setLoadingAuth(true);
      if (fbUser) {
        setFirebaseUser(fbUser);
        if (fbUser.emailVerified) {
          const firestoreUser = await fetchUserDocument(fbUser.uid);
          if (firestoreUser) {
            setUser({ ...firestoreUser, emailVerified: fbUser.emailVerified });
            setLocalCurrency(firestoreUser.currency || 'USD');
            setLocalBalance(firestoreUser.balance || 0);
            localStorage.setItem('betbabu-user-uid', fbUser.uid); // Store only UID
          } else {
            // Firebase user exists but no Firestore doc (should ideally not happen if signup is correct)
            // Or if admin deleted Firestore doc. For now, treat as logged out from app perspective.
            console.warn("Firestore document missing for authenticated Firebase user:", fbUser.uid);
            setUser(null);
            setFirebaseUser(null);
            setLocalCurrency('USD');
            setLocalBalance(0);
            localStorage.removeItem('betbabu-user-uid');
          }
        } else {
          // Email not verified, don't fully log into app context
          setUser(null); 
          // firebaseUser is set, so login page can react if needed
          setLocalCurrency('USD');
          setLocalBalance(0);
          localStorage.removeItem('betbabu-user-uid');
           console.log("User email not verified, clearing app user state.");
        }
      } else {
        // No Firebase user
        setUser(null);
        setFirebaseUser(null);
        setLocalCurrency('USD');
        setLocalBalance(0);
        localStorage.removeItem('betbabu-user-uid');
      }
      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, [fetchUserDocument]);


  // This function is now primarily for setting up Firestore data and app state AFTER Firebase auth & email verification
  const login = async (userDataFromAuth: { id: string; email?: string; phone?: string; name?: string; currency: string; country?: string; emailVerified?: boolean, role?: 'Admin' | 'User' | 'Agent' }, isNewUser: boolean = false) => {
    setLoadingAuth(true);
    try {
      let finalUserData: User | null = null;
      const uid = userDataFromAuth.id;

      if (isNewUser) {
        const userDocRef = doc(db, "users", uid);
        const initialBalance = 0;
        const newUserDocData: Omit<User, 'id' | 'emailVerified' | 'avatarUrl' | 'isVerified'> & { createdAt: any, isVerified: boolean, role?: 'Admin' | 'User' | 'Agent' } = {
          name: userDataFromAuth.name || '',
          email: userDataFromAuth.email || '', // This should be the verified email
          phone: userDataFromAuth.phone || '',
          currency: userDataFromAuth.currency,
          country: userDataFromAuth.country || '',
          balance: initialBalance,
          isVerified: false, // Identity verification
          createdAt: serverTimestamp(),
          role: userDataFromAuth.role || 'User', // Default to User role
        };
        await setDoc(userDocRef, newUserDocData);
        finalUserData = { 
          ...newUserDocData,
          id: uid,
          emailVerified: userDataFromAuth.emailVerified, // Pass this through
        };
      } else {
        const firestoreUser = await fetchUserDocument(uid);
        if (firestoreUser) {
          finalUserData = { ...firestoreUser, id: uid, emailVerified: userDataFromAuth.emailVerified };
        } else {
          console.error("Login failed: User document not found in Firestore for UID:", uid);
          throw new Error("User data not found. Your account might not be fully set up or was removed.");
        }
      }
      
      if (finalUserData) {
        setUser(finalUserData);
        setLocalCurrency(finalUserData.currency);
        setLocalBalance(finalUserData.balance || 0);
        localStorage.setItem('betbabu-user-uid', uid);
      } else {
        throw new Error("Failed to establish user session in app context.");
      }

    } catch (error) {
      console.error("Error during app context login/signup:", error);
      setUser(null);
      setFirebaseUser(null); // Also clear firebaseUser if app login fails
      setLocalBalance(0);
      setLocalCurrency('USD');
      localStorage.removeItem('betbabu-user-uid');
      await signOut(auth).catch(e => console.error("Signout error during context login failure:", e)); // Attempt to sign out from Firebase too
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
    } finally {
      setUser(null);
      setFirebaseUser(null);
      setLocalBalance(0);
      setLocalCurrency('USD');
      localStorage.removeItem('betbabu-user-uid');
      setLoadingAuth(false); 
    }
  };

  const setCurrency = async (newCurrency: string) => {
    if (user) {
      const updatedUser = { ...user, currency: newCurrency };
      setUser(updatedUser); // Optimistic update
      setLocalCurrency(newCurrency);
      const userDocRef = doc(db, "users", user.id);
      try {
        await updateDoc(userDocRef, { currency: newCurrency });
        // No need to update localStorage here as it only stores UID
      } catch (error) {
        console.error("Failed to update currency in Firestore:", error);
        // Revert optimistic update if needed or show error
        setUser(user); 
        setLocalCurrency(user.currency);
      }
    }
  };
  
  const updateBalance = async (amountChange: number) => {
    if (user) {
      const newBalance = (user.balance || 0) + amountChange;
      setUser({ ...user, balance: newBalance }); // Optimistic update
      setLocalBalance(newBalance);
      const userDocRef = doc(db, "users", user.id);
      try {
        await updateDoc(userDocRef, { balance: newBalance });
      } catch (error) {
        console.error("Failed to update balance in Firestore:", error);
        // Revert optimistic update
        setUser(user);
        setLocalBalance(user.balance || 0);
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
