#!/bin/bash

# Quick Vercel deployment script for SubVault email forwarding
echo "🚀 Deploying SubVault to Vercel..."

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel CLI..."
    npm i -g vercel
fi

# Login to Vercel (if not already logged in)
echo "📝 Logging into Vercel..."
vercel login

# Deploy the project
echo "🚀 Deploying project..."
vercel --prod

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🔧 Next steps:"
echo "1. Set up environment variables in Vercel dashboard"
echo "2. Go to: https://vercel.com/dashboard"
echo "3. Find your project → Settings → Environment Variables"
echo "4. Add the Firebase environment variables from .env.local"
echo ""
echo "📧 Your webhook URL will be:"
echo "https://your-app-name.vercel.app/api/webhook/email?address=ilsangchang%40ccmail.uk"
echo ""
echo "🎯 Webhook queries for InstAddr:"
echo '{"content": "#subject#\\n#textbody#", "username": "#from#", "receivingAddress": "ilsangchang@ccmail.uk"}'