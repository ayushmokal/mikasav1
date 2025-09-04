// Subscription Plan types
export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  description?: string;
  features?: string[];
  isActive: boolean;
  createdAt: any;
  updatedAt: any;
}

// Shared Account types
export interface SharedAccount {
  id: string;
  planId: string;
  planName: string;
  email: string;
  password: string;
  maxUsers: number;
  currentUsers: number;
  assignedUserIds: string[];
  status: 'active' | 'inactive' | 'suspended';
  notes?: string;
  createdAt: any;
  updatedAt: any;
}

// Account Assignment types
export interface AccountAssignment {
  id: string;
  userId: string;
  userEmail: string;
  accountId: string;
  planId: string;
  assignedAt: any;
  status: 'active' | 'inactive';
}

// Email Inbox types
export interface EmailMessage {
  id: string;
  userId: string;
  fromEmail: string;
  fromName?: string;
  subject: string;
  textBody: string;
  htmlBody?: string;
  receivedAt: any;
  isRead: boolean;
  isStarred: boolean;
  attachments?: EmailAttachment[];
}

export interface EmailAttachment {
  filename: string;
  contentType: string;
  size: number;
  data?: string; // Base64 encoded
}

export interface InboxSettings {
  forwardingEnabled: boolean;
  forwardingMethod: 'webhook' | 'email' | 'multiple';
  webhookUrl?: string;
  forwardingEmail?: string;
  receivingAddress: string; // The email address that receives emails (accountEmail)
  autoMarkAsRead: boolean;
  retentionDays: number; // How long to keep emails
  // InstAddr-inspired features
  forwardingDestinations: ForwardingDestination[];
  dailyForwardingLimit: number; // Max 200 per day
  dailyForwardingCount: number; // Current day count
  preventForwardedEmails: boolean; // Skip emails with Fw:/Fwd: prefixes
  premiumFeaturesEnabled: boolean;
}

export interface ForwardingDestination {
  id: string;
  type: 'email' | 'webhook' | 'discord' | 'ifttt';
  name: string;
  enabled: boolean;
  // Email forwarding
  email?: string;
  // Webhook forwarding
  webhookUrl?: string;
  webhookMethod: 'POST' | 'GET';
  webhookFormat: 'json' | 'form' | 'plaintext';
  webhookHeaders?: { [key: string]: string };
  webhookParams?: { [key: string]: string };
  // Discord integration
  discordWebhookUrl?: string;
  discordUsername?: string;
  // IFTTT integration
  iftttKey?: string;
  iftttEvent?: string;
  // Advanced settings
  filterRules?: EmailFilterRule[];
  template?: string; // Custom message template
}

export interface EmailFilterRule {
  id: string;
  type: 'sender' | 'subject' | 'body' | 'attachment';
  condition: 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'regex';
  value: string;
  action: 'include' | 'exclude';
}
