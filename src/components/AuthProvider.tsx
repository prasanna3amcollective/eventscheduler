'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  currentUser: any;
  setCurrentUser: React.Dispatch<React.SetStateAction<any>>;
  userRoles: string[];
  setUserRoles: React.Dispatch<React.SetStateAction<string[]>>;
  userPermissions: { canCreateActivity: boolean; canCreateResponsibility: boolean };
  setUserPermissions: React.Dispatch<React.SetStateAction<{ canCreateActivity: boolean; canCreateResponsibility: boolean }>>;
  isLoggedIn: boolean;
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  isLoadingSession: boolean;
  showSignInPanel: boolean;
  setShowSignInPanel: React.Dispatch<React.SetStateAction<boolean>>;
  showRegisterModal: boolean;
  setShowRegisterModal: React.Dispatch<React.SetStateAction<boolean>>;
  signinPhone: string;
  setSigninPhone: React.Dispatch<React.SetStateAction<string>>;
  signinPassword: string;
  setSigninPassword: React.Dispatch<React.SetStateAction<string>>;
  signinError: string | null;
  setSigninError: React.Dispatch<React.SetStateAction<string | null>>;
  signinSubmitting: boolean;
  setSigninSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
  handlePanelSignIn: () => Promise<void>;
  handleLogout: () => Promise<void>;
  handleLoginSuccess: (user: any) => Promise<void>;
  isProfileOpen: boolean;
  setIsProfileOpen: React.Dispatch<React.SetStateAction<boolean>>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [userPermissions, setUserPermissions] = useState({ canCreateActivity: false, canCreateResponsibility: false });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  // UI state for sign-in / registration / profile modals
  const [showSignInPanel, setShowSignInPanel] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Login form fields
  const [signinPhone, setSigninPhone] = useState('');
  const [signinPassword, setSigninPassword] = useState('');
  const [signinError, setSigninError] = useState<string | null>(null);
  const [signinSubmitting, setSigninSubmitting] = useState(false);

  const checkSession = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        setUserRoles(data.roles || []);
        setUserPermissions(data.permissions || { canCreateActivity: false, canCreateResponsibility: false });
        setIsLoggedIn(true);
      } else {
        setCurrentUser(null);
        setUserRoles([]);
        setUserPermissions({ canCreateActivity: false, canCreateResponsibility: false });
        setIsLoggedIn(false);
      }
    } catch (e) {
      console.error('Session check failed:', e);
    } finally {
      setIsLoadingSession(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const handleLoginSuccess = async (user: any) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
    if (typeof localStorage !== 'undefined' && localStorage.getItem('joinTechCommunity') === 'true') {
      fetch('/api/groups/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupName: 'tech community' })
      }).then(() => {
        localStorage.removeItem('joinTechCommunity');
      }).catch(console.error);
    }
    await checkSession();
  };

  const handlePanelSignIn = async () => {
    if (!signinPhone.trim() || !signinPassword) {
      setSigninError('Please enter phone number and password');
      return;
    }
    setSigninSubmitting(true);
    setSigninError(null);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: signinPhone.trim(), password: signinPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        await handleLoginSuccess(data.user);
        setShowSignInPanel(false);
        setSigninPhone('');
        setSigninPassword('');
        setSigninError(null);
      } else {
        setSigninError(data.error || 'Login failed');
      }
    } catch {
      setSigninError('An unexpected error occurred');
    } finally {
      setSigninSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
    } catch (e) {
      console.error('Logout failed:', e);
    } finally {
      setCurrentUser(null);
      setUserRoles([]);
      setUserPermissions({ canCreateActivity: false, canCreateResponsibility: false });
      setIsLoggedIn(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        userRoles,
        setUserRoles,
        userPermissions,
        setUserPermissions,
        isLoggedIn,
        setIsLoggedIn,
        isLoadingSession,
        showSignInPanel,
        setShowSignInPanel,
        showRegisterModal,
        setShowRegisterModal,
        signinPhone,
        setSigninPhone,
        signinPassword,
        setSigninPassword,
        signinError,
        setSigninError,
        signinSubmitting,
        setSigninSubmitting,
        handlePanelSignIn,
        handleLogout,
        handleLoginSuccess,
        isProfileOpen,
        setIsProfileOpen,
        refreshAuth: checkSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
