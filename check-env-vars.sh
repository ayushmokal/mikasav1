#!/bin/bash

# Script to check if all required environment variables are set

echo "Checking required environment variables..."

REQUIRED_VARS=(
  "VITE_FIREBASE_API_KEY"
  "VITE_FIREBASE_AUTH_DOMAIN"
  "VITE_FIREBASE_PROJECT_ID"
  "VITE_FIREBASE_STORAGE_BUCKET"
  "VITE_FIREBASE_MESSAGING_SENDER_ID"
  "VITE_FIREBASE_APP_ID"
)

MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    MISSING_VARS+=("$var")
    echo "❌ $var is not set"
  else
    echo "✅ $var is set"
  fi
done

if [ ${#MISSING_VARS[@]} -eq 0 ]; then
  echo "🎉 All required environment variables are set!"
  exit 0
else
  echo "⚠️  Missing environment variables:"
  for var in "${MISSING_VARS[@]}"; do
    echo "   - $var"
  done
  echo "Please set these variables before running the application."
  exit 1
fi