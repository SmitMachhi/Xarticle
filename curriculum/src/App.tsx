import { Routes, Route } from 'react-router-dom'
import SkillTreePage from './features/skill-tree/SkillTreePage.tsx'
import LessonPage from './features/lesson/LessonPage.tsx'
import QuizPage from './features/quiz/QuizPage.tsx'
import QuizResult from './features/quiz/QuizResult.tsx'
import { ProgressContext } from './hooks/useProgressContext.ts'
import { useProgress } from './hooks/useProgress.ts'

export default function App() {
  const progressApi = useProgress()

  return (
    <ProgressContext.Provider value={progressApi}>
      <Routes>
        <Route path="/" element={<SkillTreePage />} />
        <Route path="/module/:id/lesson" element={<LessonPage />} />
        <Route path="/module/:id/quiz" element={<QuizPage />} />
        <Route path="/module/:id/result" element={<QuizResult />} />
      </Routes>
    </ProgressContext.Provider>
  )
}
