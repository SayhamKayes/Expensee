import { useState, useEffect } from 'react';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';

export function useAuth() {
  // State to hold the logged-in user's data (name, email, profile picture)
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // If we are testing on the web (not a physical phone), we have to manually initialize the plugin
    if (!Capacitor.isNativePlatform()) {
      GoogleAuth.initialize({
        clientId: '776701945232-kfjjlrq1kiivtsov9re4hpj3e78cu1k2.apps.googleusercontent.com',
        scopes: ['profile', 'email', 'https://www.googleapis.com/auth/drive.file'],
        grantOfflineAccess: true,
      });
    }
  }, []);

  const signIn = async () => {
    try {
      // Triggers the native Android popup or the Web popup!
      const googleUser = await GoogleAuth.signIn();
      setUser(googleUser);
      toast.success(`Welcome, ${googleUser.givenName}!`);
      return googleUser;
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      toast.error('Failed to sign in. Please try again.');
    }
  };

  const signOut = async () => {
    try {
      await GoogleAuth.signOut();
      setUser(null);
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Sign Out Error:', error);
    }
  };

  return { user, signIn, signOut };
}