
'use client';

import type React from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { db, doc, getDoc, setDoc, updateDoc, serverTimestamp, auth, signOut, onAuthStateChanged, type FirebaseUserType } from '@/lib/firebase';
import { useRouter, usePathname } from 'next/navigation';

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
  <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm text-primary">
    <div className="flex flex-col items-center justify-center gap-6">
      {/* Logo */}
      <h1 className="text-5xl font-headline font-bold text-primary tracking-wider animate-pulse">
        BETBABU
      </h1>
      {/* Loading bar */}
      <div className="w-48 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="w-full h-full bg-primary animate-loading-bar"></div>
      </div>
    </div>
  </div>
);


const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUserType | null>(null);
  const [balance, setLocalBalance] = useState<number>(0);
  const [currency, setLocalCurrency] = useState<string>('USD'); // Default currency
  const [loadingAuth, setLoadingAuth] = useState(true);

  const router = useRouter();
  const pathname = usePathname();

  const fetchUserDocument = useCallback(async (uid: string): Promise<User | null> => {
    if (!uid) return null;
    const userDocRef = doc(db, "users", uid);
    try {
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const firestoreData = userDocSnap.data();

        if (!firestoreData.customUserId) {
          const newCustomUserId = Math.floor(100000000 + Math.random() * 900000000);
          await updateDoc(userDocRef, { customUserId: newCustomUserId });
          firestoreData.customUserId = newCustomUserId;
        }
        
        const ensuredRole = firestoreData.role || 'User';
        
        return {
          id: uid,
          ...firestoreData,
          customUserId: firestoreData.customUserId,
          currency: firestoreData.currency || 'USD',
          role: ensuredRole
        } as User;
      }
      return null;
    } catch (error) {
      console.error("AuthContext: Error fetching user document for UID " + uid + ":", error);
      throw error;
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setLoadingAuth(true); // Start loading on any auth change
      try {
        if (fbUser) {
          setFirebaseUser(fbUser);
          const firestoreUser = await fetchUserDocument(fbUser.uid);
          
          if (firestoreUser) {
            const finalUser = { ...firestoreUser, emailVerified: fbUser.emailVerified };
            if (finalUser.role === 'Admin' || fbUser.emailVerified) {
              setUser(finalUser);
              setLocalCurrency(finalUser.currency || 'USD');
              setLocalBalance(finalUser.balance || 0);
            } else {
              setUser(null); // Not an admin and email not verified
            }
          } else {
            setUser(null);
          }
        } else {
          setUser(null);
          setFirebaseUser(null);
        }
      } catch (error) {
        console.error("AuthContext: Error in onAuthStateChanged listener:", error);
        setUser(null);
        setFirebaseUser(null);
      } finally {
        setLoadingAuth(false);
      }
    });

    return () => unsubscribe();
  }, [fetchUserDocument]);


  useEffect(() => {
    if (loadingAuth) {
        return; // Wait until authentication state is determined
    }

    const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup');
    const isAdminPage = pathname.startsWith('/admin');
    const protectedRoutes = ['/profile', '/wallet', '/deposit', '/withdraw', '/bet-slip', '/user-dashboard', '/admin'];

    if (user) {
        // User is logged in
        if (user.role === 'Admin') {
            if (!isAdminPage) {
                router.push('/admin');
            }
        } else { // Regular user
            if (isAuthPage) {
                router.push('/');
            }
        }
    } else {
        // User is not logged in
        const isProtectedRoute = protectedRoutes.some(p => pathname.startsWith(p));
        if (isProtectedRoute) {
             router.push('/login');
        }
    }
  }, [user, loadingAuth, pathname, router]);

  const login = async (userDataFromAuth: { id: string; email?: string; phone?: string; name?: string; currency?: string; country?: string; emailVerified?: boolean, role?: 'Admin' | 'User' | 'Agent', customUserId?: number }, isNewUser: boolean = false): Promise<User | null> => {
    setLoadingAuth(true);
    try {
      let finalUserData: User | null = null;
      const uid = userDataFromAuth.id;
      const currentFbUser = auth.currentUser;

      const defaultCurrency = userDataFromAuth.currency || 'USD';
      const defaultRoleFromInput = userDataFromAuth.role;
      const defaultName = userDataFromAuth.name || currentFbUser?.displayName || (currentFbUser?.email ? currentFbUser.email.split('@')[0] : 'User');
      const defaultEmail = userDataFromAuth.email || currentFbUser?.email || '';
      const defaultPhone = userDataFromAuth.phone || currentFbUser?.phoneNumber || '';
      const emailVerifiedStatus = userDataFromAuth.emailVerified ?? currentFbUser?.emailVerified ?? false;

      if (isNewUser) {
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
          role: defaultRoleFromInput || 'User',
        };
        await setDoc(userDocRef, newUserDocData);
        finalUserData = {
          ...newUserDocData,
          id: uid,
          emailVerified: emailVerifiedStatus,
        };
      } else {
        let firestoreUser = await fetchUserDocument(uid);
        if (firestoreUser) {
          finalUserData = { ...firestoreUser, id: uid, emailVerified: emailVerifiedStatus };
        } else {
          const userDocRef = doc(db, "users", uid);
          const docDataToSet: Omit<User, 'id' | 'emailVerified' | 'avatarUrl' | 'isVerified'> & { createdAt: any, isVerified: boolean, role: 'Admin' | 'User' | 'Agent', currency: string, customUserId: number } = {
            customUserId: Math.floor(100000000 + Math.random() * 900000000),
            name: defaultName,
            email: defaultEmail,
            phone: defaultPhone,
            currency: defaultCurrency,
            country: userDataFromAuth.country || '',
            balance: 0,
            isVerified: false,
            createdAt: serverTimestamp(),
            role: defaultRoleFromInput || 'User',
          };
          await setDoc(userDocRef, docDataToSet);
          finalUserData = {
            ...docDataToSet,
            id: uid,
            emailVerified: emailVerifiedStatus,
          };
        }
      }

      // The onAuthStateChanged listener will handle setting the user state.
      // This function just ensures the Firestore doc is present.
      return finalUserData;

    } catch (error) {
      console.error("AuthContext: Error during app context login/signup for UID:", userDataFromAuth.id, error);
      // Let onAuthStateChanged handle clearing state.
      throw error;
    } finally {
      // Don't set loading to false here, let the listeners do it to prevent race conditions.
    }
  };

  const logout = async () => {
    setLoadingAuth(true);
    try {
      await signOut(auth);
      // State will be cleared by onAuthStateChanged
    } catch (error) {
      console.error("AuthContext: Firebase signOut error:", error);
      setUser(null);
      setFirebaseUser(null);
      setLoadingAuth(false);
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
