import type { ReactNode } from 'react'

import pandaSeriousGear from '../../../assets/panda_pose_serious_gear.png'
import pandaWave from '../../../assets/panda_pose_wave.png'
import pandaWinkHeart from '../../../assets/panda_pose_wink_heart.png'
import pandaWrench from '../../../assets/panda_pose_wrench.png'
import { HERO_TITLE } from '../constants/uiContent'

interface HeroSectionProps {
  children: ReactNode
  hasArticle: boolean
  hasError: boolean
  loading: boolean
}

type PandaMood = 'is-celebrating' | 'is-error' | 'is-idle' | 'is-loading'

// The panda only reacts to real state changes; it stays still otherwise.
const pandaFor = ({ hasArticle, hasError, loading }: Omit<HeroSectionProps, 'children'>): { mood: PandaMood; src: string } => {
  if (loading) return { mood: 'is-loading', src: pandaWrench }
  if (hasError) return { mood: 'is-error', src: pandaSeriousGear }
  if (hasArticle) return { mood: 'is-celebrating', src: pandaWinkHeart }
  return { mood: 'is-idle', src: pandaWave }
}

export const HeroSection = ({ children, ...state }: HeroSectionProps) => {
  const panda = pandaFor(state)
  return (
    <section className="hero card">
      <div className={`panda ${panda.mood}`} aria-hidden="true">
        <span className="panda-dot panda-dot-a" />
        <span className="panda-dot panda-dot-b" />
        <img alt="" key={panda.src} src={panda.src} />
      </div>
      <h1 className="hero-title">{HERO_TITLE}</h1>
      {children}
    </section>
  )
}
