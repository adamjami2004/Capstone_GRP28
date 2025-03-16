// app/services/userService.js
import { db } from "../config/firebase";
import { doc, setDoc } from "firebase/firestore";

export const createUserProfile = async (uid, userData) => {
  try {
    await setDoc(doc(db, "users", uid), userData);
  } catch (error) {
    throw error.message;
  }
};
