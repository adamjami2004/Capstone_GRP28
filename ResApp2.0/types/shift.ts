/**
 * Shift Cover Management System - Type Definitions
 */

/**
 * Shift represents a work shift assigned to a user
 */
export type Shift = {
  id: string;
  // Current assignment (updated only after TL/Admin approval)
  userId: string;
  userEmail: string;
  userName: string;
  // Original assignment (never changes, for audit trail)
  originalUserId: string;
  originalUserEmail: string;
  originalUserName: string;
  // Shift details
  date: string; // YYYY-MM-DD
  month: string; // YYYY-MM for efficient filtering
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  location: string;
  description?: string;
  // Status tracking
  status: ShiftStatus;
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
};

export type ShiftStatus =
  | "scheduled" // Normal scheduled shift
  | "cover_requested" // User has requested a cover
  | "cover_pending_approval" // Cover taken, waiting for TL/Admin approval
  | "completed" // Shift completed
  | "cancelled"; // Shift cancelled

/**
 * CoverRequest manages the cover request workflow
 */
export type CoverRequest = {
  id: string;
  // Shift reference
  shiftId: string;
  // Denormalized shift data for display
  shiftDate: string; // YYYY-MM-DD
  shiftTime: string; // "HH:MM - HH:MM"
  shiftLocation: string;
  // Requester (original user)
  requestedBy: string;
  requestedByEmail: string;
  requestedByUserId: string;
  requestedByResidence: string;
  // Person who accepted the cover
  takenBy?: string;
  takenByEmail?: string;
  takenByUserId?: string;
  // Request details
  reason: string;
  status: CoverRequestStatus;
  // Review information (TL/Admin)
  reviewedBy?: string;
  reviewedByEmail?: string;
  reviewNotes?: string;
  // Timestamps
  createdAt: any; // Firestore Timestamp
  takenAt?: any; // When someone accepted
  reviewedAt?: any; // When TL/Admin approved/rejected
};

export type CoverRequestStatus =
  | "open" // Available for anyone to take
  | "pending_approval" // Taken, waiting for TL/Admin approval
  | "approved" // Approved by TL/Admin
  | "rejected" // Rejected by TL/Admin
  | "cancelled"; // Cancelled by requester

/**
 * User role types
 */
export type UserRole = "Staff" | "CA" | "TL" | "Admin";

/**
 * Helper to determine if user is a CA (not TL or Admin)
 */
export function isCA(role: UserRole): boolean {
  return role !== "TL" && role !== "Admin";
}

/**
 * Helper to determine if user can approve covers
 */
export function canApproveCover(role: UserRole): boolean {
  return role === "TL" || role === "Admin";
}

/**
 * Format month string from date
 */
export function getMonthFromDate(date: string): string {
  return date.substring(0, 7); // "YYYY-MM-DD" -> "YYYY-MM"
}

/**
 * Format time range for display
 */
export function formatTimeRange(startTime: string, endTime: string): string {
  return `${startTime} - ${endTime}`;
}

/**
 * Format date for display
 */
export function formatShiftDate(dateString: string): string {
  // Parse date manually to avoid timezone issues
  // dateString format: "YYYY-MM-DD"
  const [year, month, day] = dateString.split('-').map(Number);
  // Month is 0-indexed in JavaScript Date
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Get current month in YYYY-MM format
 */
export function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/**
 * Get month options for selector
 */
export function getMonthOptions(count: number = 6): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const label = date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
    options.push({ value, label });
  }
  
  return options;
}

