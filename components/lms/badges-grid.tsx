'use client'

import { useState } from 'react'
import type { Badge } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Lock, X } from 'lucide-react'

interface BadgesGridProps {
  badges: Badge[]
}

export function BadgesGrid({ badges }: BadgesGridProps) {
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null)

  const earnedBadges = badges.filter((b) => !b.locked)
  const lockedBadges = badges.filter((b) => b.locked)

  return (
    <>
      <div className="space-y-6">
        {/* Earned Badges */}
        <div>
          <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
            <span className="text-2xl">✨</span>
            Earned ({earnedBadges.length})
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {earnedBadges.map((badge) => (
              <button
                key={badge.id}
                onClick={() => setSelectedBadge(badge)}
                className="flex flex-col items-center p-4 glass-card rounded-2xl hover:scale-105 transition-transform"
              >
                <span className="text-4xl mb-2">{badge.icon}</span>
                <span className="text-xs font-medium text-center leading-tight">{badge.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Locked Badges */}
        <div>
          <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
            <Lock className="w-5 h-5 text-muted-foreground" />
            Locked ({lockedBadges.length})
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {lockedBadges.map((badge) => (
              <button
                key={badge.id}
                onClick={() => setSelectedBadge(badge)}
                className="flex flex-col items-center p-4 bg-muted/50 rounded-2xl border border-border hover:bg-muted transition-colors"
              >
                <div className="relative">
                  <span className="text-4xl mb-2 opacity-30 grayscale">{badge.icon}</span>
                  <Lock className="w-4 h-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-muted-foreground" />
                </div>
                <span className="text-xs font-medium text-center leading-tight text-muted-foreground">{badge.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Badge Detail Modal */}
      {selectedBadge && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="glass-card rounded-3xl max-w-sm w-full p-6 relative">
            <button
              onClick={() => setSelectedBadge(null)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className={cn(
                'w-24 h-24 rounded-full flex items-center justify-center mb-4',
                selectedBadge.locked
                  ? 'bg-muted'
                  : 'bg-gradient-to-br from-primary/30 to-accent/30'
              )}>
                <span className={cn(
                  'text-5xl',
                  selectedBadge.locked && 'opacity-30 grayscale'
                )}>
                  {selectedBadge.icon}
                </span>
              </div>

              <h3 className="text-xl font-bold mb-1">{selectedBadge.name}</h3>
              <p className="text-muted-foreground text-sm mb-4">{selectedBadge.description}</p>

              {selectedBadge.locked ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Lock className="w-4 h-4" />
                  <span className="text-sm">Keep learning to unlock!</span>
                </div>
              ) : (
                <div className="text-sm text-xp font-medium">
                  Earned on {new Date(selectedBadge.earnedAt!).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
