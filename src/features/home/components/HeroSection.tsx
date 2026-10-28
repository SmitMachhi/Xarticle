import type { ReactNode } from 'react'

import pandaSeriousGear from '../../../assets/panda_pose_serious_gear.png'
import pandaWave from '../../../assets/panda_pose_wave.png'
import pandaWinkHeart from '../../../assets/panda_pose_wink_heart.png'
import pandaWrench from '../../../assets/panda_pose_wrench.png'
import { AuroraText } from '../../../components/magicui/aurora-text'
import { AURORA_COLORS, HERO_TITLE_ACCENT, HERO_TITLE_LEAD } from '../constants/uiContent'

interface HeroSectionProps {
  children: ReactNode
  hasArticle: boolean
  hasError: boolean
  loading: boolean
}

// The panda only reacts to real state changes; it stays still otherwise.
const pandaFor = ({ hasArticle, hasError, loading }: Omit<HeroSectionProps, 'children'>): { motion: string; src: string } => {
  if (loading) return { motion: 'motion-safe:animate-panda-bob', src: pandaWrench }
  if (hasError) return { motion: '', src: pandaSeriousGear }
  if (hasArticle) return { motion: 'motion-safe:animate-panda-hop', src: pandaWinkHeart }
  return { motion: '', src: pandaWave }
}

export const HeroSection = ({ children, ...state }: HeroSectionProps) => {
  const panda = pandaFor(state)
  return (
    <section className="flex flex-col items-center gap-6 pt-8 text-center print:hidden">
      <img alt="" aria-hidden="true" className={`-my-6 size-40 object-contain drop-shadow-[0_10px_14px_rgba(16,185,129,0.18)] [image-rendering:pixelated] ${panda.motion}`} key={panda.src} src={panda.src} />
      <h1 className="font-serif text-5xl leading-[1.05] tracking-tight text-balance sm:text-6xl">
        {HERO_TITLE_LEAD} <AuroraText colors={AURORA_COLORS}>{HERO_TITLE_ACCENT}</AuroraText>
      </h1>
      {children}
    </section>
  )
}
