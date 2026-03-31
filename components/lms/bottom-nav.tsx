'use client'

import { cn } from '@/lib/utils'
import { Home, BookOpen, Users, User, Brain } from 'lucide-react'

export type Tab = 'home' | 'courses' | 'leagues' | 'community' | 'profile' | 'practice'

interface BottomNavProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const tabs = [
    { id: 'home' as Tab, icon: Home, label: 'Home' },
    { id: 'courses' as Tab, icon: BookOpen, label: 'Courses' },
    { id: 'practice' as Tab, icon: Brain, label: 'Practice' },
    { id: 'community' as Tab, icon: Users, label: 'Community' },
    { id: 'profile' as Tab, icon: User, label: 'Profile' },
  ]

  return (
    <nav className="fixed bottom-4 left-4 right-4 z-50">
      <div className="bg-card/90 dark:bg-card/80 backdrop-blur-md rounded-2xl shadow-lg border border-border/50 safe-area-bottom">
        <div className="flex items-center justify-around px-2 py-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            const isPractice = tab.id === 'practice'
            return (
              <button
                key={tab.id}
                id={`nav-${tab.id}`}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  'flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-300',
                  isActive
                    ? isPractice
                      ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-md shadow-violet-500/30'
                      : 'bg-primary text-primary-foreground shadow-md'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                )}
              >
                <tab.icon
                  className={cn(
                    'w-5 h-5 transition-transform duration-300',
                    isActive && 'scale-110'
                  )}
                />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
