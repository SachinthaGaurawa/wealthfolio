import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyBpIRHoNQJTeMIVYime_oVjBXiQWNH18K4",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "wealthflow-6dffb.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "wealthflow-6dffb",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "wealthflow-6dffb.firebasestorage.app",
  messagingSenderId: process.env.VITE_FIREBASE_SENDER_ID || "1020193373377",
  appId: process.env.VITE_FIREBASE_APP_ID || "1:1020193373377:web:52ae0662d35b02037f6840",
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID || "G-FKEKQGG8MZ"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
