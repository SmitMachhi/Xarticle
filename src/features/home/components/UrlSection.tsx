import { ClipboardPaste } from 'lucide-react'
import type { FormEvent } from 'react'

import { BorderBeam } from '../../../components/magicui/border-beam'
import { ShimmerButton } from '../../../components/magicui/shimmer-button'
import { FLOATING_SURFACE, ICON_BUTTON, ICON_SIZE } from '../constants/styles'
import { LOADING_BEAM_COLORS, URL_PLACEHOLDER } from '../constants/uiContent'

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
    <form className="w-full max-w-xl" onSubmit={onSubmit}>
      <div className={`relative flex items-center gap-1 rounded-full p-1.5 transition focus-within:border-neutral-300 focus-within:ring-4 focus-within:ring-emerald-500/10 ${FLOATING_SURFACE}`}>
        <input aria-label="X URL" autoComplete="off" className="min-w-0 flex-1 bg-transparent pl-4 text-[15px] outline-none placeholder:text-neutral-400" id="url" inputMode="url" onChange={(event) => onUrlChange(event.target.value)} placeholder={URL_PLACEHOLDER} ref={urlInputRef} spellCheck={false} type="text" value={urlInput} />
        <button aria-label="Paste" className={ICON_BUTTON} onClick={onPaste} title="Paste" type="button"><ClipboardPaste size={ICON_SIZE} /></button>
        <ShimmerButton background="#0a0a0a" className="h-9 px-4 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50" disabled={!canLoad} type="submit">{loading ? loadingLabel : 'Load Article'}</ShimmerButton>
        {loading ? <BorderBeam colorFrom={LOADING_BEAM_COLORS.from} colorTo={LOADING_BEAM_COLORS.to} size={90} /> : null}
      </div>
      {message ? <p className={`mt-3 text-sm ${error || urlProblem ? 'text-red-600' : 'text-neutral-500'}`} role={error ? 'alert' : undefined}>{message}</p> : null}
    </form>
  )
}
