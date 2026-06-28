import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function RootRedirect() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    // Wait for the server-side auth check (httpOnly cookie) to finish.
    if (isLoading) return;

    if (isAuthenticated) {
      navigate('/home', { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  return null; // This component doesn't render anything
}

export default RootRedirect;
