import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '@/components/auth/LoginForm';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/ui/logo';

const Login = () => {
  const navigate = useNavigate();
  const { currentUser, loading } = useAuth();

  useEffect(() => {
    if (currentUser && !loading) {
      navigate('/', { replace: true });
    }
  }, [currentUser, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-netflix-bg flex items-center justify-center">
        <div className="text-center">
          <Logo size="lg" glow={true} className="mb-4 justify-center" />
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-netflix-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md netflix-scale-in">
        <div className="text-center mb-8">
          <Logo size="lg" glow={true} className="mb-4 netflix-fade-in justify-center" />
          <p className="text-muted-foreground mt-2 netflix-slide-up">
            Sign in to manage your subscriptions
          </p>
        </div>
        <LoginForm onSuccess={() => navigate('/', { replace: true })} />
      </div>
    </div>
  );
};

export default Login;
