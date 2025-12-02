export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userProfilePicture?: string;
  text: string;
  createdAt: number; // timestamp
}

export interface Post {
  id: string;
  userId: string;
  userName: string;
  userProfilePicture?: string; // User's profile picture URL
  title: string;
  description: string;
  date: string; // ISO date string
  startTime: string; // ISO time string for event start
  endTime: string; // ISO time string for event end
  imageUrl?: string; // Optional image URL from Firebase Storage
  createdAt: number; // timestamp
  updatedAt: number; // timestamp
  likes: string[]; // Array of user IDs who liked the post
  likeCount: number; // Total number of likes
  comments?: Comment[]; // Array of comments
  commentCount?: number; // Total number of comments
}

export interface CreatePostData {
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  imageUrl?: string;
}

export interface UpdatePostData {
  title?: string;
  description?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  imageUrl?: string;
}

