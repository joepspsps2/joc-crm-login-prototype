import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { auth, handleAuthRedirect } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isRedirectHandled = false;
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // Handle redirect result on page load (only once)
      if (!user && !isRedirectHandled) {
        isRedirectHandled = true;
        try {
          const redirectUser = await handleAuthRedirect();
          if (redirectUser) {
            // User will be set by the auth state change, no need to set here
            return;
          }
        } catch (error) {
          console.error('Auth redirect error:', error);
        }
      }
      
      setUser(user);
      setLoading(false);

      // Create or update unified user record and navigate
      if (user) {
        try {
          await fetch('/api/users', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${await user.getIdToken()}`,
            },
            body: JSON.stringify({
              firebaseUid: user.uid,
              email: user.email,
              displayName: user.displayName,
              phoneNumber: user.phoneNumber,
              providers: user.providerData.map(p => p.providerId),
            }),
          });
          
          // Navigate to dashboard after successful authentication
          // Only if we're not already on a protected page
          if (window.location.pathname === '/' || window.location.pathname === '/auth-selection' || window.location.pathname === '/email-login') {
            window.location.href = '/dashboard';
          }
        } catch (error) {
          console.error('Error creating/updating user:', error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    await auth.signOut();
  };

  const value = {
    user,
    loading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
