
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore, collection, doc, setDoc, getDoc, serverTimestamp, updateDoc, addDoc, query, where, getDocs, orderBy, Timestamp, runTransaction, limit, startAfter, type QueryDocumentSnapshot, deleteDoc } from "firebase/firestore"; // Added deleteDoc
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, signOut, onAuthStateChanged, type User as FirebaseUserType } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDKGnwFB_t8avhuoDBubBgR0BqVyXz1soc",
  authDomain: "qwiklabs-gcp-04-a5e03f21bee9.firebaseapp.com",
  projectId: "qwiklabs-gcp-04-a5e03f21bee9",
  storageBucket: "qwiklabs-gcp-04-a5e03f21bee9.firebasestorage.app",
  messagingSenderId: "604410604222",
  appId: "1:604410604222:web:379d2d0988ecec8be50cef",
  measurementId: "G-FJ6TT56G25"
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


export { app, auth, analytics, db, collection, doc, setDoc, getDoc, serverTimestamp, updateDoc, addDoc, query, where, getDocs, orderBy, Timestamp, runTransaction, updateUserBalanceInFirestore, firebaseConfig, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, signOut, onAuthStateChanged, type FirebaseUserType, limit, startAfter, type QueryDocumentSnapshot, deleteDoc }; // Added deleteDoc
