
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore, collection, doc, setDoc, getDoc, serverTimestamp, updateDoc, addDoc, query, where, getDocs, orderBy, Timestamp, runTransaction, limit, startAfter, type QueryDocumentSnapshot } from "firebase/firestore"; // Added limit, startAfter, QueryDocumentSnapshot
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, signOut, onAuthStateChanged, type User as FirebaseUserType } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCZvkhsQfHWujjMipHAyWB4SpRwU-AZYb0",
  authDomain: "betbabu-5e02b.firebaseapp.com",
  projectId: "betbabu-5e02b",
  storageBucket: "betbabu-5e02b.firebasestorage.app",
  messagingSenderId: "99347182224",
  appId: "1:99347182224:web:089e71e13f87887c511e15",
  measurementId: "G-8HD0X351BK"
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

let analytics;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

const db = getFirestore(app);
const auth = getAuth(app);

// Function to update user balance in Firestore
const updateUserBalanceInFirestore = async (userId: string, amountChange: number): Promise<void> => {
  const userDocRef = doc(db, "users", userId);
  try {
    await runTransaction(db, async (transaction) => {
      const userDoc = await transaction.get(userDocRef);
      if (!userDoc.exists()) {
        throw new Error("User document does not exist!");
      }
      const currentBalance = userDoc.data().balance || 0;
      const newBalance = currentBalance + amountChange;
      if (newBalance < 0) {
        throw new Error("Insufficient balance for this operation.");
      }
      transaction.update(userDocRef, { balance: newBalance });
    });
  } catch (error) {
    console.error("Error updating user balance in Firestore transaction:", error);
    throw error; // Re-throw to be handled by caller
  }
};


export { app, auth, analytics, db, collection, doc, setDoc, getDoc, serverTimestamp, updateDoc, addDoc, query, where, getDocs, orderBy, Timestamp, runTransaction, updateUserBalanceInFirestore, firebaseConfig, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, signOut, onAuthStateChanged, type FirebaseUserType, limit, startAfter, type QueryDocumentSnapshot }; // Added limit, startAfter, QueryDocumentSnapshot

