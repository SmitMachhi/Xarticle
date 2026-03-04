import type { Lesson } from '../../types/curriculum.ts'
import lesson01 from './01-http.ts'
import lesson02 from './02-apis.ts'
import lesson03 from './03-client-server.ts'
import lesson04 from './04-serverless.ts'
import lesson05 from './05-routing.ts'
import lesson06 from './06-auth-headers.ts'
import lesson07 from './07-cors.ts'
import lesson08 from './08-caching.ts'
import lesson09 from './09-error-handling.ts'
import lesson10 from './10-type-contracts.ts'

const LESSONS: Record<number, Lesson> = {
  1: lesson01,
  2: lesson02,
  3: lesson03,
  4: lesson04,
  5: lesson05,
  6: lesson06,
  7: lesson07,
  8: lesson08,
  9: lesson09,
  10: lesson10,
}

export function getLessonData(moduleId: number): Lesson | undefined {
  return LESSONS[moduleId]
}
