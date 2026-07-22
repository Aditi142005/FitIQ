import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/firebase";

export async function createUserProfile(uid, name, email) {
  await setDoc(doc(db, "users", uid), {
    name,
    email,
    createdAt: serverTimestamp()
  });
}