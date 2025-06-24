
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore, collection, doc, setDoc, getDoc, serverTimestamp, updateDoc, addDoc, query, where, getDocs, orderBy, Timestamp, runTransaction, limit, startAfter, type QueryDocumentSnapshot, deleteDoc } from "firebase/firestore"; // Added deleteDoc
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, signOut, onAuthStateChanged, type User as FirebaseUserType } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAAeONCc7rsrvOwlbxmHjxf-qUw3O1v9QY",
  authDomain: "summer-function-461109-t2.firebaseapp.com",
  projectId: "summer-function-461109-t2",
  storageBucket: "summer-function-461109-t2.firebasestorage.app",
  messagingSenderId: "404019274818",
  appId: "1:404019274818:web:e765b67dfb7710d4be79db",
  measurementId: "G-8FH69DQ5Q9"
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
