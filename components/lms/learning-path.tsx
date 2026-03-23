'use client'

import { useState } from 'react'
import type { LearningPath, Phase } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Lock, CheckCircle2, Play, FileQuestion, ChevronRight, Sparkles } from 'lucide-react'

interface LearningPathProps {
  path: LearningPath
  onStartLesson: (lessonId: string) => void
  onStartAssessment: () => void
}

export function LearningPathComponent({ path, onStartLesson, onStartAssessment }: LearningPathProps) {
  const [expandedPhase, setExpandedPhase] = useState<string | null>(path.phases[0]?.id || null)

  const phaseColors = {
    Discover: 'from-blue-500 to-cyan-400',
    Learn: 'from-primary to-orange-400',
    Practice: 'from-accent to-pink-400',
    Master: 'from-yellow-500 to-amber-400',
  }

  return (
    <div className="space-y-4">
      {/* Path Header */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold">{path.title}</h2>
          <div className="flex items-center gap-1.5 bg-xp/20 text-xp px-3 py-1 rounded-full text-sm font-bold">
            <Sparkles className="w-4 h-4" />
            {path.totalXP} XP
          </div>
        </div>
        <p className="text-muted-foreground text-sm mb-4">{path.description}</p>
        
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-bold">{path.progress}%</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary via-xp to-accent rounded-full transition-all"
              style={{ width: `${path.progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">Estimated time: {path.estimatedTime}</p>
        </div>
      </div>

      {/* Phases */}
      <div className="space-y-3">
        {path.phases.map((phase, index) => (
          <div
            key={phase.id}
            className={cn(
              'rounded-2xl border overflow-hidden transition-all',
              phase.locked
                ? 'bg-muted/30 border-border opacity-60'
                : phase.completed
                ? 'glass-card border-primary/20'
                : 'glass-card'
            )}
          >
            {/* Phase Header */}
            <button
              onClick={() => !phase.locked && setExpandedPhase(expandedPhase === phase.id ? null : phase.id)}
              disabled={phase.locked}
              className="w-full flex items-center gap-4 p-4"
            >
              <div className={cn(
                'w-12 h-12 rounded-full flex items-center justify-center text-2xl',
                phase.locked
                  ? 'bg-muted'
                  : phase.completed
                  ? 'bg-xp/20'
                  : `bg-gradient-to-br ${phaseColors[phase.name as keyof typeof phaseColors] || 'from-primary to-accent'}`
              )}>
                {phase.locked ? (
                  <Lock className="w-5 h-5 text-muted-foreground" />
                ) : phase.completed ? (
                  <CheckCircle2 className="w-6 h-6 text-xp" />
                ) : (
                  phase.icon
                )}
              </div>
              
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold">Phase {index + 1}: {phase.name}</h3>
                  {phase.completed && (
                    <span className="text-xs bg-xp/20 text-xp px-2 py-0.5 rounded-full">Complete</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {phase.lessons.length} lessons
                  {phase.assessment && ' + Assessment'}
                </p>
              </div>
              
              {!phase.locked && (
                <ChevronRight className={cn(
                  'w-5 h-5 text-muted-foreground transition-transform',
                  expandedPhase === phase.id && 'rotate-90'
                )} />
              )}
            </button>

            {/* Expanded Content */}
            {expandedPhase === phase.id && !phase.locked && (
              <div className="px-4 pb-4 space-y-3">
                {phase.lessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl"
                  >
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={lesson.thumbnail || "/placeholder.svg"}
                        alt={lesson.title}
                        className="w-full h-full object-cover"
                      />
                      {lesson.completed ? (
                        <div className="absolute inset-0 bg-xp/80 flex items-center justify-center">
                          <CheckCircle2 className="w-6 h-6 text-white" />
                        </div>
                      ) : (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <Play className="w-6 h-6 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{lesson.title}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{lesson.duration}</span>
                        <span className="text-xp">+{lesson.xp} XP</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={lesson.completed ? 'outline' : 'default'}
                      onClick={() => onStartLesson(lesson.id)}
                      className={cn(
                        !lesson.completed && 'bg-gradient-to-r from-primary to-accent text-white'
                      )}
                    >
                      {lesson.completed ? 'Replay' : 'Start'}
                    </Button>
                  </div>
                ))}

                {phase.assessment && (
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl border border-primary/20">
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                      <FileQuestion className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{phase.assessment.title}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{phase.assessment.questions.length} questions</span>
                        <span className="text-xp">+{phase.assessment.xpReward} XP</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={onStartAssessment}
                      className="bg-gradient-to-r from-primary to-accent text-white"
                    >
                      Take Quiz
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
