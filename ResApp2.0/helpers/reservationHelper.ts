// Reservation helper functions for room booking system
import { auth, db } from "@/firebase";
import {
    CreateReservationData,
    Reservation,
    Room,
    UpdateReservationData
} from "@/types/reservation";
import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    serverTimestamp,
    updateDoc,
    where
} from "firebase/firestore";

/**
 * Fetch all active rooms from Firestore
 */
export async function fetchRooms(): Promise<Room[]> {
  try {
    const roomsRef = collection(db, "Rooms");
    const q = query(roomsRef, where("isActive", "==", true));
    const querySnapshot = await getDocs(q);

    const rooms: Room[] = [];
    querySnapshot.forEach((doc) => {
      rooms.push({ id: doc.id, ...doc.data() } as Room);
    });

    return rooms;
  } catch (error) {
    console.error("Error fetching rooms:", error);
    throw new Error("Failed to fetch rooms");
  }
}

/**
 * Fetch a single room by ID
 */
export async function fetchRoomById(roomId: string): Promise<Room | null> {
  try {
    const roomRef = doc(db, "Rooms", roomId);
    const roomDoc = await getDoc(roomRef);

    if (roomDoc.exists()) {
      return { id: roomDoc.id, ...roomDoc.data() } as Room;
    }
    return null;
  } catch (error) {
    console.error("Error fetching room:", error);
    throw new Error("Failed to fetch room");
  }
}

/**
 * Parse time string (HH:MM) to minutes since midnight
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Check if two time ranges overlap
 */
function timeRangesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const start1Minutes = timeToMinutes(start1);
  const end1Minutes = timeToMinutes(end1);
  const start2Minutes = timeToMinutes(start2);
  const end2Minutes = timeToMinutes(end2);

  // Ranges overlap if one starts before the other ends
  return start1Minutes < end2Minutes && start2Minutes < end1Minutes;
}

/**
 * Validate time range
 */
export function validateTimeRange(
  startTime: string,
  endTime: string
): { valid: boolean; error?: string } {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  if (startMinutes >= endMinutes) {
    return { valid: false, error: "End time must be after start time" };
  }

  if (endMinutes - startMinutes < 30) {
    return {
      valid: false,
      error: "Reservation must be at least 30 minutes long",
    };
  }

  if (endMinutes - startMinutes > 480) {
    return {
      valid: false,
      error: "Reservation cannot exceed 8 hours",
    };
  }

  return { valid: true };
}

/**
 * Parse a YYYY-MM-DD date string as a local date (not UTC)
 * This avoids timezone issues where "2024-11-30" becomes Nov 29 in local time
 */
export function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day); // month is 0-indexed
}

/**
 * Validate reservation date
 */
export function validateReservationDate(date: string): {
  valid: boolean;
  error?: string;
} {
  // Parse date as local date to avoid timezone issues
  const selectedDate = parseLocalDate(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (selectedDate < today) {
    return { valid: false, error: "Cannot book rooms in the past" };
  }

  // Check if date is within 90 days from now
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 90);

  if (selectedDate > maxDate) {
    return { valid: false, error: "Cannot book more than 90 days in advance" };
  }

  return { valid: true };
}

/**
 * Check for booking conflicts
 */
export async function checkReservationConflict(
  roomId: string,
  date: string,
  startTime: string,
  endTime: string,
  excludeReservationId?: string
): Promise<{ hasConflict: boolean; conflictingReservation?: Reservation }> {
  try {
    const reservationsRef = collection(db, "Reservations");
    const q = query(
      reservationsRef,
      where("roomId", "==", roomId),
      where("date", "==", date),
      where("status", "==", "confirmed")
    );

    const querySnapshot = await getDocs(q);
    
    for (const docSnapshot of querySnapshot.docs) {
      const reservation = { id: docSnapshot.id, ...docSnapshot.data() } as Reservation;
      
      // Skip if this is the reservation being updated
      if (excludeReservationId && reservation.id === excludeReservationId) {
        continue;
      }

      // Check for time overlap
      if (
        timeRangesOverlap(
          startTime,
          endTime,
          reservation.startTime,
          reservation.endTime
        )
      ) {
        return { hasConflict: true, conflictingReservation: reservation };
      }
    }

    return { hasConflict: false };
  } catch (error) {
    console.error("Error checking conflicts:", error);
    throw new Error("Failed to check reservation conflicts");
  }
}

/**
 * Create a new reservation
 */
export async function createReservation(
  data: CreateReservationData
): Promise<{ success: boolean; reservationId?: string; error?: string }> {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // Validate date
    const dateValidation = validateReservationDate(data.date);
    if (!dateValidation.valid) {
      return { success: false, error: dateValidation.error };
    }

    // Validate time range
    const timeValidation = validateTimeRange(data.startTime, data.endTime);
    if (!timeValidation.valid) {
      return { success: false, error: timeValidation.error };
    }

    // Check for conflicts
    const conflictCheck = await checkReservationConflict(
      data.roomId,
      data.date,
      data.startTime,
      data.endTime
    );

    if (conflictCheck.hasConflict) {
      return {
        success: false,
        error: "This time slot is already booked. Please choose another time.",
      };
    }

    // Fetch room details
    const room = await fetchRoomById(data.roomId);
    if (!room) {
      return { success: false, error: "Room not found" };
    }

    // Fetch user details
    const usersRef = collection(db, "Users");
    const userQuery = query(usersRef, where("uid", "==", user.uid));
    const userSnapshot = await getDocs(userQuery);

    let userName = user.displayName || "Unknown User";
    if (!userSnapshot.empty) {
      const userData = userSnapshot.docs[0].data();
      userName = `${userData.firstName} ${userData.lastName}`;
    }

    // Create reservation
    const reservationsRef = collection(db, "Reservations");
    const reservationData = {
      roomId: data.roomId,
      roomName: room.name,
      userId: user.uid,
      userEmail: user.email || "",
      userName: userName,
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      purpose: data.purpose || "",
      status: "confirmed",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: user.uid,
    };

    const docRef = await addDoc(reservationsRef, reservationData);

    return { success: true, reservationId: docRef.id };
  } catch (error: any) {
    console.error("Error creating reservation:", error);
    return {
      success: false,
      error: error.message || "Failed to create reservation",
    };
  }
}

/**
 * Update an existing reservation
 */
export async function updateReservation(
  reservationId: string,
  data: UpdateReservationData
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // Fetch existing reservation
    const reservationRef = doc(db, "Reservations", reservationId);
    const reservationDoc = await getDoc(reservationRef);

    if (!reservationDoc.exists()) {
      return { success: false, error: "Reservation not found" };
    }

    const existingReservation = reservationDoc.data() as Reservation;

    // Check permissions - user can only update their own reservations unless they're admin
    const usersRef = collection(db, "Users");
    const userQuery = query(usersRef, where("uid", "==", user.uid));
    const userSnapshot = await getDocs(userQuery);
    
    let isAdmin = false;
    if (!userSnapshot.empty) {
      const userData = userSnapshot.docs[0].data();
      isAdmin = userData.role === "Admin" || userData.role === "Super Admin";
    }

    if (existingReservation.userId !== user.uid && !isAdmin) {
      return { success: false, error: "You can only modify your own reservations" };
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: serverTimestamp(),
    };

    // If updating time or date, validate and check conflicts
    const newDate = data.date || existingReservation.date;
    const newStartTime = data.startTime || existingReservation.startTime;
    const newEndTime = data.endTime || existingReservation.endTime;

    if (data.date || data.startTime || data.endTime) {
      // Validate date
      const dateValidation = validateReservationDate(newDate);
      if (!dateValidation.valid) {
        return { success: false, error: dateValidation.error };
      }

      // Validate time range
      const timeValidation = validateTimeRange(newStartTime, newEndTime);
      if (!timeValidation.valid) {
        return { success: false, error: timeValidation.error };
      }

      // Check for conflicts (excluding current reservation)
      const conflictCheck = await checkReservationConflict(
        existingReservation.roomId,
        newDate,
        newStartTime,
        newEndTime,
        reservationId
      );

      if (conflictCheck.hasConflict) {
        return {
          success: false,
          error: "This time slot is already booked. Please choose another time.",
        };
      }

      if (data.date) updateData.date = data.date;
      if (data.startTime) updateData.startTime = data.startTime;
      if (data.endTime) updateData.endTime = data.endTime;
    }

    if (data.purpose !== undefined) {
      updateData.purpose = data.purpose;
    }

    // Update reservation
    await updateDoc(reservationRef, updateData);

    return { success: true };
  } catch (error: any) {
    console.error("Error updating reservation:", error);
    return {
      success: false,
      error: error.message || "Failed to update reservation",
    };
  }
}

/**
 * Cancel a reservation
 */
export async function cancelReservation(
  reservationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // Fetch existing reservation
    const reservationRef = doc(db, "Reservations", reservationId);
    const reservationDoc = await getDoc(reservationRef);

    if (!reservationDoc.exists()) {
      return { success: false, error: "Reservation not found" };
    }

    const existingReservation = reservationDoc.data() as Reservation;

    // Check permissions
    const usersRef = collection(db, "Users");
    const userQuery = query(usersRef, where("uid", "==", user.uid));
    const userSnapshot = await getDocs(userQuery);
    
    let isAdmin = false;
    if (!userSnapshot.empty) {
      const userData = userSnapshot.docs[0].data();
      isAdmin = userData.role === "Admin" || userData.role === "Super Admin";
    }

    if (existingReservation.userId !== user.uid && !isAdmin) {
      return { success: false, error: "You can only cancel your own reservations" };
    }

    // Cancel reservation
    await updateDoc(reservationRef, {
      status: "cancelled",
      cancelledAt: serverTimestamp(),
      cancelledBy: user.uid,
      updatedAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error cancelling reservation:", error);
    return {
      success: false,
      error: error.message || "Failed to cancel reservation",
    };
  }
}

/**
 * Get today's date in YYYY-MM-DD format using local timezone
 */
export function getTodayDateString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Fetch user's reservations
 */
export async function fetchUserReservations(
  userId: string,
  includeHistory: boolean = false
): Promise<Reservation[]> {
  try {
    const reservationsRef = collection(db, "Reservations");
    
    // Simplified query - fetch all user's reservations and filter/sort in memory
    // This avoids needing a composite index
    const q = query(
      reservationsRef,
      where("userId", "==", userId)
    );

    const querySnapshot = await getDocs(q);
    const allReservations: Reservation[] = [];

    querySnapshot.forEach((doc) => {
      allReservations.push({ id: doc.id, ...doc.data() } as Reservation);
    });

    // Get today's date string for comparison
    const todayString = getTodayDateString();

    // Filter and sort in memory
    let filteredReservations = allReservations;
    
    if (!includeHistory) {
      // Only show confirmed reservations that are today or in the future
      filteredReservations = allReservations.filter(r => 
        r.status === "confirmed" && r.date >= todayString
      );
    }

    // Sort by date and time
    filteredReservations.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) {
        return includeHistory ? -dateCompare : dateCompare; // desc for history, asc otherwise
      }
      return includeHistory 
        ? b.startTime.localeCompare(a.startTime) // desc for history
        : a.startTime.localeCompare(b.startTime); // asc otherwise
    });

    return filteredReservations;
  } catch (error) {
    console.error("Error fetching user reservations:", error);
    throw new Error("Failed to fetch reservations");
  }
}

/**
 * Fetch all reservations (admin only)
 */
export async function fetchAllReservations(
  filterDate?: string
): Promise<Reservation[]> {
  try {
    const reservationsRef = collection(db, "Reservations");
    
    // Simplified query - filter and sort in memory to avoid index requirements
    let q;
    
    if (filterDate) {
      q = query(
        reservationsRef,
        where("date", "==", filterDate),
        where("status", "==", "confirmed")
      );
    } else {
      q = query(
        reservationsRef,
        where("status", "==", "confirmed")
      );
    }

    const querySnapshot = await getDocs(q);
    const reservations: Reservation[] = [];

    querySnapshot.forEach((doc) => {
      reservations.push({ id: doc.id, ...doc.data() } as Reservation);
    });

    // Sort in memory
    reservations.sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date); // desc
      if (dateCompare !== 0) return dateCompare;
      return a.startTime.localeCompare(b.startTime); // asc
    });

    return reservations;
  } catch (error) {
    console.error("Error fetching all reservations:", error);
    throw new Error("Failed to fetch reservations");
  }
}

/**
 * Fetch reservations for a specific room and date
 */
export async function fetchRoomReservations(
  roomId: string,
  date: string
): Promise<Reservation[]> {
  try {
    const reservationsRef = collection(db, "Reservations");
    
    // Simplified query - filter by room, date, and status only
    // Sort in memory to avoid index requirement
    const q = query(
      reservationsRef,
      where("roomId", "==", roomId),
      where("date", "==", date),
      where("status", "==", "confirmed")
    );

    const querySnapshot = await getDocs(q);
    const reservations: Reservation[] = [];

    querySnapshot.forEach((doc) => {
      reservations.push({ id: doc.id, ...doc.data() } as Reservation);
    });

    // Sort by start time in memory
    reservations.sort((a, b) => a.startTime.localeCompare(b.startTime));

    return reservations;
  } catch (error) {
    console.error("Error fetching room reservations:", error);
    throw new Error("Failed to fetch room reservations");
  }
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  // Parse as local date to avoid timezone issues
  const date = parseLocalDate(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format time for display (convert 24h to 12h format)
 */
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
}

