# SubVault - Subscription Management Platform

A modern React application for managing subscription services with Firebase backend integration.

## Features

- **User Authentication**: Email/password authentication with Firebase Auth
- **Role-based Access Control**: Separate dashboards for users and administrators
- **User Management**: Admin panel for managing all users and subscriptions
- **Real-time Data**: Firebase Firestore for real-time data synchronization
- **Responsive Design**: Modern UI with Tailwind CSS and shadcn/ui components

## Technologies Used

- **Frontend**: React 18, TypeScript, Vite
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **UI Components**: shadcn/ui, Tailwind CSS
- **State Management**: TanStack Query (React Query)
- **Routing**: React Router DOM
- **Build Tool**: Vite

## Quick Start

### Prerequisites

- Node.js & npm installed
- Firebase project set up (see [Firebase Setup Guide](./FIREBASE_SETUP.md))

### Installation

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to the project directory
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm install

# Copy environment file and configure Firebase
cp .env.example .env.local
# Edit .env.local with your Firebase configuration

# Start development server
npm run dev
```

### Environment Variables Setup

Before running the application, you need to set up the required environment variables:

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` with your actual Firebase configuration values

3. For Vercel deployment, use the provided script:
   ```bash
   ./add-env-vars.sh
   ```

For detailed setup instructions, see [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md)

### Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication with Email/Password provider
3. Create a Firestore database
4. Configure environment variables in `.env.local`

For detailed setup instructions, see [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)

## Project Structure

```
src/
├── components/
│   ├── auth/                 # Authentication components
│   ├── ui/                   # shadcn/ui components
│   ├── AdminDashboard.tsx    # Admin dashboard
│   ├── UserDashboard.tsx     # User dashboard
│   └── Navigation.tsx        # Navigation sidebar
├── contexts/
│   └── AuthContext.tsx       # Authentication context
├── hooks/
│   └── useFirestore.ts       # Custom Firestore hooks
├── lib/
│   ├── firebase.ts           # Firebase configuration
│   ├── auth.ts              # Authentication functions
│   ├── firestore.ts         # Firestore operations
│   └── utils.ts             # Utility functions
├── pages/
│   ├── Index.tsx            # Main dashboard page
│   ├── Login.tsx            # Login/signup page
│   ├── NotFound.tsx         # 404 page
│   └── Unauthorized.tsx     # Unauthorized access page
└── App.tsx                  # Main app component
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Authentication Flow

1. Users sign up/sign in with email and password
2. User profiles are automatically created in Firestore
3. Role-based access control determines dashboard view
4. Protected routes ensure authenticated access

## User Roles

- **User**: Can view and manage their own subscription details
- **Admin**: Can manage all users, view analytics, and perform administrative tasks

## Data Models

### User Document (Firestore)
```typescript
{
  uid: string;              // Firebase Auth UID
  email: string;            // User email
  displayName?: string;     // Optional display name
  role: 'user' | 'admin';   // User role
  accountEmail: string;     // Service account email
  accountPassword: string;  // Service account password
  plan: {
    name: string;           // Plan name
    price: number;          // Monthly price
    dueDate: string;        // Due date
    status: 'active' | 'expired' | 'pending';
  };
  joinDate: string;         // Join date
  createdAt: Timestamp;     // Creation timestamp
  updatedAt: Timestamp;     // Last update timestamp
}
```

## Security

- Environment variables for sensitive configuration
- Firestore security rules for data protection
- Role-based access control
- Protected routes and authentication guards

## Deployment

The application can be deployed to various platforms:

- **Lovable**: Click Share → Publish in the Lovable dashboard
- **Vercel**: Connect your GitHub repository
- **Netlify**: Deploy via Git integration
- **Firebase Hosting**: Use Firebase CLI

For Vercel deployment troubleshooting, see [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For issues and questions:
- Check the [Firebase Setup Guide](./FIREBASE_SETUP.md)
- Review the project documentation
- Open an issue on GitHub

## License

This project is built with Lovable and follows standard open-source practices.