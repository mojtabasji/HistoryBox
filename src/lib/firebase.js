import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirebaseConfig } from "./config.js";

// Get Firebase configuration with validation
const firebaseConfig = getFirebaseConfig();

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export default app;
