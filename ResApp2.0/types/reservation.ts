// Types for room reservation system

export interface Room {
  id: string;
  name: string;
  capacity: number;
  location: string;
  description?: string;
  amenities: string[];
  isActive: boolean;
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}

export interface Reservation {
  id: string;
  roomId: string;
  roomName: string;
  userId: string;
  userEmail: string;
  userName: string;
  date: string; // Format: YYYY-MM-DD
  startTime: string; // Format: HH:MM (24-hour)
  endTime: string; // Format: HH:MM (24-hour)
  purpose?: string;
  status: 'confirmed' | 'cancelled';
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
  createdBy: string; // User ID who created
  cancelledAt?: any; // Firestore Timestamp
  cancelledBy?: string; // User ID who cancelled
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  reservationId?: string;
}

export interface CreateReservationData {
  roomId: string;
  date: string;
  startTime: string;
  endTime: string;
  purpose?: string;
}

export interface UpdateReservationData {
  date?: string;
  startTime?: string;
  endTime?: string;
  purpose?: string;
}

