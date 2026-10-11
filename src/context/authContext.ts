import { createContext, useContext } from 'react';
import type { User, UserRole } from '../types';

export interface AuthContextType {
  currentUser: User | null;
  role: UserRole | null;
  isAdmin: boolean;
  isStudent: boolean;
  users: User[];
  lockedExamIds: string[];
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'register';
  openAuthModal: (mode?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  isRegistrationEnabled: boolean;
  toggleRegistrationEnabled: () => void;
  setRegistrationEnabled: (enabled: boolean) => void;
  login: (email: string, password: string) => { success: boolean; error?: string };
  register: (name: string, email: string, password: string, role?: UserRole) => { success: boolean; error?: string };
  addUser: (name: string, email: string, password: string, role?: UserRole) => { success: boolean; error?: string };
  updateUser: (
    userId: string,
    updates: { name?: string; email?: string; role?: UserRole; password?: string }
  ) => { success: boolean; error?: string };
  setUserPassword: (userId: string, newPassword: string) => { success: boolean; error?: string };
  logout: () => void;
  updateUserRole: (userId: string, newRole: UserRole) => void;
  resetStudentProgress: (userId: string) => void;
  deleteUser: (userId: string) => void;
  toggleLockExam: (examId: string) => void;
  isExamLocked: (examId: string, examTitle?: string) => boolean;
  setAllExamsLocked: (examIds: string[], locked: boolean) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
