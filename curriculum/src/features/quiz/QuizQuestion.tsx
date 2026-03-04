import { useState } from 'react'
import type { QuizQuestion as QuizQuestionType, QuizAnswerState } from '../../types/curriculum.ts'

interface Props {
  question: QuizQuestionType
  onAnswer: (correct: boolean) => void
  questionNum: number
  total: number
}

export default function QuizQuestion({ question, onAnswer, questionNum, total }: Props) {
  const [state, setState] = useState<QuizAnswerState>('unanswered')
  const [selected, setSelected] = useState<number | null>(null)

  const handlePick = (idx: number) => {
    if (state !== 'unanswered') return
    const correct = idx === question.correctIndex
    setSelected(idx)
    setState(correct ? 'correct' : 'wrong')
    setTimeout(() => onAnswer(correct), 1200)
  }

  const optionClass = (idx: number) => {
    if (state === 'unanswered') return 'quiz-option'
    if (idx === question.correctIndex) return 'quiz-option quiz-option--correct'
    if (idx === selected && state === 'wrong') return 'quiz-option quiz-option--wrong'
    return 'quiz-option quiz-option--dim'
  }

  return (
    <div className={`quiz-question-wrap ${state === 'wrong' ? 'animate-shake' : ''}`}>
      <p className="quiz-num">{questionNum} / {total}</p>
      <h2 className="quiz-question">{question.question}</h2>
      <div className="quiz-options">
        {question.options.map((opt, idx) => (
          <button key={idx} className={optionClass(idx)} onClick={() => handlePick(idx)}>
            <span className="quiz-option-letter">{String.fromCharCode(65 + idx)}</span>
            {opt}
          </button>
        ))}
      </div>
      {state !== 'unanswered' && (
        <div className={`quiz-feedback quiz-feedback--${state}`}>
          {state === 'correct' ? '✓ Correct! ' : '✗ Not quite. '}
          {question.explanation}
        </div>
      )}
    </div>
  )
}
