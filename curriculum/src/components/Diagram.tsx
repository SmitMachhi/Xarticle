interface Props {
  ascii: string
  label?: string
}

export default function Diagram({ ascii, label }: Props) {
  return (
    <figure className="diagram">
      {label && <figcaption className="diagram-label">{label}</figcaption>}
      <pre className="diagram-body">{ascii.trim()}</pre>
    </figure>
  )
}
