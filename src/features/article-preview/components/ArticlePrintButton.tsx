export const ArticlePrintButton = () => (
  <button
    aria-label="Print article"
    className="article-copy-btn"
    onClick={() => window.print()}
    title="Print article"
    type="button"
  >
    ⎙
  </button>
)
