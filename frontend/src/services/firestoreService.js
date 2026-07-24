import {
  doc,
  setDoc,
  updateDoc,
  getDoc,
  serverTimestamp
} from "firebase/firestore";
import { db } from "../firebase/firebase";
export async function updateUserProfile(uid, profileData) {
  const userRef = doc(db, "users", uid);

  await updateDoc(userRef, profileData);
}
export async function getUserProfile(uid) {

  const userRef = doc(db, "users", uid);

  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    return userSnap.data();
  }

  return null;
}
export async function createUserProfile(uid, name, email) {
  await setDoc(doc(db, "users", uid), {
    name,
    email,
    createdAt: serverTimestamp()
  });
}