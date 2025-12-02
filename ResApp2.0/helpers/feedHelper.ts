import { auth, db, storage } from "@/firebase";
import { Comment, CreatePostData, Post, UpdatePostData } from "@/types/feed";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
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
 * Upload image to Firebase Storage
 */
export const uploadPostImage = async (
  uri: string,
  postId: string
): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // Fetch the image as a blob
    const response = await fetch(uri);
    const blob = await response.blob();

    // Create a unique filename with timestamp
    const timestamp = Date.now();
    const filename = `posts/${user.uid}/${postId}_${timestamp}.jpg`;
    const storageRef = ref(storage, filename);

    // Upload the blob
    await uploadBytes(storageRef, blob);

    // Get the download URL
    const downloadURL = await getDownloadURL(storageRef);

    return { success: true, url: downloadURL };
  } catch (error) {
    console.error("Error uploading image:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to upload image",
    };
  }
};

/**
 * Delete image from Firebase Storage
 */
export const deletePostImage = async (
  imageUrl: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!imageUrl) return { success: true };

    // Extract the path from the URL
    const imageRef = ref(storage, imageUrl);
    await deleteObject(imageRef);

    return { success: true };
  } catch (error) {
    console.error("Error deleting image:", error);
    // Don't fail the operation if image deletion fails
    return { success: true };
  }
};

/**
 * Create a new post
 */
export const createPost = async (
  data: CreatePostData
): Promise<{ success: boolean; error?: string; postId?: string }> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // Get user's name and profile picture from Users collection
    const usersRef = collection(db, "Users");
    const userQuery = query(usersRef, where("uid", "==", user.uid));
    const userSnapshot = await getDocs(userQuery);

    let userName = "Anonymous";
    let userProfilePicture = "";
    if (!userSnapshot.empty) {
      const userData = userSnapshot.docs[0].data();
      userName = `${userData.firstName || ""} ${userData.lastName || ""}`.trim() || userData.Email || "Anonymous";
      userProfilePicture = userData.profilePicture || userData.profilePictureUrl || "";
    }

    // Create post document
    const postData: any = {
      userId: user.uid,
      userName,
      userProfilePicture,
      title: data.title,
      description: data.description,
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      likes: [],
      likeCount: 0,
    };

    // Only add imageUrl if it's provided (Firestore doesn't accept undefined)
    if (data.imageUrl) {
      postData.imageUrl = data.imageUrl;
    }

    const docRef = await addDoc(collection(db, "Posts"), postData);

    return { success: true, postId: docRef.id };
  } catch (error) {
    console.error("Error creating post:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create post",
    };
  }
};

/**
 * Fetch all posts
 */
export const fetchPosts = async (): Promise<Post[]> => {
  try {
    const postsRef = collection(db, "Posts");
    const q = query(postsRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);

    const posts: Post[] = [];
    for (const docSnapshot of querySnapshot.docs) {
      const data = docSnapshot.data();
      
      // Fetch comments for each post
      const comments = await fetchComments(docSnapshot.id);
      
      posts.push({
        id: docSnapshot.id,
        ...data,
        // Ensure likes array exists for backward compatibility
        likes: data.likes || [],
        likeCount: data.likeCount || 0,
        comments: comments,
        commentCount: data.commentCount || comments.length,
      } as Post);
    }

    return posts;
  } catch (error) {
    console.error("Error fetching posts:", error);
    return [];
  }
};

/**
 * Fetch posts by specific user
 */
export const fetchUserPosts = async (userId: string): Promise<Post[]> => {
  try {
    const postsRef = collection(db, "Posts");
    const q = query(
      postsRef,
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);

    const posts: Post[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      posts.push({
        id: doc.id,
        ...data,
        // Ensure likes array exists for backward compatibility
        likes: data.likes || [],
        likeCount: data.likeCount || 0,
      } as Post);
    });

    return posts;
  } catch (error) {
    console.error("Error fetching user posts:", error);
    return [];
  }
};

/**
 * Update an existing post
 */
export const updatePost = async (
  postId: string,
  data: UpdatePostData
): Promise<{ success: boolean; error?: string }> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const updateData: any = {
      updatedAt: Date.now(),
    };

    // Update title if provided
    if (data.title !== undefined) {
      updateData.title = data.title;
    }

    // Update description if provided
    if (data.description !== undefined) {
      updateData.description = data.description;
    }

    // Update date if provided
    if (data.date !== undefined) {
      updateData.date = data.date;
    }

    // Update startTime if provided
    if (data.startTime !== undefined) {
      updateData.startTime = data.startTime;
    }

    // Update endTime if provided
    if (data.endTime !== undefined) {
      updateData.endTime = data.endTime;
    }

    // Update imageUrl if provided (only add to update if it has a value)
    if (data.imageUrl !== undefined) {
      if (data.imageUrl) {
        updateData.imageUrl = data.imageUrl;
      } else {
        // If imageUrl is explicitly null or empty string, remove it
        updateData.imageUrl = null;
      }
    }

    const postRef = doc(db, "Posts", postId);
    await updateDoc(postRef, updateData);

    return { success: true };
  } catch (error) {
    console.error("Error updating post:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update post",
    };
  }
};

/**
 * Delete a post
 */
export const deletePost = async (
  postId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // Get post data to check for image
    const postRef = doc(db, "Posts", postId);
    const postsRef = collection(db, "Posts");
    const q = query(postsRef, where("__name__", "==", postId));
    const querySnapshot = await getDocs(q);

    // Delete associated image if it exists
    if (!querySnapshot.empty) {
      const postData = querySnapshot.docs[0].data();
      if (postData.imageUrl) {
        await deletePostImage(postData.imageUrl);
      }
    }

    // Delete post document
    await deleteDoc(postRef);

    return { success: true };
  } catch (error) {
    console.error("Error deleting post:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete post",
    };
  }
};

/**
 * Format date for display
 */
export const formatPostDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return date.toLocaleDateString("en-US", options);
  } catch (error) {
    return dateString;
  }
};

/**
 * Format time for display (e.g., "2:30 PM")
 */
export const formatPostTime = (timeString: string): string => {
  try {
    const date = new Date(timeString);
    const options: Intl.DateTimeFormatOptions = {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    };
    return date.toLocaleTimeString("en-US", options);
  } catch (error) {
    return timeString;
  }
};

/**
 * Format relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (timestamp: number): string => {
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
};

/**
 * Toggle like on a post
 */
export const toggleLike = async (
  postId: string,
  currentLikes: string[]
): Promise<{ success: boolean; error?: string; liked?: boolean }> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const postRef = doc(db, "Posts", postId);
    const hasLiked = currentLikes.includes(user.uid);

    let updatedLikes: string[];
    if (hasLiked) {
      // Unlike: remove user ID from likes array
      updatedLikes = currentLikes.filter((id) => id !== user.uid);
    } else {
      // Like: add user ID to likes array
      updatedLikes = [...currentLikes, user.uid];
    }

    await updateDoc(postRef, {
      likes: updatedLikes,
      likeCount: updatedLikes.length,
    });

    return { success: true, liked: !hasLiked };
  } catch (error) {
    console.error("Error toggling like:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to toggle like",
    };
  }
};

/**
 * Add a comment to a post
 */
export const addComment = async (
  postId: string,
  text: string
): Promise<{ success: boolean; error?: string; commentId?: string }> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    if (!text.trim()) {
      return { success: false, error: "Comment text cannot be empty" };
    }

    // Get user's name and profile picture from Users collection
    const usersRef = collection(db, "Users");
    const userQuery = query(usersRef, where("uid", "==", user.uid));
    const userSnapshot = await getDocs(userQuery);

    let userName = "Anonymous";
    let userProfilePicture = "";
    if (!userSnapshot.empty) {
      const userData = userSnapshot.docs[0].data();
      userName = `${userData.firstName || ""} ${userData.lastName || ""}`.trim() || userData.Email || "Anonymous";
      userProfilePicture = userData.profilePicture || userData.profilePictureUrl || "";
    }

    // Add comment to subcollection
    const commentsRef = collection(db, "Posts", postId, "comments");
    const commentData = {
      userId: user.uid,
      userName,
      userProfilePicture,
      text: text.trim(),
      createdAt: Date.now(),
    };

    const commentRef = await addDoc(commentsRef, commentData);

    // Update comment count on post
    const postRef = doc(db, "Posts", postId);
    const postDoc = await getDocs(query(collection(db, "Posts"), where("__name__", "==", postId)));
    let currentCommentCount = 0;
    if (!postDoc.empty) {
      const postData = postDoc.docs[0].data();
      currentCommentCount = postData.commentCount || 0;
    }

    await updateDoc(postRef, {
      commentCount: (currentCommentCount || 0) + 1,
    });

    return { success: true, commentId: commentRef.id };
  } catch (error) {
    console.error("Error adding comment:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to add comment",
    };
  }
};

/**
 * Fetch comments for a post
 */
export const fetchComments = async (postId: string): Promise<Comment[]> => {
  try {
    const commentsRef = collection(db, "Posts", postId, "comments");
    const q = query(commentsRef, orderBy("createdAt", "asc"));
    const querySnapshot = await getDocs(q);

    const comments: Comment[] = [];
    querySnapshot.forEach((doc) => {
      comments.push({
        id: doc.id,
        ...doc.data(),
      } as Comment);
    });

    return comments;
  } catch (error) {
    console.error("Error fetching comments:", error);
    return [];
  }
};
