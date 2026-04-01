'use client'

import type { User } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Check, Target } from 'lucide-react'

interface DailyGoalsProps {
  user: User
}

export function DailyGoals({ user }: DailyGoalsProps) {
  const { dailyGoals } = user

  const goals = [
    {
      label: 'Watch Lessons',
      current: dailyGoals.lessonsCompleted,
      target: dailyGoals.lessonsGoal,
      xp: 50,
      completed: dailyGoals.lessonsCompleted >= dailyGoals.lessonsGoal,
      surface: {
        borderColor: 'rgba(147,197,253,0.38)',
        backgroundImage: 'radial-gradient(circle at 14% 18%, rgba(125,211,252,0.28), transparent 30%), linear-gradient(180deg, rgba(187,222,255,0.88) 0%, rgba(158,202,250,0.8) 100%)',
      },
    },
    {
      label: 'Complete Quizzes',
      current: 2,
      target: 2,
      xp: 30,
      completed: true,
      surface: {
        borderColor: 'rgba(196,181,253,0.38)',
        backgroundImage: 'radial-gradient(circle at 14% 18%, rgba(196,181,253,0.24), transparent 30%), linear-gradient(180deg, rgba(219,211,255,0.88) 0%, rgba(196,186,255,0.8) 100%)',
      },
    },
    {
      label: 'Time Spent',
      current: Math.min(dailyGoals.timeSpent, 30),
      target: 30,
      xp: 25,
      completed: dailyGoals.timeSpent >= 30,
      unit: 'min',
      surface: {
        borderColor: 'rgba(103,232,249,0.38)',
        backgroundImage: 'radial-gradient(circle at 14% 18%, rgba(103,232,249,0.24), transparent 30%), linear-gradient(180deg, rgba(197,244,255,0.88) 0%, rgba(165,229,247,0.8) 100%)',
      },
    },
  ] as const

  const completedCount = goals.filter(goal => goal.completed).length
  const todaysXP = goals.filter(goal => goal.completed).reduce((acc, goal) => acc + goal.xp, 0)

  const shellStyle = {
    borderColor: 'rgba(191,219,254,0.72)',
    backgroundImage: 'radial-gradient(circle at 12% 18%, rgba(56,189,248,0.42), transparent 28%), radial-gradient(circle at 88% 14%, rgba(34,211,238,0.28), transparent 24%), radial-gradient(circle at 50% 100%, rgba(96,165,250,0.24), transparent 34%), repeating-linear-gradient(135deg, rgba(224,242,254,0.18) 0 1px, transparent 1px 18px), linear-gradient(180deg, rgba(170,211,255,0.98) 0%, rgba(135,187,248,0.96) 50%, rgba(109,165,239,0.96) 100%)',
    boxShadow: '0 34px 58px -34px rgba(59,130,246,0.46), inset 0 1px 0 rgba(224,242,254,0.42)',
  }
  const iconShellStyle = {
    borderColor: 'rgba(147,197,253,0.34)',
    backgroundImage: 'linear-gradient(180deg, rgba(219,234,254,0.82) 0%, rgba(186,214,255,0.76) 100%)',
  }
  const countPillStyle = {
    borderColor: 'rgba(224,242,254,0.4)',
    backgroundImage: 'linear-gradient(180deg, rgba(219,234,254,0.72) 0%, rgba(191,219,254,0.62) 100%)',
    boxShadow: '0 16px 28px -24px rgba(59,130,246,0.4), inset 0 1px 0 rgba(224,242,254,0.4)',
  }
  const rewardPillStyle = {
    borderColor: 'rgba(224,242,254,0.42)',
    backgroundImage: 'linear-gradient(180deg, rgba(219,234,254,0.66) 0%, rgba(191,219,254,0.56) 100%)',
  }

  return (
    <div className="ios-shell relative overflow-hidden rounded-[2rem] p-4" style={shellStyle}>
      <div className="pointer-events-none absolute -left-10 top-0 h-28 w-28 rounded-full bg-sky-300/50 blur-3xl animate-float" />
      <div className="pointer-events-none absolute right-0 top-6 h-24 w-24 rounded-full bg-cyan-300/40 blur-3xl animate-float" />
      <div className="pointer-events-none absolute bottom-0 right-6 h-24 w-24 rounded-full bg-blue-300/35 blur-3xl animate-float" />

      <div className="relative">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="ios-icon-button flex h-11 w-11 items-center justify-center rounded-full" style={iconShellStyle}>
              <Target className="h-5 w-5 text-sky-600" />
            </div>
            <div>
              <h3 className="text-[1.08rem] font-semibold tracking-[-0.05em] text-sky-950">Daily Goals</h3>
              <p className="text-[0.95rem] tracking-[-0.02em] text-sky-950/58">Small wins that keep the streak alive.</p>
            </div>
          </div>

          <span
            className="rounded-full border px-3 py-1 text-sm font-semibold tracking-[-0.03em] text-sky-950/78"
            style={countPillStyle}
          >
            {completedCount}/{goals.length}
          </span>
        </div>

        <div className="space-y-3">
          {goals.map(goal => {
            const percentage = Math.min((goal.current / goal.target) * 100, 100)

            return (
              <div
                key={goal.label}
                className="ios-frost rounded-[1.45rem] p-3.5 transition-all duration-300 hover:-translate-y-0.5"
                style={goal.surface}
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-full border transition-all',
                        goal.completed
                          ? 'border-sky-500 bg-sky-500 text-white shadow-[0_12px_20px_-14px_rgba(37,99,235,0.55)]'
                          : 'border-sky-200/70 bg-sky-100/60 text-transparent',
                      )}
                    >
                      {goal.completed && <Check className="h-4 w-4 text-white" />}
                    </div>
                    <span className="text-[15px] font-semibold tracking-[-0.04em] text-sky-950">{goal.label}</span>
                  </div>

                  <span
                    className={cn(
                      'rounded-full border px-2.5 py-1 text-xs font-semibold',
                      goal.completed ? 'text-sky-700' : 'text-sky-800/88',
                    )}
                    style={rewardPillStyle}
                  >
                    +{goal.xp} XP
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-sky-100/55">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-500',
                        goal.completed
                          ? 'bg-[linear-gradient(90deg,rgba(37,99,235,0.98)_0%,rgba(59,130,246,0.96)_48%,rgba(96,165,250,0.96)_100%)]'
                          : 'bg-[linear-gradient(90deg,rgba(96,165,250,0.92)_0%,rgba(59,130,246,0.82)_100%)]',
                      )}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  <span className="min-w-[70px] text-right text-sm font-semibold tracking-[-0.03em] text-sky-950/64">
                    {goal.current}/{goal.target}{goal.unit ? ` ${goal.unit}` : ''}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-sky-100/40 pt-3.5">
          <span className="text-[1.02rem] tracking-[-0.03em] text-sky-950/62">Today&apos;s XP earned</span>
          <span className="text-[2rem] font-semibold tracking-[-0.06em] text-sky-600">+{todaysXP} XP</span>
        </div>
      </div>
    </div>
  )
}
