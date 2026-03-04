import CodeBlock from '../../components/CodeBlock.tsx'
import Diagram from '../../components/Diagram.tsx'
import { getVisual } from '../../visuals/index.ts'
import type { LessonSection as LessonSectionType } from '../../types/curriculum.ts'

interface Props {
  section: LessonSectionType
}

export default function LessonSection({ section }: Props) {
  if (section.kind === 'code') {
    return (
      <CodeBlock
        code={section.content}
        language={section.language}
        filename={section.filename}
      />
    )
  }

  if (section.kind === 'diagram') {
    return <Diagram ascii={section.content} label={section.filename} />
  }

  if (section.kind === 'visual' && section.visualKey) {
    const Visual = getVisual(section.visualKey)
    if (Visual) return <Visual />
  }

  return (
    <div className="lesson-text">
      {section.content.split('\n\n').map((para, i) => (
        <p key={i}>{para}</p>
      ))}
    </div>
  )
}
