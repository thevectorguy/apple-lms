'use client'

import { useState } from 'react'
import type { Story } from '@/lib/types'
import { cn } from '@/lib/utils'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

interface StoryCirclesProps {
  stories: Story[]
}

export function StoryCircles({ stories }: StoryCirclesProps) {
  const [activeStory, setActiveStory] = useState<Story | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const openStory = (story: Story, index: number) => {
    setActiveStory(story)
    setActiveIndex(index)
  }

  const closeStory = () => {
    setActiveStory(null)
  }

  const nextStory = () => {
    if (activeIndex < stories.length - 1) {
      setActiveIndex(activeIndex + 1)
      setActiveStory(stories[activeIndex + 1])
    } else {
      closeStory()
    }
  }

  const prevStory = () => {
    if (activeIndex > 0) {
      setActiveIndex(activeIndex - 1)
      setActiveStory(stories[activeIndex - 1])
    }
  }

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {stories.map((story, index) => (
          <button
            key={story.id}
            onClick={() => openStory(story, index)}
            className="flex flex-col items-center gap-1.5 flex-shrink-0"
          >
            <div
              className={cn(
                'p-[2px] rounded-full',
                story.viewed
                  ? 'bg-muted'
                  : 'bg-gradient-to-tr from-primary via-chart-1 to-accent'
              )}
            >
              <div className="p-[2px] rounded-full bg-background">
                <img
                  src={story.instructor.avatar || "/placeholder.svg"}
                  alt={story.instructor.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
              </div>
            </div>
            <span className="text-xs text-muted-foreground truncate w-16 text-center">
              {story.instructor.name}
            </span>
            {story.isNew && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full" />
            )}
          </button>
        ))}
      </div>

      {activeStory && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
          <button
            onClick={closeStory}
            className="absolute top-4 right-4 z-10 p-2 text-white/80 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>

          <button
            onClick={prevStory}
            className={cn(
              'absolute left-4 z-10 p-2 text-white/80 hover:text-white',
              activeIndex === 0 && 'opacity-30 pointer-events-none'
            )}
          >
            <ChevronLeft className="w-8 h-8" />
          </button>

          <button
            onClick={nextStory}
            className="absolute right-4 z-10 p-2 text-white/80 hover:text-white"
          >
            <ChevronRight className="w-8 h-8" />
          </button>

          <div className="absolute top-4 left-4 right-16 flex gap-1">
            {stories.map((_, idx) => (
              <div
                key={idx}
                className={cn(
                  'h-0.5 flex-1 rounded-full',
                  idx <= activeIndex ? 'bg-white' : 'bg-white/30'
                )}
              />
            ))}
          </div>

          <div className="absolute top-10 left-4 flex items-center gap-3">
            <img
              src={activeStory.instructor.avatar || "/placeholder.svg"}
              alt={activeStory.instructor.name}
              className="w-10 h-10 rounded-full"
            />
            <div>
              <p className="text-white font-medium text-sm flex items-center gap-1">
                {activeStory.instructor.name}
                {activeStory.instructor.verified && (
                  <span className="text-primary text-xs">✓</span>
                )}
              </p>
              <p className="text-white/60 text-xs">{activeStory.title}</p>
            </div>
          </div>

          <div className="relative w-full max-w-sm aspect-[9/16]">
            <img
              src={activeStory.thumbnail || "/placeholder.svg"}
              alt={activeStory.title}
              className="w-full h-full object-cover rounded-lg"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 rounded-lg" />
            <div className="absolute bottom-8 left-4 right-4">
              <h3 className="text-white text-xl font-bold">{activeStory.title}</h3>
              <p className="text-white/80 text-sm mt-1">Tap to continue learning</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
