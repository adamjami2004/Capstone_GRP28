/**
 * Shift Cover Management System - Helper Functions
 */

import { db, auth } from "@/firebase";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  getDocs,
  serverTimestamp,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import {
  Shift,
  CoverRequest,
  formatTimeRange,
  getMonthFromDate,
} from "@/types/shift";

/**
 * Create a new shift
 */
export async function createShift(
  userEmail: string,
  shiftData: {
    date: string;
    startTime: string;
    endTime: string;
    location: string;
    description?: string;
  }
): Promise<{ success: boolean; error?: string; shiftId?: string }> {
  try {
    // Get user info
    const usersRef = collection(db, "Users");
    const userQuery = query(usersRef, where("Email", "==", userEmail));
    const userSnapshot = await getDocs(userQuery);

    if (userSnapshot.empty) {
      return { success: false, error: "User not found" };
    }

    const userData = userSnapshot.docs[0].data();
    const userId = auth.currentUser?.uid || "";
    const userName = `${userData.firstName} ${userData.lastName}`;

    const shift: Omit<Shift, "id"> = {
      userId,
      userEmail,
      userName,
      originalUserId: userId,
      originalUserEmail: userEmail,
      originalUserName: userName,
      date: shiftData.date,
      month: getMonthFromDate(shiftData.date),
      startTime: shiftData.startTime,
      endTime: shiftData.endTime,
      location: shiftData.location,
      description: shiftData.description,
      status: "scheduled",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, "Shifts"), shift);
    return { success: true, shiftId: docRef.id };
  } catch (error) {
    console.error("Error creating shift:", error);
    return { success: false, error: "Failed to create shift" };
  }
}

/**
 * Request a cover for a shift
 */
export async function requestCover(
  shiftId: string,
  reason: string,
  userEmail: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get shift details
    const shiftsRef = collection(db, "Shifts");
    const shiftQuery = query(shiftsRef, where("__name__", "==", shiftId));
    const shiftSnapshot = await getDocs(shiftQuery);

    if (shiftSnapshot.empty) {
      return { success: false, error: "Shift not found" };
    }

    const shift = shiftSnapshot.docs[0].data() as Shift;

    // Verify user owns the shift
    if (shift.userEmail !== userEmail) {
      return { success: false, error: "You can only request covers for your own shifts" };
    }

    // Check if cover already requested
    if (shift.status === "cover_requested" || shift.status === "cover_pending_approval") {
      return { success: false, error: "Cover already requested for this shift" };
    }

    // Get user info
    const usersRef = collection(db, "Users");
    const userQuery = query(usersRef, where("Email", "==", userEmail));
    const userSnapshot = await getDocs(userQuery);

    if (userSnapshot.empty) {
      return { success: false, error: "User not found" };
    }

    const userData = userSnapshot.docs[0].data();
    const userId = auth.currentUser?.uid || "";
    const userName = `${userData.firstName} ${userData.lastName}`;

    // Create cover request
    const coverRequest: Omit<CoverRequest, "id"> = {
      shiftId,
      shiftDate: shift.date,
      shiftTime: formatTimeRange(shift.startTime, shift.endTime),
      shiftLocation: shift.location,
      requestedBy: userName,
      requestedByEmail: userEmail,
      requestedByUserId: userId,
      reason,
      status: "open",
      createdAt: serverTimestamp(),
    };

    await addDoc(collection(db, "CoverRequests"), coverRequest);

    // Update shift status
    const shiftDocRef = doc(db, "Shifts", shiftId);
    await updateDoc(shiftDocRef, {
      status: "cover_requested",
      updatedAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error requesting cover:", error);
    return { success: false, error: "Failed to request cover" };
  }
}

/**
 * Take/accept a cover request
 */
export async function takeCover(
  coverRequestId: string,
  userEmail: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get cover request
    const coverRef = doc(db, "CoverRequests", coverRequestId);
    const coverSnapshot = await getDocs(query(collection(db, "CoverRequests"), where("__name__", "==", coverRequestId)));

    if (coverSnapshot.empty) {
      return { success: false, error: "Cover request not found" };
    }

    const coverData = coverSnapshot.docs[0].data() as CoverRequest;

    // Check if still open
    if (coverData.status !== "open") {
      return { success: false, error: "This cover request is no longer available" };
    }

    // Can't take your own cover request
    if (coverData.requestedByEmail === userEmail) {
      return { success: false, error: "You cannot take your own cover request" };
    }

    // Get user info
    const usersRef = collection(db, "Users");
    const userQuery = query(usersRef, where("Email", "==", userEmail));
    const userSnapshot = await getDocs(userQuery);

    if (userSnapshot.empty) {
      return { success: false, error: "User not found" };
    }

    const userData = userSnapshot.docs[0].data();
    const userId = auth.currentUser?.uid || "";
    const userName = `${userData.firstName} ${userData.lastName}`;

    // Update cover request
    await updateDoc(coverRef, {
      takenBy: userName,
      takenByEmail: userEmail,
      takenByUserId: userId,
      status: "pending_approval",
      takenAt: serverTimestamp(),
    });

    // Update shift status
    const shiftDocRef = doc(db, "Shifts", coverData.shiftId);
    await updateDoc(shiftDocRef, {
      status: "cover_pending_approval",
      updatedAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error taking cover:", error);
    return { success: false, error: "Failed to take cover" };
  }
}

/**
 * Approve a cover request (TL/Admin only)
 */
export async function approveCover(
  coverRequestId: string,
  userEmail: string,
  reviewNotes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get cover request
    const coverSnapshot = await getDocs(
      query(collection(db, "CoverRequests"), where("__name__", "==", coverRequestId))
    );

    if (coverSnapshot.empty) {
      return { success: false, error: "Cover request not found" };
    }

    const coverData = coverSnapshot.docs[0].data() as CoverRequest;

    // Check if pending approval
    if (coverData.status !== "pending_approval") {
      return { success: false, error: "This cover request is not pending approval" };
    }

    // Get reviewer info
    const usersRef = collection(db, "Users");
    const userQuery = query(usersRef, where("Email", "==", userEmail));
    const userSnapshot = await getDocs(userQuery);

    if (userSnapshot.empty) {
      return { success: false, error: "User not found" };
    }

    const userData = userSnapshot.docs[0].data();
    const reviewerName = `${userData.firstName} ${userData.lastName}`;

    // Update cover request
    const coverRef = doc(db, "CoverRequests", coverRequestId);
    await updateDoc(coverRef, {
      status: "approved",
      reviewedBy: reviewerName,
      reviewedByEmail: userEmail,
      reviewNotes: reviewNotes || "",
      reviewedAt: serverTimestamp(),
    });

    // Update shift - reassign to new user
    const shiftDocRef = doc(db, "Shifts", coverData.shiftId);
    await updateDoc(shiftDocRef, {
      userId: coverData.takenByUserId,
      userEmail: coverData.takenByEmail,
      userName: coverData.takenBy,
      status: "scheduled",
      updatedAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error approving cover:", error);
    return { success: false, error: "Failed to approve cover" };
  }
}

/**
 * Reject a cover request (TL/Admin only)
 */
export async function rejectCover(
  coverRequestId: string,
  userEmail: string,
  reviewNotes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get cover request
    const coverSnapshot = await getDocs(
      query(collection(db, "CoverRequests"), where("__name__", "==", coverRequestId))
    );

    if (coverSnapshot.empty) {
      return { success: false, error: "Cover request not found" };
    }

    const coverData = coverSnapshot.docs[0].data() as CoverRequest;

    // Check if pending approval
    if (coverData.status !== "pending_approval") {
      return { success: false, error: "This cover request is not pending approval" };
    }

    // Get reviewer info
    const usersRef = collection(db, "Users");
    const userQuery = query(usersRef, where("Email", "==", userEmail));
    const userSnapshot = await getDocs(userQuery);

    if (userSnapshot.empty) {
      return { success: false, error: "User not found" };
    }

    const userData = userSnapshot.docs[0].data();
    const reviewerName = `${userData.firstName} ${userData.lastName}`;

    // Update cover request
    const coverRef = doc(db, "CoverRequests", coverRequestId);
    await updateDoc(coverRef, {
      status: "rejected",
      reviewedBy: reviewerName,
      reviewedByEmail: userEmail,
      reviewNotes: reviewNotes || "",
      reviewedAt: serverTimestamp(),
    });

    // Update shift - return to scheduled
    const shiftDocRef = doc(db, "Shifts", coverData.shiftId);
    await updateDoc(shiftDocRef, {
      status: "scheduled",
      updatedAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error rejecting cover:", error);
    return { success: false, error: "Failed to reject cover" };
  }
}

/**
 * Cancel a cover request (requester only, before it's taken)
 */
export async function cancelCover(
  coverRequestId: string,
  userEmail: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get cover request
    const coverSnapshot = await getDocs(
      query(collection(db, "CoverRequests"), where("__name__", "==", coverRequestId))
    );

    if (coverSnapshot.empty) {
      return { success: false, error: "Cover request not found" };
    }

    const coverData = coverSnapshot.docs[0].data() as CoverRequest;

    // Verify user is the requester
    if (coverData.requestedByEmail !== userEmail) {
      return { success: false, error: "You can only cancel your own cover requests" };
    }

    // Can only cancel if still open
    if (coverData.status !== "open") {
      return { success: false, error: "Can only cancel open cover requests" };
    }

    // Update cover request
    const coverRef = doc(db, "CoverRequests", coverRequestId);
    await updateDoc(coverRef, {
      status: "cancelled",
    });

    // Update shift back to scheduled
    const shiftDocRef = doc(db, "Shifts", coverData.shiftId);
    await updateDoc(shiftDocRef, {
      status: "scheduled",
      updatedAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error cancelling cover:", error);
    return { success: false, error: "Failed to cancel cover" };
  }
}

