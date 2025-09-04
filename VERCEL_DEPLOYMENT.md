# Vercel Deployment Guide

## Quick Deploy to Vercel

### 1. **Install Vercel CLI**
```bash
npm i -g vercel
```

### 2. **Login to Vercel**
```bash
vercel login
```

### 3. **Deploy Project**
```bash
# From your project root
vercel

# Follow prompts:
# - Link to existing project? N
# - Project name: mikasav1 (or your preferred name)
# - Directory: ./
# - Override settings? N
```

### 4. **Set Environment Variables**
```bash
# Add Firebase config
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY
vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID
vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
vercel env add NEXT_PUBLIC_FIREBASE_APP_ID

# Add server-side Firebase config
vercel env add FIREBASE_PRIVATE_KEY
vercel env add FIREBASE_CLIENT_EMAIL
vercel env add FIREBASE_PROJECT_ID
```

### 5. **Redeploy with Environment Variables**
```bash
vercel --prod
```

## Your Webhook URLs After Deployment

Once deployed, your webhook URLs will be:

**Format:**
```
https://your-app-name.vercel.app/api/webhook/email?address={ENCODED_EMAIL}
```

**Example for ilsangchang@ccmail.uk:**
```
https://your-app-name.vercel.app/api/webhook/email?address=ilsangchang%40ccmail.uk
```

## Environment Variables Needed

```env
# Firebase Client Config (Public)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin Config (Server-side)
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PROJECT_ID=your_project_id
```

## Testing the Webhook

After deployment, test with:
```bash
curl -X POST "https://your-app.vercel.app/api/webhook/email?address=ilsangchang%40ccmail.uk" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "test@example.com",
    "subject": "Test Email",
    "content": "#subject#Test Email\n#textbody#This is a test email",
    "username": "#from#test@example.com"
  }'
```

## Unique Features

✅ **Address-Based Routing**: Each receiving address gets a unique webhook URL
✅ **Multi-User Support**: Multiple users can share the same receiving address
✅ **InstAddr Compatible**: Works with InstAddr webhook format
✅ **Free Hosting**: Vercel's free tier supports this functionality
✅ **Automatic SSL**: HTTPS enabled by default