# Firebase Setup Instructions

## Prerequisites

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication with Email/Password provider
3. Create a Firestore database
4. Get your Firebase configuration

## Setup Steps

### 1. Firebase Configuration

1. Go to your Firebase project settings
2. Scroll down to "Your apps" and click on the web app (</>) icon
3. Copy the Firebase configuration object
4. Update the `.env.local` file with your actual Firebase configuration:

```env
VITE_FIREBASE_API_KEY="your-actual-api-key"
VITE_FIREBASE_AUTH_DOMAIN="your-project-id.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-actual-project-id"
VITE_FIREBASE_STORAGE_BUCKET="your-project-id.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="your-actual-sender-id"
VITE_FIREBASE_APP_ID="your-actual-app-id"
VITE_FIREBASE_MEASUREMENT_ID="your-actual-measurement-id"
```

### 2. Firestore Security Rules

Add these security rules to your Firestore database:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && 
        (request.auth.uid == resource.data.uid || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
    
    // Admin users can read/write all documents
    match /{document=**} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

### 3. Authentication Setup

1. Go to Authentication > Sign-in method in Firebase Console: https://console.firebase.google.com/project/mikasav1/authentication/providers
2. Enable "Email/Password" provider
3. Optionally enable "Email link (passwordless sign-in)"

### 4. Create an Admin User

To create your first admin user:

1. Sign up through the app normally
2. Go to Firestore Console
3. Find your user document in the `users` collection
4. Edit the document and change the `role` field from `'user'` to `'admin'`

### 5. Optional: Enable Analytics

If you want to use Firebase Analytics:
1. Enable Google Analytics in your Firebase project
2. The measurement ID will be automatically added to your config

## File Structure

```
src/
├── lib/
│   ├── firebase.ts          # Firebase configuration
│   ├── auth.ts             # Authentication functions
│   └── firestore.ts        # Firestore operations
├── contexts/
│   └── AuthContext.tsx     # Authentication context
├── hooks/
│   └── useFirestore.ts     # Custom hooks for Firestore
├── components/
│   └── auth/
│       ├── LoginForm.tsx   # Login/signup form
│       └── ProtectedRoute.tsx # Route protection
└── pages/
    ├── Login.tsx           # Login page
    └── Unauthorized.tsx    # Unauthorized access page
```

## Usage

### Authentication
- Users can sign up and sign in with email/password
- User profiles are automatically created in Firestore
- Role-based access control (user/admin)

### User Management
- Admins can view all users
- Users can only view their own data
- CRUD operations for user management

### Data Structure
Each user document contains:
- `uid`: Firebase Auth UID
- `email`: User's email
- `displayName`: Optional display name
- `role`: 'user' or 'admin'
- `accountEmail`: Service account email
- `accountPassword`: Service account password
- `plan`: Subscription plan details
- `joinDate`: When the user joined
- `createdAt`: Document creation timestamp
- `updatedAt`: Last update timestamp

## Security

- Environment variables are used for Firebase configuration
- Firestore security rules prevent unauthorized access
- Authentication is required for all operations
- Role-based permissions for admin features
