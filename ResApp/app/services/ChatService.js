import { db } from "../config/firebase";
import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";

// Create a new chat
export const createChat = async (user1, user2) => {
  try {
    const chatRef = await addDoc(collection(db, "chats"), {
      participants: [user1, user2],
      createdAt: serverTimestamp(),
    });
    return chatRef.id;
  } catch (error) {
    throw error.message;
  }
};

// Send a message
export const sendMessage = async (chatId, sender, text, imageUrl = null) => {
  try {
    await addDoc(collection(db, `chats/${chatId}/messages`), {
      sender,
      text,
      imageUrl,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    throw error.message;
  }
};

// Get existing chats for a user
export const getUserChats = async (userId) => {
  try {
    const q = query(collection(db, "chats"), where("participants", "array-contains", userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    throw error.message;
  }
};
