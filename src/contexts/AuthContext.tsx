
'use client';

import type React from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { db, doc, getDoc, setDoc, updateDoc, serverTimestamp, auth, signOut, onAuthStateChanged, type FirebaseUserType } from '@/lib/firebase';

export interface User {
  id: string; // Firebase UID
  customUserId?: number; // 9-digit user ID
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
  login: (userData: { id: string; email?: string; phone?: string; name?: string; currency?: string; country?: string; emailVerified?: boolean, role?: 'Admin' | 'User' | 'Agent', customUserId?: number }, isNewUser?: boolean) => Promise<User | null>;
  logout: () => Promise<void>;
  balance: number;
  currency: string;
  setCurrency: (currency: string) => Promise<void>;
  updateBalance: (amount: number) => Promise<void>;
  loadingAuth: boolean;
  firebaseUser: FirebaseUserType | null;
}

const GlobalLoader = () => (
  <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background text-primary">
    <div className="relative flex items-center justify-center">
      <div className="absolute h-24 w-24 animate-spin rounded-full border-4 border-dashed border-primary/50"></div>
      <div className="absolute h-32 w-32 animate-spin rounded-full border-4 border-dotted border-primary/50 [animation-delay:-0.2s]"></div>
      <h1 className="text-4xl font-headline font-bold tracking-wider text-primary">
        BETBABU
      </h1>
    </div>
    <p className="mt-4 text-sm text-muted-foreground animate-pulse">Loading Platform...</p>
  </div>
);

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

        // If user exists but doesn't have a customUserId, generate and save one.
        if (!firestoreData.customUserId) {
          const newCustomUserId = Math.floor(100000000 + Math.random() * 900000000);
          console.log(`AuthContext: User ${uid} is missing customUserId. Generating and saving new ID: ${newCustomUserId}`);
          await updateDoc(userDocRef, { customUserId: newCustomUserId });
          firestoreData.customUserId = newCustomUserId; // Update local data to avoid re-fetch
        }
        
        const ensuredRole = firestoreData.role || 'User'; // Default to 'User'
        
        console.log(`AuthContext: UID ${uid} - Firestore role found: '${firestoreData.role}', Final role set: '${ensuredRole}'`);
        
        return {
          id: uid,
          ...firestoreData,
          customUserId: firestoreData.customUserId,
          currency: firestoreData.currency || 'USD',
          role: ensuredRole
        } as User;
      }
      console.warn("AuthContext: User document not found in Firestore for UID:", uid);
      return null;
    } catch (error) {
      console.error("AuthContext: Error fetching user document for UID " + uid + ":", error);
      // Re-throw the error so the calling function can handle it, especially for permissions issues.
      throw error;
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      // Keep loadingAuth true initially. It will be set to false at the end.
      try {
        if (fbUser) {
          setFirebaseUser(fbUser);
          const firestoreUser = await fetchUserDocument(fbUser.uid);
          
          if (firestoreUser) {
            // Case 1: User is an Admin. Log them in regardless of email verification.
            if (firestoreUser.role === 'Admin') {
              setUser({ ...firestoreUser, emailVerified: fbUser.emailVerified });
              setLocalCurrency(firestoreUser.currency || 'USD');
              setLocalBalance(firestoreUser.balance || 0);
              localStorage.setItem('betbabu-user-uid', fbUser.uid);
              console.log("AuthContext: Admin user session SET for UID:", fbUser.uid, "Email verification status:", fbUser.emailVerified);
            } 
            // Case 2: User is NOT an Admin. They MUST have a verified email.
            else if (fbUser.emailVerified) {
              setUser({ ...firestoreUser, emailVerified: fbUser.emailVerified });
              setLocalCurrency(firestoreUser.currency || 'USD');
              setLocalBalance(firestoreUser.balance || 0);
              localStorage.setItem('betbabu-user-uid', fbUser.uid);
              console.log("AuthContext: Verified non-admin user session SET for UID:", fbUser.uid);
            }
            // Case 3: User is NOT an Admin and email is NOT verified. Do not log them in.
            else {
              setUser(null);
              localStorage.removeItem('betbabu-user-uid');
              console.log("AuthContext: Non-admin user email NOT verified. Session CLEARED for UID:", fbUser.uid);
            }
          } else {
            // No Firestore document, no session.
            setUser(null);
            localStorage.removeItem('betbabu-user-uid');
            console.warn("AuthContext: Firestore document MISSING for authenticated Firebase user:", fbUser.uid, "Session CLEARED.");
          }
        } else {
          // No Firebase user, no session.
          setUser(null);
          setFirebaseUser(null);
          localStorage.removeItem('betbabu-user-uid');
          console.log("AuthContext: No Firebase user. Session CLEARED.");
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

  const login = async (userDataFromAuth: { id: string; email?: string; phone?: string; name?: string; currency?: string; country?: string; emailVerified?: boolean, role?: 'Admin' | 'User' | 'Agent', customUserId?: number }, isNewUser: boolean = false): Promise<User | null> => {
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
        const newUserDocData: Omit<User, 'id' | 'emailVerified' | 'avatarUrl' | 'isVerified'> & { createdAt: any, isVerified: boolean, role: 'Admin' | 'User' | 'Agent', currency: string, customUserId: number } = {
          customUserId: userDataFromAuth.customUserId!,
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
          const docDataToSet: Omit<User, 'id' | 'emailVerified' | 'avatarUrl' | 'isVerified'> & { createdAt: any, isVerified: boolean, role: 'Admin' | 'User' | 'Agent', currency: string, customUserId: number } = {
            customUserId: Math.floor(100000000 + Math.random() * 900000000), // Fallback custom ID
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
        setLocalCurrency(finalUserData.currency || 'USD');
        setLocalBalance(finalUserData.balance || 0);
        
        // Let onAuthStateChanged handle localStorage based on its own logic (which now includes admin role check)
        // This keeps the logic consistent.
        
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

  if (loadingAuth) {
    return <GlobalLoader />;
  }

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
