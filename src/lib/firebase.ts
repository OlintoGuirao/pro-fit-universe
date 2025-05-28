// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDCvMtNCLbN5HJMtcFXSh8CqS6bVTYDCSs",
  authDomain: "profit-5dd3c.firebaseapp.com",
  projectId: "profit-5dd3c",
  storageBucket: "profit-5dd3c.appspot.com",
  messagingSenderId: "407609025346",
  appId: "1:407609025346:web:06a321924f3145dceb1edb",
  measurementId: "G-JMEH6GZYDD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, analytics, storage };
