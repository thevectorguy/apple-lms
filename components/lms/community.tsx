'use client'

import { useState } from 'react'
import type { User, Discussion, Achievement } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  Heart,
  MessageCircle,
  Share2,
  Send,
  MoreHorizontal,
  Flame,
} from 'lucide-react'

interface CommunityProps {
  user: User
  discussions: Discussion[]
  achievements: Achievement[]
  posts?: CommunityFeedPost[]
}

type CommunityTab = 'feed' | 'achievements' | 'discussions'

export interface CommunityFeedPost {
  id: string
  author: {
    name: string
    avatar: string
    level?: number
  }
  type: 'achievement' | 'discussion' | 'milestone'
  content: string
  badge?: {
    icon: string
    name: string
    description: string
  }
  timestamp: string
  likes: number
  comments: number
  isLiked: boolean
  scoreShare?: {
    gameTitle: string
    courseTitle: string
    score: number
    xpEarned: number
  }
}

export function Community({ user, discussions, achievements, posts = [] }: CommunityProps) {
  const [activeTab, setActiveTab] = useState<CommunityTab>('feed')
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set())

  const tabs = [
    { id: 'feed' as CommunityTab, label: 'Feed' },
    { id: 'achievements' as CommunityTab, label: 'Achievements' },
    { id: 'discussions' as CommunityTab, label: 'Discussions' },
  ]

  // Combine achievements and discussions into feed posts
  const feedPosts: CommunityFeedPost[] = [
    ...posts,
    {
      id: '1',
      author: { name: 'codemaster', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=codemaster' },
      type: 'achievement',
      content: 'Just unlocked the Week Warrior badge! 7 days of consistent learning!',
      badge: { icon: '🔥', name: 'Week Warrior', description: 'Maintain a 7-day streak' },
      timestamp: '739d ago',
      likes: 24,
      comments: 1,
      isLiked: false,
    },
    {
      id: '2',
      author: { name: 'learnerpro', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=learner' },
      type: 'milestone',
      content: 'Just completed the iPhone 16 Pro course! Ready for the certification exam!',
      timestamp: '2h ago',
      likes: 45,
      comments: 8,
      isLiked: true,
    },
    ...discussions.map(d => ({
      id: d.id,
      author: { name: d.author.name, avatar: d.author.avatar, level: d.author.level },
      type: 'discussion' as const,
      content: d.content,
      timestamp: d.timestamp,
      likes: d.likes,
      comments: d.replies,
      isLiked: d.isLiked,
    })),
  ]

  const toggleLike = (postId: string) => {
    setLikedPosts(prev => {
      const next = new Set(prev)
      if (next.has(postId)) {
        next.delete(postId)
      } else {
        next.add(postId)
      }
      return next
    })
  }

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="mb-2">
        <h1 className="text-2xl font-bold">Community</h1>
        <p className="text-muted-foreground">Connect and celebrate with fellow learners</p>
      </div>

      {/* Post Composer */}
      <div className="glass-card rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <img
            src={user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=user'}
            alt={user.name}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Share your learning journey..."
              className="w-full px-4 py-2.5 bg-secondary/50 rounded-full border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <button className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition-colors">
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex-1 py-3 text-center font-medium transition-all relative',
              activeTab === tab.id
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Feed Content */}
      {activeTab === 'feed' && (
        <div className="space-y-4">
          {feedPosts.map((post) => {
            const isLiked = likedPosts.has(post.id) || post.isLiked
            return (
              <div key={post.id} className="glass-card rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <img
                    src={post.author.avatar || "/placeholder.svg"}
                    alt={post.author.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold">{post.author.name}</span>
                        {post.type === 'achievement' && (
                          <span className="text-xs px-2 py-0.5 bg-streak/20 text-streak rounded-full font-medium">
                            Achievement
                          </span>
                        )}
                        {post.type === 'milestone' && post.scoreShare && (
                          <span className="text-xs px-2 py-0.5 bg-primary/15 text-primary rounded-full font-medium">
                            Score Share
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">{post.timestamp}</span>
                      </div>
                      <button className="text-muted-foreground hover:text-foreground p-1">
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                    </div>

                    <p className="mt-2 text-foreground/90">{post.content}</p>

                    {/* Badge Card for Achievement posts */}
                    {post.badge && (
                      <div className="mt-3 bg-secondary/50 rounded-xl p-4 flex items-center gap-4 border border-border">
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-2xl">
                          <Flame className="w-6 h-6 text-streak" />
                        </div>
                        <div>
                          <h4 className="font-bold">{post.badge.name}</h4>
                          <p className="text-sm text-muted-foreground">{post.badge.description}</p>
                        </div>
                      </div>
                    )}

                    {post.scoreShare && (
                      <div className="mt-3 rounded-xl border border-primary/15 bg-primary/5 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/80">
                              {post.scoreShare.gameTitle}
                            </p>
                            <p className="mt-1 text-sm font-semibold">
                              {post.scoreShare.courseTitle}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-black text-primary">{post.scoreShare.score}%</p>
                            <p className="text-xs text-muted-foreground">+{post.scoreShare.xpEarned} XP</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-6 mt-4 pt-3 border-t border-border/50">
                      <button
                        onClick={() => toggleLike(post.id)}
                        className={cn(
                          'flex items-center gap-1.5 transition-colors',
                          isLiked ? 'text-red-500' : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        <Heart className={cn('w-5 h-5', isLiked && 'fill-current')} />
                        <span className="text-sm">{post.likes + (likedPosts.has(post.id) && !post.isLiked ? 1 : 0)}</span>
                      </button>
                      <button className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
                        <MessageCircle className="w-5 h-5" />
                        <span className="text-sm">{post.comments}</span>
                      </button>
                      <button className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground ml-auto">
                        <Share2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Achievements Tab */}
      {activeTab === 'achievements' && (
        <div className="space-y-4">
          {achievements.map((achievement) => (
            <div key={achievement.id} className="glass-card rounded-2xl p-4">
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
                  
                  <div className="mt-3 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/5 rounded-xl p-4 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center text-3xl">
                      {achievement.icon}
                    </div>
                    <div>
                      <h4 className="font-bold">{achievement.title}</h4>
                      <p className="text-sm text-muted-foreground">{achievement.description}</p>
                      <span className="text-xs font-medium text-primary">+{achievement.xp} XP</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-3">
                    <button className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
                      <Heart className="w-4 h-4" />
                      <span className="text-sm">{achievement.likes}</span>
                    </button>
                    <button className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
                      <MessageCircle className="w-4 h-4" />
                      <span className="text-sm">{achievement.comments}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Discussions Tab */}
      {activeTab === 'discussions' && (
        <div className="space-y-4">
          {discussions.map((discussion) => (
            <div key={discussion.id} className="glass-card rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <img
                  src={discussion.author.avatar || "/placeholder.svg"}
                  alt={discussion.author.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{discussion.author.name}</span>
                    <span className="text-xs px-1.5 py-0.5 bg-level/20 text-level rounded-full">
                      LVL {discussion.author.level}
                    </span>
                    <span className="text-xs text-muted-foreground">{discussion.timestamp}</span>
                  </div>
                  
                  <span className="inline-block text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full mt-1">
                    {discussion.topic}
                  </span>
                  
                  <p className="text-sm mt-2">{discussion.content}</p>

                  <div className="flex items-center gap-4 mt-3">
                    <button className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
                      <Heart className="w-4 h-4" />
                      <span className="text-sm">{discussion.likes}</span>
                    </button>
                    <button className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
                      <MessageCircle className="w-4 h-4" />
                      <span className="text-sm">{discussion.replies}</span>
                    </button>
                    <button className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
