'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: 'customer' | 'vendor' | 'admin';
}

export default function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, token, checkAuth } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuthentication = async () => {
      if (!isAuthenticated || !token) {
        // Public routes that don't require auth
        if (pathname === '/login' || pathname === '/register' || pathname === '/') {
          setIsChecking(false);
          return;
        }
        
        // User is not authenticated, redirect to login
        router.push('/login');
        return;
      }
      
      // Verify token is still valid
      const isValid = await checkAuth();
      
      if (!isValid) {
        // Token is invalid, redirect to login
        router.push('/login');
        return;
      }
      
      // Check role-based access if requiredRole is specified
      if (requiredRole && user?.role !== requiredRole) {
        // User doesn't have the required role
        switch (user?.role) {
          case 'customer':
            router.push('/menu');
            break;
          case 'vendor':
            router.push('/vendor/dashboard');
            break;
          case 'admin':
            router.push('/admin/dashboard');
            break;
          default:
            router.push('/login');
        }
        return;
      }
      
      setIsChecking(false);
    };
    
    checkAuthentication();
  }, [isAuthenticated, token, pathname, router, checkAuth, requiredRole, user]);

  if (isChecking) {
    // Show a loading state
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return <>{children}</>;
}
