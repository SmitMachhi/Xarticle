import { useState } from 'react'

const BLOCK_TYPES = [
  {
    type: 'heading', color: '#7c3aed',
    fields: [
      { name: 'type', val: '"heading"', note: 'discriminant field' },
      { name: 'level', val: '1 | 2 | 3', note: 'H1/H2/H3' },
      { name: 'text', val: 'string', note: 'heading content' },
    ],
  },
  {
    type: 'paragraph', color: '#2563eb',
    fields: [
      { name: 'type', val: '"paragraph"', note: 'discriminant field' },
      { name: 'text', val: 'string', note: 'paragraph content' },
    ],
  },
  {
    type: 'code', color: '#059669',
    fields: [
      { name: 'type', val: '"code"', note: 'discriminant field' },
      { name: 'code', val: 'string', note: 'the source code' },
      { name: 'language', val: 'string | undefined', note: 'e.g. "typescript"' },
    ],
  },
  {
    type: 'media', color: '#d97706',
    fields: [
      { name: 'type', val: '"media"', note: 'discriminant field' },
      { name: 'url', val: 'string', note: 'pbs.twimg.com/…' },
      { name: 'caption', val: 'string | undefined', note: 'optional alt text' },
      { name: 'mediaType', val: '"image" | "video"', note: 'determines rendering' },
    ],
  },
  {
    type: 'quote', color: '#dc2626',
    fields: [
      { name: 'type', val: '"quote"', note: 'discriminant field' },
      { name: 'text', val: 'string', note: 'blockquote content' },
    ],
  },
  {
    type: 'list', color: '#0891b2',
    fields: [
      { name: 'type', val: '"list"', note: 'discriminant field' },
      { name: 'items', val: 'string[]', note: 'array of list items' },
    ],
  },
  {
    type: 'embed', color: '#6b7280',
    fields: [
      { name: 'type', val: '"embed"', note: 'discriminant field' },
      { name: 'url', val: 'string | undefined', note: 'embedded content URL' },
      { name: 'text', val: 'string | undefined', note: 'fallback text' },
    ],
  },
]

export default function DiscriminatedUnionExplorer() {
  const [selected, setSelected] = useState('heading')
  const block = BLOCK_TYPES.find(b => b.type === selected) ?? BLOCK_TYPES[0]!

  return (
    <div className="visual-wrap">
      <p className="visual-label">ArticleBlock — Discriminated Union Explorer</p>
      <p className="visual-hint" style={{ marginBottom: 12 }}>Click a block type. TypeScript narrows all available fields based on the <code>type</code> field.</p>
      <div className="du-type-pills">
        {BLOCK_TYPES.map(b => (
          <button
            key={b.type}
            className={`du-pill ${selected === b.type ? 'du-pill--active' : ''}`}
            style={selected === b.type ? { background: b.color, borderColor: b.color } : { borderColor: b.color, color: b.color }}
            onClick={() => setSelected(b.type)}
          >
            {b.type}
          </button>
        ))}
      </div>
      <div className="du-fields animate-fade-up" key={selected}>
        <div className="du-type-header" style={{ color: block.color }}>
          type <strong>{block.type}Block</strong> &#123;
        </div>
        {block.fields.map(f => (
          <div key={f.name} className="du-field-row">
            <span className="du-field-name">{f.name}</span>
            <span className="du-field-colon">: </span>
            <span className="du-field-val" style={{ color: block.color }}>{f.val}</span>
            <span className="du-field-note">// {f.note}</span>
          </div>
        ))}
        <div className="du-close">&#125;</div>
      </div>
    </div>
  )
}
