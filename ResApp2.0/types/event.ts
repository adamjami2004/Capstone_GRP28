export type EventCategory = "Cat1" | "Cat2" | "Cat3";

export interface Event {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  deadline: Date | string;
  imageUrl: string;
  createdBy: string; // user email
  createdAt: Date | string;
  updatedAt?: Date | string;
}

export interface CreateEventInput {
  title: string;
  description: string;
  category: EventCategory;
  deadline: Date;
  imageUri: string; // local image URI before upload
}

export interface UpdateEventInput {
  id: string;
  title?: string;
  description?: string;
  category?: EventCategory;
  deadline?: Date;
  imageUri?: string;
}


