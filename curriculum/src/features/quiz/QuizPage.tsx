import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getLessonData } from '../../data/lessons/index.ts'
import { isModuleLocked } from '../../lib/progress.ts'
import { useProgressContext } from '../../hooks/useProgressContext.ts'
import QuizQuestion from './QuizQuestion.tsx'
import ProgressBar from '../../components/ProgressBar.tsx'

export default function QuizPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { progress, markComplete } = useProgressContext()
  const moduleId = Number(id)

  const [questionIdx, setQuestionIdx] = useState(0)
  const [score, setScore] = useState(0)

  const lesson = getLessonData(moduleId)

  if (!lesson || isModuleLocked(progress, moduleId)) {
    return (
      <div className="page">
        <p style={{ color: 'var(--color-danger)' }}>Module not found or locked.</p>
        <Link to="/" className="btn-secondary" style={{ marginTop: 16, display: 'inline-block' }}>← Back</Link>
      </div>
    )
  }

  const { quiz } = lesson
  const currentQ = quiz[questionIdx]

  const handleAnswer = (correct: boolean) => {
    const newScore = correct ? score + 1 : score
    if (questionIdx + 1 < quiz.length) {
      setScore(newScore)
      setQuestionIdx(i => i + 1)
    } else {
      markComplete(moduleId, newScore + (correct ? 1 : 0))
      navigate(`/module/${moduleId}/result`, {
        state: { score: newScore + (correct ? 1 : 0), total: quiz.length },
      })
    }
  }

  return (
    <div className="page">
      <div className="lesson-top">
        <Link to={`/module/${moduleId}/lesson`} className="lesson-back-link">← Review Lesson</Link>
        <ProgressBar current={questionIdx} total={quiz.length} label="Quiz" />
      </div>

      <div className="animate-fade-up" key={questionIdx}>
        {currentQ && (
          <QuizQuestion
            question={currentQ}
            onAnswer={handleAnswer}
            questionNum={questionIdx + 1}
            total={quiz.length}
          />
        )}
      </div>
    </div>
  )
}
