'use client'

import type { User } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Flame, Sparkles, Trophy, ChevronRight, Medal } from 'lucide-react'

interface ProfileHeaderProps {
  user: User
  compact?: boolean
}

export function ProfileHeader({ user, compact = false }: ProfileHeaderProps) {
  const xpProgress = (user.xp / user.xpToNextLevel) * 100

  if (compact) {
    return (
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={user.avatar || "/placeholder.svg"}
              alt={user.name}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-level text-[10px] font-bold text-white rounded-full flex items-center justify-center">
              {user.level}
            </div>
          </div>
          <div>
            <p className="font-semibold text-sm">{user.name.split(' ')[0]}</p>
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-0.5 text-primary">
                <Flame className="w-3 h-3" />
                {user.streak}
              </span>
              <span className="flex items-center gap-0.5 text-xp">
                <Sparkles className="w-3 h-3" />
                {user.xp.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-gradient-to-r from-accent/20 to-primary/20 px-3 py-1.5 rounded-full border border-accent/30">
            <Medal className="w-4 h-4 text-accent" />
            <span className="text-sm font-bold text-accent">Rank #{user.rank}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-start gap-4">
        <div className="relative">
          <img
            src={user.avatar || "/placeholder.svg"}
            alt={user.name}
            className="w-20 h-20 rounded-full object-cover ring-4 ring-primary/30"
          />
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-level text-white text-sm font-bold px-3 py-0.5 rounded-full">
            LVL {user.level}
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold truncate">{user.name}</h2>
          
          {/* Stats Row */}
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1.5 bg-primary/20 px-2.5 py-1 rounded-full">
              <Flame className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-primary">{user.streak}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-xp/20 px-2.5 py-1 rounded-full">
              <Sparkles className="w-4 h-4 text-xp" />
              <span className="text-sm font-bold text-xp">{user.xp.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-accent/20 px-2.5 py-1 rounded-full">
              <Trophy className="w-4 h-4 text-accent" />
              <span className="text-sm font-bold text-accent">#{user.rank}</span>
            </div>
          </div>

          {/* XP Progress */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">Level {user.level}</span>
              <span className="text-muted-foreground">Level {user.level + 1}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-xp rounded-full transition-all"
                style={{ width: `${xpProgress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {user.xpToNextLevel - user.xp} XP to next level
            </p>
          </div>
        </div>
      </div>

      {/* Badges Preview */}
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Badges Earned</p>
          <button className="flex items-center gap-1 text-xs text-primary">
            View all <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        <div className="flex gap-2 mt-2">
          {user.badges.filter(b => !b.locked).slice(0, 5).map((badge) => (
            <div
              key={badge.id}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-lg"
              title={badge.name}
            >
              {badge.icon}
            </div>
          ))}
          {user.badges.filter(b => !b.locked).length > 5 && (
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
              +{user.badges.filter(b => !b.locked).length - 5}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
