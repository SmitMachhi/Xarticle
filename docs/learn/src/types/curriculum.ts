export interface Lesson {
  id: string;
  worldId: number;
  worldName: string;
  title: string;
  description: string;
  xp: number;
  prerequisites: string[];
  duration: number;
  sections: LessonSection[];
}

export interface LessonSection {
  id: string;
  type: 'concept' | 'code' | 'quiz' | 'challenge' | 'summary';
  title: string;
  content: string;
  visualComponent?: string;
  codeExample?: CodeExample;
  quiz?: Quiz;
  challenge?: Challenge;
}

export interface CodeExample {
  file: string;
  code: string;
  highlights: number[];
}

export interface Quiz {
  questions: Question[];
  passingScore: number;
}

export interface Question {
  id: string;
  type: 'single' | 'multiple' | 'code-analysis';
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  starterCode: string;
  solution: string;
  tests: TestCase[];
  hints: string[];
}

export interface TestCase {
  input: unknown;
  expected: unknown;
  description: string;
}

export interface UserProgress {
  completedLessons: string[];
  lessonScores: Record<string, number>;
  totalXP: number;
  currentStreak: number;
  lastActiveDate: string;
  achievements: string[];
  lessonProgress: Record<string, LessonProgress>;
}

export interface LessonProgress {
  lessonId: string;
  currentSection: number;
  quizAnswers: Record<string, string>;
  challengeAttempts: number;
  timeSpent: number;
  completed: boolean;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: string;
  xpBonus: number;
}

export interface World {
  id: number;
  name: string;
  description: string;
  lessons: Lesson[];
  color: string;
  locked: boolean;
}

export const COLORS = {
  success: '#22c55e',
  error: '#ef4444',
  info: '#3b82f6',
  warning: '#f59e0b',
  external: '#a855f7',
  primary: '#6366f1',
  secondary: '#ec4899',
} as const;
