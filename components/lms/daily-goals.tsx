'use client'

import type { User } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

interface DailyGoalsProps {
  user: User
}

type Goal = {
  label: string
  current: number
  target: number
  xp: number
  completed: boolean
  unit?: string
  tileBg: string
  barFrom: string
  barTo: string
  checkGlow: string
  checkBg: string
  textColor: string
  subColor: string
  fractionColor: string
}

export function DailyGoals({ user }: DailyGoalsProps) {
  const { dailyGoals } = user

  const goals: Goal[] = [
    {
      label: 'Watch Lessons',
      current: dailyGoals.lessonsCompleted,
      target: dailyGoals.lessonsGoal,
      xp: 50,
      completed: dailyGoals.lessonsCompleted >= dailyGoals.lessonsGoal,
      tileBg: 'linear-gradient(135deg, rgba(167,139,250,0.55) 0%, rgba(139,92,246,0.38) 50%, rgba(196,181,253,0.28) 100%)',
      barFrom: '#a78bfa',
      barTo: '#7c3aed',
      checkGlow: '0 8px 20px -8px rgba(124,58,237,0.65)',
      checkBg: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
      textColor: 'text-violet-950',
      subColor: 'text-violet-900/60',
      fractionColor: 'text-violet-950/50',
    },
    {
      label: 'Complete Quizzes',
      current: 2,
      target: 2,
      xp: 30,
      completed: true,
      tileBg: 'linear-gradient(135deg, rgba(52,211,153,0.55) 0%, rgba(20,184,166,0.38) 50%, rgba(153,246,228,0.28) 100%)',
      barFrom: '#34d399',
      barTo: '#0d9488',
      checkGlow: '0 8px 20px -8px rgba(20,184,166,0.65)',
      checkBg: 'linear-gradient(135deg, #34d399, #0d9488)',
      textColor: 'text-teal-950',
      subColor: 'text-teal-900/60',
      fractionColor: 'text-teal-950/50',
    },
    {
      label: 'Time Spent',
      current: Math.min(dailyGoals.timeSpent, 30),
      target: 30,
      xp: 25,
      completed: dailyGoals.timeSpent >= 30,
      unit: 'min',
      tileBg: 'linear-gradient(135deg, rgba(251,191,36,0.55) 0%, rgba(249,115,22,0.38) 50%, rgba(253,230,138,0.28) 100%)',
      barFrom: '#fbbf24',
      barTo: '#ea580c',
      checkGlow: '0 8px 20px -8px rgba(234,88,12,0.65)',
      checkBg: 'linear-gradient(135deg, #fbbf24, #ea580c)',
      textColor: 'text-amber-950',
      subColor: 'text-amber-900/60',
      fractionColor: 'text-amber-950/50',
    },
  ]

  const completedCount = goals.filter(g => g.completed).length
  const todaysXP = goals.filter(g => g.completed).reduce((acc, g) => acc + g.xp, 0)

  const shellStyle = {
    background: 'rgba(255,255,255,0.72)',
    backdropFilter: 'blur(32px) saturate(180%)',
    WebkitBackdropFilter: 'blur(32px) saturate(180%)',
    boxShadow: '0 32px 64px -28px rgba(100,80,200,0.28), 0 2px 8px rgba(255,255,255,0.6) inset',
    border: 'none',
  }

  return (
    <div className="relative overflow-hidden rounded-[2rem] p-5" style={shellStyle}>
      <div className="pointer-events-none absolute -left-6 -top-4 h-32 w-32 rounded-full bg-violet-400/40 blur-[40px]" />
      <div className="pointer-events-none absolute -right-4 top-0 h-28 w-28 rounded-full bg-teal-400/32 blur-[36px]" />
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-28 w-28 -translate-x-1/2 rounded-full bg-amber-400/28 blur-[36px]" />
      <div className="pointer-events-none absolute right-4 bottom-6 h-20 w-20 rounded-full bg-violet-300/30 blur-[28px]" />

      <div className="relative">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.28em] text-slate-500/80">Today</p>
            <h3 className="mt-1 text-[1.65rem] font-black leading-none tracking-[-0.065em] text-slate-900">
              Daily Goals
            </h3>
          </div>

          <div
            className="flex items-center gap-0.5 rounded-full px-3.5 py-2"
            style={{
              background: 'rgba(255,255,255,0.65)',
              backdropFilter: 'blur(16px)',
              boxShadow: '0 2px 12px rgba(124,58,237,0.18), inset 0 1px 0 rgba(255,255,255,0.8)',
            }}
          >
            <span className="text-[1.4rem] font-black leading-none tracking-[-0.05em] text-violet-700">{completedCount}</span>
            <span className="text-sm font-bold text-slate-400">/{goals.length}</span>
          </div>
        </div>

        <div className="space-y-2.5">
          {goals.map(goal => {
            const percentage = Math.min((goal.current / goal.target) * 100, 100)

            return (
              <div
                key={goal.label}
                className="overflow-hidden rounded-[1.5rem] p-4 transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.01]"
                style={{
                  background: goal.tileBg,
                  backdropFilter: 'blur(20px) saturate(160%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(160%)',
                  boxShadow: '0 8px 24px -12px rgba(0,0,0,0.14), inset 0 1px 0 rgba(255,255,255,0.55)',
                }}
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-md"
                      style={{
                        background: goal.completed ? goal.checkBg : 'rgba(255,255,255,0.55)',
                        boxShadow: goal.completed ? goal.checkGlow : 'none',
                      }}
                    >
                      {goal.completed
                        ? <Check className="h-4 w-4 text-white" strokeWidth={3} />
                        : <div className="h-3 w-3 rounded-full bg-white/60" />
                      }
                    </div>
                    <span className={cn('text-[15px] font-bold tracking-[-0.03em]', goal.textColor)}>{goal.label}</span>
                  </div>

                  <span
                    className={cn('rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em]', goal.textColor)}
                    style={{ background: 'rgba(255,255,255,0.45)', backdropFilter: 'blur(8px)' }}
                  >
                    +{goal.xp} XP
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-2 flex-1 overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,0.38)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${percentage}%`,
                        background: `linear-gradient(90deg, ${goal.barFrom}, ${goal.barTo})`,
                        boxShadow: `0 0 8px ${goal.barFrom}88`,
                      }}
                    />
                  </div>
                  <div className="flex min-w-[56px] items-baseline justify-end gap-0.5">
                    <span className={cn('text-[1.1rem] font-black leading-none tracking-[-0.05em]', goal.textColor)}>
                      {goal.current}
                    </span>
                    <span className={cn('text-[11px] font-semibold', goal.fractionColor)}>
                      {goal.unit ? `/${goal.target} ${goal.unit}` : `/${goal.target}`}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-5 flex items-center justify-between">
          <span className="text-[0.88rem] font-semibold text-slate-500">Today&apos;s XP earned</span>
          <div
            className="flex items-baseline gap-1 rounded-2xl px-4 py-2"
            style={{
              background: 'rgba(255,255,255,0.60)',
              backdropFilter: 'blur(16px)',
              boxShadow: '0 2px 12px rgba(124,58,237,0.16), inset 0 1px 0 rgba(255,255,255,0.85)',
            }}
          >
            <span className="text-[2.35rem] font-black leading-none tracking-[-0.07em] text-violet-600">+{todaysXP}</span>
            <span className="text-lg font-bold text-slate-400">XP</span>
          </div>
        </div>
      </div>
    </div>
  )
}
