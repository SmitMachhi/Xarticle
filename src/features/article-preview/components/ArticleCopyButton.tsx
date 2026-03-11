import { useState } from 'react'

interface ArticleCopyButtonProps {
  payload: string
}

const COPIED_RESET_DELAY_MS = 1_400
const FAILED_RESET_DELAY_MS = 1_800

const nextState = (value: boolean): 'copied' | 'failed' => (value ? 'copied' : 'failed')

export const ArticleCopyButton = ({ payload }: ArticleCopyButtonProps) => {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle')

  const onClick = async (): Promise<void> => {
    if (!payload) {
      return
    }
    const canWrite = Boolean(navigator.clipboard?.writeText)
    const wrote = canWrite ? await navigator.clipboard.writeText(payload).then(() => true).catch(() => false) : false
    setState(nextState(wrote))
    window.setTimeout(() => setState('idle'), wrote ? COPIED_RESET_DELAY_MS : FAILED_RESET_DELAY_MS)
  }

  const label = state === 'copied' ? 'Copied' : state === 'failed' ? 'Copy failed' : 'Copy text'
  return <button aria-label={label} className={`article-copy-btn ${state === 'failed' ? 'is-failed' : ''} ${state === 'copied' ? 'is-copied' : ''}`} onClick={() => void onClick()} title={label} type="button">{state === 'copied' ? '✓' : '⧉'}</button>
}
