import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';
import {
  loginUser,
  signUpUser,
  logoutUser,
  getUserProfile,
  loginWithGoogleIdToken,
} from '../services/authService';
import { UserProfile } from '../types/user';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signUp: (name: string, email: string, pass: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (firebaseUser: User) => {
    const profile = await getUserProfile(firebaseUser.uid);
    if (profile) {
      setUserProfile(profile);
    } else {
      setUserProfile({
        id: firebaseUser.uid,
        name: firebaseUser.displayName || firebaseUser.email || 'User',
        email: firebaseUser.email || '',
        avatarUrl: '',
      });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await fetchProfile(firebaseUser);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    const firebaseUser = await loginUser(email, pass);
    await fetchProfile(firebaseUser);
  };

  const signUp = async (name: string, email: string, pass: string) => {
    const profile = await signUpUser(name, email, pass);
    setUserProfile(profile);
  };

  const loginWithGoogle = async (idToken: string) => {
    const firebaseUser = await loginWithGoogleIdToken(idToken);
    await fetchProfile(firebaseUser);
  };

  const logout = async () => {
    await logoutUser();
    setUser(null);
    setUserProfile(null);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        login,
        signUp,
        loginWithGoogle,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
