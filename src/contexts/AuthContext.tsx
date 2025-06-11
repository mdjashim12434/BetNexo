
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
        console.log(`AuthContext: Fetched Firestore data for UID ${uid}:`, JSON.parse(JSON.stringify(firestoreData || {}))); // Log raw data safely
        const ensuredCurrency = firestoreData.currency || 'USD';
        const ensuredRole = firestoreData.role || 'User'; // Default to 'User' if role is missing
        console.log(`AuthContext: UID ${uid} - Firestore role found: '${firestoreData.role}', Ensured/Defaulted role: '${ensuredRole}'`);
        return {
          id: uid,
          ...firestoreData,
          currency: ensuredCurrency,
          role: ensuredRole
        } as User;
      }
      console.warn("AuthContext: User document not found in Firestore for UID:", uid);
      return null;
    } catch (error) {
      console.error("AuthContext: Error fetching user document for UID " + uid + ":", error);
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
            console.log("AuthContext: Firebase user email IS verified for UID:", fbUser.uid);
            const firestoreUser = await fetchUserDocument(fbUser.uid);
            if (firestoreUser) {
              setUser({ ...firestoreUser, emailVerified: fbUser.emailVerified });
              setLocalCurrency(firestoreUser.currency || 'USD'); // Ensure currency has a fallback
              setLocalBalance(firestoreUser.balance || 0);
              localStorage.setItem('betbabu-user-uid', fbUser.uid);
              console.log("AuthContext: App user state SET for verified user:", {...firestoreUser, emailVerified: fbUser.emailVerified});
            } else {
              console.warn("AuthContext: Firestore document MISSING for authenticated and verified Firebase user:", fbUser.uid, "User might need to complete signup or document was removed. App user state CLEARED.");
              setUser(null);
              localStorage.removeItem('betbabu-user-uid');
            }
          } else {
            console.log("AuthContext: Firebase user email NOT verified for UID:", fbUser.uid, "App user state CLEARED.");
            setUser(null);
            localStorage.removeItem('betbabu-user-uid');
          }
        } else {
          console.log("AuthContext: No Firebase user. App user state CLEARED.");
          setUser(null);
          setFirebaseUser(null);
          localStorage.removeItem('betbabu-user-uid');
        }
      } catch (error) {
        console.error("AuthContext: Error in onAuthStateChanged listener:", error);
        setUser(null);
        setFirebaseUser(null);
        localStorage.removeItem('betbabu-user-uid');
      } finally {
        setLoadingAuth(false);
        console.log("AuthContext: onAuthStateChanged finished, loadingAuth set to false.");
      }
    });

    return () => unsubscribe();
  }, [fetchUserDocument]);

  const login = async (userDataFromAuth: { id: string; email?: string; phone?: string; name?: string; currency?: string; country?: string; emailVerified?: boolean, role?: 'Admin' | 'User' | 'Agent' }, isNewUser: boolean = false): Promise<User | null> => {
    setLoadingAuth(true);
    console.log("AuthContext: Login function called. isNewUser:", isNewUser, "UID:", userDataFromAuth.id);
    try {
      let finalUserData: User | null = null;
      const uid = userDataFromAuth.id;
      const currentFbUser = auth.currentUser;

      const defaultCurrency = userDataFromAuth.currency || 'USD';
      const defaultRoleFromInput = userDataFromAuth.role; // Might be undefined
      const defaultName = userDataFromAuth.name || currentFbUser?.displayName || (currentFbUser?.email ? currentFbUser.email.split('@')[0] : 'User');
      const defaultEmail = userDataFromAuth.email || currentFbUser?.email || '';
      const defaultPhone = userDataFromAuth.phone || currentFbUser?.phoneNumber || '';
      const emailVerifiedStatus = userDataFromAuth.emailVerified ?? currentFbUser?.emailVerified ?? false;

      if (isNewUser) {
        console.log("AuthContext: Handling as NEW user for UID:", uid);
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
          role: defaultRoleFromInput || 'User', // If role provided in signup, use it, else 'User'
        };
        await setDoc(userDocRef, newUserDocData);
        console.log("AuthContext: NEW user document created in Firestore for UID:", uid, "with role:", newUserDocData.role);
        finalUserData = {
          ...newUserDocData,
          id: uid,
          emailVerified: emailVerifiedStatus,
        };
      } else {
        console.log("AuthContext: Handling as EXISTING user for UID:", uid);
        let firestoreUser = await fetchUserDocument(uid);
        if (firestoreUser) {
           console.log("AuthContext: Existing user document FOUND in Firestore for UID:", uid, "Fetched role:", firestoreUser.role);
          finalUserData = { ...firestoreUser, id: uid, emailVerified: emailVerifiedStatus };
        } else {
          console.warn(`AuthContext login: Firestore document NOT FOUND for existing Firebase user ${uid}. Creating one with defaults.`);
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
            role: defaultRoleFromInput || 'User', // For an existing Firebase user without Firestore doc, default to 'User' unless a role is passed (unlikely for login)
          };
          await setDoc(userDocRef, docDataToSet);
          console.log("AuthContext: Firestore document CREATED for existing Firebase user UID:", uid, "with role:", docDataToSet.role);
          finalUserData = {
            ...docDataToSet,
            id: uid,
            emailVerified: emailVerifiedStatus,
          };
        }
      }

      if (finalUserData) {
        // Ensure role in finalUserData is what was intended (especially from Firestore or new user creation)
        console.log("AuthContext: Final user data for app state:", finalUserData);
        if (!emailVerifiedStatus && finalUserData.role === 'Admin') {
            console.warn(`AuthContext: Admin user ${uid} email is not verified. They might not be able to access admin functionalities until email is verified.`);
        }

        setUser(finalUserData);
        setLocalCurrency(finalUserData.currency);
        setLocalBalance(finalUserData.balance || 0);
        if(emailVerifiedStatus) { // Only set in localStorage if email is verified to align with onAuthStateChanged logic
            localStorage.setItem('betbabu-user-uid', uid);
        } else {
            localStorage.removeItem('betbabu-user-uid');
        }
        console.log("AuthContext: App user state updated after login function for UID:", uid, "Role:", finalUserData.role, "EmailVerified:", emailVerifiedStatus);
        return finalUserData;
      } else {
        console.error("AuthContext: Login function - finalUserData is null, failed to establish user session. UID:", uid);
        throw new Error("Failed to establish user session in app context.");
      }

    } catch (error) {
      console.error("AuthContext: Error during app context login/signup for UID:", userDataFromAuth.id, error);
      setUser(null);
      setLocalBalance(0);
      setLocalCurrency('USD');
      localStorage.removeItem('betbabu-user-uid');
      throw error;
    } finally {
      setLoadingAuth(false);
      console.log("AuthContext: Login function finished, loadingAuth set to false for UID:", userDataFromAuth.id);
    }
  };

  const logout = async () => {
    setLoadingAuth(true);
    console.log("AuthContext: Logout function called.");
    try {
      await signOut(auth);
      // State will be cleared by onAuthStateChanged
    } catch (error) {
      console.error("AuthContext: Firebase signOut error:", error);
      // Force clear state if signOut fails before onAuthStateChanged can react
      setUser(null);
      setFirebaseUser(null);
      setLocalBalance(0);
      setLocalCurrency('USD');
      localStorage.removeItem('betbabu-user-uid');
      setLoadingAuth(false); // Ensure loading is false if error occurs here
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

