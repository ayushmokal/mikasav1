// Vercel API endpoint for email webhook processing
// This replaces the Firebase Cloud Function for free deployment

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, doc, getDoc, addDoc, updateDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';

// Initialize Firebase (Vercel will use environment variables)
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID || process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase only if not already initialized
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Accept POST (preferred) and GET (fallback for services that only support query params)
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Merge query params into body so we can support providers that send data via query string
    const payload = {
      ...(typeof req.body === 'object' ? req.body : {}),
      ...(req.query || {})
    };

    // Extract receiving address from query params or body
    const receivingAddress = payload.address || payload.receivingAddress;
    
    if (!receivingAddress) {
      return res.status(400).json({ error: 'Receiving address is required' });
    }

    console.log('Email webhook received for:', receivingAddress);

    // Parse email data from webhook payload (merged body + query)
    const emailData = parseEmailWebhook(payload, req.headers);
    
    if (!emailData) {
      return res.status(400).json({ error: 'Invalid email data' });
    }

    // Find user by account email (receiving address)
    const usersQuery = query(
      collection(db, 'users'), 
      where('accountEmail', '==', receivingAddress)
    );
    const userSnapshot = await getDocs(usersQuery);
    
    if (userSnapshot.empty) {
      return res.status(404).json({ error: 'User not found for receiving address' });
    }

    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();
    const userId = userDoc.id;

    if (!userData?.inboxSettings?.forwardingEnabled) {
      return res.status(403).json({ error: 'Email forwarding not enabled for this user' });
    }

    // Check daily forwarding limit
    const dailyCount = userData.inboxSettings.dailyForwardingCount || 0;
    const dailyLimit = userData.inboxSettings.dailyForwardingLimit || 50;
    
    if (dailyCount >= dailyLimit) {
      console.warn('Daily forwarding limit exceeded', { userId, dailyCount, dailyLimit });
      return res.status(429).json({ error: 'Daily forwarding limit exceeded' });
    }

    // Check if email is already forwarded (prevent Fw:/Fwd: emails)
    if (userData.inboxSettings.preventForwardedEmails && emailData.subject) {
      const subject = emailData.subject.toLowerCase();
      if (subject.startsWith('fw:') || subject.startsWith('fwd:')) {
        console.log('Skipping already forwarded email', { userId, subject: emailData.subject });
        return res.status(200).json({ success: true, message: 'Skipped forwarded email' });
      }
    }

    // Store email in Firestore
    const emailDoc = {
      userId,
      fromEmail: emailData.from,
      fromName: emailData.fromName || '',
      subject: emailData.subject || 'No Subject',
      textBody: emailData.textBody || '',
      htmlBody: emailData.htmlBody || '',
      receivedAt: Timestamp.now(),
      isRead: userData.inboxSettings.autoMarkAsRead || false,
      isStarred: false,
      attachments: emailData.attachments || [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    const emailRef = await addDoc(collection(db, 'emails'), emailDoc);
    
    // Update daily forwarding count
    await updateDoc(doc(db, 'users', userId), {
      'inboxSettings.dailyForwardingCount': dailyCount + 1
    });
    
    // Process forwarding destinations
    if (userData.inboxSettings.forwardingDestinations && 
        userData.inboxSettings.forwardingDestinations.length > 0) {
      await processForwardingDestinations(
        userData.inboxSettings.forwardingDestinations, 
        emailData, 
        userId
      );
    }
    
    console.log('Email stored successfully', {
      emailId: emailRef.id,
      userId,
      subject: emailData.subject,
      from: emailData.from
    });

    return res.status(200).json({
      success: true,
      emailId: emailRef.id,
      message: 'Email processed successfully'
    });

  } catch (error) {
    console.error('Email webhook error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Parse email webhook payload (same as Firebase function)
function parseEmailWebhook(body, headers) {
  try {
    // If provider sent JSON as a string in a single field (rare), try to parse it
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (_) {}
    }

    // Generic format
    if (body.from && body.subject !== undefined) {
      return {
        from: body.from,
        fromName: body.fromName || body['from-name'] || '',
        subject: body.subject,
        textBody: body.text || body['text-body'] || '',
        htmlBody: body.html || body['html-body'] || '',
        attachments: parseAttachments(body.attachments || [])
      };
    }

    // SendGrid format
    if (body.envelope) {
      return {
        from: body.envelope.from,
        fromName: body.from,
        subject: body.subject,
        textBody: body.text,
        htmlBody: body.html,
        attachments: parseAttachments(body.attachments || {})
      };
    }

    // Mailgun format
    if (body.sender) {
      return {
        from: body.sender,
        fromName: body.From || body.sender,
        subject: body.Subject || body.subject,
        textBody: body['body-plain'] || body.text,
        htmlBody: body['body-html'] || body.html,
        attachments: parseAttachments(body.attachments || [])
      };
    }

    // InstAddr-style format
    // Common configuration uses:
    //   content: "#subject#\n#textbody#"
    //   username: "#from#"
    // InstAddr replaces the tokens, so we typically get:
    //   content: "Actual subject\nActual plain text body"
    //   username: "sender@example.com" (or "Name <sender@example.com>")
    if (typeof body.content === 'string' || typeof body.username === 'string') {
      const content = (body.content ?? '').toString();
      const username = (body.username ?? body.from ?? body.sender ?? '').toString();

      // If content contains token names (e.g., "#subject#"), strip them. Otherwise
      // treat first line as subject and the rest as body.
      let subject = '';
      let textBody = '';
      if (/#subject#|#textbody#/i.test(content)) {
        subject = content.replace(/^[^#]*#subject#/i, '').split(/\r?\n/)[0] ?? '';
        textBody = content.split(/\r?\n/).slice(1).join('\n') || '';
      } else {
        const [firstLine, ...rest] = content.split(/\r?\n/);
        subject = (firstLine || '').trim();
        textBody = rest.join('\n').trim();
      }

      // Clean up username like "#from#name <email>" or plain email
      const from = username.replace(/#from#/gi, '').trim();

      return {
        from,
        fromName: '',
        subject: subject || body.subject || 'No Subject',
        textBody: textBody || body.text || '',
        htmlBody: body.html || '',
        attachments: parseAttachments(body.attachments || [])
      };
    }

    console.warn('Unknown email webhook format', { body, headers });
    return null;

  } catch (error) {
    console.error('Error parsing email webhook:', error);
    return null;
  }
}

// Parse attachments
function parseAttachments(attachments) {
  if (!attachments) return [];
  
  try {
    if (Array.isArray(attachments)) {
      return attachments.map(att => ({
        filename: att.filename || att.name || 'attachment',
        contentType: att.contentType || att['content-type'] || 'application/octet-stream',
        size: att.size || 0,
        data: att.data || att.content
      }));
    }

    if (typeof attachments === 'object') {
      return Object.keys(attachments).map(key => ({
        filename: key,
        contentType: 'application/octet-stream',
        size: 0,
        data: attachments[key]
      }));
    }

    return [];
  } catch (error) {
    console.error('Error parsing attachments:', error);
    return [];
  }
}

// Process forwarding destinations (simplified for Vercel)
async function processForwardingDestinations(destinations, emailData, userId) {
  for (const destination of destinations) {
    if (!destination.enabled) continue;

    try {
      switch (destination.type) {
        case 'discord':
          await forwardToDiscord(destination, emailData);
          break;
        case 'webhook':
          await forwardToWebhook(destination, emailData);
          break;
        case 'ifttt':
          await forwardToIFTTT(destination, emailData);
          break;
      }
    } catch (error) {
      console.error('Error processing forwarding destination:', error);
    }
  }
}

// Forward to Discord
async function forwardToDiscord(destination, emailData) {
  const template = destination.template || `📧 **New Email**\n**From:** {{fromEmail}}\n**Subject:** {{subject}}\n\n{{textBody}}`;
  
  const message = template
    .replace(/\{\{fromEmail\}\}/g, emailData.from)
    .replace(/\{\{fromName\}\}/g, emailData.fromName || emailData.from)
    .replace(/\{\{subject\}\}/g, emailData.subject)
    .replace(/\{\{textBody\}\}/g, emailData.textBody.substring(0, 1000))
    .replace(/\{\{receivedAt\}\}/g, new Date().toISOString());

  const payload = {
    content: message,
    username: destination.discordUsername || 'Email Bot'
  };

  const response = await fetch(destination.discordWebhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Discord webhook failed: ${response.status}`);
  }
}

// Forward to custom webhook
async function forwardToWebhook(destination, emailData) {
  const templateData = {
    fromEmail: emailData.from,
    fromName: emailData.fromName,
    subject: emailData.subject,
    textBody: emailData.textBody,
    htmlBody: emailData.htmlBody,
    receivedAt: new Date().toISOString()
  };

  let payload;
  switch (destination.webhookFormat) {
    case 'json':
      payload = JSON.stringify(templateData);
      break;
    case 'form':
      payload = new URLSearchParams(templateData).toString();
      break;
    case 'plaintext':
      const template = destination.template || '{{subject}} from {{fromEmail}}';
      payload = Object.entries(templateData).reduce(
        (text, [key, value]) => text.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value),
        template
      );
      break;
  }

  await fetch(destination.webhookUrl, {
    method: destination.webhookMethod || 'POST',
    headers: {
      'Content-Type': destination.webhookFormat === 'json' ? 'application/json' : 
                     destination.webhookFormat === 'form' ? 'application/x-www-form-urlencoded' : 
                     'text/plain',
      ...destination.webhookHeaders
    },
    body: payload
  });
}

// Forward to IFTTT
async function forwardToIFTTT(destination, emailData) {
  const url = `https://maker.ifttt.com/trigger/${destination.iftttEvent}/with/key/${destination.iftttKey}`;
  
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      value1: emailData.subject,
      value2: emailData.from,
      value3: emailData.textBody.substring(0, 500)
    })
  });
}
