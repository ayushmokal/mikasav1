# Environment Variables Setup

This document explains how to properly configure environment variables for the Mikasa application.

## Required Environment Variables

The application requires the following Firebase configuration variables:

```
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

## Setting Up for Local Development

1. Create a `.env.local` file in the root directory
2. Add your Firebase configuration values to this file
3. Never commit this file to version control (it's in .gitignore)

## Setting Up for Vercel Deployment

1. Run the provided script to add environment variables to Vercel:
   ```bash
   ./add-env-vars.sh
   ```

2. Or manually add each environment variable through the Vercel dashboard:
   - Go to your project settings
   - Navigate to "Environment Variables"
   - Add each variable with the prefix `VITE_`

## Firebase Configuration

To get your Firebase configuration:

1. Go to the Firebase Console: https://console.firebase.google.com/
2. Select your project
3. Click the gear icon and select "Project settings"
4. Under "Your apps", click on your web app or create one
5. Copy the configuration object

## Troubleshooting

If you see Firestore connection errors:

1. Verify all environment variables are set correctly
2. Check that your Firebase project has Firestore enabled
3. Ensure your security rules are properly configured
4. Confirm your Firebase project has the Blaze (pay-as-you-go) plan enabled for external API calls

## Security Notes

- Never expose your Firebase API key in client-side code for production applications
- Use Firebase Security Rules to protect your data
- Regularly rotate your API keys