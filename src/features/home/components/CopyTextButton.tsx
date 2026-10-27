import { useState } from 'react'

const RESET_DELAY_MS = 1_600
const LABELS = { idle: 'Copy text', copied: 'Copied', failed: 'Copy failed' } as const

export const CopyTextButton = ({ payload }: { payload: string }) => {
  const [state, setState] = useState<keyof typeof LABELS>('idle')

  const onClick = async (): Promise<void> => {
    const wrote = await navigator.clipboard?.writeText(payload).then(() => true).catch(() => false)
    setState(wrote ? 'copied' : 'failed')
    window.setTimeout(() => setState('idle'), RESET_DELAY_MS)
  }

  return <button className="btn-quiet" disabled={!payload} onClick={() => void onClick()} type="button">{LABELS[state]}</button>
}
