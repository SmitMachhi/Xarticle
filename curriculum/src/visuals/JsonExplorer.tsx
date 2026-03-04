import { useState } from 'react'

interface TreeNode {
  key: string
  value?: string
  type: 'string' | 'number' | 'array' | 'object' | 'null'
  children?: TreeNode[]
  annotation?: string
}

const TREE: TreeNode[] = [
  { key: 'kind', value: '"status"', type: 'string', annotation: 'tells parser which shape to expect' },
  {
    key: 'payloads', type: 'array', annotation: 'array — one item per tweet fetched',
    children: [
      { key: '0', type: 'object', children: [
        { key: 'code', value: '200', type: 'number', annotation: 'HTTP status from X\'s API' },
        { key: 'message', value: '"OK"', type: 'string' },
        { key: 'tweet', type: 'object', annotation: 'the raw tweet data', children: [
          { key: 'article', type: 'object', children: [
            { key: 'title', value: '"My Article Title"', type: 'string' },
            { key: 'body', value: '"..."', type: 'string', annotation: 'full HTML body' },
          ]},
          { key: 'favorite_count', value: '1247', type: 'number', annotation: 'likes' },
          { key: 'retweet_count', value: '342', type: 'number' },
        ]},
      ]},
    ],
  },
  { key: 'warnings', type: 'array', annotation: 'non-fatal notices (e.g. missing metrics)', children: [] },
]

function TreeRow({ node, depth }: { node: TreeNode; depth: number }) {
  const [open, setOpen] = useState(depth < 2)
  const hasChildren = node.children !== undefined
  const indent = depth * 16

  return (
    <div>
      <div
        className={`json-row ${hasChildren ? 'json-row--clickable' : ''}`}
        style={{ paddingLeft: indent }}
        onClick={() => hasChildren && setOpen(o => !o)}
      >
        {hasChildren && <span className="json-toggle">{open ? '▾' : '▸'}</span>}
        <span className="json-key">"{node.key}"</span>
        <span className="json-colon">: </span>
        {!hasChildren && <span className={`json-val json-val--${node.type}`}>{node.value}</span>}
        {hasChildren && <span className="json-brace">{open ? (node.type === 'array' ? '[' : '{') : (node.type === 'array' ? '[…]' : '{…}')}</span>}
        {node.annotation && <span className="json-annotation">← {node.annotation}</span>}
      </div>
      {hasChildren && open && node.children?.map((child, i) => (
        <TreeRow key={i} node={child} depth={depth + 1} />
      ))}
      {hasChildren && open && (
        <div style={{ paddingLeft: indent }}>
          <span className="json-brace">{node.type === 'array' ? ']' : '}'}</span>
        </div>
      )}
    </div>
  )
}

export default function JsonExplorer() {
  return (
    <div className="visual-wrap">
      <p className="visual-label">POST /api/extract — Response Shape (click to expand)</p>
      <div className="json-tree">
        <div className="json-brace">{'{'}</div>
        {TREE.map((node, i) => <TreeRow key={i} node={node} depth={1} />)}
        <div className="json-brace">{'}'}</div>
      </div>
    </div>
  )
}
