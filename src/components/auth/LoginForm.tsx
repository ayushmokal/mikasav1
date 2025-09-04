import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { signIn, signUp } from '@/lib/auth';
import { createUser } from '@/lib/firestore';
import { Timestamp } from 'firebase/firestore';

interface LoginFormProps {
  onSuccess?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
    accountEmail: '',
    accountPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const submitStartTime = Date.now();
    console.log('[LOGIN] Form submission started:', {
      email: formData.email,
      isLogin,
      timestamp: new Date().toISOString()
    });

    try {
      if (isLogin) {
        // Support a simple dev admin alias: email "admin" with password "admin"
        // Maps to a valid Firebase Auth account behind the scenes.
        let email = formData.email.trim();
        let password = formData.password;

        if (email === 'admin') {
          const aliasEmail = 'admin@local.dev';
          const aliasPassword = password === 'admin' ? 'adminadmin' : (password.length < 6 ? 'adminadmin' : password);

          console.log('[LOGIN] Admin alias detected, mapping to:', {
            original: { email, password: '***' },
            mapped: { email: aliasEmail, password: '***' }
          });

          // Ensure an admin profile exists in Firestore for aliasEmail
          try {
            const { collection, query, where, getDocs, addDoc, Timestamp } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');
            const q = query(collection(db, 'users'), where('email', '==', aliasEmail));
            const snap = await getDocs(q);
            if (snap.empty) {
              console.log('[LOGIN] Creating admin profile in Firestore');
              await addDoc(collection(db, 'users'), {
                uid: `temp_admin_${Date.now()}`,
                email: aliasEmail,
                displayName: 'Admin',
                role: 'admin',
                accountEmail: '',
                accountPassword: '',
                plan: { name: 'Admin', price: 0, dueDate: '2099-12-31', status: 'active' },
                joinDate: new Date().toISOString().split('T')[0],
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
              });
            }
          } catch (seedErr) {
            console.warn('[LOGIN] Admin seed step skipped:', seedErr);
          }

          email = aliasEmail;
          password = aliasPassword;
        }

        console.log('[LOGIN] Attempting sign in for:', email);
        const signInStartTime = Date.now();
        
        await signIn(email, password);
        
        const signInTime = Date.now() - signInStartTime;
        console.log('[LOGIN] Sign in successful:', {
          email,
          signInTimeMs: signInTime,
          totalTimeMs: Date.now() - submitStartTime
        });
      } else {
        console.log('[LOGIN] Attempting sign up for:', formData.email);
        // Sign up
        const authUser = await signUp(formData.email, formData.password, formData.displayName);
        console.log('[LOGIN] Auth user created:', {
          uid: authUser.uid,
          email: authUser.email,
          displayName: authUser.displayName
        });
        
        // Create user document in Firestore
        const userData = {
          uid: authUser.uid,
          email: authUser.email,
          displayName: authUser.displayName,
          role: 'user' as const,
          accountEmail: formData.accountEmail,
          accountPassword: formData.accountPassword,
          plan: {
            name: 'Basic',
            price: 9.99,
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
            status: 'active' as const,
          },
          joinDate: new Date().toISOString().split('T')[0],
        };
        
        console.log('[LOGIN] Creating user document in Firestore');
        const docId = await createUser(userData);
        console.log('[LOGIN] User document created with ID:', docId);
      }
      
      console.log('[LOGIN] Authentication process completed successfully');
      onSuccess?.();
    } catch (err: any) {
      const errorDetails = {
        message: err.message || 'Unknown error',
        code: err.code,
        email: formData.email,
        isLogin,
        timestamp: new Date().toISOString(),
        totalTimeMs: Date.now() - submitStartTime
      };
      
      console.error('[LOGIN] Authentication failed:', errorDetails);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{isLogin ? 'Sign In' : 'Sign Up'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              required
            />
          </div>
          
          {!isLogin && (
            <>
              <div>
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  name="displayName"
                  type="text"
                  value={formData.displayName}
                  onChange={handleInputChange}
                />
              </div>
              
              <div>
                <Label htmlFor="accountEmail">Service Account Email</Label>
                <Input
                  id="accountEmail"
                  name="accountEmail"
                  type="email"
                  value={formData.accountEmail}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="accountPassword">Service Account Password</Label>
                <Input
                  id="accountPassword"
                  name="accountPassword"
                  type="password"
                  value={formData.accountPassword}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </>
          )}
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Loading...' : (isLogin ? 'Sign In' : 'Sign Up')}
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
