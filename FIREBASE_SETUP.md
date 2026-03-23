# Firebase Setup Guide

## Quick Fix for "API Key Not Valid" Error

If you're seeing the error: `Firebase: Error (auth/api-key-not-valid.-please-pass-a-valid-api-key.)`, follow these steps:

## Step-by-Step Setup

### 1. Get Your Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Sign in with your Google account
3. **Create a new project** (or select an existing one):
   - Click "Add project" or select your project
   - Follow the setup wizard
   - Enable Google Analytics (optional)

### 2. Add a Web App to Your Firebase Project

1. In your Firebase project dashboard, click the **Web icon** (`</>`) or "Add app" > Web
2. Register your app:
   - App nickname: `FitLine Gym` (or any name)
   - **Do NOT** check "Also set up Firebase Hosting"
   - Click "Register app"

### 3. Copy Your Firebase Config

You'll see a configuration object that looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdefghijklmnop",
  measurementId: "G-XXXXXXXXXX"
};
```

### 4. Update Your .env.local File

1. Open `.env.local` in the project root (create it if it doesn't exist)
2. Copy the values from Firebase into your `.env.local` file:

```env
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdefghijklmnop
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

**Important Notes:**
- Replace all placeholder values with your actual Firebase values
- Do NOT use quotes around the values
- Do NOT leave any spaces around the `=` sign
- Each value should be on its own line

### 5. Enable Firebase Services

#### Enable Authentication:

1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Click on **Email/Password**
3. Enable "Email/Password" and click **Save**
4. (Optional) Enable **Google** sign-in if you want Google authentication

#### Enable Firestore Database:

1. In Firebase Console, go to **Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** (for development) or **Production mode**
4. Select a location for your database (choose the closest to your users)
5. Click **Enable**

### 6. Set Up Firestore Security Rules (Important!)

1. Go to **Firestore Database** > **Rules**
2. For development, you can use these test rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read/write their own data
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow authenticated users to read public data
    match /{document=**} {
      allow read: if request.auth != null;
    }
  }
}
```

3. Click **Publish**

⚠️ **Warning**: These rules are for development only. For production, implement proper security rules based on your app's needs.

### 7. Restart Your Development Server

**CRITICAL**: After updating `.env.local`, you MUST restart your dev server:

1. Stop the current server (Press `Ctrl+C` in the terminal)
2. Start it again:
   ```powershell
   npm run dev
   ```

## Troubleshooting

### Error: "API key not valid"
- ✅ Check that you copied the correct API key from Firebase Console
- ✅ Make sure there are no extra spaces or quotes in `.env.local`
- ✅ Restart the dev server after changing `.env.local`
- ✅ Verify the API key starts with "AIza" and is at least 30 characters

### Error: "Missing environment variables"
- ✅ Ensure `.env.local` exists in the project root (not in `src/` or any subfolder)
- ✅ Check that all variables start with `VITE_`
- ✅ Verify no typos in variable names

### Error: "Permission denied" in Firestore
- ✅ Check Firestore security rules
- ✅ Ensure Authentication is enabled
- ✅ Verify the user is authenticated before accessing Firestore

### Environment variables not loading
- ✅ Restart the dev server (Vite only loads env vars on startup)
- ✅ Check that `.env.local` is in the root directory
- ✅ Verify file name is exactly `.env.local` (not `.env.local.txt`)

## Verify Your Setup

After setup, you should be able to:
1. ✅ Start the app without Firebase errors
2. ✅ See the login/signup page
3. ✅ Create a new account
4. ✅ Sign in with your credentials

## Need Help?

If you're still having issues:
1. Check the browser console for detailed error messages
2. Check the terminal where `npm run dev` is running
3. Verify your Firebase project is active in Firebase Console
4. Ensure all required Firebase services are enabled

## Example .env.local File

Here's what a correctly formatted `.env.local` file should look like:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyC7xX9Y2Z3A4B5C6D7E8F9G0H1I2J3K4L5M6
VITE_FIREBASE_AUTH_DOMAIN=fitline-gym-12345.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=fitline-gym-12345
VITE_FIREBASE_STORAGE_BUCKET=fitline-gym-12345.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abc123def456ghi789
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# AI Endpoint (Optional)
VITE_AI_ENDPOINT=
```

**Remember**: Replace these example values with your actual Firebase configuration values!

