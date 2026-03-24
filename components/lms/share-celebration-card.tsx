'use client'

import { cn } from '@/lib/utils'

export type ShareCardKind = 'game_score' | 'assessment_pass' | 'module_reward'

export interface ShareCardData {
  kind: ShareCardKind
  icon: string
  eyebrow: string
  achievement: string
  title: string
  subtitle: string
  primaryStat: {
    label: string
    value: string
  }
  secondaryStat?: {
    label: string
    value: string
  }
  footer: string
}

function getCardTheme(kind: ShareCardKind) {
  if (kind === 'assessment_pass') {
    return {
      shell:
        'border-fuchsia-300/20 bg-[radial-gradient(circle_at_top,rgba(244,114,182,0.26),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.28),transparent_36%),linear-gradient(180deg,#1f1147_0%,#120a2b_54%,#090612_100%)]',
      accent: 'text-pink-200',
      stat:
        'border-white/12 bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]',
      pill: 'border-pink-300/25 bg-pink-400/15 text-pink-100',
      orb: 'from-pink-400 via-fuchsia-500 to-indigo-400',
      titleClass: 'font-serif tracking-[0.01em]',
      achievementClass: 'font-semibold tracking-[0.18em]',
      subtitleClass: 'font-medium',
    }
  }

  if (kind === 'module_reward') {
    return {
      shell:
        'border-amber-200/25 bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.28),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(249,115,22,0.26),transparent_35%),linear-gradient(180deg,#3a2107_0%,#1f1205_58%,#0c0703_100%)]',
      accent: 'text-amber-100',
      stat:
        'border-white/12 bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]',
      pill: 'border-amber-200/25 bg-amber-300/15 text-amber-50',
      orb: 'from-amber-300 via-orange-400 to-rose-400',
      titleClass: 'font-serif uppercase tracking-[0.05em]',
      achievementClass: 'font-black tracking-[0.24em]',
      subtitleClass: 'font-medium text-amber-50/90',
    }
  }

  return {
    shell:
      'border-cyan-300/20 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.24),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.24),transparent_36%),linear-gradient(180deg,#07111f_0%,#091426_54%,#050914_100%)]',
    accent: 'text-cyan-100',
    stat:
      'border-white/12 bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]',
    pill: 'border-cyan-300/25 bg-cyan-400/15 text-cyan-100',
    orb: 'from-cyan-300 via-sky-400 to-blue-500',
    titleClass: 'font-sans tracking-[-0.02em]',
    achievementClass: 'font-bold tracking-[0.2em]',
    subtitleClass: 'font-semibold',
  }
}

export function ShareCelebrationCard({
  card,
  className,
  compact = false,
}: {
  card: ShareCardData
  className?: string
  compact?: boolean
}) {
  const theme = getCardTheme(card.kind)

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[1.9rem] border text-white shadow-[0_30px_120px_rgba(2,6,23,0.28)]',
        compact ? 'p-4' : 'p-5',
        theme.shell,
        className,
      )}
    >
      <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:24px_24px]" />
      <div className={cn('absolute rounded-full bg-gradient-to-br opacity-80 blur-2xl', theme.orb, compact ? 'right-[-2.25rem] top-[-2.25rem] h-24 w-24' : 'right-[-3rem] top-[-3rem] h-32 w-32')} />

      <div className="relative">
        <div className={cn('flex items-start justify-between', compact ? 'gap-3' : 'gap-4')}>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-white/65">{card.eyebrow}</p>
            <div className={cn('inline-flex items-center rounded-full border text-xs uppercase', theme.pill, theme.achievementClass, compact ? 'mt-2 px-2.5 py-0.5' : 'mt-3 px-3 py-1')}>
              {card.achievement}
            </div>
          </div>
          <div className={cn('flex items-center justify-center rounded-[1.4rem] border border-white/10 bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]', compact ? 'h-12 w-12 text-2xl' : 'h-16 w-16 text-3xl')}>
            {card.icon}
          </div>
        </div>

        <div className={cn(compact ? 'mt-4' : 'mt-5')}>
          <h3 className={cn('font-black leading-tight', theme.titleClass, compact ? 'text-[1.45rem]' : 'text-2xl')}>{card.title}</h3>
          <p className={cn(theme.accent, theme.subtitleClass, compact ? 'mt-1.5 text-[13px]' : 'mt-2 text-sm')}>{card.subtitle}</p>
        </div>

        <div className={cn('grid grid-cols-2', compact ? 'mt-4 gap-2.5' : 'mt-6 gap-3')}>
          <div className={cn('rounded-[1.3rem] border', theme.stat, compact ? 'p-3' : 'p-4')}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/55">{card.primaryStat.label}</p>
            <p className={cn('font-black', compact ? 'mt-1.5 text-[2rem]' : 'mt-2 text-3xl')}>{card.primaryStat.value}</p>
          </div>
          {card.secondaryStat ? (
            <div className={cn('rounded-[1.3rem] border', theme.stat, compact ? 'p-3' : 'p-4')}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/55">{card.secondaryStat.label}</p>
              <p className={cn('font-black', compact ? 'mt-1.5 text-[2rem]' : 'mt-2 text-3xl')}>{card.secondaryStat.value}</p>
            </div>
          ) : (
            <div className={cn('rounded-[1.3rem] border', theme.stat, compact ? 'p-3' : 'p-4')}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/55">Achievement</p>
              <p className={cn('font-black leading-tight', compact ? 'mt-1.5 text-base' : 'mt-2 text-lg')}>{card.achievement}</p>
            </div>
          )}
        </div>

        <div className={cn('rounded-[1.2rem] border border-white/10 bg-black/20 text-white/80', compact ? 'mt-4 px-3.5 py-2.5 text-[13px]' : 'mt-5 px-4 py-3 text-sm')}>
          {card.footer}
        </div>
      </div>
    </div>
  )
}
