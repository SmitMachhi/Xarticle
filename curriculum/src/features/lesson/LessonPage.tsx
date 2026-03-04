import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { MODULES } from '../../data/modules.ts'
import { getLessonData } from '../../data/lessons/index.ts'
import { isModuleLocked } from '../../lib/progress.ts'
import { useProgressContext } from '../../hooks/useProgressContext.ts'
import LessonSection from './LessonSection.tsx'
import LessonNav from './LessonNav.tsx'
import ProgressBar from '../../components/ProgressBar.tsx'

export default function LessonPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { progress } = useProgressContext()
  const moduleId = Number(id)

  const [sectionIdx, setSectionIdx] = useState(0)

  const meta = MODULES.find(m => m.id === moduleId)
  const lesson = getLessonData(moduleId)

  if (!meta || !lesson || isModuleLocked(progress, moduleId)) {
    return (
      <div className="page">
        <p style={{ color: 'var(--color-danger)' }}>Module not found or locked.</p>
        <Link to="/" className="btn-secondary" style={{ marginTop: 16, display: 'inline-block' }}>← Back</Link>
      </div>
    )
  }

  const section = lesson.sections[sectionIdx]
  const isLast = sectionIdx === lesson.sections.length - 1

  const handleNext = () => {
    if (isLast) {
      navigate(`/module/${moduleId}/quiz`)
    } else {
      setSectionIdx(i => i + 1)
    }
  }

  const handleBack = () => {
    if (sectionIdx === 0) {
      navigate('/')
    } else {
      setSectionIdx(i => i - 1)
    }
  }

  return (
    <div className="page">
      <div className="lesson-top">
        <Link to="/" className="lesson-back-link">← Modules</Link>
        <ProgressBar current={sectionIdx} total={lesson.sections.length} />
      </div>

      <header className="lesson-header">
        <span className="lesson-module-num">Module {moduleId}</span>
        <h1 className="lesson-title">
          {meta.icon} {meta.title}
        </h1>
      </header>

      <div className="lesson-body animate-fade-up" key={sectionIdx}>
        {section && <LessonSection section={section} />}
      </div>

      <LessonNav
        onNext={handleNext}
        onBack={handleBack}
        isFirst={sectionIdx === 0}
        isLast={isLast}
        current={sectionIdx}
        total={lesson.sections.length}
      />
    </div>
  )
}
