// src/lib/firebaseClient.js
import { getFirestore } from "firebase/firestore";
import { getFirebaseApp } from "./firebaseApp.js";

const app = getFirebaseApp();
export const db = getFirestore(app);
export { app };
