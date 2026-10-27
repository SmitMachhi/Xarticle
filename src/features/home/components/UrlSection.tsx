import type { FormEvent } from 'react'

import { URL_PLACEHOLDER } from '../constants/uiContent'

interface UrlSectionProps {
  canLoad: boolean
  error: string | null
  loading: boolean
  loadingLabel: string | null
  notice: string | null
  onLoad: () => void
  onPaste: () => void
  onUrlChange: (value: string) => void
  urlInput: string
  urlInputRef: React.MutableRefObject<HTMLInputElement | null>
  urlProblem: string | null
}

export const UrlSection = ({ canLoad, error, loading, loadingLabel, notice, onLoad, onPaste, onUrlChange, urlInput, urlInputRef, urlProblem }: UrlSectionProps) => {
  const onSubmit = (event: FormEvent): void => {
    event.preventDefault()
    if (canLoad) onLoad()
  }
  const message = error || urlProblem || notice
  return (
    <form className="url-form" onSubmit={onSubmit}>
      <div className="url-row">
        <input aria-label="X URL" autoComplete="off" id="url" inputMode="url" onChange={(event) => onUrlChange(event.target.value)} placeholder={URL_PLACEHOLDER} ref={urlInputRef} spellCheck={false} type="text" value={urlInput} />
        <button className="btn-quiet" onClick={onPaste} type="button">Paste</button>
        <button className="btn-primary" disabled={!canLoad} type="submit">{loading ? loadingLabel : 'Load Article'}</button>
      </div>
      {message ? <p className={error || urlProblem ? 'form-message is-error' : 'form-message'} role={error ? 'alert' : undefined}>{message}</p> : null}
    </form>
  )
}
