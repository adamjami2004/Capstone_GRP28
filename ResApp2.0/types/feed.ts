export interface Post {
  id: string;
  userId: string;
  userName: string;
  userProfilePicture?: string; // Optional user profile picture URL
  title: string;
  description: string;
  date: string; // ISO date string
  createdAt: number; // timestamp
  updatedAt: number; // timestamp
  likes: string[]; // Array of user IDs who liked the post
  likeCount: number; // Total number of likes
  imageUrl?: string; // Optional image URL
}

export interface CreatePostData {
  title: string;
  description: string;
  date: string;
  imageUrl?: string; // Optional image URL
}

export interface UpdatePostData {
  title?: string;
  description?: string;
  date?: string;
  imageUrl?: string; // Optional image URL
}

