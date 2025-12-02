// Announcement helper functions
import { auth, db, storage } from "@/firebase";
import {
    Announcement,
    CreateAnnouncementData,
    UpdateAnnouncementData,
} from "@/types/announcement";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
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
 * Check if current user is admin
 */
export async function isUserAdmin(): Promise<boolean> {
  try {
    const user = auth.currentUser;
    if (!user) return false;

    const usersRef = collection(db, "Users");
    const userQuery = query(usersRef, where("uid", "==", user.uid));
    const userSnapshot = await getDocs(userQuery);

    if (!userSnapshot.empty) {
      const userData = userSnapshot.docs[0].data();
      return userData.role === "Admin" || userData.role === "Super Admin";
    }
    return false;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}

/**
 * Upload attachment to Firebase Storage
 */
export async function uploadAttachment(
  uri: string,
  filename: string,
  announcementId: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // Fetch the file as a blob
    const response = await fetch(uri);
    const blob = await response.blob();

    // Create a unique filename
    const timestamp = Date.now();
    const storageFilename = `announcements/${announcementId}/${timestamp}_${filename}`;
    const storageRef = ref(storage, storageFilename);

    // Upload the blob
    await uploadBytes(storageRef, blob);

    // Get the download URL
    const downloadURL = await getDownloadURL(storageRef);

    return { success: true, url: downloadURL };
  } catch (error) {
    console.error("Error uploading attachment:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to upload attachment",
    };
  }
}

/**
 * Delete attachment from Firebase Storage
 */
export async function deleteAttachment(
  attachmentUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!attachmentUrl) return { success: true };

    const imageRef = ref(storage, attachmentUrl);
    await deleteObject(imageRef);

    return { success: true };
  } catch (error) {
    console.error("Error deleting attachment:", error);
    return { success: true }; // Don't fail if attachment deletion fails
  }
}

/**
 * Create a new announcement (Admin only)
 */
export async function createAnnouncement(
  data: CreateAnnouncementData
): Promise<{ success: boolean; announcementId?: string; error?: string }> {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // Check if user is admin
    const adminCheck = await isUserAdmin();
    if (!adminCheck) {
      return { success: false, error: "Only admins can create announcements" };
    }

    // Get user details
    const usersRef = collection(db, "Users");
    const userQuery = query(usersRef, where("uid", "==", user.uid));
    const userSnapshot = await getDocs(userQuery);

    let publisherName = "Admin";
    let publisherProfilePicture = "";
    if (!userSnapshot.empty) {
      const userData = userSnapshot.docs[0].data();
      publisherName = `${userData.firstName || ""} ${userData.lastName || ""}`.trim() || "Admin";
      publisherProfilePicture = userData.profilePicture || userData.profilePictureUrl || "";
    }

    // Create announcement document
    const announcementData: any = {
      title: data.title,
      content: data.content,
      tag: data.tag,
      publisherId: user.uid,
      publisherName,
      publisherEmail: user.email || "",
      publisherProfilePicture,
      readBy: [],
      readCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Add attachment if provided
    if (data.attachmentUrl) {
      announcementData.attachmentUrl = data.attachmentUrl;
      announcementData.attachmentName = data.attachmentName || "Attachment";
    }

    const docRef = await addDoc(collection(db, "Announcements"), announcementData);

    return { success: true, announcementId: docRef.id };
  } catch (error) {
    console.error("Error creating announcement:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create announcement",
    };
  }
}

/**
 * Fetch all announcements
 */
export async function fetchAnnouncements(): Promise<Announcement[]> {
  try {
    const announcementsRef = collection(db, "Announcements");
    const q = query(announcementsRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);

    const announcements: Announcement[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      announcements.push({
        id: doc.id,
        ...data,
        readBy: data.readBy || [],
        readCount: data.readCount || 0,
      } as Announcement);
    });

    return announcements;
  } catch (error) {
    console.error("Error fetching announcements:", error);
    return [];
  }
}

/**
 * Update an announcement (Publisher only)
 */
export async function updateAnnouncement(
  announcementId: string,
  data: UpdateAnnouncementData,
  checkOwnership: boolean = false
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // If checking ownership, verify the user is the publisher
    if (checkOwnership) {
      const announcementRef = doc(db, "Announcements", announcementId);
      const announcementDoc = await getDoc(announcementRef);
      
      if (!announcementDoc.exists()) {
        return { success: false, error: "Announcement not found" };
      }
      
      const announcementData = announcementDoc.data();
      if (announcementData.publisherId !== user.uid) {
        return { success: false, error: "You can only edit your own announcements" };
      }
    }

    const updateData: any = {
      updatedAt: Date.now(),
    };

    if (data.title !== undefined) updateData.title = data.title;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.tag !== undefined) updateData.tag = data.tag;
    if (data.attachmentUrl !== undefined) {
      updateData.attachmentUrl = data.attachmentUrl;
      updateData.attachmentName = data.attachmentName || "Attachment";
    }

    const announcementRef = doc(db, "Announcements", announcementId);
    await updateDoc(announcementRef, updateData);

    return { success: true };
  } catch (error) {
    console.error("Error updating announcement:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update announcement",
    };
  }
}

/**
 * Delete an announcement (Publisher only)
 */
export async function deleteAnnouncement(
  announcementId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // Check if user is the publisher
    const announcementRef = doc(db, "Announcements", announcementId);
    const announcementDoc = await getDoc(announcementRef);
    
    if (!announcementDoc.exists()) {
      return { success: false, error: "Announcement not found" };
    }
    
    const announcementData = announcementDoc.data();
    if (announcementData.publisherId !== user.uid) {
      return { success: false, error: "You can only delete your own announcements" };
    }

    await deleteDoc(announcementRef);

    return { success: true };
  } catch (error) {
    console.error("Error deleting announcement:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete announcement",
    };
  }
}

/**
 * Toggle read status on an announcement
 */
export async function toggleRead(
  announcementId: string,
  currentReadBy: string[]
): Promise<{ success: boolean; error?: string; hasRead?: boolean }> {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const announcementRef = doc(db, "Announcements", announcementId);
    const hasRead = currentReadBy.includes(user.uid);

    let updatedReadBy: string[];
    if (hasRead) {
      // Remove user from readBy
      updatedReadBy = currentReadBy.filter((id) => id !== user.uid);
    } else {
      // Add user to readBy
      updatedReadBy = [...currentReadBy, user.uid];
    }

    await updateDoc(announcementRef, {
      readBy: updatedReadBy,
      readCount: updatedReadBy.length,
    });

    return { success: true, hasRead: !hasRead };
  } catch (error) {
    console.error("Error toggling read:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to toggle read",
    };
  }
}

/**
 * Format date for display
 */
export function formatAnnouncementDate(timestamp: number): string {
  try {
    const date = new Date(timestamp);
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return date.toLocaleDateString("en-US", options);
  } catch (error) {
    return "";
  }
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days > 1 ? "s" : ""} ago`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  } else {
    return "Just now";
  }
}

