const NODES = [
  { id: 'start', label: 'extractArticle(url)', type: 'start' },
  { id: 'try1', label: 'Try Threadloom\n(X GraphQL API)', type: 'action' },
  { id: 'q1', label: 'Success?', type: 'decision' },
  { id: 'ret1', label: 'Return article\n✓ providerUsed: "threadloom"', type: 'success' },
  { id: 'try2', label: 'Try Companion\n(HTML scraping)', type: 'action' },
  { id: 'q2', label: 'Success?', type: 'decision' },
  { id: 'ret2', label: 'Return article\n✓ providerUsed: "companion"', type: 'success' },
  { id: 'err', label: 'Throw Error\n"All providers failed"', type: 'error' },
]

export default function FallbackChainDiagram() {
  return (
    <div className="visual-wrap">
      <p className="visual-label">Extraction Fallback Chain</p>
      <div className="chain-diagram">
        <div className="chain-node chain-node--start">{NODES[0].label}</div>
        <div className="chain-arrow chain-arrow--down">↓</div>

        <div className="chain-node chain-node--action">{NODES[1].label}</div>
        <div className="chain-arrow chain-arrow--down">↓</div>

        <div className="chain-decision-wrap">
          <div className="chain-node chain-node--decision">{NODES[2].label}</div>
          <div className="chain-decision-branches">
            <div className="chain-branch chain-branch--yes">
              <span className="chain-branch-label">Yes</span>
              <div className="chain-node chain-node--success">{NODES[3].label}</div>
            </div>
            <div className="chain-branch chain-branch--no">
              <span className="chain-branch-label">No</span>
              <div className="chain-node chain-node--action">{NODES[4].label}</div>
              <div className="chain-arrow chain-arrow--down">↓</div>
              <div className="chain-node chain-node--decision">{NODES[5].label}</div>
              <div className="chain-decision-branches">
                <div className="chain-branch chain-branch--yes">
                  <span className="chain-branch-label">Yes</span>
                  <div className="chain-node chain-node--success">{NODES[6].label}</div>
                </div>
                <div className="chain-branch chain-branch--no">
                  <span className="chain-branch-label">No</span>
                  <div className="chain-node chain-node--error">{NODES[7].label}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
