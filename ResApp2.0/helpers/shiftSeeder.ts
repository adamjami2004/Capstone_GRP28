/**
 * Shift Seeder - Helper functions to create test data for Shift Cover System
 * 
 * Usage: Import these functions in a component or script to seed test data
 */

import { db } from "@/firebase";
import { collection, addDoc, serverTimestamp, getDocs, query, where } from "firebase/firestore";
import { Shift, CoverRequest } from "@/types/shift";

/**
 * Create sample shifts for a user
 */
export async function createSampleShifts(
  userEmail: string,
  count: number = 5
): Promise<{ success: boolean; error?: string; shiftsCreated?: number }> {
  try {
    // Get user info
    const usersRef = collection(db, "Users");
    const userQuery = query(usersRef, where("Email", "==", userEmail));
    const userSnapshot = await getDocs(userQuery);

    if (userSnapshot.empty) {
      return { success: false, error: "User not found" };
    }

    const userData = userSnapshot.docs[0].data();
    const userId = userSnapshot.docs[0].id;
    const userName = `${userData.firstName} ${userData.lastName}`;

    // Create shifts for the next 30 days
    const today = new Date();
    const shiftsCreated = [];

    for (let i = 0; i < count; i++) {
      const shiftDate = new Date(today);
      shiftDate.setDate(today.getDate() + i * 2); // Every 2 days

      const dateString = shiftDate.toISOString().split("T")[0]; // YYYY-MM-DD
      const month = dateString.substring(0, 7); // YYYY-MM

      const shifts = [
        { start: "08:00", end: "16:00", location: "Main Building" },
        { start: "16:00", end: "00:00", location: "East Wing" },
        { start: "10:00", end: "18:00", location: "West Wing" },
      ];

      const randomShift = shifts[i % shifts.length];

      const shift: Omit<Shift, "id"> = {
        userId,
        userEmail,
        userName,
        originalUserId: userId,
        originalUserEmail: userEmail,
        originalUserName: userName,
        date: dateString,
        month: month,
        startTime: randomShift.start,
        endTime: randomShift.end,
        location: randomShift.location,
        description: `Sample shift #${i + 1}`,
        status: "scheduled",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "Shifts"), shift);
      shiftsCreated.push(docRef.id);
    }

    return {
      success: true,
      shiftsCreated: shiftsCreated.length,
    };
  } catch (error) {
    console.error("Error creating sample shifts:", error);
    return { success: false, error: "Failed to create sample shifts" };
  }
}

/**
 * Create a sample cover request for a shift
 */
export async function createSampleCoverRequest(
  shiftId: string,
  requesterEmail: string
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

    // Get requester info
    const usersRef = collection(db, "Users");
    const userQuery = query(usersRef, where("Email", "==", requesterEmail));
    const userSnapshot = await getDocs(userQuery);

    if (userSnapshot.empty) {
      return { success: false, error: "User not found" };
    }

    const userData = userSnapshot.docs[0].data();
    const userId = userSnapshot.docs[0].id;
    const userName = `${userData.firstName} ${userData.lastName}`;

    const reasons = [
      "Medical appointment",
      "Family emergency",
      "Academic commitment",
      "Personal matter",
      "Schedule conflict",
    ];

    const coverRequest: Omit<CoverRequest, "id"> = {
      shiftId,
      shiftDate: shift.date,
      shiftTime: `${shift.startTime} - ${shift.endTime}`,
      shiftLocation: shift.location,
      requestedBy: userName,
      requestedByEmail: requesterEmail,
      requestedByUserId: userId,
      reason: reasons[Math.floor(Math.random() * reasons.length)],
      status: "open",
      createdAt: serverTimestamp(),
    };

    await addDoc(collection(db, "CoverRequests"), coverRequest);

    return { success: true };
  } catch (error) {
    console.error("Error creating sample cover request:", error);
    return { success: false, error: "Failed to create sample cover request" };
  }
}

/**
 * Get all shifts for a user
 */
export async function getUserShifts(
  userEmail: string
): Promise<{ success: boolean; shifts?: Shift[]; error?: string }> {
  try {
    const shiftsRef = collection(db, "Shifts");
    const shiftsQuery = query(shiftsRef, where("userEmail", "==", userEmail));
    const shiftsSnapshot = await getDocs(shiftsQuery);

    const shifts: Shift[] = [];
    shiftsSnapshot.forEach((doc) => {
      shifts.push({ id: doc.id, ...doc.data() } as Shift);
    });

    return { success: true, shifts };
  } catch (error) {
    console.error("Error getting user shifts:", error);
    return { success: false, error: "Failed to get user shifts" };
  }
}

/**
 * Complete seeding workflow for testing
 * Creates shifts for multiple users and some cover requests
 */
export async function seedTestData(): Promise<{
  success: boolean;
  summary?: string;
  error?: string;
}> {
  try {
    // Get all users
    const usersRef = collection(db, "Users");
    const usersSnapshot = await getDocs(usersRef);

    if (usersSnapshot.empty) {
      return {
        success: false,
        error: "No users found in database. Please create users first.",
      };
    }

    const users = usersSnapshot.docs.map((doc) => ({
      id: doc.id,
      email: doc.data().Email,
      name: `${doc.data().firstName} ${doc.data().lastName}`,
      role: doc.data().role,
    }));

    console.log(`Found ${users.length} users to seed data for`);

    let totalShifts = 0;
    let totalRequests = 0;

    // Create shifts for each user
    for (const user of users) {
      const result = await createSampleShifts(user.email, 3);
      if (result.success) {
        totalShifts += result.shiftsCreated || 0;
        console.log(`Created ${result.shiftsCreated} shifts for ${user.name}`);
      }
    }

    // Create some cover requests (for first user if available)
    if (users.length > 0) {
      const firstUserEmail = users[0].email;
      const shiftsResult = await getUserShifts(firstUserEmail);

      if (shiftsResult.success && shiftsResult.shifts && shiftsResult.shifts.length > 0) {
        // Create cover request for the first shift
        const firstShift = shiftsResult.shifts[0];
        const requestResult = await createSampleCoverRequest(
          firstShift.id,
          firstUserEmail
        );

        if (requestResult.success) {
          totalRequests++;
          console.log(`Created cover request for ${firstShift.id}`);
        }
      }
    }

    return {
      success: true,
      summary: `Created ${totalShifts} shifts and ${totalRequests} cover requests for ${users.length} users`,
    };
  } catch (error) {
    console.error("Error seeding test data:", error);
    return { success: false, error: "Failed to seed test data" };
  }
}

/**
 * Clear all shifts and cover requests (use with caution!)
 */
export async function clearAllShiftData(): Promise<{
  success: boolean;
  summary?: string;
  error?: string;
}> {
  try {
    console.warn("Clearing all shift data...");

    // Get all shifts
    const shiftsRef = collection(db, "Shifts");
    const shiftsSnapshot = await getDocs(shiftsRef);

    // Get all cover requests
    const coversRef = collection(db, "CoverRequests");
    const coversSnapshot = await getDocs(coversRef);

    // Note: Firestore doesn't support batch deletes in client SDK
    // This is a simplified version - in production, use Cloud Functions

    console.log(
      `Would delete ${shiftsSnapshot.size} shifts and ${coversSnapshot.size} cover requests`
    );

    return {
      success: true,
      summary: `Found ${shiftsSnapshot.size} shifts and ${coversSnapshot.size} cover requests. Use Firestore Console or Cloud Functions to delete in production.`,
    };
  } catch (error) {
    console.error("Error clearing shift data:", error);
    return { success: false, error: "Failed to clear shift data" };
  }
}

