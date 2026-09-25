import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile
} from "firebase/auth";

import { auth } from "../firebase/firebase";

/**
 * Register a new user with Firebase Authentication.
 * Immediately sends a Firebase email verification link to the registered email.
 * Passwords are managed securely by Firebase and never stored in custom databases.
 */
export async function signup(email, password, displayName = "") {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  if (displayName && userCredential.user) {
    try {
      await updateProfile(userCredential.user, { displayName });
    } catch (e) {
      console.warn("Could not set displayName on user:", e);
    }
  }

  // Immediately send Firebase email verification link
  await sendEmailVerification(userCredential.user);

  return userCredential;
}

/**
 * Sign in existing user with email and password.
 * Reloads user to ensure the latest emailVerified status from Firebase servers.
 */
export async function login(email, password) {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );

  try {
    await userCredential.user.reload();
  } catch (e) {
    console.warn("Could not reload user after login:", e);
  }

  return userCredential;
}

/**
 * Resend verification email to current or specified Firebase user.
 */
export async function resendVerificationEmail(user = auth.currentUser) {
  if (!user) {
    throw new Error("No user is currently authenticated to resend verification email.");
  }
  await sendEmailVerification(user);
}

/**
 * Check if the user's email has been verified.
 * Reloads the user from Firebase to retrieve the latest server state.
 */
export async function checkEmailVerified(user = auth.currentUser) {
  if (!user) {
    return false;
  }
  await user.reload();
  return Boolean(auth.currentUser && auth.currentUser.emailVerified);
}

export function logout() {
  return signOut(auth);
}

export function resetPassword(email) {
  return sendPasswordResetEmail(
    auth,
    email
  );
}