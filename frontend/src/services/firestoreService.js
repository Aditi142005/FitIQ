import { doc, setDoc, serverTimestamp, updateDoc} from "firebase/firestore";
import { db } from "../firebase/firebase";
export async function updateUserProfile(uid, profileData) {
  const userRef = doc(db, "users", uid);

  await updateDoc(userRef, profileData);
}
export async function createUserProfile(uid, name, email) {
  await setDoc(doc(db, "users", uid), {
    name,
    email,
    createdAt: serverTimestamp()
  });
}