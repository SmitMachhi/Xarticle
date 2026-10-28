import type { ReactNode } from 'react'

import { AuroraText } from '../../../components/magicui/aurora-text'
import { AURORA_COLORS, HERO_TITLE_ACCENT, HERO_TITLE_LEAD } from '../constants/uiContent'

// Centered in the viewport until there is something to show below it.
export const HeroSection = ({ centered, children }: { centered: boolean; children: ReactNode }) => {
  return (
    <section className={`flex flex-col items-center gap-6 text-center print:hidden ${centered ? 'flex-1 justify-center' : 'pt-10'}`}>
      <h1 className="font-mono text-3xl leading-tight font-bold tracking-tighter text-balance sm:text-5xl">
        {HERO_TITLE_LEAD} <AuroraText colors={AURORA_COLORS}>{HERO_TITLE_ACCENT}</AuroraText>
      </h1>
      {children}
    </section>
  )
}
