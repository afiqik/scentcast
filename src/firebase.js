import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getFirestore } from 'firebase/firestore';

// Firebase Storage is intentionally not used: perfume images are compressed
// client-side and stored as base64 data URIs directly on Firestore documents
// (see storageService.js), so no Storage bucket needs to be provisioned.
const firebaseConfig = {
  projectId: "scentcast-54308",
  appId: "1:1037116038559:web:b418fbb1a70f8d020b71aa",
  databaseURL: "https://scentcast-54308-default-rtdb.asia-southeast1.firebasedatabase.app",
  apiKey: "AIzaSyBFvaGvq9In9Mq9-2675JUSPEEqmBv3bVw",
  authDomain: "scentcast-54308.firebaseapp.com",
  messagingSenderId: "1037116038559",
  measurementId: "G-6W7JPV93EK"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// 1. Firebase Authentication
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// 2. Firebase Realtime Database
export const rtdb = getDatabase(app);

// 3. Cloud Firestore
export const db = getFirestore(app);

export default app;
