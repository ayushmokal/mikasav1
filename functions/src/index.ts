/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {setGlobalOptions} from "firebase-functions";
import {onRequest} from "firebase-functions/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import {Request, Response} from "express";

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

// Email webhook handler
export const emailWebhook = onRequest(async (req: Request, res: Response) => {
  try {
    // CORS headers
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
      res.status(200).send('');
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).send('Method not allowed');
      return;
    }

    // Extract user ID from path or query params
    const userId = req.query.userId as string || req.path.split('/').pop();
    
    if (!userId) {
      res.status(400).send('User ID is required');
      return;
    }

    logger.info('Email webhook received', {
      userId,
      contentType: req.headers['content-type'],
      bodySize: JSON.stringify(req.body).length
    });

    // Parse email data from webhook payload
    // This format will depend on your email service provider
    // Common formats: SendGrid, Mailgun, Postmark, etc.
    const emailData = parseEmailWebhook(req.body, req.headers);
    
    if (!emailData) {
      res.status(400).send('Invalid email data');
      return;
    }

    // Verify user exists and has inbox settings enabled
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      res.status(404).send('User not found');
      return;
    }

    const userData = userDoc.data();
    if (!userData?.inboxSettings?.forwardingEnabled) {
      res.status(403).send('Email forwarding not enabled for this user');
      return;
    }

    // Check daily forwarding limit (InstAddr-style)
    const dailyCount = userData.inboxSettings.dailyForwardingCount || 0;
    const dailyLimit = userData.inboxSettings.dailyForwardingLimit || 50;
    
    if (dailyCount >= dailyLimit) {
      logger.warn('Daily forwarding limit exceeded', { userId, dailyCount, dailyLimit });
      res.status(429).send('Daily forwarding limit exceeded');
      return;
    }

    // Check if email is already forwarded (InstAddr prevention)
    if (userData.inboxSettings.preventForwardedEmails && emailData.subject) {
      const subject = emailData.subject.toLowerCase();
      if (subject.startsWith('fw:') || subject.startsWith('fwd:')) {
        logger.info('Skipping already forwarded email', { userId, subject: emailData.subject });
        res.status(200).json({ success: true, message: 'Skipped forwarded email' });
        return;
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
      receivedAt: admin.firestore.Timestamp.now(),
      isRead: userData.inboxSettings.autoMarkAsRead || false,
      isStarred: false,
      attachments: emailData.attachments || [],
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now()
    };

    const emailRef = await db.collection('emails').add(emailDoc);
    
    // Update daily forwarding count
    await db.collection('users').doc(userId).update({
      'inboxSettings.dailyForwardingCount': dailyCount + 1
    });
    
    // Process forwarding destinations (InstAddr-style multiple destinations)
    if (userData.inboxSettings.forwardingDestinations && 
        userData.inboxSettings.forwardingDestinations.length > 0) {
      await processForwardingDestinations(
        userData.inboxSettings.forwardingDestinations, 
        emailData, 
        userId
      );
    }
    
    logger.info('Email stored successfully', {
      emailId: emailRef.id,
      userId,
      subject: emailData.subject,
      from: emailData.from
    });

    // Optional: Trigger notification or other actions
    if (!userData.inboxSettings.autoMarkAsRead) {
      // Could trigger push notification here
      logger.info('New unread email notification could be sent', { userId });
    }

    res.status(200).json({
      success: true,
      emailId: emailRef.id,
      message: 'Email processed successfully'
    });

  } catch (error) {
    logger.error('Email webhook error', error);
    res.status(500).send('Internal server error');
  }
});

// Parse email webhook payload
// This function needs to be adapted based on your email service provider
function parseEmailWebhook(body: any, headers: any): any {
  try {
    // Example for generic webhook format
    // Adapt this based on your email service provider:
    // - SendGrid: https://docs.sendgrid.com/for-developers/parsing-email/setting-up-the-inbound-parse-webhook
    // - Mailgun: https://documentation.mailgun.com/en/latest/user_manual.html#receiving-messages
    // - Postmark: https://postmarkapp.com/developer/webhooks/inbound-webhook
    
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

    logger.warn('Unknown email webhook format', { body, headers });
    return null;

  } catch (error) {
    logger.error('Error parsing email webhook', error);
    return null;
  }
}

// Parse attachments from various formats
function parseAttachments(attachments: any): any[] {
  if (!attachments) return [];
  
  try {
    if (Array.isArray(attachments)) {
      return attachments.map(att => ({
        filename: att.filename || att.name || 'attachment',
        contentType: att.contentType || att['content-type'] || 'application/octet-stream',
        size: att.size || 0,
        data: att.data || att.content // Base64 encoded data
      }));
    }

    // Handle object format (e.g., SendGrid)
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
    logger.error('Error parsing attachments', error);
    return [];
  }
}

// Process forwarding destinations (InstAddr-style)
async function processForwardingDestinations(destinations: any[], emailData: any, userId: string) {
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
        case 'email':
          // Email forwarding would require SMTP setup
          logger.info('Email forwarding not implemented yet', { destination });
          break;
      }
    } catch (error) {
      logger.error('Error processing forwarding destination', { 
        error, 
        destination: destination.name, 
        userId 
      });
    }
  }
}

// Forward to Discord webhook
async function forwardToDiscord(destination: any, emailData: any) {
  const template = destination.template || `📧 **New Email**\n**From:** {{fromEmail}}\n**Subject:** {{subject}}\n\n{{textBody}}`;
  
  const message = template
    .replace(/{{fromEmail}}/g, emailData.from)
    .replace(/{{fromName}}/g, emailData.fromName || emailData.from)
    .replace(/{{subject}}/g, emailData.subject)
    .replace(/{{textBody}}/g, emailData.textBody.substring(0, 1000))
    .replace(/{{receivedAt}}/g, new Date().toISOString());

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

  logger.info('Email forwarded to Discord', { 
    destination: destination.name,
    subject: emailData.subject 
  });
}

// Forward to custom webhook
async function forwardToWebhook(destination: any, emailData: any) {
  let payload: any;
  
  const templateData = {
    fromEmail: emailData.from,
    fromName: emailData.fromName,
    subject: emailData.subject,
    textBody: emailData.textBody,
    htmlBody: emailData.htmlBody,
    receivedAt: new Date().toISOString()
  };

  switch (destination.webhookFormat) {
    case 'json':
      payload = templateData;
      break;
    case 'form':
      payload = new URLSearchParams(templateData as any);
      break;
    case 'plaintext':
      const template = destination.template || '{{subject}} from {{fromEmail}}';
      payload = Object.entries(templateData).reduce(
        (text, [key, value]) => text.replace(new RegExp(`{{${key}}}`, 'g'), value),
        template
      );
      break;
  }

  const headers = {
    'Content-Type': destination.webhookFormat === 'json' ? 'application/json' : 
                   destination.webhookFormat === 'form' ? 'application/x-www-form-urlencoded' : 
                   'text/plain',
    ...destination.webhookHeaders
  };

  const response = await fetch(destination.webhookUrl, {
    method: destination.webhookMethod || 'POST',
    headers,
    body: typeof payload === 'string' ? payload : JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Webhook failed: ${response.status}`);
  }

  logger.info('Email forwarded to webhook', { 
    destination: destination.name,
    subject: emailData.subject 
  });
}

// Forward to IFTTT
async function forwardToIFTTT(destination: any, emailData: any) {
  const url = `https://maker.ifttt.com/trigger/${destination.iftttEvent}/with/key/${destination.iftttKey}`;
  
  const payload = {
    value1: emailData.subject,
    value2: emailData.from,
    value3: emailData.textBody.substring(0, 500)
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`IFTTT webhook failed: ${response.status}`);
  }

  logger.info('Email forwarded to IFTTT', { 
    destination: destination.name,
    event: destination.iftttEvent 
  });
}
