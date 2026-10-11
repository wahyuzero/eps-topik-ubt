export interface ExamOption {
  id: string;
  optionNumber: number;
  text?: string;
  type?: string;
  fileId?: string | null;
  file?: {
    url?: string;
    presignedUrl?: string;
    contentType?: string;
  } | null;
  imagePath?: string;
  audioPath?: string;
}

export interface QuestionType {
  id: string;
  name: string; // Reading or Listening
  code: string; // KO_READING or KO_LISTENING
  language: string;
  labels?: {
    en?: string;
    ko?: string;
  };
}

export interface Question {
  id: string;
  questionNumber: number;
  mainHeading?: string;
  heading?: string | null;
  descriptionText?: string;
  descriptionFileId?: string | null;
  descriptionFile?: {
    url?: string;
    presignedUrl?: string;
    contentType?: string;
  } | null;
  answer?: string; // e.g. "1", "2", "3", "4"
  time?: number | null;
  questionType?: QuestionType;
  listening?: {
    url?: string;
    presignedUrl?: string;
    contentType?: string;
  } | null;
  options: ExamOption[];
  // Local paths mapped in simulator:
  imagePath?: string;
  audioPath?: string;
}

export interface ExamManifestItem {
  id: string;
  title: string;
  category: string;
  duration: number;
  questionsCount: number;
  path: string;
  hasAudio: boolean;
  hasImages: boolean;
}

export interface VocabularyWord {
  id: string;
  korean: string;
  koreanReading?: string | null;
  indonesian: string;
  wordType?: string; // NOUN, VERB, ADJECTIVE, ADVERB, PHRASE, etc.
  difficulty?: string; // BEGINNER, INTERMEDIATE, ADVANCED
  examples?: Array<{ korean: string; indonesian?: string }> | string | null;
  notes?: string | null;
}

export interface StudyChapter {
  id: string;
  title: string;
  orderIndex: number;
  files: Array<{
    fileType: 'PDF' | 'AUDIO' | string;
    title?: string;
    file?: {
      objectName?: string;
      presignedUrl?: string;
      size?: number;
    };
    localPath?: string;
  }>;
}

export interface StudyMaterial {
  name: string;
  path: string;
  totalChapters: number;
  chapters?: StudyChapter[];
}

export type UserRole = 'admin' | 'student';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface ExamResult {
  examId: string;
  examTitle: string;
  totalQuestions: number;
  answeredCount: number;
  correctCount: number;
  totalScore: number; // Max 200
  readingScore: number; // Max 100
  listeningScore: number; // Max 100
  passed: boolean;
  timeSpentSeconds: number;
  answers: Record<number, number>; // questionNumber -> selectedOptionNumber
  completedAt: string;
  userId?: string;
  studentName?: string;
  userEmail?: string;
}
