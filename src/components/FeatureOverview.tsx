import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Users, Bell, Calendar, DollarSign, Shield } from 'lucide-react';

export const FeatureOverview = () => {
  const features = [
    {
      icon: Users,
      title: "User Management",
      description: "Create and manage users with comprehensive subscription details",
      items: [
        "Add new users with email and display name",
        "Set subscription account credentials",
        "Manage user roles (admin/user)",
        "Edit user information and subscriptions",
        "Delete users when needed"
      ],
      status: "implemented"
    },
    {
      icon: DollarSign,
      title: "Subscription Management",
      description: "Handle various subscription services with pricing in INR",
      items: [
        "Pre-defined services (Netflix ₹200, Amazon Prime ₹150, Disney+ ₹100, etc.)",
        "Custom service support for any subscription",
        "Price management in Indian Rupees",
        "Due date tracking",
        "Status management (active, pending, expired)"
      ],
      status: "implemented"
    },
    {
      icon: Bell,
      title: "Reminder System",
      description: "Automated reminder system for subscription renewals",
      items: [
        "Set custom reminder days before due date",
        "Automatic reminder calculation based on due dates",
        "Pending reminders dashboard",
        "Mark reminders as sent",
        "Overdue tracking and alerts"
      ],
      status: "implemented"
    },
    {
      icon: Calendar,
      title: "Due Date Management",
      description: "Comprehensive due date tracking and visualization",
      items: [
        "Visual due date picker",
        "Days until due calculation",
        "Overdue highlighting",
        "Near-due warnings (7 days)",
        "Date formatting and display"
      ],
      status: "implemented"
    },
    {
      icon: Shield,
      title: "Admin Dashboard",
      description: "Powerful admin interface for subscription management",
      items: [
        "User creation modal with subscription setup",
        "Edit user modal for updates",
        "Reminders management tab",
        "Revenue and user statistics",
        "Growth rate tracking"
      ],
      status: "implemented"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'implemented':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'planned':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">SubVault Admin Features</h1>
        <p className="text-muted-foreground">
          Comprehensive subscription management system with user creation and reminder capabilities
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <Card key={index} className="bg-gradient-card shadow-card border-0">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                    </div>
                  </div>
                  <Badge className={getStatusColor(feature.status)}>
                    <CheckCircle className="mr-1 h-3 w-3" />
                    {feature.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {feature.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-gradient-card shadow-card border-0">
        <CardHeader>
          <CardTitle>How to Use</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">1. Creating a New User</h4>
            <p className="text-sm text-muted-foreground">
              Click "Add New User" button, fill in user details, select a subscription service (e.g., Netflix ₹200/month), 
              set the account email, due date, and reminder preferences. The system will automatically create reminders 
              based on your settings.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">2. Managing Subscriptions</h4>
            <p className="text-sm text-muted-foreground">
              Edit existing users to update their subscription details, change due dates, or modify reminder settings. 
              The system supports both predefined services and custom subscription services.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">3. Handling Reminders</h4>
            <p className="text-sm text-muted-foreground">
              Use the Reminders tab to view pending reminders, mark them as sent, and track overdue subscriptions. 
              The system automatically calculates reminder dates based on your configured days-before settings.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">4. Monitoring Dashboard</h4>
            <p className="text-sm text-muted-foreground">
              Track key metrics including total users, active subscriptions, monthly revenue in INR, and growth rates. 
              The dashboard provides real-time insights into your subscription management performance.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
