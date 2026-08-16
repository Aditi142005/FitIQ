import {
  doc,
  setDoc,
  updateDoc,
  getDoc,
  collection,
  addDoc,
  getDocs,
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
export async function getHealthHistory(uid) {

  const historyRef = collection(
    db,
    "users",
    uid,
    "healthHistory"
  );

  const snapshot = await getDocs(historyRef);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}
export async function saveDailyTracking(uid, trackingData) {

  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  const date = `${year}-${month}-${day}`;

  const trackingRef = doc(
    db,
    "users",
    uid,
    "dailyTracking",
    date
  );

  await setDoc(trackingRef, {
    ...trackingData,
    date,
    recordedAt: serverTimestamp()
  });
}
export async function getDailyTracking(uid) {

  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  const date = `${year}-${month}-${day}`;

  const trackingRef = doc(
    db,
    "users",
    uid,
    "dailyTracking",
    date
  );

  const trackingSnap = await getDoc(trackingRef);

  if (trackingSnap.exists()) {
    return trackingSnap.data();
  }

  return null;
}
export async function getLast7DaysTracking(uid) {

  const trackingRef = collection(
    db,
    "users",
    uid,
    "dailyTracking"
  );

  const snapshot = await getDocs(trackingRef);

  const records = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  const days = [];

  for (let i = 6; i >= 0; i--) {

    const date = new Date();

    date.setDate(date.getDate() - i);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    const dateString = `${year}-${month}-${day}`;

    const record = records.find(
      item => item.date === dateString
    );

    days.push({
      date: dateString,
      recorded: !!record
    });
  }

  return days;
}
export async function getWeeklyTracking(uid) {

  const trackingRef = collection(
    db,
    "users",
    uid,
    "dailyTracking"
  );

  const snapshot = await getDocs(trackingRef);

  const records = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  return records;
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