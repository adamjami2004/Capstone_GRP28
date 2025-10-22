/**
 * Script to seed the Firestore database with sample rooms
 * 
 * This script should be run once to populate the database with initial room data.
 * You can run this from a React Native component or admin panel.
 */

import { addDoc, collection, getDocs, query, serverTimestamp, where } from "firebase/firestore";
import { db } from "../firebase";

export const sampleRooms = [
  {
    name: "Study Room A",
    capacity: 4,
    location: "Library - 1st Floor",
    description: "Quiet study room with whiteboard and projector",
    amenities: ["Whiteboard", "Projector", "WiFi", "Power Outlets"],
    isActive: true,
  },
  {
    name: "Study Room B",
    capacity: 6,
    location: "Library - 2nd Floor",
    description: "Medium-sized study room perfect for group work",
    amenities: ["Large Table", "Whiteboard", "WiFi", "Power Outlets"],
    isActive: true,
  },
  {
    name: "Conference Room",
    capacity: 12,
    location: "Main Building - 3rd Floor",
    description: "Large conference room with video conferencing capabilities",
    amenities: ["Conference Table", "TV Display", "Video Conferencing", "WiFi", "Power Outlets"],
    isActive: true,
  },
  {
    name: "Meeting Room 1",
    capacity: 8,
    location: "Student Center - Ground Floor",
    description: "Versatile meeting space with comfortable seating",
    amenities: ["Comfortable Seating", "Whiteboard", "WiFi", "Power Outlets"],
    isActive: true,
  },
  {
    name: "Study Booth",
    capacity: 2,
    location: "Library - Ground Floor",
    description: "Small private booth for individual or pair study",
    amenities: ["Desk", "WiFi", "Power Outlets", "Quiet"],
    isActive: true,
  },
  {
    name: "Collaboration Space",
    capacity: 10,
    location: "Innovation Hub - 2nd Floor",
    description: "Open collaborative space with flexible furniture",
    amenities: ["Flexible Seating", "Whiteboards", "Monitor", "WiFi", "Power Outlets"],
    isActive: true,
  },
];

/**
 * Seed rooms to Firestore
 * Returns the number of rooms added
 */
export async function seedRooms(): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const roomsRef = collection(db, "Rooms");
    
    // Check if rooms already exist
    const existingRooms = await getDocs(roomsRef);
    if (existingRooms.size > 0) {
      console.log(`Database already has ${existingRooms.size} rooms. Skipping seed.`);
      return { success: true, count: 0 };
    }

    let addedCount = 0;
    
    for (const room of sampleRooms) {
      await addDoc(roomsRef, {
        ...room,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      addedCount++;
    }

    console.log(`Successfully added ${addedCount} rooms to the database.`);
    return { success: true, count: addedCount };
  } catch (error: any) {
    console.error("Error seeding rooms:", error);
    return { success: false, count: 0, error: error.message };
  }
}

/**
 * Add a single room to Firestore
 */
export async function addRoom(roomData: {
  name: string;
  capacity: number;
  location: string;
  description?: string;
  amenities: string[];
  isActive: boolean;
}): Promise<{ success: boolean; error?: string; roomId?: string }> {
  try {
    const roomsRef = collection(db, "Rooms");
    
    // Check if room with same name already exists
    const q = query(roomsRef, where("name", "==", roomData.name));
    const existingRoom = await getDocs(q);
    
    if (!existingRoom.empty) {
      return { success: false, error: "A room with this name already exists" };
    }

    const docRef = await addDoc(roomsRef, {
      ...roomData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { success: true, roomId: docRef.id };
  } catch (error: any) {
    console.error("Error adding room:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Instructions for running this script:
 * 
 * Option 1: From a React Native component (Admin Panel)
 * ---------------------------------------------------------
 * Import this function in your admin component:
 * 
 * import { seedRooms } from '@/scripts/seedRooms';
 * 
 * Then call it from a button:
 * 
 * const handleSeedRooms = async () => {
 *   const result = await seedRooms();
 *   if (result.success) {
 *     Alert.alert('Success', `Added ${result.count} rooms`);
 *   } else {
 *     Alert.alert('Error', result.error);
 *   }
 * };
 * 
 * 
 * Option 2: Using Firebase Console
 * ----------------------------------
 * You can manually add rooms through the Firebase Console:
 * 1. Go to your Firebase Console
 * 2. Navigate to Firestore Database
 * 3. Create a collection called "Rooms"
 * 4. Add documents with the structure from sampleRooms above
 * 
 * 
 * Option 3: Using a Node.js script
 * ----------------------------------
 * Create a separate Node.js script that initializes Firebase Admin SDK
 * and uses this function to seed the database.
 */

