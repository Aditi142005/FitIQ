import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyALSfIRWOUuQ0Ln9bscJYjbZJ_iefhTPRs",
  authDomain: "fitiq-88401.firebaseapp.com",
  projectId: "fitiq-88401",
  storageBucket: "fitiq-88401.firebasestorage.app",
  messagingSenderId: "972052388645",
  appId: "1:972052388645:web:b0bfca0a819592c78018cc"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export default app;