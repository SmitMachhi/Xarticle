import type { Progress } from '../types/curriculum.ts'

const STORAGE_KEY = 'curriculum_progress'
const BASE_XP = 10
const BONUS_XP = 5
const PASS_THRESHOLD = 4
const TOTAL_MODULES = 10

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { completedModules: [], totalXP: 0 }
    return JSON.parse(raw) as Progress
  } catch {
    return { completedModules: [], totalXP: 0 }
  }
}

export function saveProgress(p: Progress): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
}

export function completeModule(p: Progress, moduleId: number, score: number): Progress {
  if (p.completedModules.includes(moduleId)) return p
  const xpEarned = score === TOTAL_MODULES ? BASE_XP + BONUS_XP : BASE_XP
  return {
    completedModules: [...p.completedModules, moduleId],
    totalXP: p.totalXP + xpEarned,
  }
}

export function isModuleLocked(p: Progress, moduleId: number): boolean {
  if (moduleId === 1) return false
  return !p.completedModules.includes(moduleId - 1)
}

export function isModuleCompleted(p: Progress, moduleId: number): boolean {
  return p.completedModules.includes(moduleId)
}

export function isPassing(score: number): boolean {
  return score >= PASS_THRESHOLD
}

export function getXPForRun(score: number, totalQuestions: number): number {
  if (!isPassing(score)) return 0
  return score === totalQuestions ? BASE_XP + BONUS_XP : BASE_XP
}

export function starCount(score: number, total: number): number {
  const ratio = score / total
  if (ratio === 1) return 3
  if (ratio >= 0.8) return 2
  return 1
}

export function resetProgress(): Progress {
  const fresh: Progress = { completedModules: [], totalXP: 0 }
  saveProgress(fresh)
  return fresh
}
