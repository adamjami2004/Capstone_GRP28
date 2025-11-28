// Types for announcements system

export interface Announcement {
  id: string;
  title: string;
  content: string;
  tag: "urgent" | "normal";
  publisherId: string;
  publisherName: string;
  publisherEmail: string;
  publisherProfilePicture?: string; // Publisher's profile picture URL
  attachmentUrl?: string; // Optional PDF/document URL
  attachmentName?: string; // Original filename
  readBy: string[]; // Array of user IDs who marked as read
  readCount: number;
  createdAt: number; // timestamp
  updatedAt: number; // timestamp
}

export interface CreateAnnouncementData {
  title: string;
  content: string;
  tag: "urgent" | "normal";
  attachmentUrl?: string;
  attachmentName?: string;
}

export interface UpdateAnnouncementData {
  title?: string;
  content?: string;
  tag?: "urgent" | "normal";
  attachmentUrl?: string;
  attachmentName?: string;
}

