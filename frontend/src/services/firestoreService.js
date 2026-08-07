import {
  doc,
  setDoc,
  updateDoc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp
} from "firebase/firestore";
import { db } from "../firebase/firebase";
export async function addHealthHistory(uid, healthData) {
  const historyRef = collection(
    db,
    "users",
    uid,
    "healthHistory"
  );

  await addDoc(historyRef, {
    ...healthData,
    recordedAt: serverTimestamp()
  });
}
export async function updateDailyGoals(uid, goals) {

  const userRef = doc(db, "users", uid);

  await updateDoc(userRef, {
    dailyGoals: goals,
    goalDate: new Date().toISOString().split("T")[0]
  });

}

export async function updateStreak(uid, streak) {

  const userRef = doc(db, "users", uid);

  await updateDoc(userRef, {
    streak: streak,
    lastCompletedDate: new Date()
      .toISOString()
      .split("T")[0]
  });

}
export async function updateTodayCompletion(uid, status){

  const userRef = doc(db,"users",uid);

  await updateDoc(userRef,{
    todayCompleted: status
  });

}

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