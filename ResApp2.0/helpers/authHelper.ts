// authHelpers.ts
import {
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    updateProfile
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

// Email validation
export function validateEmail(email: string): { valid: boolean; error?: string } {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!email) {
    return { valid: false, error: "Email is required" };
  }
  
  if (!emailRegex.test(email)) {
    return { valid: false, error: "Please enter a valid email address" };
  }
  
  return { valid: true };
}

// Password validation
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password) {
    return { valid: false, error: "Password is required" };
  }
  
  if (password.length < 6) {
    return { valid: false, error: "Password must be at least 6 characters" };
  }
  
  if (password.length > 128) {
    return { valid: false, error: "Password is too long" };
  }
  
  // Check for at least one letter and one number
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  
  if (!hasLetter || !hasNumber) {
    return { valid: false, error: "Password must contain letters and numbers" };
  }
  
  return { valid: true };
}

// Name validation
export function validateName(name: string): { valid: boolean; error?: string } {
  if (!name) {
    return { valid: false, error: "Name is required" };
  }
  
  if (name.trim().length < 2) {
    return { valid: false, error: "Name must be at least 2 characters" };
  }
  
  return { valid: true };
}

// Sign in function
export async function signIn(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error: any) {
    console.error("Login failed:", error.message);
    
    // Return user-friendly error messages
    let errorMessage = "Login failed. Please try again.";
    
    switch (error.code) {
      case "auth/invalid-email":
        errorMessage = "Invalid email address format.";
        break;
      case "auth/user-disabled":
        errorMessage = "This account has been disabled.";
        break;
      case "auth/user-not-found":
        errorMessage = "No account found with this email.";
        break;
      case "auth/wrong-password":
        errorMessage = "Incorrect password.";
        break;
      case "auth/invalid-credential":
        errorMessage = "Invalid email or password.";
        break;
      case "auth/too-many-requests":
        errorMessage = "Too many failed attempts. Please try again later.";
        break;
      case "auth/network-request-failed":
        errorMessage = "Network error. Please check your connection.";
        break;
      default:
        errorMessage = error.message || "An unexpected error occurred.";
    }
    
    return { success: false, error: errorMessage };
  }
}

// Register new user
export async function registerUser(
  email: string, 
  password: string, 
  firstName: string, 
  lastName: string,
  role: string = "Staff",
  residence?: string
) {
  try {
    // Create authentication user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update display name
    await updateProfile(user, {
      displayName: `${firstName} ${lastName}`
    });
    
    // Create user profile in Firestore
    await setDoc(doc(db, "Users", user.uid), {
      uid: user.uid,
      Email: email,
      email: email, // lowercase for compatibility
      firstName: firstName,
      lastName: lastName,
      fullName: `${firstName} ${lastName}`,
      role: role,
      residence: residence || "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isActive: true
    });
    
    return { success: true, user };
  } catch (error: any) {
    console.error("Registration failed:", error.message);
    
    let errorMessage = "Registration failed. Please try again.";
    
    switch (error.code) {
      case "auth/email-already-in-use":
        errorMessage = "An account with this email already exists.";
        break;
      case "auth/invalid-email":
        errorMessage = "Invalid email address format.";
        break;
      case "auth/operation-not-allowed":
        errorMessage = "Email/password accounts are not enabled.";
        break;
      case "auth/weak-password":
        errorMessage = "Password is too weak. Use at least 6 characters.";
        break;
      case "auth/network-request-failed":
        errorMessage = "Network error. Please check your connection.";
        break;
      default:
        errorMessage = error.message || "An unexpected error occurred.";
    }
    
    return { success: false, error: errorMessage };
  }
}

// Send password reset email
export async function resetPassword(email: string) {
  try {
    await sendPasswordResetEmail(auth, email);
    return { 
      success: true, 
      message: "Password reset email sent. Please check your inbox." 
    };
  } catch (error: any) {
    console.error("Password reset failed:", error.message);
    
    let errorMessage = "Failed to send reset email. Please try again.";
    
    switch (error.code) {
      case "auth/invalid-email":
        errorMessage = "Invalid email address format.";
        break;
      case "auth/user-not-found":
        errorMessage = "No account found with this email.";
        break;
      case "auth/network-request-failed":
        errorMessage = "Network error. Please check your connection.";
        break;
      case "auth/too-many-requests":
        errorMessage = "Too many requests. Please try again later.";
        break;
      default:
        errorMessage = error.message || "An unexpected error occurred.";
    }
    
    return { success: false, error: errorMessage };
  }
}
