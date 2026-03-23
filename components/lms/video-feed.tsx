'use client'

import { useState } from 'react'
import type { Lesson } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Heart, MessageCircle, Share2, Bookmark, Play, Lock, CheckCircle2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface VideoFeedProps {
  lessons: Lesson[]
  onStartLesson: (lesson: Lesson) => void
}

export function VideoFeed({ lessons, onStartLesson }: VideoFeedProps) {
  const [likedLessons, setLikedLessons] = useState<Set<string>>(new Set())
  const [savedLessons, setSavedLessons] = useState<Set<string>>(new Set())

  const toggleLike = (lessonId: string) => {
    setLikedLessons((prev) => {
      const next = new Set(prev)
      if (next.has(lessonId)) {
        next.delete(lessonId)
      } else {
        next.add(lessonId)
      }
      return next
    })
  }

  const toggleSave = (lessonId: string) => {
    setSavedLessons((prev) => {
      const next = new Set(prev)
      if (next.has(lessonId)) {
        next.delete(lessonId)
      } else {
        next.add(lessonId)
      }
      return next
    })
  }

  const phaseColors = {
    discover: 'from-blue-500 to-cyan-400',
    learn: 'from-primary to-orange-400',
    practice: 'from-accent to-pink-400',
    master: 'from-yellow-500 to-amber-400',
  }

  const phaseIcons = {
    discover: '🧠',
    learn: '🎯',
    practice: '⚡',
    master: '🏆',
  }

  return (
    <div className="space-y-4 pb-20">
      {lessons.map((lesson) => (
        <div
          key={lesson.id}
          className="bg-card rounded-2xl overflow-hidden border border-border"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <img
                src={lesson.instructor.avatar || "/placeholder.svg"}
                alt={lesson.instructor.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <p className="font-medium text-sm flex items-center gap-1">
                  {lesson.instructor.name}
                  {lesson.instructor.verified && (
                    <span className="text-primary">✓</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">{lesson.instructor.role}</p>
              </div>
            </div>
            <div className={cn(
              'px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r text-white',
              phaseColors[lesson.phase]
            )}>
              {phaseIcons[lesson.phase]} {lesson.phase.charAt(0).toUpperCase() + lesson.phase.slice(1)}
            </div>
          </div>

          {/* Video Thumbnail */}
          <div className="relative aspect-[4/5] bg-secondary">
            <img
              src={lesson.thumbnail || "/placeholder.svg"}
              alt={lesson.title}
              className={cn(
                'w-full h-full object-cover',
                lesson.locked && 'opacity-50 blur-sm'
              )}
            />
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
            
            {/* Locked State */}
            {lesson.locked ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center mb-3">
                  <Lock className="w-8 h-8 text-white" />
                </div>
                <p className="text-white font-medium">Complete previous modules</p>
                <p className="text-white/60 text-sm">to unlock this content</p>
              </div>
            ) : lesson.completed ? (
              <div className="absolute top-4 right-4">
                <div className="flex items-center gap-1.5 bg-xp/90 text-white px-3 py-1.5 rounded-full text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  Completed
                </div>
              </div>
            ) : (
              <button
                onClick={() => onStartLesson(lesson)}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:scale-110 transition-transform">
                  <Play className="w-10 h-10 text-white fill-white" />
                </div>
              </button>
            )}

            {/* Progress Bar */}
            {lesson.progress > 0 && lesson.progress < 100 && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${lesson.progress}%` }}
                />
              </div>
            )}

            {/* Duration & XP */}
            <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
              <div>
                <h3 className="text-white font-bold text-lg leading-tight">{lesson.title}</h3>
                <p className="text-white/70 text-sm mt-1 line-clamp-2">{lesson.description}</p>
              </div>
            </div>

            {/* XP Badge */}
            <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-black/50 text-white px-3 py-1.5 rounded-full text-sm font-medium">
              <Sparkles className="w-4 h-4 text-xp" />
              +{lesson.xp} XP
            </div>

            {/* Duration */}
            <div className="absolute bottom-4 right-4 bg-black/50 text-white px-2 py-1 rounded text-xs font-medium">
              {lesson.duration}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => toggleLike(lesson.id)}
                className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
              >
                <Heart
                  className={cn(
                    'w-6 h-6 transition-all',
                    likedLessons.has(lesson.id) && 'fill-primary text-primary scale-110'
                  )}
                />
                <span className="text-sm font-medium">
                  {lesson.likes + (likedLessons.has(lesson.id) ? 1 : 0)}
                </span>
              </button>
              <button className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
                <MessageCircle className="w-6 h-6" />
                <span className="text-sm font-medium">{lesson.comments}</span>
              </button>
              <button className="text-muted-foreground hover:text-foreground transition-colors">
                <Share2 className="w-6 h-6" />
              </button>
            </div>
            <button
              onClick={() => toggleSave(lesson.id)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Bookmark
                className={cn(
                  'w-6 h-6',
                  savedLessons.has(lesson.id) && 'fill-foreground'
                )}
              />
            </button>
          </div>

          {/* Start Button */}
          {!lesson.locked && !lesson.completed && (
            <div className="px-4 pb-4">
              <Button
                onClick={() => onStartLesson(lesson)}
                className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-semibold"
              >
                {lesson.progress > 0 ? 'Continue Learning' : 'Start Lesson'}
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
