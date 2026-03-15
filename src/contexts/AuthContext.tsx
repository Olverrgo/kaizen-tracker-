import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import type { User, AuthState } from '../types';

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo user for local mode
const DEMO_USER: User = {
  uid: 'demo-user-001',
  email: 'demo@kaizen.local',
  displayName: 'Usuario Kaizen',
  photoURL: null,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  // Check if user was previously logged in
  const savedUser = localStorage.getItem('kaizen-user');

  const [state, setState] = useState<AuthState>({
    user: savedUser ? JSON.parse(savedUser) : null,
    loading: false,
    error: null,
  });

  const signIn = async (email: string, _password: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    // Simulate login delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Create user from email
    const user: User = {
      uid: 'user-' + Date.now(),
      email: email,
      displayName: email.split('@')[0],
      photoURL: null,
    };

    localStorage.setItem('kaizen-user', JSON.stringify(user));
    setState({ user, loading: false, error: null });
  };

  const signUp = async (email: string, password: string) => {
    // Same as signIn for demo mode
    await signIn(email, password);
  };

  const signInWithGoogle = async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    // Simulate login delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    localStorage.setItem('kaizen-user', JSON.stringify(DEMO_USER));
    setState({ user: DEMO_USER, loading: false, error: null });
  };

  const signOut = async () => {
    localStorage.removeItem('kaizen-user');
    setState({ user: null, loading: false, error: null });
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
