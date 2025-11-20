export interface Post {
  id: string;
  userId: string;
  userName: string;
  title: string;
  description: string;
  date: string; // ISO date string
  imageUrl?: string; // Optional image URL
  createdAt: number; // timestamp
  updatedAt: number; // timestamp
  likes: string[]; // Array of user IDs who liked the post
  likeCount: number; // Total number of likes
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

