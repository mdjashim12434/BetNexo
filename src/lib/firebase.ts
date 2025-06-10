// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

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

export { app, analytics, firebaseConfig };
