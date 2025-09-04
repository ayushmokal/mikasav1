#!/bin/bash

# Add Firebase environment variables to Vercel project

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