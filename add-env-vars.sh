#!/bin/bash

# Add Firebase environment variables to Vercel project
# NOTE: Replace the placeholder values with your actual Firebase configuration

echo "Adding VITE_FIREBASE_API_KEY..."
echo "YOUR_ACTUAL_API_KEY_HERE" | vercel env add VITE_FIREBASE_API_KEY production

echo "Adding VITE_FIREBASE_AUTH_DOMAIN..."
echo "mikasav1.firebaseapp.com" | vercel env add VITE_FIREBASE_AUTH_DOMAIN production

echo "Adding VITE_FIREBASE_PROJECT_ID..."
echo "mikasav1" | vercel env add VITE_FIREBASE_PROJECT_ID production

echo "Adding VITE_FIREBASE_STORAGE_BUCKET..."
echo "mikasav1.firebasestorage.app" | vercel env add VITE_FIREBASE_STORAGE_BUCKET production

echo "Adding VITE_FIREBASE_MESSAGING_SENDER_ID..."
echo "479249363106" | vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID production

echo "Adding VITE_FIREBASE_APP_ID..."
echo "1:479249363106:web:9d879c323ad035d30267fb" | vercel env add VITE_FIREBASE_APP_ID production

echo "Adding VITE_FIREBASE_MEASUREMENT_ID..."
echo "G-J6LD6K3Q50" | vercel env add VITE_FIREBASE_MEASUREMENT_ID production

echo "All environment variables added successfully!"
echo "IMPORTANT: Remember to replace 'YOUR_ACTUAL_API_KEY_HERE' with your real Firebase API key."
echo "You can find your API key in the Firebase Console under Project Settings > General > Your apps."