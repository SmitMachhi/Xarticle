import { create } from 'zustand';
import type { UserProgress, LessonProgress, Achievement } from '../types/curriculum';

const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'hello-world',
    name: 'Hello World',
    description: 'Complete your first lesson',
    icon: '👋',
    requirement: 'Complete lesson 1.1',
    xpBonus: 50,
  },
  {
    id: 'http-hero',
    name: 'HTTP Hero',
    description: 'Master World 1: Foundations',
    icon: '🌐',
    requirement: 'Complete all World 1 lessons',
    xpBonus: 200,
  },
  {
    id: 'api-apprentice',
    name: 'API Apprentice',
    description: 'Build your first endpoint',
    icon: '🔌',
    requirement: 'Complete lesson 2.2',
    xpBonus: 100,
  },
  {
    id: 'cache-cow',
    name: 'Cache Cow',
    description: 'Implement caching',
    icon: '🐄',
    requirement: 'Complete lesson 4.1',
    xpBonus: 150,
  },
  {
    id: 'error-handler',
    name: 'Error Handler',
    description: 'Fix 5 bugs',
    icon: '🐛',
    requirement: 'Complete 5 code challenges',
    xpBonus: 100,
  },
  {
    id: 'deployer',
    name: 'Deployer',
    description: 'Deploy to production',
    icon: '🚀',
    requirement: 'Complete lesson 5.4',
    xpBonus: 200,
  },
  {
    id: 'full-stack',
    name: 'Full Stack',
    description: 'Complete all worlds',
    icon: '🏆',
    requirement: 'Complete all 25 lessons',
    xpBonus: 1000,
  },
  {
    id: 'speed-demon',
    name: 'Speed Demon',
    description: 'Complete a lesson in under 10 minutes',
    icon: '⚡',
    requirement: 'Complete any lesson in < 10 min',
    xpBonus: 50,
  },
  {
    id: 'perfect-score',
    name: 'Perfect Score',
    description: 'Get 100% on any quiz',
    icon: '💯',
    requirement: 'Score 100% on a quiz',
    xpBonus: 75,
  },
  {
    id: 'bug-hunter',
    name: 'Bug Hunter',
    description: 'Find and fix bugs',
    icon: '🔍',
    requirement: 'Complete 3 code analysis questions',
    xpBonus: 100,
  },
];

interface ProgressState extends UserProgress {
  completeLesson: (lessonId: string, score: number) => void;
  updateLessonProgress: (lessonId: string, progress: Partial<LessonProgress>) => void;
  addXP: (amount: number) => void;
  checkAchievements: () => void;
  getStreakBonus: () => number;
}

const INITIAL_PROGRESS: UserProgress = {
  completedLessons: [],
  lessonScores: {},
  totalXP: 0,
  currentStreak: 0,
  lastActiveDate: '',
  achievements: [],
  lessonProgress: {},
};

// Simple localStorage implementation that works in all environments
const storage = {
  getItem: (name: string) => {
    try {
      const item = localStorage.getItem(name);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: unknown) => {
    try {
      localStorage.setItem(name, JSON.stringify(value));
    } catch {
      // Ignore storage errors
    }
  },
  removeItem: (name: string) => {
    try {
      localStorage.removeItem(name);
    } catch {
      // Ignore storage errors
    }
  },
};

export const useProgressStore = create<ProgressState>()((set, get) => {
  // Load initial state from localStorage
  const savedState = storage.getItem('backend-mastery-progress');
  const initialState = savedState?.state || INITIAL_PROGRESS;

  return {
    ...initialState,

    completeLesson: (lessonId: string, score: number) => {
      set((state) => {
        const today = new Date().toISOString().split('T')[0];
        let newStreak = state.currentStreak;
        
        if (state.lastActiveDate !== today) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];
          
          newStreak = state.lastActiveDate === yesterdayStr 
            ? state.currentStreak + 1 
            : 1;
        }

        const newState = {
          completedLessons: [...state.completedLessons, lessonId],
          lessonScores: { ...state.lessonScores, [lessonId]: score },
          totalXP: state.totalXP + score,
          currentStreak: newStreak,
          lastActiveDate: today,
        };
        
        // Save to localStorage
        storage.setItem('backend-mastery-progress', { state: { ...state, ...newState } });
        
        return newState;
      });
      
      // Check achievements after a small delay to ensure state is updated
      setTimeout(() => {
        get().checkAchievements();
      }, 0);
    },

    updateLessonProgress: (lessonId: string, progress: Partial<LessonProgress>) => {
      set((state) => {
        const newState = {
          lessonProgress: {
            ...state.lessonProgress,
            [lessonId]: {
              ...state.lessonProgress[lessonId],
              lessonId,
              ...progress,
            } as LessonProgress,
          },
        };
        
        storage.setItem('backend-mastery-progress', { state: { ...state, ...newState } });
        
        return newState;
      });
    },

    addXP: (amount: number) => {
      set((state) => {
        const newState = { totalXP: state.totalXP + amount };
        storage.setItem('backend-mastery-progress', { state: { ...state, ...newState } });
        return newState;
      });
    },

    checkAchievements: () => {
      const state = get();
      const newAchievements: string[] = [];

      ACHIEVEMENTS.forEach((achievement) => {
        if (state.achievements.includes(achievement.id)) return;

        let earned = false;
        
        switch (achievement.id) {
          case 'hello-world':
            earned = state.completedLessons.includes('1.1');
            break;
          case 'http-hero':
            earned = ['1.1', '1.2', '1.3', '1.4', '1.5'].every(id => 
              state.completedLessons.includes(id)
            );
            break;
          case 'api-apprentice':
            earned = state.completedLessons.includes('2.2');
            break;
          case 'cache-cow':
            earned = state.completedLessons.includes('4.1');
            break;
          case 'error-handler':
            earned = Object.values(state.lessonProgress).filter(p => 
              p.challengeAttempts > 0
            ).length >= 5;
            break;
          case 'deployer':
            earned = state.completedLessons.includes('5.4');
            break;
          case 'full-stack':
            earned = state.completedLessons.length >= 25;
            break;
          case 'perfect-score':
            earned = Object.values(state.lessonScores).some(s => s >= 100);
            break;
        }

        if (earned) {
          newAchievements.push(achievement.id);
        }
      });

      if (newAchievements.length > 0) {
        const bonusXP = newAchievements.reduce((sum, id) => {
          const achievement = ACHIEVEMENTS.find(a => a.id === id);
          return sum + (achievement?.xpBonus ?? 0);
        }, 0);

        set((state) => {
          const newState = {
            achievements: [...state.achievements, ...newAchievements],
            totalXP: state.totalXP + bonusXP,
          };
          
          storage.setItem('backend-mastery-progress', { state: { ...state, ...newState } });
          
          return newState;
        });
      }
    },

    getStreakBonus: () => {
      const streak = get().currentStreak;
      return Math.min(streak * 0.05, 0.5);
    },
  };
});

export { ACHIEVEMENTS };
