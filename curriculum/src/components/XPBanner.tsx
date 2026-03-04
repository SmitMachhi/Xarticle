import { useEffect, useState } from 'react'

interface Props {
  xp: number
  visible: boolean
}

export default function XPBanner({ xp, visible }: Props) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!visible) { setShow(false); return }
    setShow(true)
    const t = setTimeout(() => setShow(false), 2000)
    return () => clearTimeout(t)
  }, [visible])

  if (!show) return null

  return (
    <div className="xp-banner" aria-live="polite">
      +{xp} XP
    </div>
  )
}
