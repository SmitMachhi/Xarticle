import { useEffect, useState } from 'react'
import pandaSeriousGear from '../../../assets/panda_pose_serious_gear.png'
import pandaWave from '../../../assets/panda_pose_wave.png'
import pandaWinkHeart from '../../../assets/panda_pose_wink_heart.png'
import pandaWrench from '../../../assets/panda_pose_wrench.png'
import {
  HERO_IDLE_COPY,
  HERO_IDLE_LABEL,
  HERO_TITLE,
  HERO_WORKING_COPY,
  HERO_WORKING_LABEL,
} from '../constants/uiContent'

interface HeroSectionProps {
  hasArticle: boolean
  hasError: boolean
  loading: boolean
}

interface HeroState {
  className: 'is-celebrating' | 'is-loading' | 'is-ready'
  copy: string
  label: string
  src: string
}

const IDLE_SPRITES = [pandaWave, pandaWrench, pandaWinkHeart, pandaSeriousGear] as const
const SPRITE_INTERVAL_MS = 2_700

const resolveHeroState = (
  { hasArticle, hasError, loading }: HeroSectionProps,
  idleSpriteIndex: number,
): HeroState => {
  if (loading) {
    return { className: 'is-loading', copy: HERO_WORKING_COPY, label: HERO_WORKING_LABEL, src: pandaWrench }
  }
  if (hasError) {
    return { className: 'is-ready', copy: 'Try a different public URL. If needed, retry once.', label: 'Needs Retry', src: pandaSeriousGear }
  }
  if (hasArticle) {
    return { className: 'is-celebrating', copy: 'Article is ready. Export to PDF or Markdown.', label: 'Ready', src: pandaWinkHeart }
  }
  return { className: 'is-ready', copy: HERO_IDLE_COPY, label: HERO_IDLE_LABEL, src: IDLE_SPRITES[idleSpriteIndex] }
}

export const HeroSection = ({ hasArticle, hasError, loading }: HeroSectionProps) => {
  const isIdle = !loading && !hasError && !hasArticle
  const [idleSpriteIndex, setIdleSpriteIndex] = useState(0)

  useEffect(() => {
    if (!isIdle) return
    const id = setInterval(() => setIdleSpriteIndex((i) => (i + 1) % IDLE_SPRITES.length), SPRITE_INTERVAL_MS)
    return () => clearInterval(id)
  }, [isIdle])

  const state = resolveHeroState({ hasArticle, hasError, loading }, idleSpriteIndex)
  return (
    <section className="hero-shell app-card" aria-live="polite">
      <div className="hero-layout">
        <div className="hero-copy-block">
          <p key={state.label} className="hero-kicker">{state.label}</p>
          <h1 className="hero-title">{HERO_TITLE}</h1>
          <p key={state.copy} className="hero-copy">{state.copy}</p>
        </div>
        <div className={`panda-guide ${state.className}`} aria-hidden="true">
          <span className="sparkle sparkle-a">*</span>
          <span className="sparkle sparkle-b">+</span>
          <span className="orbit orbit-a" />
          <span className="orbit orbit-b" />
          <img alt="" className="panda-hero" key={state.src} src={state.src} />
        </div>
      </div>
    </section>
  )
}
