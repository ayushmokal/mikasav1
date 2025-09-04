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

You have two options for setting up environment variables:

#### Option A: Use Vercel CLI (Recommended)
```bash
# Set the environment variables from your .env.local file
vercel env add VITE_FIREBASE_API_KEY
# Enter: AIzaSyDYvve8egt1xcXzRRACpXt5aPCUxj3GVJY
# Select: Production, Preview, Development

vercel env add VITE_FIREBASE_AUTH_DOMAIN  
# Enter: mikasav1.firebaseapp.com
# Select: Production, Preview, Development

vercel env add VITE_FIREBASE_PROJECT_ID
# Enter: mikasav1
# Select: Production, Preview, Development

vercel env add VITE_FIREBASE_STORAGE_BUCKET
# Enter: mikasav1.firebasestorage.app
# Select: Production, Preview, Development

vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID
# Enter: 479249363106
# Select: Production, Preview, Development

vercel env add VITE_FIREBASE_APP_ID
# Enter: 1:479249363106:web:9d879c323ad035d30267fb
# Select: Production, Preview, Development
```

#### Option B: Use Vercel Dashboard
1. Go to your project in Vercel dashboard
2. Settings → Environment Variables
3. Add each variable:

| Variable Name | Value | Environment |
|---------------|-------|--------------|
| `VITE_FIREBASE_API_KEY` | `AIzaSyDYvve8egt1xcXzRRACpXt5aPCUxj3GVJY` | All |
| `VITE_FIREBASE_AUTH_DOMAIN` | `mikasav1.firebaseapp.com` | All |
| `VITE_FIREBASE_PROJECT_ID` | `mikasav1` | All |
| `VITE_FIREBASE_STORAGE_BUCKET` | `mikasav1.firebasestorage.app` | All |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `479249363106` | All |
| `VITE_FIREBASE_APP_ID` | `1:479249363106:web:9d879c323ad035d30267fb` | All |

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

**Your specific webhook queries:**
```json
{
  "content": "#subject#Test Email\n#textbody#This is a test email",
  "username": "#from#test@example.com",
  "receivingAddress": "ilsangchang@ccmail.uk"
}
```

## Environment Variables Needed

**From your .env.local file (use these exact values):**
```env
# Firebase Client Config (used by both frontend and webhook)
VITE_FIREBASE_API_KEY=AIzaSyDYvve8egt1xcXzRRACpXt5aPCUxj3GVJY
VITE_FIREBASE_AUTH_DOMAIN=mikasav1.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=mikasav1
VITE_FIREBASE_STORAGE_BUCKET=mikasav1.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=479249363106
VITE_FIREBASE_APP_ID=1:479249363106:web:9d879c323ad035d30267fb
```

**⚠️ Important Notes:**
- Use `VITE_` prefix (not `NEXT_PUBLIC_`)
- These are the exact values from your current `.env.local` file
- The webhook endpoint supports both `VITE_` and `NEXT_PUBLIC_` prefixes for compatibility

## Testing the Webhook

After deployment, test with your specific receiving address:
```bash
curl -X POST "https://your-app.vercel.app/api/webhook/email?address=ilsangchang%40ccmail.uk" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "test@example.com",
    "subject": "Test Email for ilsangchang@ccmail.uk",
    "content": "#subject#Test Email\n#textbody#This is a test email",
    "username": "#from#test@example.com",
    "receivingAddress": "ilsangchang@ccmail.uk"
  }'
```

## Unique Features

✅ **Address-Based Routing**: Each receiving address gets a unique webhook URL
✅ **Multi-User Support**: Multiple users can share the same receiving address
✅ **InstAddr Compatible**: Works with InstAddr webhook format
✅ **Free Hosting**: Vercel's free tier supports this functionality
✅ **Automatic SSL**: HTTPS enabled by default