import { auth, db, storage } from "@/firebase";
import { pickImage } from "./imageHelper";
import { collection, doc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

/**
 * Upload profile picture to Firebase Storage
 */
export const uploadProfilePicture = async (
  imageUri: string,
  userId: string
): Promise<string> => {
  try {
    // Fetch the image from the local URI
    const response = await fetch(imageUri);
    const blob = await response.blob();

    // Create a reference to the storage location
    const filename = `profile_${Date.now()}.jpg`;
    const path = `profiles/${userId}/${filename}`;
    const storageRef = ref(storage, path);

    // Upload the blob
    await uploadBytes(storageRef, blob);

    // Get the download URL
    const downloadURL = await getDownloadURL(storageRef);

    return downloadURL;
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    throw error;
  }
};

/**
 * Update user's profile picture in Firestore
 */
export const updateUserProfilePicture = async (
  profilePictureUrl: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // Find the user document by uid
    const usersRef = collection(db, "Users");
    const q = query(usersRef, where("uid", "==", user.uid));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { success: false, error: "User document not found" };
    }

    // Update the user document
    const userDocRef = doc(db, "Users", querySnapshot.docs[0].id);
    await updateDoc(userDocRef, {
      profilePicture: profilePictureUrl,
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating profile picture:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update profile picture",
    };
  }
};

/**
 * Get user's profile picture URL
 */
export const getUserProfilePicture = async (
  userId: string
): Promise<string | null> => {
  try {
    const usersRef = collection(db, "Users");
    const q = query(usersRef, where("uid", "==", userId));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const userData = querySnapshot.docs[0].data();
      return userData.profilePicture || null;
    }

    return null;
  } catch (error) {
    console.error("Error fetching profile picture:", error);
    return null;
  }
};

/**
 * Handle complete profile picture change flow
 */
export const changeProfilePicture = async (): Promise<{
  success: boolean;
  error?: string;
  profilePictureUrl?: string;
}> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // Pick image
    const image = await pickImage();
    if (!image) {
      return { success: false, error: "No image selected" };
    }

    // Upload to storage
    const profilePictureUrl = await uploadProfilePicture(image.uri, user.uid);

    // Update Firestore
    const result = await updateUserProfilePicture(profilePictureUrl);
    
    if (result.success) {
      return { success: true, profilePictureUrl };
    }

    return result;
  } catch (error) {
    console.error("Error changing profile picture:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to change profile picture",
    };
  }
};

