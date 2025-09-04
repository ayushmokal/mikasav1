#!/bin/bash

# Add all Firebase environment variables to all Vercel environments

# Define environment variables
VARS=(
  "VITE_FIREBASE_API_KEY:AIzaSyDYvve8egt1xcXzRRACpXt5aPCUxj3GVJY"
  "VITE_FIREBASE_AUTH_DOMAIN:mikasav1.firebaseapp.com"
  "VITE_FIREBASE_PROJECT_ID:mikasav1"
  "VITE_FIREBASE_STORAGE_BUCKET:mikasav1.firebasestorage.app"
  "VITE_FIREBASE_MESSAGING_SENDER_ID:479249363106"
  "VITE_FIREBASE_APP_ID:1:479249363106:web:9d879c323ad035d30267fb"
  "VITE_FIREBASE_MEASUREMENT_ID:G-J6LD6K3Q50"
)

# Add each variable to all environments
for var in "${VARS[@]}"; do
  IFS=':' read -r name value <<< "$var"
  
  echo "Adding $name to all environments..."
  
  # Add to production
  echo "$value" | vercel env add "$name" production
  
  # Add to preview
  echo "$value" | vercel env add "$name" preview
  
  # Add to development
  echo "$value" | vercel env add "$name" development
done

echo "All environment variables added to all environments successfully!"