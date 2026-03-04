interface Props {
  code: string
  language?: string
  filename?: string
}

export default function CodeBlock({ code, language = 'typescript', filename }: Props) {
  return (
    <div className="code-block">
      {filename && (
        <div className="code-block-header">
          <span className="code-block-dot" />
          <span className="code-block-dot" />
          <span className="code-block-dot" />
          <span className="code-block-filename">{filename}</span>
          <span className="code-block-lang">{language}</span>
        </div>
      )}
      <pre className="code-block-body">
        <code>{code.trim()}</code>
      </pre>
    </div>
  )
}
