import { useState, useCallback } from 'react'
import { loadProgress, saveProgress, completeModule, resetProgress } from '../lib/progress.ts'
import type { Progress } from '../types/curriculum.ts'

export function useProgress() {
  const [progress, setProgress] = useState<Progress>(loadProgress)

  const markComplete = useCallback((moduleId: number, score: number) => {
    setProgress(prev => {
      const next = completeModule(prev, moduleId, score)
      saveProgress(next)
      return next
    })
  }, [])

  const reset = useCallback(() => {
    setProgress(resetProgress())
  }, [])

  return { progress, markComplete, reset }
}
