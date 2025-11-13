import { storage } from "@/firebase";
import * as ImagePicker from "expo-image-picker";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

/**
 * Request permission to access the image library
 */
export const requestImagePermissions = async (): Promise<boolean> => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") {
    return false;
  }
  return true;
};

/**
 * Pick an image from the device's library
 */
export const pickImage = async (): Promise<ImagePicker.ImagePickerAsset | null> => {
  try {
    // Request permissions first
    const hasPermission = await requestImagePermissions();
    if (!hasPermission) {
      throw new Error("Permission to access media library was denied");
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      return result.assets[0];
    }

    return null;
  } catch (error) {
    console.error("Error picking image:", error);
    throw error;
  }
};

/**
 * Upload an image to Firebase Storage
 */
export const uploadImage = async (
  uri: string,
  path: string
): Promise<string> => {
  try {
    // Fetch the image from the local URI
    const response = await fetch(uri);
    const blob = await response.blob();

    // Create a reference to the storage location
    const storageRef = ref(storage, path);

    // Upload the blob
    await uploadBytes(storageRef, blob);

    // Get the download URL
    const downloadURL = await getDownloadURL(storageRef);

    return downloadURL;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
};

/**
 * Upload a post image and return its URL
 */
export const uploadPostImage = async (
  imageUri: string,
  userId: string
): Promise<string> => {
  const timestamp = Date.now();
  const filename = `post_${timestamp}.jpg`;
  const path = `posts/${userId}/${filename}`;

  return await uploadImage(imageUri, path);
};

