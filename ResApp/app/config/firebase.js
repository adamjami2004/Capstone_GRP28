// app/config/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDrWnNajrysqRqTP7eF5z7M8ajpAUj30e4",
  authDomain: "reslife-1b867.firebaseapp.com",
  projectId: "reslife-1b867",
  storageBucket: "reslife-1b867.firebasestorage.app",
  messagingSenderId: "670451934314",
  appId: "1:670451934314:web:e02d10116c90a49d51d613",
  measurementId: "G-PH7EZRL25J"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
