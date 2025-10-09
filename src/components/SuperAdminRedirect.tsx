import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';

export default function SuperAdminRedirect() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Redirect superadmin to super admin dashboard after login
    if (user?.role === 'superadmin' && location.pathname === '/') {
      navigate('/superadmin', { replace: true });
    }
  }, [user, navigate, location.pathname]);

  return null;
}