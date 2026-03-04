import { createContext, useContext } from 'react'
import type { Progress } from '../types/curriculum.ts'

export interface ProgressContextValue {
  progress: Progress
  markComplete: (moduleId: number, score: number) => void
  reset: () => void
}

export const ProgressContext = createContext<ProgressContextValue | null>(null)

export function useProgressContext(): ProgressContextValue {
  const ctx = useContext(ProgressContext)
  if (!ctx) throw new Error('useProgressContext must be used inside ProgressProvider')
  return ctx
}
