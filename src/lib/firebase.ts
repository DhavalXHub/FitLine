import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Helper to get env var with validation
const getEnvVar = (key: string): string => {
  const value = import.meta.env[key as keyof ImportMetaEnv];
  if (!value || value === "" || value.startsWith("your_") || value.includes("your_")) {
    throw new Error(
      `Invalid or missing environment variable: ${key}\n` +
      `Please check your .env.local file and ensure ${key} is set to a valid Firebase value.\n` +
      `See .env.example for the correct format.`
    );
  }
  return String(value).trim();
};

// Validate and get Firebase configuration
let firebaseConfig;
try {
  const apiKey = getEnvVar("VITE_FIREBASE_API_KEY");
  const authDomain = getEnvVar("VITE_FIREBASE_AUTH_DOMAIN");
  const projectId = getEnvVar("VITE_FIREBASE_PROJECT_ID");
  const storageBucket = getEnvVar("VITE_FIREBASE_STORAGE_BUCKET");
  const messagingSenderId = getEnvVar("VITE_FIREBASE_MESSAGING_SENDER_ID");
  const appId = getEnvVar("VITE_FIREBASE_APP_ID");
  const measurementId = import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string | undefined;

  // Validate API key format (Firebase API keys typically start with AIza and are at least 30 chars)
  if (apiKey.length < 30) {
    throw new Error(
      `Invalid Firebase API Key format. API keys should be at least 30 characters long.\n` +
      `Please check your VITE_FIREBASE_API_KEY in .env.local file.\n` +
      `Current value appears to be invalid or placeholder.`
    );
  }

  firebaseConfig = {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
    measurementId: measurementId || undefined,
  };
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  // Show user-friendly error message
  console.error("❌ Firebase Configuration Error:", errorMessage);
  console.error("\n📝 Setup Instructions:");
  console.error("1. Create a .env.local file in the project root (copy from .env.example)");
  console.error("2. Go to https://console.firebase.google.com/");
  console.error("3. Select your project > Project Settings > General");
  console.error("4. Scroll to 'Your apps' and click the web icon (</>)");
  console.error("5. Copy the config values into .env.local");
  console.error("6. Restart the development server (npm run dev)");
  console.error("\n⚠️  Important: Restart the dev server after changing .env.local files!");
  
  // Create a minimal invalid config to prevent app crash, but Firebase will show the error
  firebaseConfig = {
    apiKey: "INVALID",
    authDomain: "INVALID",
    projectId: "INVALID",
    storageBucket: "INVALID",
    messagingSenderId: "INVALID",
    appId: "INVALID",
  };
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);