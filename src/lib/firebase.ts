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
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAAeONCc7rsrvOwlbxmHjxf-qUw3O1v9QY",
  authDomain: "summer-function-461109-t2.firebaseapp.com",
  projectId: "summer-function-461109-t2",
  storageBucket: "summer-function-461109-t2.appspot.com",
  messagingSenderId: "404019274818",
  appId: "1:404019274818:web:e765b67dfb7710d4be79db",
  measurementId: "G-8FH69DQ5Q9"
};

// Initialize Firebase safely for both server and client
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Initialize Analytics if supported (client-side)
const analytics = isSupported().then(yes => yes ? getAnalytics(app) : null);

// Helper function to find user by custom 9-digit ID
export const findUserByCustomId = async (customId: string): Promise<{ email: string } | null> => {
    const usersRef = collection(db, "users");
    // Firestore stores numbers, so we need to convert the string ID to a number for the query.
    const q = query(usersRef, where("customUserId", "==", Number(customId)));
    try {
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            // Assuming customUserId is unique, there should be only one doc.
            const userDoc = querySnapshot.docs[0];
            const userData = userDoc.data();
            if (userData && userData.email) {
                return { email: userData.email };
            }
        }
        return null;
    } catch (error) {
        console.error("Error finding user by custom ID:", error);
        // This could be a permissions error or a missing index.
        // A toast in the calling component will notify the user.
        throw error;
    }
};

// New helper function to find a user's document snapshot by their custom ID
export const findUserDocByCustomId = async (customId: number): Promise<QueryDocumentSnapshot | null> => {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("customUserId", "==", customId), limit(1));
    try {
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            return querySnapshot.docs[0];
        }
        return null;
    } catch (error) {
        console.error("Error finding user document by custom ID:", error);
        throw error;
    }
};


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
  storage,
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
  storageRef,
  uploadBytes,
  getDownloadURL,
  type FirebaseUserType,
  type QueryDocumentSnapshot,
};
