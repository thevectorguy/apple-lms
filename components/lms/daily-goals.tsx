'use client'

import type { User } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Target, Check } from 'lucide-react'

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
    },
    {
      label: 'Complete Quizzes',
      current: 2,
      target: 2,
      xp: 30,
      completed: true,
    },
    {
      label: 'Time Spent',
      current: Math.min(dailyGoals.timeSpent, 30),
      target: 30,
      xp: 25,
      completed: dailyGoals.timeSpent >= 30,
      unit: 'min',
    },
  ]

  const completedCount = goals.filter(g => g.completed).length
  const todaysXP = goals.filter(g => g.completed).reduce((acc, g) => acc + g.xp, 0)

  return (
    <div className="ios-shell rounded-[2rem] p-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="ios-icon-button flex h-9 w-9 items-center justify-center rounded-full">
            <Target className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <h3 className="text-[1.05rem] font-bold tracking-[-0.03em] text-slate-950 dark:text-white">Daily Goals</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Small wins that keep the streak alive.</p>
          </div>
        </div>
        <span className="rounded-full bg-white/60 px-3 py-1 text-xs font-medium text-slate-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] dark:bg-white/10 dark:text-slate-300">
          {completedCount}/{goals.length}
        </span>
      </div>

      {/* Goals List */}
      <div className="space-y-2.5">
        {goals.map((goal, index) => {
          const percentage = Math.min((goal.current / goal.target) * 100, 100)
          
          return (
            <div
              key={index}
              className={cn(
                'ios-frost rounded-[1.4rem] p-3.5 transition-all duration-300 hover:-translate-y-0.5',
                goal.completed
                  ? 'border-primary/30 bg-primary/10'
                  : 'border-white/70 bg-white/45 dark:bg-white/[0.06]'
              )}
            >
              <div className="mb-2.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-full border transition-all',
                      goal.completed
                        ? 'bg-primary text-primary-foreground shadow-[0_12px_20px_-14px_rgba(37,99,235,0.55)] border-primary'
                        : 'border-slate-300/70 bg-white/50 text-transparent dark:border-white/15 dark:bg-white/5'
                    )}
                  >
                    {goal.completed && <Check className="w-4 h-4 text-primary-foreground" />}
                  </div>
                  <span className={cn(
                    'text-[13px] font-semibold text-slate-900 dark:text-slate-100',
                    goal.completed && 'text-foreground'
                  )}>{goal.label}</span>
                </div>
                <span className={cn(
                  'rounded-full px-2.5 py-1 text-xs font-semibold',
                  goal.completed
                    ? 'bg-primary/12 text-primary'
                    : 'bg-white/60 text-primary/80 dark:bg-white/8'
                )}>+{goal.xp} XP</span>
              </div>
              
              {/* Progress Bar */}
              <div className="flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800/80">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500',
                      goal.completed
                        ? 'bg-[linear-gradient(90deg,rgba(86,161,255,1)_0%,rgba(59,130,246,1)_48%,rgba(131,198,255,1)_100%)]'
                        : 'bg-[linear-gradient(90deg,rgba(148,197,255,0.95)_0%,rgba(86,161,255,0.85)_100%)]'
                    )}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="min-w-[62px] text-right text-xs font-medium text-slate-500 dark:text-slate-400">
                  {goal.current}/{goal.target}{(goal as any).unit ? ` ${(goal as any).unit}` : ''}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Today's XP Summary */}
      <div className="mt-4 flex items-center justify-between border-t border-white/45 pt-3.5 dark:border-white/10">
        <span className="text-sm text-slate-500 dark:text-slate-400">Today’s XP earned</span>
        <span className="text-lg font-semibold tracking-[-0.03em] text-primary">+{todaysXP} XP</span>
      </div>
    </div>
  )
}
