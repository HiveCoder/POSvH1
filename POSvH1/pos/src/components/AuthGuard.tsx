import React, { useEffect, useState } from 'react';
import { useRootStore } from '../store/root-store';
import { Button } from './ui/button';
import { Spinner } from './ui/spinner';
import { RefreshCw } from 'lucide-react';
import { IS_WEBSITE_MODE } from '../lib/platform';

interface Props {
  children: React.ReactNode;
}

const AuthGuard: React.FC<Props> = ({ children }) => {
  const { 
    checkAuth, 
    user, 
    isLoading: authLoading, 
    error: authError,
    fetchPosProfile,
    posProfile,
    isLoading: configLoading,
    error: configError,
    hasAccess,
  } = useRootStore();

  // State to track if we're rechecking permissions
  const [isRechecking, setIsRechecking] = useState(false);

  useEffect(() => {
    // Start auth check
    checkAuth();
  }, [checkAuth]);

  // Once we have a user, fetch POS profile
  useEffect(() => {
    if (user) {
      fetchPosProfile();
    }
  }, [user, fetchPosProfile]);

  // Show loading state while either auth or config is loading
  if (authLoading || (user && configLoading) || isRechecking) {
    return (
      <div className="min-h-screen">
        <Spinner />
      </div>
    );
  }

  if (authError || configError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600">{authError || configError}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // In Frappe mode checkAuth handles redirects. In website mode, no redirect is used.
    return null;
  }

  if (!posProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-amber-600 text-xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Configuration Error</h2>
          <p className="text-gray-600">POS Profile not found or not configured.</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    const requiredRoles = posProfile.role_allowed_for_billing?.map(r => r.role).join(', ') || 'Cashier';
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-amber-600 text-xl mb-4">🔒</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Permission Required</h2>
          <p className="text-gray-600">You do not have permission to access this application.</p>
          <p className="text-sm text-gray-500 mt-2">Required roles: {requiredRoles}</p>
          <Button 
            variant="outline"
            className="mt-4"
            onClick={async () => {
              setIsRechecking(true);
              try {
                await fetchPosProfile(true); // Force refresh the POS profile
              } finally {
                setIsRechecking(false);
              }
            }}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {IS_WEBSITE_MODE ? 'Recheck Access' : 'Recheck Permissions'}
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthGuard; 