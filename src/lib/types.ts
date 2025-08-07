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
