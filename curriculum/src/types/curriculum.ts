export type SectionKind = 'text' | 'code' | 'diagram' | 'visual'

export interface LessonSection {
  kind: SectionKind
  content: string
  filename?: string
  language?: string
  visualKey?: string
}

export interface QuizQuestion {
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}

export interface Lesson {
  moduleId: number
  sections: LessonSection[]
  quiz: QuizQuestion[]
}

export interface ModuleMeta {
  id: number
  title: string
  icon: string
  description: string
  xp: number
}

export interface Progress {
  completedModules: number[]
  totalXP: number
}

export type QuizAnswerState = 'unanswered' | 'correct' | 'wrong'
