import React, { useState, useEffect, type ReactNode } from 'react';
import type { User, UserRole, ExamResult } from '../types';
import { AuthContext } from './authContext';

const DEFAULT_USERS: User[] = [
  {
    id: 'user-admin-1',
    name: 'Pak Guru Kim',
    email: 'admin@epstopik.com',
    role: 'admin',
    createdAt: '2026-01-15T08:00:00.000Z',
  },
  {
    id: 'user-student-1',
    name: 'Budi Santoso',
    email: 'siswa@epstopik.com',
    role: 'student',
    createdAt: '2026-02-01T09:30:00.000Z',
  },
  {
    id: 'user-student-2',
    name: 'Siti Nurhaliza',
    email: 'siti@epstopik.com',
    role: 'student',
    createdAt: '2026-02-10T11:15:00.000Z',
  },
  {
    id: 'user-student-3',
    name: 'Agus Pratama',
    email: 'agus@epstopik.com',
    role: 'student',
    createdAt: '2026-02-18T14:20:00.000Z',
  },
  {
    id: 'user-student-4',
    name: 'Rina Wulandari',
    email: 'rina@epstopik.com',
    role: 'student',
    createdAt: '2026-03-01T10:00:00.000Z',
  },
];

const DEFAULT_PASSWORDS: Record<string, string> = {
  'admin@epstopik.com': '!4421Ngadmin',
  'siswa@epstopik.com': 'siswa123',
  'siti@epstopik.com': 'siswa123',
  'agus@epstopik.com': 'siswa123',
  'rina@epstopik.com': 'siswa123',
};

const BUDI_01_ANSWERS: Record<number, number> = { 1: 4, 2: 3, 3: 3, 4: 3, 5: 4, 6: 2, 7: 1, 8: 4, 9: 4, 10: 3, 11: 2, 12: 1, 13: 3, 14: 2, 15: 4, 16: 3, 17: 2, 18: 3, 19: 4, 20: 3, 21: 3, 22: 4, 23: 2, 24: 2, 25: 2, 26: 3, 27: 2, 28: 1, 29: 2, 30: 1, 31: 2, 32: 1, 33: 1, 34: 3, 35: 3, 36: 1, 37: 2, 38: 1, 39: 4, 40: 3 };
const BUDI_02_ANSWERS: Record<number, number> = { 1: 3, 2: 3, 3: 2, 4: 4, 5: 1, 6: 2, 7: 4, 8: 1, 9: 4, 10: 3, 11: 4, 12: 4, 13: 2, 14: 1, 15: 4, 16: 1, 17: 3, 18: 2, 19: 4, 20: 3, 21: 3, 22: 3, 23: 3, 24: 4, 25: 3, 26: 4, 27: 2, 28: 2, 29: 3, 30: 2, 31: 2, 32: 4, 33: 3, 34: 4, 35: 4, 36: 3, 37: 2, 38: 3, 39: 1, 40: 1 };
const BUDI_03_ANSWERS: Record<number, number> = { 1: 3, 2: 3, 3: 4, 4: 3, 5: 4, 6: 2, 7: 1, 8: 3, 9: 3, 10: 1, 11: 4, 12: 2, 13: 1, 14: 3, 15: 4, 16: 4, 17: 4, 18: 1, 19: 4, 20: 1, 21: 1, 22: 4, 23: 3, 24: 2, 25: 2, 26: 2, 27: 3, 28: 1, 29: 3, 30: 4, 31: 4, 32: 4, 33: 2, 34: 3, 35: 4, 36: 1, 37: 4, 38: 3, 39: 2, 40: 2 };
const SITI_01_ANSWERS: Record<number, number> = { 1: 4, 2: 3, 3: 2, 4: 4, 5: 4, 6: 2, 7: 4, 8: 4, 9: 4, 10: 3, 11: 2, 12: 2, 13: 3, 14: 2, 15: 3, 16: 3, 17: 2, 18: 3, 19: 4, 20: 3, 21: 3, 22: 4, 23: 1, 24: 2, 25: 3, 26: 3, 27: 2, 28: 4, 29: 2, 30: 1, 31: 3, 32: 1, 33: 1, 34: 2, 35: 3, 36: 1, 37: 3, 38: 1, 39: 3, 40: 3 };
const AGUS_01_ANSWERS: Record<number, number> = { 1: 1, 2: 4, 3: 2, 4: 4, 5: 4, 6: 3, 7: 4, 8: 1, 9: 1, 10: 3, 11: 3, 12: 1, 13: 4, 14: 3, 15: 3, 16: 4, 17: 2, 18: 4, 19: 4, 20: 4, 21: 4, 22: 4, 23: 2, 24: 3, 25: 2, 26: 4, 27: 2, 28: 1, 29: 2, 30: 2, 31: 2, 32: 2, 33: 2, 34: 2, 35: 4, 36: 1, 37: 3, 38: 1, 39: 4, 40: 3 };
const RINA_02_ANSWERS: Record<number, number> = { 1: 3, 2: 2, 3: 3, 4: 4, 5: 4, 6: 2, 7: 1, 8: 4, 9: 4, 10: 3, 11: 1, 12: 3, 13: 2, 14: 1, 15: 1, 16: 4, 17: 3, 18: 3, 19: 3, 20: 3, 21: 3, 22: 2, 23: 3, 24: 1, 25: 3, 26: 3, 27: 2, 28: 3, 29: 2, 30: 2, 31: 2, 32: 3, 33: 4, 34: 4, 35: 3, 36: 3, 37: 3, 38: 2, 39: 1, 40: 1 };

// Initial sample exam history so admin analytics & student reports have realistic data
const SEED_EXAM_HISTORY: ExamResult[] = [
  {
    examId: '40255133-acb7-4c7c-9077-7a7937357857',
    examTitle: '2026 UBT - 01',
    totalQuestions: 40,
    answeredCount: 40,
    correctCount: 33,
    totalScore: 165,
    readingScore: 85,
    listeningScore: 80,
    passed: true,
    timeSpentSeconds: 2640,
    answers: BUDI_01_ANSWERS,
    completedAt: '2026-03-20T10:30:00.000Z',
    userId: 'user-student-1',
    studentName: 'Budi Santoso',
    userEmail: 'siswa@epstopik.com',
  },
  {
    examId: 'd00e7e40-8fae-44ca-a3ed-faee553c3bf0',
    examTitle: '2026 UBT - 02',
    totalQuestions: 40,
    answeredCount: 40,
    correctCount: 28,
    totalScore: 140,
    readingScore: 70,
    listeningScore: 70,
    passed: true,
    timeSpentSeconds: 2820,
    answers: BUDI_02_ANSWERS,
    completedAt: '2026-03-22T14:45:00.000Z',
    userId: 'user-student-1',
    studentName: 'Budi Santoso',
    userEmail: 'siswa@epstopik.com',
  },
  {
    examId: 'b9564dd4-ff37-43c8-9e04-972d915caad1',
    examTitle: '2026 UBT - 03',
    totalQuestions: 40,
    answeredCount: 40,
    correctCount: 19,
    totalScore: 95,
    readingScore: 45,
    listeningScore: 50,
    passed: false,
    timeSpentSeconds: 3000,
    answers: BUDI_03_ANSWERS,
    completedAt: '2026-03-25T09:15:00.000Z',
    userId: 'user-student-1',
    studentName: 'Budi Santoso',
    userEmail: 'siswa@epstopik.com',
  },
  {
    examId: '40255133-acb7-4c7c-9077-7a7937357857',
    examTitle: '2026 UBT - 01',
    totalQuestions: 40,
    answeredCount: 40,
    correctCount: 35,
    totalScore: 175,
    readingScore: 90,
    listeningScore: 85,
    passed: true,
    timeSpentSeconds: 2450,
    answers: SITI_01_ANSWERS,
    completedAt: '2026-03-21T11:00:00.000Z',
    userId: 'user-student-2',
    studentName: 'Siti Nurhaliza',
    userEmail: 'siti@epstopik.com',
  },
  {
    examId: '40255133-acb7-4c7c-9077-7a7937357857',
    examTitle: '2026 UBT - 01',
    totalQuestions: 40,
    answeredCount: 40,
    correctCount: 17,
    totalScore: 85,
    readingScore: 40,
    listeningScore: 45,
    passed: false,
    timeSpentSeconds: 2950,
    answers: AGUS_01_ANSWERS,
    completedAt: '2026-03-23T15:20:00.000Z',
    userId: 'user-student-3',
    studentName: 'Agus Pratama',
    userEmail: 'agus@epstopik.com',
  },
  {
    examId: 'd00e7e40-8fae-44ca-a3ed-faee553c3bf0',
    examTitle: '2026 UBT - 02',
    totalQuestions: 40,
    answeredCount: 40,
    correctCount: 31,
    totalScore: 155,
    readingScore: 75,
    listeningScore: 80,
    passed: true,
    timeSpentSeconds: 2710,
    answers: RINA_02_ANSWERS,
    completedAt: '2026-03-24T16:00:00.000Z',
    userId: 'user-student-4',
    studentName: 'Rina Wulandari',
    userEmail: 'rina@epstopik.com',
  },
];

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 1. Users state
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem('ubt_users');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    localStorage.setItem('ubt_users', JSON.stringify(DEFAULT_USERS));
    return DEFAULT_USERS;
  });

  // 2. Passwords state
  const [passwords, setPasswords] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('ubt_user_passwords');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    localStorage.setItem('ubt_user_passwords', JSON.stringify(DEFAULT_PASSWORDS));
    return DEFAULT_PASSWORDS;
  });

  // 3. Current active user (default to null if not logged in)
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('ubt_auth_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.email) return parsed;
      }
    } catch {
      // fallback
    }
    return null;
  });

  // 4. Locked Exam IDs (default lock: 2026 UBT - 05)
  const [lockedExamIds, setLockedExamIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('ubt_locked_exams');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    const initialLocked = ['69e2ce9b-c3af-4722-9ef8-872b39b36b9d', 'ubt-2026-05'];
    localStorage.setItem('ubt_locked_exams', JSON.stringify(initialLocked));
    return initialLocked;
  });

  // 5. Auth Modal state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  // Seed history if empty or uninitialized
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('ubt_exam_history');
      if (savedHistory === null) {
        localStorage.setItem('ubt_exam_history', JSON.stringify(SEED_EXAM_HISTORY));
      }
    } catch {
      // ignore
    }
  }, []);

  // Sync users to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('ubt_users', JSON.stringify(users));
    } catch {
      // ignore
    }
  }, [users]);

  // Sync passwords to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('ubt_user_passwords', JSON.stringify(passwords));
    } catch {
      // ignore
    }
  }, [passwords]);

  // Sync locked exams to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('ubt_locked_exams', JSON.stringify(lockedExamIds));
    } catch {
      // ignore
    }
  }, [lockedExamIds]);

  const openAuthModal = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const login = (email: string, pass: string) => {
    const trimmedEmail = email.trim().toLowerCase();
    const storedPass = passwords[trimmedEmail];

    if (!storedPass) {
      return { success: false, error: 'Email tidak ditemukan dalam sistem.' };
    }

    if (storedPass !== pass) {
      return { success: false, error: 'Kata sandi salah. Silakan coba lagi.' };
    }

    const matchedUser = users.find((u) => u.email.toLowerCase() === trimmedEmail);
    if (!matchedUser) {
      return { success: false, error: 'Data profil pengguna tidak ditemukan.' };
    }

    setCurrentUser(matchedUser);
    localStorage.setItem('ubt_auth_user', JSON.stringify(matchedUser));
    setIsAuthModalOpen(false);
    return { success: true };
  };

  // Add user to system without hijacking/replacing the active logged-in user session (used by Admin)
  const addUser = (name: string, email: string, pass: string, regRole: UserRole = 'student') => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName || !trimmedEmail || !pass) {
      return { success: false, error: 'Semua kolom wajib diisi.' };
    }

    if (users.some((u) => u.email.toLowerCase() === trimmedEmail)) {
      return { success: false, error: 'Email ini sudah terdaftar dalam sistem.' };
    }

    const newUser: User = {
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: trimmedName,
      email: trimmedEmail,
      role: regRole,
      createdAt: new Date().toISOString(),
    };

    setUsers((prev) => [...prev, newUser]);
    setPasswords((prev) => ({ ...prev, [trimmedEmail]: pass }));

    return { success: true };
  };

  // User self-registration: creates user and immediately logs them in
  const register = (name: string, email: string, pass: string, regRole: UserRole = 'student') => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName || !trimmedEmail || !pass) {
      return { success: false, error: 'Semua kolom wajib diisi.' };
    }

    if (users.some((u) => u.email.toLowerCase() === trimmedEmail)) {
      return { success: false, error: 'Email ini sudah terdaftar. Silakan login.' };
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      name: trimmedName,
      email: trimmedEmail,
      role: regRole,
      createdAt: new Date().toISOString(),
    };

    const nextUsers = [...users, newUser];
    setUsers(nextUsers);

    const nextPasswords = { ...passwords, [trimmedEmail]: pass };
    setPasswords(nextPasswords);

    setCurrentUser(newUser);
    localStorage.setItem('ubt_auth_user', JSON.stringify(newUser));
    setIsAuthModalOpen(false);
    return { success: true };
  };



  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('ubt_auth_user');
  };

  const updateUserRole = (userId: string, newRole: UserRole) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );

    if (currentUser?.id === userId) {
      const updatedCurrent = { ...currentUser, role: newRole };
      setCurrentUser(updatedCurrent);
      localStorage.setItem('ubt_auth_user', JSON.stringify(updatedCurrent));
    }
  };

  const resetStudentProgress = (userId: string) => {
    try {
      const saved = localStorage.getItem('ubt_exam_history');
      if (saved) {
        const historyList: ExamResult[] = JSON.parse(saved);
        const targetUser = users.find((u) => u.id === userId);
        const filtered = historyList.filter((item) => {
          if (item.userId && item.userId === userId) return false;
          if (targetUser && item.userEmail && item.userEmail.toLowerCase() === targetUser.email.toLowerCase()) {
            return false;
          }
          return true;
        });
        localStorage.setItem('ubt_exam_history', JSON.stringify(filtered));
        window.dispatchEvent(new Event('ubt-history-updated'));
      }
    } catch {
      // ignore
    }
  };

  const deleteUser = (userId: string) => {
    if (currentUser?.id === userId) return; // Prevent self deletion
    const targetUser = users.find((u) => u.id === userId);
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    if (targetUser) {
      setPasswords((prev) => {
        const copy = { ...prev };
        delete copy[targetUser.email.toLowerCase()];
        return copy;
      });
    }
  };

  const toggleLockExam = (examId: string) => {
    setLockedExamIds((prev) => {
      const isLocked =
        prev.includes(examId) ||
        (examId === '69e2ce9b-c3af-4722-9ef8-872b39b36b9d' && prev.includes('ubt-2026-05')) ||
        (examId === 'ubt-2026-05' && prev.includes('69e2ce9b-c3af-4722-9ef8-872b39b36b9d'));

      if (isLocked) {
        return prev.filter(
          (id) =>
            id !== examId &&
            !(examId === '69e2ce9b-c3af-4722-9ef8-872b39b36b9d' && id === 'ubt-2026-05') &&
            !(examId === 'ubt-2026-05' && id === '69e2ce9b-c3af-4722-9ef8-872b39b36b9d')
        );
      } else {
        return [...prev, examId];
      }
    });
  };

  const isExamLocked = (examId: string, examTitle?: string) => {
    if (lockedExamIds.includes(examId)) return true;
    if (examTitle && lockedExamIds.includes(examTitle)) return true;
    if (
      (examId === '69e2ce9b-c3af-4722-9ef8-872b39b36b9d' || examTitle === '2026 UBT - 05') &&
      lockedExamIds.includes('ubt-2026-05')
    ) {
      return true;
    }
    return false;
  };

  const setAllExamsLocked = (examIds: string[], locked: boolean) => {
    if (locked) {
      setLockedExamIds(Array.from(new Set([...lockedExamIds, ...examIds])));
    } else {
      setLockedExamIds([]);
    }
  };

  const role: UserRole | null = currentUser ? currentUser.role : null;
  const isAdmin = role === 'admin';
  const isStudent = role === 'student';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role,
        isAdmin,
        isStudent,
        users,
        lockedExamIds,
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        login,
        register,
        addUser,
        logout,
        updateUserRole,
        resetStudentProgress,
        deleteUser,
        toggleLockExam,
        isExamLocked,
        setAllExamsLocked,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
