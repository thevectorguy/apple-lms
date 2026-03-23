'use client'

import { useState, useEffect } from 'react'
import type { Lesson } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { X, Play, Pause, Volume2, VolumeX, Maximize2, Heart, Share2, Bookmark, CheckCircle2, Sparkles, ArrowRight } from 'lucide-react'

interface LessonViewerProps {
  lesson: Lesson
  onComplete: () => void
  onClose: () => void
}

export function LessonViewer({ lesson, onComplete, onClose }: LessonViewerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [progress, setProgress] = useState(lesson.progress)
  const [isComplete, setIsComplete] = useState(lesson.completed)
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = Math.min(prev + 2, 100)
        if (next >= 100 && !isComplete) {
          setIsComplete(true)
          setIsPlaying(false)
        }
        return next
      })
    }, 200)

    return () => clearInterval(interval)
  }, [isPlaying, isComplete])

  const handleComplete = () => {
    onComplete()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Video Area */}
      <div className="relative flex-1 flex items-center justify-center">
        <img
          src={lesson.thumbnail || "/placeholder.svg"}
          alt={lesson.title}
          className="w-full h-full object-cover"
        />
        
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 z-10 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Instructor Info */}
        <div className="absolute top-4 left-16 right-16 flex items-center gap-3">
          <img
            src={lesson.instructor.avatar || "/placeholder.svg"}
            alt={lesson.instructor.name}
            className="w-10 h-10 rounded-full"
          />
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate flex items-center gap-1">
              {lesson.instructor.name}
              {lesson.instructor.verified && <span className="text-primary text-xs">✓</span>}
            </p>
            <p className="text-white/60 text-xs">{lesson.instructor.role}</p>
          </div>
        </div>

        {/* Play/Pause Button */}
        {!isComplete && (
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className={cn(
              'w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center transition-all',
              isPlaying ? 'opacity-0 hover:opacity-100' : 'opacity-100'
            )}>
              {isPlaying ? (
                <Pause className="w-10 h-10 text-white" />
              ) : (
                <Play className="w-10 h-10 text-white fill-white ml-1" />
              )}
            </div>
          </button>
        )}

        {/* Completion State */}
        {isComplete && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-24 h-24 rounded-full bg-xp/20 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-14 h-14 text-xp" />
            </div>
            <h3 className="text-white text-2xl font-bold mb-2">Lesson Complete!</h3>
            <div className="flex items-center gap-2 bg-xp/20 text-xp px-4 py-2 rounded-full mb-6">
              <Sparkles className="w-5 h-5" />
              <span className="font-bold">+{lesson.xp} XP earned!</span>
            </div>
            <Button
              onClick={handleComplete}
              className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-semibold"
            >
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Right Side Actions */}
        <div className="absolute right-4 bottom-32 flex flex-col items-center gap-6">
          <button
            onClick={() => setLiked(!liked)}
            className="flex flex-col items-center gap-1"
          >
            <Heart
              className={cn(
                'w-8 h-8 transition-all',
                liked ? 'text-primary fill-primary scale-110' : 'text-white'
              )}
            />
            <span className="text-white text-xs">{lesson.likes + (liked ? 1 : 0)}</span>
          </button>
          <button className="flex flex-col items-center gap-1">
            <Share2 className="w-8 h-8 text-white" />
            <span className="text-white text-xs">Share</span>
          </button>
          <button
            onClick={() => setSaved(!saved)}
            className="flex flex-col items-center gap-1"
          >
            <Bookmark
              className={cn(
                'w-8 h-8',
                saved ? 'text-white fill-white' : 'text-white'
              )}
            />
            <span className="text-white text-xs">Save</span>
          </button>
        </div>

        {/* Bottom Content */}
        <div className="absolute bottom-0 left-0 right-0 p-4 pb-24">
          <h2 className="text-white text-xl font-bold mb-2">{lesson.title}</h2>
          <p className="text-white/70 text-sm line-clamp-2">{lesson.description}</p>
        </div>

        {/* Progress Bar */}
        <div className="absolute bottom-20 left-0 right-0 px-4">
          <div className="h-1 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="absolute bottom-4 left-0 right-0 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </button>
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white"
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white text-sm">{lesson.duration}</span>
            <button className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white">
              <Maximize2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
