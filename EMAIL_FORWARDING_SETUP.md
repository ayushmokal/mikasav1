# Email Forwarding Setup Guide

## Overview

SubVault now includes an advanced email forwarding system inspired by InstAddr, allowing you to automatically forward emails from your subscription accounts to multiple destinations including Discord, webhooks, IFTTT, and more.

## Features

### 🚀 **InstAddr-Inspired Features**
- **Multiple Forwarding Destinations**: Set up to 200 forwards per day (premium users)
- **Discord Integration**: Send emails directly to Discord channels
- **IFTTT Support**: Connect to IFTTT applets and automation
- **Custom Webhooks**: Support for JSON, form data, and plain text formats
- **Smart Filtering**: Prevent forwarding of already forwarded emails (Fw:/Fwd:)
- **Premium Plans**: Enhanced limits and advanced features

### 📧 **Core Capabilities**
- Real-time email inbox with search and filtering
- Multiple forwarding methods per receiving address
- Custom message templates for each destination
- Daily usage tracking and limits
- Attachment handling and preview
- Read/unread status management

## Quick Setup

### 1. **Enable Email Forwarding**
1. Go to your dashboard
2. Navigate to the "Inbox" section
3. Click on the "Settings" tab
4. Enable "Email Forwarding"
5. Configure your receiving address (your subscription account email)

### 2. **Configure Forwarding Destinations**
1. Go to the "Destinations" tab
2. Click "Add Forwarding Destination"
3. Choose your destination type:
   - **Email**: Forward to another email address
   - **Discord**: Send to Discord channel via webhook
   - **Webhook**: Custom API endpoint
   - **IFTTT**: Trigger IFTTT applets

### 3. **Set Up External Email Service**
Configure your email provider to forward emails to the webhook URL:
```
https://your-firebase-project.cloudfunctions.net/emailWebhook?userId=YOUR_USER_ID
```

## Destination Setup Guides

### 🔔 **Discord Integration**
1. Create a Discord webhook in your channel:
   - Channel Settings → Integrations → Webhooks → New Webhook
   - Copy the webhook URL
2. In SubVault:
   - Type: Discord
   - Paste the webhook URL
   - Customize the bot username (optional)
   - Use the default template or create a custom message format

**Example Discord Template:**
```
📧 **New Email**
**From:** {{fromEmail}}
**Subject:** {{subject}}
**Time:** {{receivedAt}}

{{textBody}}
```

### 🔗 **IFTTT Integration**
1. Get your IFTTT Webhook key:
   - Go to https://ifttt.com/maker_webhooks
   - Copy your key from the settings
2. Create an IFTTT applet:
   - Trigger: Webhooks
   - Event name: `email_received` (or custom name)
3. In SubVault:
   - Type: IFTTT
   - Enter your webhook key
   - Enter the event name

### 🛠 **Custom Webhooks**
Configure custom API endpoints with full control:

**JSON Format:**
```json
{
  "from": "{{fromEmail}}",
  "subject": "{{subject}}",
  "body": "{{textBody}}",
  "receivedAt": "{{receivedAt}}"
}
```

**Form Data Format:**
```
from=user@example.com&subject=Test&body=Hello
```

**Plain Text Format:**
```
New email from {{fromEmail}}: {{subject}}
```

## Email Service Provider Setup

### 📧 **Gmail Forwarding**
1. Gmail Settings → Forwarding and POP/IMAP
2. Add forwarding address: Use a service like Zapier or IFTTT to convert email to webhook
3. Alternative: Use Gmail API with Google Apps Script

### 📧 **Outlook/Hotmail**
1. Outlook Settings → Mail → Forwarding
2. Use Power Automate (Microsoft Flow) to create email-to-webhook flow
3. Trigger: "When a new email arrives"
4. Action: HTTP POST to your webhook URL

### 📧 **Professional Email Services**
Most business email providers support webhook forwarding:

**SendGrid Inbound Parse:**
```
https://docs.sendgrid.com/for-developers/parsing-email/setting-up-the-inbound-parse-webhook
```

**Mailgun Routes:**
```
https://documentation.mailgun.com/en/latest/user_manual.html#routes
```

**Postmark Inbound:**
```
https://postmarkapp.com/developer/webhooks/inbound-webhook
```

## Advanced Configuration

### 🎛 **Email Filters**
Set up rules to filter emails before forwarding:
- Sender-based filtering
- Subject line matching
- Body content filtering
- Attachment type filtering

### 📊 **Usage Limits**
- **Standard Users**: 50 forwards per day
- **Premium Users**: 200 forwards per day
- Limits reset at midnight UTC
- Rejected emails don't count towards limit

### 🛡 **Security Features**
- User-specific webhook URLs with unique IDs
- Request validation and user verification
- Rate limiting and abuse prevention
- Firestore security rules enforcement

## Testing Your Setup

### 🧪 **Built-in Test Tool**
1. Go to Settings tab in your inbox
2. Use the "Test Email Forwarding" tool
3. Customize the test email content
4. Send test email to verify webhook functionality

### ✅ **Manual Testing**
1. Send an email to your subscription account
2. Check the inbox for the received email
3. Verify forwarding destinations received the email
4. Check Discord/IFTTT/webhook logs for delivery confirmation

## Troubleshooting

### ❌ **Common Issues**

**Webhook Not Receiving Emails:**
- Verify webhook URL is correct
- Check email service provider settings
- Ensure forwarding is enabled
- Test with built-in test tool

**Discord Not Showing Messages:**
- Verify Discord webhook URL
- Check channel permissions
- Test webhook URL directly

**Daily Limit Reached:**
- Monitor usage in Settings tab
- Upgrade to premium for higher limits
- Check for email loops or spam

**Email Not Appearing in Inbox:**
- Check Firestore security rules
- Verify user authentication
- Look for webhook errors in Firebase logs

### 🔍 **Debug Steps**
1. Check Firebase Functions logs
2. Test webhook URL directly with curl/Postman
3. Verify email service provider configuration
4. Check user settings and permissions

## Premium Features

### 👑 **Premium Plan Benefits**
- 200 emails per day (vs 50 for standard)
- Advanced filtering rules
- Priority support
- Enhanced webhook formats
- Custom templates and formatting

### 💰 **Upgrading**
Contact your administrator to upgrade your plan for access to premium forwarding features.

## API Reference

### 📡 **Webhook Endpoint**
```
POST https://your-project.cloudfunctions.net/emailWebhook
Query Parameters:
  - userId: Your user ID (required)

Supported Formats:
  - Generic JSON
  - SendGrid Inbound Parse
  - Mailgun Routes
  - Postmark Inbound
```

### 🔧 **Custom Integration**
For advanced users, you can send emails directly to the webhook:

```bash
curl -X POST "https://your-project.cloudfunctions.net/emailWebhook?userId=YOUR_USER_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "sender@example.com",
    "fromName": "Sender Name",
    "subject": "Test Email",
    "text": "Email body content",
    "html": "<p>Email body content</p>"
  }'
```

## Support

Need help? Contact support or check the GitHub repository for detailed documentation and examples.

---

**Happy Email Forwarding! 📧✨**