export interface Post {
  id: string;
  userId: string;
  userName: string;
  userProfilePicture?: string; // User's profile picture URL
  title: string;
  description: string;
  date: string; // ISO date string
  imageUrl?: string; // Optional image URL from Firebase Storage
  createdAt: number; // timestamp
  updatedAt: number; // timestamp
  likes: string[]; // Array of user IDs who liked the post
  likeCount: number; // Total number of likes
}

export interface CreatePostData {
  title: string;
  description: string;
  date: string;
  imageUrl?: string;
}

export interface UpdatePostData {
  title?: string;
  description?: string;
  date?: string;
  imageUrl?: string;
}

