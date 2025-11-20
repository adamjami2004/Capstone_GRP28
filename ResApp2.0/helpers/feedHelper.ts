import { auth, db } from "@/firebase";
import { CreatePostData, Post, UpdatePostData } from "@/types/feed";
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

    // Get user's name from Users collection
    const usersRef = collection(db, "Users");
    const userQuery = query(usersRef, where("uid", "==", user.uid));
    const userSnapshot = await getDocs(userQuery);

    let userName = "Anonymous";
    if (!userSnapshot.empty) {
      const userData = userSnapshot.docs[0].data();
      userName = `${userData.firstName || ""} ${userData.lastName || ""}`.trim() || userData.Email || "Anonymous";
    }

    // Create post document
    const postData: any = {
      userId: user.uid,
      userName,
      title: data.title,
      description: data.description,
      date: data.date,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      likes: [],
      likeCount: 0,
    };

    // Only add imageUrl if it exists (Firestore doesn't allow undefined)
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

    // Update image URL if provided (only add if not undefined)
    if (data.imageUrl !== undefined && data.imageUrl !== null) {
      updateData.imageUrl = data.imageUrl;
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

    // Delete post document
    const postRef = doc(db, "Posts", postId);
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
