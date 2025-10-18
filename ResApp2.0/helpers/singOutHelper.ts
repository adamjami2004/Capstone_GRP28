import { signOut } from "firebase/auth";
import { auth } from "../firebase";

export async function logOut() {
  await signOut(auth);
}
