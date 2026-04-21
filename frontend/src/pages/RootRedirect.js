import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function RootRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('pixora_token');

    if (token) {
      // User has token → go to home page
      navigate('/home', { replace: true });
    } else {
      // No token → go to login page
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  return null; // This component doesn't render anything
}

export default RootRedirect;
