import { db, storage } from "@/firebase";
import { CreateEventInput, Event, UpdateEventInput } from "@/types/event";
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    orderBy,
    query,
    Timestamp,
    updateDoc,
} from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";

const EVENTS_COLLECTION = "Events";

/**
 * Upload image to Firebase Storage
 */
export async function uploadEventImage(imageUri: string, eventId: string): Promise<string> {
  try {
    console.log("📸 Starting image upload for event:", eventId);
    console.log("📸 Image URI:", imageUri);
    
    // Check if storage is available
    if (!storage) {
      throw new Error("Firebase Storage is not initialized. Please enable Storage in Firebase Console.");
    }

    console.log("📸 Fetching image from URI...");
    const response = await fetch(imageUri);
    if (!response.ok) {
      throw new Error(`Failed to fetch image from URI: ${response.status} ${response.statusText}`);
    }
    
    console.log("📸 Converting to blob...");
    const blob = await response.blob();
    console.log("📸 Blob size:", blob.size, "bytes, type:", blob.type);
    
    const storagePath = `events/${eventId}/${Date.now()}.jpg`;
    console.log("📸 Uploading to storage path:", storagePath);
    
    const storageRef = ref(storage, storagePath);
    const uploadResult = await uploadBytes(storageRef, blob);
    console.log("✅ Image uploaded successfully:", uploadResult.metadata.fullPath);
    
    console.log("📸 Getting download URL...");
    const downloadUrl = await getDownloadURL(storageRef);
    console.log("✅ Download URL obtained:", downloadUrl);
    
    return downloadUrl;
  } catch (error: any) {
    console.error("❌ Error uploading image:", error);
    console.error("❌ Error code:", error.code);
    console.error("❌ Error message:", error.message);
    
    // Provide more helpful error messages
    if (error.code === 'storage/unauthorized') {
      throw new Error("Storage permission denied. Please check Firebase Storage rules.");
    } else if (error.code === 'storage/unknown') {
      throw new Error("Firebase Storage is not enabled. Please enable it in Firebase Console.");
    }
    
    throw error;
  }
}

/**
 * Delete image from Firebase Storage
 */
export async function deleteEventImage(imageUrl: string): Promise<void> {
  try {
    const imageRef = ref(storage, imageUrl);
    await deleteObject(imageRef);
  } catch (error) {
    console.error("Error deleting image:", error);
    // Don't throw error, as the document deletion should proceed
  }
}

/**
 * Create a new event
 */
export async function createEvent(
  eventData: CreateEventInput,
  userEmail: string
): Promise<string> {
  try {
    console.log("🆕 Creating new event...");
    console.log("🆕 Event data:", { title: eventData.title, category: eventData.category });
    
    // First create the document to get an ID
    const eventsRef = collection(db, EVENTS_COLLECTION);
    const docRef = await addDoc(eventsRef, {
      title: eventData.title,
      description: eventData.description,
      category: eventData.category,
      deadline: Timestamp.fromDate(eventData.deadline),
      imageUrl: "", // Temporary empty value
      createdBy: userEmail,
      createdAt: Timestamp.now(),
    });

    console.log("✅ Event document created with ID:", docRef.id);

    // Upload image with the document ID
    console.log("🆕 Uploading event image...");
    const imageUrl = await uploadEventImage(eventData.imageUri, docRef.id);

    // Update the document with the image URL
    console.log("🆕 Updating event with image URL...");
    await updateDoc(docRef, { imageUrl });
    console.log("✅ Event fully created with image URL:", imageUrl);

    return docRef.id;
  } catch (error) {
    console.error("❌ Error creating event:", error);
    throw error;
  }
}

/**
 * Get all events
 */
export async function getAllEvents(): Promise<Event[]> {
  try {
    console.log("📖 Fetching all events...");
    const eventsRef = collection(db, EVENTS_COLLECTION);
    const q = query(eventsRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);

    console.log(`📖 Found ${querySnapshot.docs.length} events in Firestore`);

    const events: Event[] = [];
    
    for (const doc of querySnapshot.docs) {
      try {
        const data = doc.data();
        
        // Validate required fields
        if (!data.deadline || !data.createdAt) {
          console.warn(`⚠️ Event ${doc.id} missing required timestamp fields`);
          continue;
        }

        const event: Event = {
          id: doc.id,
          title: data.title || "",
          description: data.description || "",
          category: data.category || "Cat1",
          deadline: data.deadline?.toDate ? data.deadline.toDate() : new Date(data.deadline),
          imageUrl: data.imageUrl || "",
          createdBy: data.createdBy || "",
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : undefined,
        };
        
        console.log(`✅ Event ${doc.id}: ${event.title}`);
        console.log(`   📸 Image URL: ${event.imageUrl ? event.imageUrl.substring(0, 100) + '...' : 'NO IMAGE URL'}`);
        
        events.push(event);
      } catch (err) {
        console.error(`❌ Error parsing event ${doc.id}:`, err);
      }
    }

    console.log(`✅ Successfully loaded ${events.length} events`);
    return events;
  } catch (error) {
    console.error("❌ Error getting events:", error);
    // Return empty array instead of throwing to prevent app crash
    return [];
  }
}

/**
 * Update an event
 */
export async function updateEvent(updateData: UpdateEventInput): Promise<void> {
  try {
    const eventRef = doc(db, EVENTS_COLLECTION, updateData.id);
    const updatePayload: any = {
      updatedAt: Timestamp.now(),
    };

    if (updateData.title !== undefined) updatePayload.title = updateData.title;
    if (updateData.description !== undefined) updatePayload.description = updateData.description;
    if (updateData.category !== undefined) updatePayload.category = updateData.category;
    if (updateData.deadline !== undefined) {
      updatePayload.deadline = Timestamp.fromDate(updateData.deadline);
    }

    // If there's a new image, upload it
    if (updateData.imageUri) {
      const imageUrl = await uploadEventImage(updateData.imageUri, updateData.id);
      updatePayload.imageUrl = imageUrl;
    }

    await updateDoc(eventRef, updatePayload);
  } catch (error) {
    console.error("Error updating event:", error);
    throw error;
  }
}

/**
 * Delete an event
 */
export async function deleteEvent(eventId: string, imageUrl: string): Promise<void> {
  try {
    // Delete the image first
    if (imageUrl) {
      await deleteEventImage(imageUrl);
    }

    // Delete the document
    const eventRef = doc(db, EVENTS_COLLECTION, eventId);
    await deleteDoc(eventRef);
  } catch (error) {
    console.error("Error deleting event:", error);
    throw error;
  }
}

