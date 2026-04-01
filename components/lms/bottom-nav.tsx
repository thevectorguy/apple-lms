'use client'

import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
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
    <nav className="fixed bottom-4 left-4 right-4 z-50 safe-area-bottom">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 26, delay: 0.28 }}
        className="ios-shell rounded-[2rem] px-3 pt-1 pb-[calc(0.3rem+env(safe-area-inset-bottom))]"
      >
        <div className="absolute inset-x-10 top-0 h-px rounded-full bg-white/65 dark:bg-white/20" />
        <div className="grid grid-cols-5 gap-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <motion.button
                key={tab.id}
                id={`nav-${tab.id}`}
                onClick={() => onTabChange(tab.id)}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.96 }}
                className={cn(
                  'group flex flex-col items-center gap-[2px] rounded-[1.25rem] px-2 py-[3px] text-[10px] font-medium leading-none transition-all duration-300',
                  isActive
                    ? 'ios-frost text-foreground shadow-[0_16px_30px_-22px_rgba(15,23,42,0.3)] dark:text-white'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300',
                    isActive
                      ? 'bg-white/70 text-slate-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:bg-slate-900/78 dark:text-white dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
                      : 'bg-transparent text-current group-hover:bg-white/40 dark:group-hover:bg-slate-900/60',
                  )}
                >
                  <tab.icon
                    className={cn(
                      'h-[1.18rem] w-[1.18rem] transition-transform duration-300',
                      isActive && 'scale-105'
                    )}
                    strokeWidth={2.15}
                  />
                </div>
                <span className={cn('leading-none transition-colors duration-300', isActive ? 'text-foreground dark:text-white' : 'text-muted-foreground')}>
                  {tab.label}
                </span>
              </motion.button>
            )
          })}
        </div>
      </motion.div>
    </nav>
  )
}
