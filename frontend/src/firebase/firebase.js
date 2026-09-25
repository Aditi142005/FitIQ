import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyALSfIRWOUuQ0Ln9bscJYjbZJ_iefhTPRs",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "fitiq-88401.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "fitiq-88401",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "fitiq-88401.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "972052388645",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:972052388645:web:b0bfca0a819592c78018cc"
};
//console.log("Firebase Config:",firebaseConfig);
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;