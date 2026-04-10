'use client'

import { CheckCircle2, MessageSquare, Play, Search, TrendingUp } from 'lucide-react'
import { SPEED_CHECK_THRESHOLD } from '@/lib/speed-framework'
import type { SpeedStageKey, UserSkillProfile } from '@/lib/types'
import { cn } from '@/lib/utils'

const SPEED_STAGE_META: Array<{
  key: SpeedStageKey
  label: string
  helper: string
  icon: typeof Play
  tone: string
}> = [
  {
    key: 'start_right',
    label: 'Start Right',
    helper: 'Open with a confident, customer-focused start.',
    icon: Play,
    tone: 'from-violet-500 to-fuchsia-500',
  },
  {
    key: 'plan_to_probe',
    label: 'Plan to Probe',
    helper: 'Ask better questions before you move into the pitch.',
    icon: Search,
    tone: 'from-sky-500 to-cyan-500',
  },
  {
    key: 'explain_value',
    label: 'Explain Value Proposition',
    helper: 'Tie the offer to customer outcomes.',
    icon: MessageSquare,
    tone: 'from-amber-500 to-orange-500',
  },
  {
    key: 'eliminate_objection',
    label: 'Eliminate Objection',
    helper: 'Handle pushback cleanly and keep momentum.',
    icon: CheckCircle2,
    tone: 'from-emerald-500 to-teal-500',
  },
  {
    key: 'drive_closure',
    label: 'Drive Closure',
    helper: 'Finish with a clear next step.',
    icon: TrendingUp,
    tone: 'from-rose-500 to-pink-500',
  },
]

function getStageStatus(score: number) {
  if (score >= SPEED_CHECK_THRESHOLD) return 'Strong now'
  if (score >= 65) return 'Building'
  return 'Focus next'
}

interface SpeedChecklistSummaryProps {
  stages: UserSkillProfile['speedFramework']['stages']
  className?: string
  variant?: 'dark' | 'light'
}

export function SpeedChecklistSummary({ stages, className, variant = 'dark' }: SpeedChecklistSummaryProps) {
  const isLight = variant === 'light'

  return (
    <div
      className={cn(
        'rounded-[24px] border p-4',
        isLight
          ? 'border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.88)_0%,rgba(248,250,252,0.92)_100%)] shadow-[0_16px_40px_rgba(15,23,42,0.06)]'
          : 'border-white/10 bg-white/5',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={cn('text-xs font-semibold uppercase tracking-[0.18em]', isLight ? 'text-slate-500' : 'text-white/55')}>SPEED checklist</p>
          <p className={cn('mt-1 text-sm font-medium', isLight ? 'text-slate-600' : 'text-white/72')}>These are the live conversation values that also feed the profile view.</p>
        </div>
        <div
          className={cn(
            'rounded-full px-3 py-1 text-xs font-semibold',
            isLight ? 'bg-slate-100 text-slate-700' : 'bg-white/8 text-white/80',
          )}
        >
          {SPEED_STAGE_META.filter(stage => (stages[stage.key]?.score ?? 0) >= SPEED_CHECK_THRESHOLD).length}/5 strong
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {SPEED_STAGE_META.map(stage => {
          const score = stages[stage.key]?.score ?? 0
          const StageIcon = stage.icon

          return (
            <div
              key={stage.key}
              className={cn(
                'rounded-[20px] border p-3 transition-colors',
                score >= SPEED_CHECK_THRESHOLD
                  ? isLight
                    ? 'border-emerald-200 bg-emerald-50/80'
                    : 'border-emerald-400/20 bg-emerald-400/10'
                  : isLight
                    ? 'border-slate-200 bg-white/80'
                    : 'border-white/10 bg-black/10',
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-sm', stage.tone)}>
                  <StageIcon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className={cn('text-sm font-bold leading-tight', isLight ? 'text-slate-900' : 'text-white')}>{stage.label}</p>
                    <p className={cn('text-sm font-black', isLight ? 'text-slate-900' : 'text-white')}>{score}%</p>
                  </div>
                  <p className={cn('mt-1 text-[11px] font-semibold uppercase tracking-[0.14em]', isLight ? 'text-slate-500' : 'text-white/50')}>{getStageStatus(score)}</p>
                </div>
              </div>

              <div className={cn('mt-3 h-2 rounded-full', isLight ? 'bg-slate-200/80' : 'bg-white/10')}>
                <div
                  className={cn(
                    'h-2 rounded-full transition-all duration-500',
                    score >= SPEED_CHECK_THRESHOLD
                      ? 'bg-gradient-to-r from-emerald-400 to-cyan-400'
                      : score >= 65
                        ? 'bg-gradient-to-r from-primary to-accent'
                        : 'bg-gradient-to-r from-amber-400 to-orange-400',
                  )}
                  style={{ width: `${score}%` }}
                />
              </div>

              <p className={cn('mt-3 text-xs leading-5 font-medium', isLight ? 'text-slate-600' : 'text-white/65')}>{stage.helper}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
