import { useMemo } from 'react'
import type { Progress } from '../types/curriculum.ts'

const LEVEL_THRESHOLDS = [0, 30, 70, 120, 180, 250]
const LEVEL_NAMES = ['Newbie', 'Apprentice', 'Dev', 'Senior', 'Architect', 'Principal']

export function useXP(progress: Progress) {
  return useMemo(() => {
    const { totalXP } = progress
    let level = 0
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
      if (totalXP >= (LEVEL_THRESHOLDS[i] ?? 0)) {
        level = i
        break
      }
    }
    const currentThreshold = LEVEL_THRESHOLDS[level] ?? 0
    const nextThreshold = LEVEL_THRESHOLDS[level + 1] ?? currentThreshold + 50
    const xpInLevel = totalXP - currentThreshold
    const xpNeeded = nextThreshold - currentThreshold
    const levelName = LEVEL_NAMES[level] ?? 'Legend'

    return { totalXP, level, levelName, xpInLevel, xpNeeded }
  }, [progress])
}
