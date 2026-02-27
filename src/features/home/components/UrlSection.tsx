interface UrlSectionProps {
  canLoad: boolean
  loadButtonLabel: string
  loading: boolean
  notice: string | null
  onLoad: () => void
  onPaste: () => void
  onUrlChange: (value: string) => void
  urlClassificationReason: string
  urlInput: string
  urlInputRef: React.MutableRefObject<HTMLInputElement | null>
}

export const UrlSection = ({
  canLoad,
  loadButtonLabel,
  loading,
  notice,
  onLoad,
  onPaste,
  onUrlChange,
  urlClassificationReason,
  urlInput,
  urlInputRef,
}: UrlSectionProps) => {
  return (
    <section className="section-block">
      <h2 className="section-title">Paste URL</h2>
      <label htmlFor="url">X URL</label>
      <div className="row">
        <input id="url" onChange={(event) => onUrlChange(event.target.value)} ref={urlInputRef} type="text" value={urlInput} />
        <button className="btn-muted" onClick={onPaste} type="button">Paste</button>
        <button className="btn-primary" disabled={!canLoad} onClick={onLoad}>{loading ? loadButtonLabel : 'Load Article'}</button>
      </div>
      <p className="url-status" aria-live="polite">{notice || urlClassificationReason}</p>
    </section>
  )
}
