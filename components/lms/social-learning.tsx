'use client'

import { useState } from 'react'
import type { Trainer, Discussion, PeerChallenge, Achievement } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  Users,
  MessageCircle,
  Swords,
  Share2,
  UserPlus,
  UserCheck,
  Heart,
  MessageSquare,
  Clock,
  Zap,
  Star,
  BadgeCheck,
  ChevronRight,
  Send,
  Trophy,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SocialLearningProps {
  trainers: Trainer[]
  discussions: Discussion[]
  challenges: PeerChallenge[]
  achievements: Achievement[]
}

type SocialTab = 'trainers' | 'discussions' | 'challenges' | 'achievements'

export function SocialLearning({ trainers, discussions, challenges, achievements }: SocialLearningProps) {
  const [activeTab, setActiveTab] = useState<SocialTab>('trainers')
  const [followedTrainers, setFollowedTrainers] = useState<Set<string>>(
    new Set(trainers.filter(t => t.isFollowing).map(t => t.id))
  )
  const [likedDiscussions, setLikedDiscussions] = useState<Set<string>>(
    new Set(discussions.filter(d => d.isLiked).map(d => d.id))
  )
  const [likedAchievements, setLikedAchievements] = useState<Set<string>>(new Set())

  const tabs = [
    { id: 'trainers' as SocialTab, label: 'Trainers', icon: Users },
    { id: 'discussions' as SocialTab, label: 'Discuss', icon: MessageCircle },
    { id: 'challenges' as SocialTab, label: 'Challenges', icon: Swords },
    { id: 'achievements' as SocialTab, label: 'Shared', icon: Share2 },
  ]

  const toggleFollow = (trainerId: string) => {
    setFollowedTrainers(prev => {
      const next = new Set(prev)
      if (next.has(trainerId)) {
        next.delete(trainerId)
      } else {
        next.add(trainerId)
      }
      return next
    })
  }

  const toggleDiscussionLike = (discussionId: string) => {
    setLikedDiscussions(prev => {
      const next = new Set(prev)
      if (next.has(discussionId)) {
        next.delete(discussionId)
      } else {
        next.add(discussionId)
      }
      return next
    })
  }

  const toggleAchievementLike = (achievementId: string) => {
    setLikedAchievements(prev => {
      const next = new Set(prev)
      if (next.has(achievementId)) {
        next.delete(achievementId)
      } else {
        next.add(achievementId)
      }
      return next
    })
  }

  const getDifficultyColor = (difficulty: PeerChallenge['difficulty']) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-xp/20 text-xp'
      case 'medium':
        return 'bg-primary/20 text-primary'
      case 'hard':
        return 'bg-accent/20 text-accent'
    }
  }

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Trainers Tab */}
      {activeTab === 'trainers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">Expert Trainers</h3>
            <span className="text-sm text-muted-foreground">
              Following {followedTrainers.size}
            </span>
          </div>

          <div className="space-y-3">
            {trainers.map((trainer) => {
              const isFollowing = followedTrainers.has(trainer.id)
              return (
                <div
                  key={trainer.id}
                  className="bg-card rounded-2xl p-4 border border-border"
                >
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <img
                        src={trainer.avatar || "/placeholder.svg"}
                        alt={trainer.name}
                        className="w-14 h-14 rounded-full object-cover"
                      />
                      {trainer.verified && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                          <BadgeCheck className="w-3.5 h-3.5 text-primary-foreground" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold truncate">{trainer.name}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">{trainer.role}</p>

                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {trainer.followers.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-primary" />
                          {trainer.rating}
                        </span>
                        <span>{trainer.lessonsCount} lessons</span>
                      </div>

                      <div className="flex gap-1.5 mt-2 flex-wrap">
                        {trainer.specialties.slice(0, 3).map((specialty) => (
                          <span
                            key={specialty}
                            className="text-[10px] px-2 py-0.5 bg-secondary rounded-full"
                          >
                            {specialty}
                          </span>
                        ))}
                      </div>
                    </div>

                    <Button
                      variant={isFollowing ? 'outline' : 'default'}
                      size="sm"
                      className={cn(
                        'rounded-full gap-1.5',
                        isFollowing && 'bg-transparent'
                      )}
                      onClick={() => toggleFollow(trainer.id)}
                    >
                      {isFollowing ? (
                        <>
                          <UserCheck className="w-4 h-4" />
                          Following
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4" />
                          Follow
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Discussions Tab */}
      {activeTab === 'discussions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">Community Discussions</h3>
            <Button size="sm" className="rounded-full gap-1.5">
              <Send className="w-4 h-4" />
              Post
            </Button>
          </div>

          <div className="space-y-3">
            {discussions.map((discussion) => {
              const isLiked = likedDiscussions.has(discussion.id)
              return (
                <div
                  key={discussion.id}
                  className="bg-card rounded-2xl p-4 border border-border"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={discussion.author.avatar || "/placeholder.svg"}
                      alt={discussion.author.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{discussion.author.name}</span>
                        <span className="text-xs px-1.5 py-0.5 bg-level/20 text-level rounded-full">
                          LVL {discussion.author.level}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {discussion.timestamp}
                        </span>
                      </div>

                      <span className="inline-block text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full mt-1">
                        {discussion.topic}
                      </span>

                      <p className="text-sm mt-2 text-foreground/90">
                        {discussion.content}
                      </p>

                      <div className="flex items-center gap-4 mt-3">
                        <button
                          onClick={() => toggleDiscussionLike(discussion.id)}
                          className={cn(
                            'flex items-center gap-1.5 text-sm transition-colors',
                            isLiked ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                          )}
                        >
                          <Heart
                            className={cn('w-4 h-4', isLiked && 'fill-current')}
                          />
                          {discussion.likes + (isLiked && !discussions.find(d => d.id === discussion.id)?.isLiked ? 1 : 0)}
                        </button>
                        <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                          <MessageSquare className="w-4 h-4" />
                          {discussion.replies}
                        </button>
                        <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                          <Share2 className="w-4 h-4" />
                          Share
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Challenges Tab */}
      {activeTab === 'challenges' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">Peer Challenges</h3>
            <Button size="sm" variant="outline" className="rounded-full gap-1.5 bg-transparent">
              <Swords className="w-4 h-4" />
              Create
            </Button>
          </div>

          <div className="space-y-3">
            {challenges.map((challenge) => (
              <div
                key={challenge.id}
                className="bg-card rounded-2xl p-4 border border-border overflow-hidden relative"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full" />

                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn(
                        'text-[10px] px-2 py-0.5 rounded-full font-medium uppercase',
                        getDifficultyColor(challenge.difficulty)
                      )}>
                        {challenge.difficulty}
                      </span>
                      <span className="text-xs text-muted-foreground">{challenge.category}</span>
                    </div>

                    <h4 className="font-semibold">{challenge.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {challenge.description}
                    </p>

                    <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {challenge.deadline}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {challenge.participants} joined
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-3">
                      <img
                        src={challenge.challenger.avatar || "/placeholder.svg"}
                        alt={challenge.challenger.name}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                      <span className="text-xs text-muted-foreground">
                        by {challenge.challenger.name}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-1 bg-xp/20 px-2.5 py-1 rounded-full">
                      <Zap className="w-4 h-4 text-xp" />
                      <span className="text-sm font-bold text-xp">+{challenge.xpReward}</span>
                    </div>
                    <Button size="sm" className="rounded-full">
                      Join Challenge
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shared Achievements Tab */}
      {activeTab === 'achievements' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">Shared Achievements</h3>
            <Button size="sm" variant="outline" className="rounded-full gap-1.5 bg-transparent">
              <Trophy className="w-4 h-4" />
              Share Yours
            </Button>
          </div>

          <div className="space-y-3">
            {achievements.map((achievement) => {
              const isLiked = likedAchievements.has(achievement.id)
              return (
                <div
                  key={achievement.id}
                  className="bg-card rounded-2xl p-4 border border-border"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={achievement.sharedBy.avatar || "/placeholder.svg"}
                      alt={achievement.sharedBy.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{achievement.sharedBy.name}</span>
                        <span className="text-xs text-muted-foreground">{achievement.timestamp}</span>
                      </div>

                      <p className="text-sm text-muted-foreground mt-1">
                        Just earned a new badge!
                      </p>

                      <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-xp/10 rounded-xl p-4 mt-3 flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center text-3xl">
                          {achievement.icon}
                        </div>
                        <div>
                          <h4 className="font-bold">{achievement.title}</h4>
                          <p className="text-sm text-muted-foreground">{achievement.description}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Zap className="w-3 h-3 text-xp" />
                            <span className="text-xs font-medium text-xp">+{achievement.xp} XP</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mt-3">
                        <button
                          onClick={() => toggleAchievementLike(achievement.id)}
                          className={cn(
                            'flex items-center gap-1.5 text-sm transition-colors',
                            isLiked ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                          )}
                        >
                          <Heart
                            className={cn('w-4 h-4', isLiked && 'fill-current')}
                          />
                          {achievement.likes + (isLiked ? 1 : 0)}
                        </button>
                        <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                          <MessageSquare className="w-4 h-4" />
                          {achievement.comments}
                        </button>
                        <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground ml-auto">
                          Congrats!
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
