import { Check, Copy, X } from 'lucide-react'
import { useState } from 'react'

import { ICON_BUTTON, ICON_SIZE } from '../constants/styles'

const RESET_DELAY_MS = 1_600
const STATES = {
  idle: { label: 'Copy text', Icon: Copy },
  copied: { label: 'Copied', Icon: Check },
  failed: { label: 'Copy failed', Icon: X },
} as const

export const CopyTextButton = ({ payload }: { payload: string }) => {
  const [state, setState] = useState<keyof typeof STATES>('idle')
  const { label, Icon } = STATES[state]

  const onClick = async (): Promise<void> => {
    const wrote = await navigator.clipboard?.writeText(payload).then(() => true).catch(() => false)
    setState(wrote ? 'copied' : 'failed')
    window.setTimeout(() => setState('idle'), RESET_DELAY_MS)
  }

  return <button aria-label={label} className={ICON_BUTTON} disabled={!payload} onClick={() => void onClick()} title={label} type="button"><Icon size={ICON_SIZE} /></button>
}
