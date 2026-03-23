# FitLine Gym - AI-Powered Fitness Application

A modern, AI-powered fitness application built with React, TypeScript, and Firebase. Get personalized workout plans, track your progress, and receive AI-powered coaching advice.

## Features

- 🏋️ Personalized workout plans based on your fitness goals
- 📊 Progress tracking and analytics
- 🤖 AI-powered fitness coaching
- 🔥 Firebase authentication and data storage
- 📱 Responsive design with modern UI components
- 🎯 Daily workout recommendations
- 📈 Workout history and statistics

## Technologies

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Components**: shadcn-ui (Radix UI + Tailwind CSS)
- **Styling**: Tailwind CSS
- **Authentication & Database**: Firebase
- **Routing**: React Router DOM
- **State Management**: React Query (TanStack Query)
- **Form Handling**: React Hook Form with Zod validation

## Prerequisites

- **Node.js** (v18 or higher) - [Download for Windows](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn** or **pnpm**
- **Firebase Account** - For authentication and database

## Installation (Windows)

### Step 1: Clone the Repository

```powershell
git clone <YOUR_GIT_URL>
cd Fit_Line_Gym
```

### Step 2: Install Dependencies

Using npm:
```powershell
npm install
```

Or using yarn:
```powershell
yarn install
```

Or using pnpm:
```powershell
pnpm install
```

### Step 3: Set Up Environment Variables

1. Copy the `.env.example` file to `.env.local`:
   ```powershell
   copy .env.example .env.local
   ```

2. **Configure Firebase** (Required):
   - See [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) for detailed step-by-step instructions
   - Quick steps:
     1. Go to [Firebase Console](https://console.firebase.google.com/)
     2. Create a new project or select an existing one
     3. Add a web app (click the `</>` icon)
     4. Copy the configuration values into your `.env.local` file
     5. Enable Authentication (Email/Password)
     6. Enable Firestore Database
   - **Important**: After updating `.env.local`, restart the dev server!

3. (Optional) Set up AI endpoint if you have one:
   - Add your AI endpoint URL to `VITE_AI_ENDPOINT` in `.env.local`

### Step 4: Start the Development Server

```powershell
npm run dev
```

The application will be available at `http://localhost:8080`

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the project for production
- `npm run build:dev` - Build the project in development mode
- `npm run preview` - Preview the production build locally
- `npm run lint` - Run ESLint to check for code issues

## Project Structure

```
Fit_Line_Gym/
├── public/          # Static assets
├── src/
│   ├── assets/      # Images and other assets
│   ├── components/  # React components
│   │   └── ui/      # shadcn-ui components
│   ├── contexts/    # React contexts (Auth, etc.)
│   ├── hooks/       # Custom React hooks
│   ├── lib/         # Utility functions and configurations
│   │   ├── ai.ts           # AI coach functionality
│   │   ├── firebase.ts     # Firebase configuration
│   │   ├── utils.ts        # Utility functions
│   │   └── workouts.ts     # Workout data and logic
│   └── pages/       # Page components
│       ├── Dashboard.tsx
│       ├── DailyWorkout.tsx
│       ├── Landing.tsx
│       ├── Profile.tsx
│       ├── Setup.tsx
│       └── WorkoutSession.tsx
├── .env.example     # Example environment variables
├── .gitignore       # Git ignore rules
├── package.json     # Project dependencies
├── tsconfig.json    # TypeScript configuration
├── vite.config.ts   # Vite configuration
└── tailwind.config.ts # Tailwind CSS configuration
```

## Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication:
   - Go to Authentication > Sign-in method
   - Enable Email/Password or Google sign-in
3. Create a Firestore database:
   - Go to Firestore Database
   - Create database in production or test mode
   - Set up security rules as needed
4. Copy your Firebase configuration to `.env.local`

## Windows-Specific Notes

- All file paths use forward slashes (handled by Vite and Node.js)
- Line endings are automatically handled by Git (LF in repo, CRLF on Windows)
- The project uses cross-platform compatible configurations
- PowerShell commands are recommended for Windows development

## Troubleshooting

### Port Already in Use
If port 8080 is already in use, you can change it in `vite.config.ts`:
```typescript
server: {
  port: 3000, // Change to any available port
}
```

### Firebase Configuration Errors

**Error: "API key not valid"**
- ✅ See [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) for detailed setup instructions
- ✅ Verify all values in `.env.local` are correct (no placeholders)
- ✅ Ensure no quotes or spaces around values in `.env.local`
- ✅ Restart the dev server after changing `.env.local`
- ✅ Check that API key is at least 30 characters and copied correctly

**Other Firebase Errors**
- Ensure all environment variables are set in `.env.local`
- Check that your Firebase project has the correct services enabled
- Verify that your Firebase security rules allow the operations you need
- Make sure Authentication and Firestore are enabled in Firebase Console

### Node Modules Issues
If you encounter issues with node_modules:
```powershell
# Delete node_modules and reinstall
Remove-Item -Recurse -Force node_modules
npm install
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Commit your changes
5. Push to the branch
6. Create a Pull Request

## License

This project is private and proprietary.

## Support

For issues and questions, please open an issue on the repository or contact the development team.
