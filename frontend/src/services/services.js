import { 
  createUserWithEmailAndPassword 
} from "firebase/auth";

import { auth } from "../firebase/firebase";


export function signup(email, password) {
  return createUserWithEmailAndPassword(
    auth,
    email,
    password
  );
}