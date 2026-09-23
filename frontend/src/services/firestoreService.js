import {
  doc,
  setDoc,
  updateDoc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase/firebase";

/* =========================================================
   LOCAL DATE HELPER
   ========================================================= */

export const getLocalDateKey = () => {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};


/* =========================================================
   USER PROFILE
   ========================================================= */

export const createUserProfile = async (uid, profileData) => {
  const userRef = doc(db, "users", uid);

  await setDoc(userRef, {
    ...profileData,
    createdAt: serverTimestamp(),
  });
};


export const getUserProfile = async (uid) => {
  const userRef = doc(db, "users", uid);
  const snapshot = await getDoc(userRef);

  if (snapshot.exists()) {
    return snapshot.data();
  }

  return null;
};

export const updateUserProfile = async (uid, profileData) => {
  const userRef = doc(db, "users", uid);

  await setDoc(
    userRef,
    {
      ...profileData,
      updatedAt: serverTimestamp(),
    },
    {
      merge: true,
    }
  );
};


/* =========================================================
   DAILY TRACKING
   ========================================================= */

export const saveDailyTracking = async (uid, trackingData) => {
  const date = getLocalDateKey();

  const trackingRef = doc(
    db,
    "users",
    uid,
    "dailyTracking",
    date
  );

  await setDoc(
    trackingRef,
    {
      ...trackingData,
      date,
      recordedAt: serverTimestamp(),
    },
    {
      merge: true,
    }
  );

  return {
    success: true,
    date,
  };
};


/* =========================================================
   GET TODAY'S TRACKING
   ========================================================= */

export const getDailyTracking = async (uid) => {
  const date = getLocalDateKey();

  const trackingRef = doc(
    db,
    "users",
    uid,
    "dailyTracking",
    date
  );

  const snapshot = await getDoc(trackingRef);

  if (snapshot.exists()) {
    return snapshot.data();
  }

  return null;
};


/* =========================================================
   GET ALL TRACKING RECORDS
   ========================================================= */

export const getWeeklyTracking = async (uid) => {
  const trackingRef = collection(
    db,
    "users",
    uid,
    "dailyTracking"
  );

  const snapshot = await getDocs(trackingRef);

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
};


/* =========================================================
   GET LAST 7 DAYS
   ========================================================= */

export const getLast7DaysTracking = async (uid) => {
  const allRecords = await getWeeklyTracking(uid);

  const recordMap = {};

  allRecords.forEach((record) => {
    if (record.date) {
      recordMap[record.date] = record;
    }
  });

  const result = [];

  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);

    date.setDate(today.getDate() - i);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    const dateKey = `${year}-${month}-${day}`;

    const record = recordMap[dateKey];

    result.push({
      date: dateKey,
      recorded: !!record,

      steps:
        record?.steps ??
        record?.dailySteps ??
        0,

      exerciseMinutes:
        record?.exerciseMinutes ??
        record?.duration_minutes ??
        record?.durationMinutes ??
        0,

      sleepHours:
        record?.sleepHours ??
        record?.sleep ??
        record?.hoursSleep ??
        0,

      waterIntake:
        record?.waterIntake ??
        record?.hydrationLevel ??
        record?.water ??
        0,

      goalsCompleted:
        record?.goalsCompleted ?? false,

      goalCompletionPercent:
        record?.goalCompletionPercent ?? 0,
    });
  }

  return result;
};


/* =========================================================
   GET LAST 365 DAYS
   ========================================================= */

export const getLast365DaysTracking = async (uid) => {
  const allRecords = await getWeeklyTracking(uid);

  const recordMap = {};

  allRecords.forEach((record) => {
    if (record.date) {
      recordMap[record.date] = record;
    }
  });

  const result = [];

  const today = new Date();

  for (let i = 364; i >= 0; i--) {
    const date = new Date(today);

    date.setDate(today.getDate() - i);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    const dateKey = `${year}-${month}-${day}`;

    const record = recordMap[dateKey];

    result.push({
      date: dateKey,
      recorded: !!record,

      steps:
        record?.steps ??
        record?.dailySteps ??
        0,

      exerciseMinutes:
        record?.exerciseMinutes ??
        record?.duration_minutes ??
        record?.durationMinutes ??
        0,

      sleepHours:
        record?.sleepHours ??
        record?.sleep ??
        record?.hoursSleep ??
        0,

      waterIntake:
        record?.waterIntake ??
        record?.hydrationLevel ??
        record?.water ??
        0,

      goalsCompleted:
        record?.goalsCompleted ?? false,

      goalCompletionPercent:
        record?.goalCompletionPercent ?? 0,
    });
  }

  return result;
};


/* =========================================================
   DAILY GOALS
   ========================================================= */

export const updateDailyGoals = async (uid, goals) => {
  const date = getLocalDateKey();

  const userRef = doc(db, "users", uid);

  await updateDoc(userRef, {
    dailyGoals: goals,
    goalDate: date,
  });

  /*
   * Store today's goal completion inside the
   * date-based dailyTracking document.
   *
   * This allows the streak to be calculated from
   * historical dates instead of one single streak number.
   */

  const goalValues = Object.values(goals);

  const completedCount = goalValues.filter(
    (value) => value === true
  ).length;

  const totalGoals = goalValues.length;

  const completionPercent =
    totalGoals > 0
      ? Math.round((completedCount / totalGoals) * 100)
      : 0;

  const goalsCompleted =
    totalGoals > 0 &&
    completedCount === totalGoals;

  const trackingRef = doc(
    db,
    "users",
    uid,
    "dailyTracking",
    date
  );

  await setDoc(
    trackingRef,
    {
      date,
      goalCompletion: goals,
      goalCompletionPercent: completionPercent,
      goalsCompleted,
    },
    {
      merge: true,
    }
  );

  return {
    goalsCompleted,
    completionPercent,
  };
};


/* =========================================================
   TODAY COMPLETION
   ========================================================= */

export const updateTodayCompletion = async (
  uid,
  status
) => {
  const userRef = doc(db, "users", uid);

  await updateDoc(userRef, {
    todayCompleted: status,
  });
};


/* =========================================================
   STREAK CALCULATION
   ========================================================= */

export const calculateStreakFromRecords = (
  records
) => {
  if (!records || records.length === 0) {
    return {
      currentStreak: 0,
      bestStreak: 0,
    };
  }

  const completedDates = new Set(
    records
      .filter((record) => record.goalsCompleted === true)
      .map((record) => record.date)
  );

  const today = new Date();

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(
      date.getMonth() + 1
    ).padStart(2, "0");
    const day = String(
      date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  /* -------------------------
     CURRENT STREAK
     ------------------------- */

  let currentStreak = 0;

  const currentDate = new Date(today);

  while (true) {
    const dateKey = formatDate(currentDate);

    if (!completedDates.has(dateKey)) {
      break;
    }

    currentStreak++;

    currentDate.setDate(
      currentDate.getDate() - 1
    );
  }

  /* -------------------------
     BEST STREAK
     ------------------------- */

  const sortedDates = Array.from(
    completedDates
  ).sort();

  let bestStreak = 0;
  let runningStreak = 0;
  let previousDate = null;

  sortedDates.forEach((dateString) => {
    const currentDate = new Date(
      `${dateString}T00:00:00`
    );

    if (!previousDate) {
      runningStreak = 1;
    } else {
      const difference =
        Math.round(
          (
            currentDate -
            previousDate
          ) /
            (1000 * 60 * 60 * 24)
        );

      if (difference === 1) {
        runningStreak++;
      } else {
        runningStreak = 1;
      }
    }

    bestStreak = Math.max(
      bestStreak,
      runningStreak
    );

    previousDate = currentDate;
  });

  return {
    currentStreak,
    bestStreak,
  };
};


/* =========================================================
   GET STREAK
   ========================================================= */

export const getStreakData = async (uid) => {
  const records = await getWeeklyTracking(uid);

  return calculateStreakFromRecords(records);
};


/* =========================================================
   LEGACY STREAK UPDATE
   ========================================================= */

export const updateStreak = async (
  uid,
  streak
) => {
  const userRef = doc(db, "users", uid);

  await updateDoc(userRef, {
    streak,
    lastCompletedDate: getLocalDateKey(),
  });
};

/* =========================================================
   HEALTH HISTORY
   ========================================================= */
export const addHealthHistory = async (uid, healthData) => {
  const historyRef = collection(
    db,
    "users",
    uid,
    "healthHistory"
  );

  const cleanedHealthData = Object.fromEntries(
    Object.entries(healthData).filter(
      ([, value]) => value !== undefined
    )
  );

  const document = await addDoc(historyRef, {
    ...cleanedHealthData,
    recordedAt: serverTimestamp(),
  });

  return document.id;
};

/* =========================================================
   GENERIC COLLECTION HELPERS
   ========================================================= */

export const addCollectionDocument = async (
  collectionName,
  data
) => {
  const collectionRef = collection(
    db,
    collectionName
  );

  const document = await addDoc(
    collectionRef,
    {
      ...data,
      createdAt: serverTimestamp(),
    }
  );

  return document.id;
};


export const getCollectionDocuments = async (
  collectionName
) => {
  const collectionRef = collection(
    db,
    collectionName
  );

  const snapshot = await getDocs(
    collectionRef
  );

  return snapshot.docs.map(
    (docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    })
  );
};