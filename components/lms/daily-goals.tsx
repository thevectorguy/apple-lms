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
    <div className="glass-card rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Target className="w-5 h-5 text-primary" />
          </div>
          <h3 className="font-bold text-lg">Daily Goals</h3>
        </div>
        <span className="text-sm text-muted-foreground">{completedCount}/{goals.length} complete</span>
      </div>

      {/* Goals List */}
      <div className="space-y-3">
        {goals.map((goal, index) => {
          const percentage = Math.min((goal.current / goal.target) * 100, 100)
          
          return (
            <div
              key={index}
              className={cn(
                'rounded-xl p-4 border transition-all',
                goal.completed
                  ? 'bg-primary/10 border-primary/30'
                  : 'bg-card border-border'
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all',
                      goal.completed
                        ? 'bg-primary border-primary'
                        : 'border-muted-foreground/30'
                    )}
                  >
                    {goal.completed && <Check className="w-4 h-4 text-primary-foreground" />}
                  </div>
                  <span className={cn(
                    'font-medium',
                    goal.completed && 'text-foreground'
                  )}>{goal.label}</span>
                </div>
                <span className={cn(
                  'font-semibold',
                  goal.completed ? 'text-primary' : 'text-primary/70'
                )}>+{goal.xp} XP</span>
              </div>
              
              {/* Progress Bar */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500',
                      goal.completed ? 'bg-primary' : 'bg-primary/60'
                    )}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-sm text-muted-foreground min-w-[50px] text-right">
                  {goal.current}/{goal.target}{(goal as any).unit ? ` ${(goal as any).unit}` : ''}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Today's XP Summary */}
      <div className="flex items-center justify-between mt-5 pt-4 border-t border-border">
        <span className="text-muted-foreground">Today's XP earned</span>
        <span className="text-lg font-bold text-primary">+{todaysXP} XP</span>
      </div>
    </div>
  )
}
