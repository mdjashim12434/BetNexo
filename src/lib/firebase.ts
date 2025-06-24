// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendEmailVerification, 
  onAuthStateChanged, 
  signOut, 
  type User as FirebaseUserType 
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp, 
  collection, 
  query, 
  where, 
  orderBy, 
  addDoc, 
  deleteDoc, 
  getDocs, 
  limit, 
  startAfter, 
  Timestamp,
  type QueryDocumentSnapshot 
} from 'firebase/firestore';
import { getAnalytics, isSupported } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAAeONCc7rsrvOwlbxmHjxf-qUw3O1v9QY",
  authDomain: "summer-function-461109-t2.firebaseapp.com",
  projectId: "summer-function-461109-t2",
  storageBucket: "summer-function-461109-t2.firebasestorage.app",
  messagingSenderId: "404019274818",
  appId: "1:404019274818:web:e765b67dfb7710d4be79db",
  measurementId: "G-8FH69DQ5Q9"
};

// Initialize Firebase safely for both server and client
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

// Initialize Analytics if supported (client-side)
const analytics = isSupported().then(yes => yes ? getAnalytics(app) : null);

// Helper function to update user balance - important for transactions
const updateUserBalanceInFirestore = async (userId: string, amountChange: number) => {
    const userDocRef = doc(db, "users", userId);
    try {
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
            const currentBalance = userDocSnap.data().balance || 0;
            const newBalance = currentBalance + amountChange;
            await updateDoc(userDocRef, { balance: newBalance });
            console.log(`Balance for user ${userId} updated by ${amountChange}. New balance: ${newBalance}`);
        } else {
            console.error(`User document with ID ${userId} not found. Cannot update balance.`);
            throw new Error(`User with ID ${userId} not found.`);
        }
    } catch (error) {
        console.error(`Failed to update balance for user ${userId}:`, error);
        throw error;
    }
};

// Re-exporting everything for use in other parts of the app
export {
  app,
  auth,
  db,
  analytics,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  onAuthStateChanged,
  signOut,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  collection,
  query,
  where,
  orderBy,
  addDoc,
  deleteDoc,
  getDocs,
  limit,
  startAfter,
  updateUserBalanceInFirestore,
  Timestamp,
  type FirebaseUserType,
  type QueryDocumentSnapshot,
};
