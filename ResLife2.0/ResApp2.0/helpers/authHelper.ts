// authHelpers.ts
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

export async function signIn(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    console.error("Login failed:", error.message);
    throw error;
  }
}
