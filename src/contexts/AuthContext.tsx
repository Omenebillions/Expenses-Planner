import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail, 
  signOut,
  updateProfile,
  User 
} from 'firebase/auth';
import { auth, googleProvider } from '../services/firebase';
import { createUserProfile, fetchUser } from '../services/db';
import { retryRequest } from '../lib/network';
import { detectLocationAndCurrency } from '../lib/location';

export type AppUser = User & { id: string };

interface AuthContextType {
  user: AppUser | null;
  userProfile: any | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signUpEmail: (email: string, pass: string, name: string) => Promise<void>;
  signInEmail: (email: string, pass: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      await handleAuthChange(currentUser);
    });

    return () => unsubscribe();
  }, []);

  const handleAuthChange = async (currentUser: User | null) => {
    const appUser = currentUser ? Object.assign(currentUser, { id: currentUser.uid }) as AppUser : null;
    setUser(appUser);
    if (appUser) {
      try {
        let profile = await retryRequest(() => fetchUser(appUser.uid));
        if (!profile) {
          // First time login - detect location & currency
          let detectedCurrency = 'USD';
          try {
            const detection = await detectLocationAndCurrency();
            detectedCurrency = detection.currency;
          } catch (e) {
            console.warn("Could not auto-detect currency on first sign in:", e);
          }
          
          const data = {
            email: appUser.email || '',
            name: appUser.displayName || 'New User',
            income: 0,
            currency: detectedCurrency
          };
          await retryRequest(() => createUserProfile(appUser.uid, data));
          profile = { id: appUser.uid, ...data };
        }
        setUserProfile(profile);
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    } else {
      setUserProfile(null);
    }
    setLoading(false);
  };

  const refreshProfile = async () => {
    if (user) {
      try {
        const profile = await retryRequest(() => fetchUser(user.uid));
        if (profile) setUserProfile(profile);
      } catch (error) {
        console.error("Error refreshing profile", error);
      }
    }
  };

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Google sign in error", error);
      throw error;
    }
  };

  const signUpEmail = async (email: string, pass: string, name: string) => {
    try {
      const { user: newUser } = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(newUser, { displayName: name });
      // updateProfile does not trigger onAuthStateChanged with updated name usually instantly for the current flow, 
      // but fetchUser/createUserProfile uses it. It will fallback to 'New User' if not ready, which is fine, we pass it.
    } catch (error: any) {
      console.error("Sign up error:", error);
      throw error;
    }
  };

  const signInEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error: any) {
      console.error("Sign in error:", error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      console.error("Reset password error", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign out error", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, signInWithGoogle, signUpEmail, signInEmail, resetPassword, logout, refreshProfile }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
