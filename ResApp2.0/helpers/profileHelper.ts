import { auth, db, storage } from "@/firebase";
import {
  collection,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";

/**
 * Upload or update profile picture
 */
export const uploadProfilePicture = async (
  uri: string
): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    const user = auth.currentUser;
    if (!user || !user.email) {
      return { success: false, error: "User not authenticated" };
    }

    // Fetch the image as a blob
    const response = await fetch(uri);
    const blob = await response.blob();

    // Create storage reference with user ID and timestamp for uniqueness
    const timestamp = Date.now();
    const filename = `profiles/${user.uid}/profile_${timestamp}.jpg`;
    const storageRef = ref(storage, filename);

    // Upload the blob
    await uploadBytes(storageRef, blob);

    // Get the download URL
    const downloadURL = await getDownloadURL(storageRef);

    // Find user document by email (since Users collection uses email query)
    const usersRef = collection(db, "Users");
    const userQuery = query(usersRef, where("Email", "==", user.email));
    const userSnapshot = await getDocs(userQuery);

    if (!userSnapshot.empty) {
      const userDoc = userSnapshot.docs[0];
      await updateDoc(userDoc.ref, {
        profilePicture: downloadURL,
        profilePictureUrl: downloadURL, // Also set for backward compatibility
      });
    }

    return { success: true, url: downloadURL };
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to upload profile picture",
    };
  }
};

/**
 * Delete profile picture
 */
export const deleteProfilePicture = async (): Promise<{
  success: boolean;
  error?: string;
}> => {
  try {
    const user = auth.currentUser;
    if (!user || !user.email) {
      return { success: false, error: "User not authenticated" };
    }

    // Find user document to get current profile picture URL
    const usersRef = collection(db, "Users");
    const userQuery = query(usersRef, where("Email", "==", user.email));
    const userSnapshot = await getDocs(userQuery);

    if (!userSnapshot.empty) {
      const userData = userSnapshot.docs[0].data();
      const profilePictureUrl = userData.profilePicture || userData.profilePictureUrl;

      // Delete from storage if URL exists
      if (profilePictureUrl) {
        try {
          // Extract the path from the URL
          const urlParts = profilePictureUrl.split('/o/');
          if (urlParts.length > 1) {
            const pathPart = urlParts[1].split('?')[0];
            const decodedPath = decodeURIComponent(pathPart);
            const storageRef = ref(storage, decodedPath);
            await deleteObject(storageRef);
          }
        } catch (error: any) {
          // If file doesn't exist, that's fine
          if (error.code !== 'storage/object-not-found') {
            console.warn("Error deleting old profile picture from storage:", error);
          }
        }
      }

      // Remove URL from Firestore
      await updateDoc(userSnapshot.docs[0].ref, {
        profilePicture: null,
        profilePictureUrl: null,
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting profile picture:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete profile picture",
    };
  }
};

/**
 * Get user profile picture URL by userId (uid)
 */
export const getUserProfilePicture = async (
  userId: string
): Promise<string | null> => {
  try {
    const usersRef = collection(db, "Users");
    const userQuery = query(usersRef, where("uid", "==", userId));
    const userSnapshot = await getDocs(userQuery);

    if (!userSnapshot.empty) {
      const userData = userSnapshot.docs[0].data();
      return userData.profilePicture || userData.profilePictureUrl || null;
    }
    return null;
  } catch (error) {
    console.error("Error getting profile picture:", error);
    return null;
  }
};

