'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import {
  Bell,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Flame,
  Megaphone,
  Sparkles,
  Target,
  X,
} from 'lucide-react'

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { AppNotification } from '@/lib/types'

type NotificationsPreviewModalProps = {
  notifications: AppNotification[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

type NotificationsAnnouncementPageProps = {
  notifications: AppNotification[]
  userName: string
  userAvatar?: string
}

const toneMap = {
  sky: {
    iconWrap: 'bg-[rgba(237,245,255,0.92)] text-sky-700 dark:bg-[rgba(41,63,94,0.72)] dark:text-sky-100',
    border: 'border-sky-100/80 dark:border-sky-300/10',
    softText: 'text-sky-700 dark:text-sky-100',
  },
  amber: {
    iconWrap: 'bg-[rgba(255,247,234,0.92)] text-amber-700 dark:bg-[rgba(80,58,22,0.72)] dark:text-amber-100',
    border: 'border-amber-100/80 dark:border-amber-300/10',
    softText: 'text-amber-700 dark:text-amber-100',
  },
  violet: {
    iconWrap: 'bg-[rgba(245,242,255,0.92)] text-violet-700 dark:bg-[rgba(63,44,96,0.72)] dark:text-violet-100',
    border: 'border-violet-100/80 dark:border-violet-300/10',
    softText: 'text-violet-700 dark:text-violet-100',
  },
  emerald: {
    iconWrap: 'bg-[rgba(239,251,245,0.92)] text-emerald-700 dark:bg-[rgba(28,69,55,0.72)] dark:text-emerald-100',
    border: 'border-emerald-100/80 dark:border-emerald-300/10',
    softText: 'text-emerald-700 dark:text-emerald-100',
  },
} as const

function getNotificationIcon(category: AppNotification['category']) {
  switch (category) {
    case 'announcement':
      return Megaphone
    case 'course':
      return Bell
    case 'practice':
      return Target
    case 'streak':
      return Flame
    default:
      return Sparkles
  }
}

function getCategoryLabel(category: AppNotification['category']) {
  switch (category) {
    case 'announcement':
      return 'Announcement'
    case 'course':
      return 'Course'
    case 'practice':
      return 'Practice'
    case 'streak':
      return 'Streak'
    default:
      return 'Update'
  }
}

function NotificationCard({
  notification,
  expanded = false,
  compact = false,
}: {
  notification: AppNotification
  expanded?: boolean
  compact?: boolean
}) {
  const Icon = getNotificationIcon(notification.category)
  const tone = toneMap[notification.tone]

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[1.45rem] border bg-[linear-gradient(180deg,rgba(255,255,255,0.92)_0%,rgba(247,249,252,0.84)_100%)] backdrop-blur-[24px] dark:bg-[linear-gradient(180deg,rgba(28,33,43,0.92)_0%,rgba(17,21,30,0.86)_100%)]',
        tone.border,
        compact ? 'p-3.5 shadow-[0_18px_34px_-28px_rgba(15,23,42,0.3)]' : 'p-4 shadow-[0_20px_42px_-30px_rgba(15,23,42,0.24)]',
      )}
    >
      <div className="absolute inset-x-8 top-0 h-px rounded-full bg-white/85 dark:bg-white/10" />
      <div className="flex items-start gap-3.5">
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.95rem]', tone.iconWrap)}>
          <Icon className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                {getCategoryLabel(notification.category)}
              </p>
              <h3 className={cn('mt-1 font-semibold tracking-[-0.035em] text-slate-950 dark:text-white', compact ? 'text-[0.98rem]' : 'text-[1.03rem]')}>
                {notification.title}
              </h3>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {notification.unread && (
                <span className="h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_0_4px_rgba(255,255,255,0.78)] dark:shadow-[0_0_0_4px_rgba(15,23,42,0.5)]" />
              )}
              <span className="text-[11px] font-medium tracking-[-0.02em] text-slate-500 dark:text-slate-400">
                {notification.timeLabel}
              </span>
            </div>
          </div>

          {expanded && (
            <>
              <p className="mt-2.5 text-[0.95rem] leading-6 text-slate-600 dark:text-slate-300">
                {notification.message}
              </p>
              <p className={cn('mt-3 text-[11px] font-semibold uppercase tracking-[0.2em]', tone.softText)}>
                {notification.contextLabel}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export function NotificationsPreviewModal({
  notifications,
  open,
  onOpenChange,
}: NotificationsPreviewModalProps) {
  const unreadNotifications = notifications.filter(notification => notification.unread).slice(0, 3)
  const [expandedNotificationId, setExpandedNotificationId] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setExpandedNotificationId(null)
      return
    }

    setExpandedNotificationId(null)
  }, [open, unreadNotifications])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        overlayClassName="z-[140] bg-[rgba(242,244,247,0.58)] backdrop-blur-md dark:bg-[rgba(2,6,23,0.52)]"
        className="z-[141] w-[calc(100%-1.5rem)] max-w-[22.75rem] gap-0 overflow-hidden rounded-[1.9rem] border border-[rgba(255,255,255,0.88)] bg-[linear-gradient(180deg,rgba(255,255,255,0.99)_0%,rgba(247,249,252,0.98)_100%)] p-0 shadow-[0_34px_90px_-44px_rgba(15,23,42,0.36),0_1px_0_rgba(255,255,255,0.92)_inset] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(31,36,46,0.98)_0%,rgba(18,22,30,0.98)_100%)]"
      >
        <div className="relative overflow-hidden px-4 pb-4 pt-4">
          <div className="absolute -left-10 top-0 h-20 w-20 rounded-full bg-sky-100/90 blur-3xl dark:bg-sky-500/10" />
          <div className="absolute right-0 top-0 h-20 w-20 rounded-full bg-white/90 blur-3xl dark:bg-violet-500/10" />
          <div className="absolute inset-x-10 top-0 h-px rounded-full bg-white/85 dark:bg-white/10" />

          <div className="relative flex items-start justify-between gap-3">
            <DialogHeader className="space-y-1 text-left">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/80 bg-white/60 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.86)] dark:border-white/10 dark:bg-white/8 dark:text-slate-200">
                <Bell className="h-3.5 w-3.5" />
                Notifications
              </div>
              <DialogTitle className="text-[1.36rem] font-semibold tracking-[-0.045em] text-slate-950 dark:text-white">
                {unreadNotifications.length} New messages
              </DialogTitle>
            </DialogHeader>

            <DialogClose asChild>
              <button
                type="button"
                className="ios-icon-button flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-foreground"
                aria-label="Close notifications"
              >
                <X className="h-4 w-4" />
              </button>
            </DialogClose>
          </div>

          <div className="relative mt-4 space-y-2.5">
            {unreadNotifications.length > 0 ? (
              unreadNotifications.map((notification, index) => {
                const isExpanded = expandedNotificationId === notification.id

                return (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => setExpandedNotificationId(current => current === notification.id ? null : notification.id)}
                    className={cn(
                      'block w-full text-left transition-all duration-300',
                      index === 1 && !isExpanded && 'scale-[0.985] opacity-95',
                      index === 2 && !isExpanded && 'scale-[0.97] opacity-90',
                    )}
                  >
                    <div className="relative">
                      <NotificationCard notification={notification} expanded={isExpanded} compact />
                      <span className="pointer-events-none absolute right-4 top-4 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/80 text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.92)] dark:bg-white/8 dark:text-slate-300">
                        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform duration-300', isExpanded && 'rotate-180')} />
                      </span>
                    </div>
                  </button>
                )
              })
            ) : (
              <div className="ios-frost rounded-[1.45rem] p-4 text-sm text-slate-500 dark:text-slate-300">
                You're all caught up.
              </div>
            )}
          </div>

          <div className="relative mt-4 flex justify-end">
            <DialogClose asChild>
              <Link
                href="/notifications"
                className="inline-flex h-9 items-center justify-center gap-1 rounded-full bg-slate-950 px-4 text-sm font-semibold text-white shadow-[0_18px_30px_-20px_rgba(15,23,42,0.78)] transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
              >
                See all
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </DialogClose>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function NotificationsAnnouncementPage({
  notifications,
  userName,
  userAvatar,
}: NotificationsAnnouncementPageProps) {
  const prefersReducedMotion = useReducedMotion()
  const unreadNotifications = notifications.filter(notification => notification.unread)
  const earlierNotifications = notifications.filter(notification => !notification.unread)

  useEffect(() => {
    const stored = window.localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const shouldBeDark = stored === 'dark' || (!stored && prefersDark)

    document.documentElement.classList.toggle('dark', shouldBeDark)
  }, [])

  const reveal = (delay = 0) => (
    prefersReducedMotion
      ? {
          initial: { opacity: 1, y: 0, scale: 1 },
          animate: { opacity: 1, y: 0, scale: 1 },
          transition: { duration: 0 },
        }
      : {
          initial: { opacity: 0, y: 14, scale: 0.99 },
          animate: { opacity: 1, y: 0, scale: 1 },
          transition: { type: 'spring' as const, stiffness: 240, damping: 24, delay },
        }
  )

  return (
    <div className="relative min-h-screen overflow-x-hidden pb-16">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[26rem]">
        <div className="absolute left-[-4rem] top-[-2rem] h-52 w-52 rounded-full bg-sky-100/70 blur-3xl dark:bg-sky-500/10" />
        <div className="absolute right-[-2rem] top-8 h-56 w-56 rounded-full bg-white/95 blur-3xl dark:bg-violet-500/10" />
      </div>

      <div className="relative mx-auto w-full max-w-4xl px-4 pb-8 pt-4">
        <motion.header
          {...reveal(0.04)}
          className="ios-shell relative overflow-hidden rounded-[2rem] px-4 py-3"
        >
          <div className="absolute inset-x-10 top-0 h-px rounded-full bg-white/82 dark:bg-white/10" />
          <div className="relative flex items-center justify-between gap-3">
            <Link
              href="/"
              className="ios-icon-button inline-flex h-11 w-11 items-center justify-center rounded-full text-foreground transition-transform duration-300 hover:-translate-y-0.5"
              aria-label="Back to dashboard"
            >
              <ChevronLeft className="h-[1.05rem] w-[1.05rem]" />
            </Link>

            <div className="min-w-0 flex-1 text-center">
              <h1 className="truncate text-[1.06rem] font-semibold tracking-[-0.035em] text-slate-950 dark:text-white">
                Notifications and Announcements
              </h1>
            </div>

            {userAvatar ? (
              <img
                src={userAvatar}
                alt={userName}
                className="h-11 w-11 rounded-[1rem] object-cover ring-1 ring-white/70 shadow-[0_14px_28px_-18px_rgba(15,23,42,0.35)]"
              />
            ) : (
              <div className="ios-icon-button flex h-11 w-11 items-center justify-center rounded-full text-foreground">
                <Bell className="h-[1.05rem] w-[1.05rem]" />
              </div>
            )}
          </div>
        </motion.header>

        <motion.section {...reveal(0.08)} className="mt-6">
          <div className="mb-3 px-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
              New
            </p>
            <h3 className="mt-1 text-[1.3rem] font-semibold tracking-[-0.05em] text-slate-950 dark:text-white">
              Unread notifications
            </h3>
          </div>

          <div className="space-y-3">
            {unreadNotifications.map(notification => (
              <NotificationCard key={notification.id} notification={notification} expanded />
            ))}
          </div>
        </motion.section>

        <motion.section {...reveal(0.14)} className="mt-6">
          <div className="mb-3 px-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
              Earlier
            </p>
            <h3 className="mt-1 text-[1.3rem] font-semibold tracking-[-0.05em] text-slate-950 dark:text-white">
              History
            </h3>
          </div>

          <div className="space-y-3">
            {earlierNotifications.map(notification => (
              <NotificationCard key={notification.id} notification={notification} expanded />
            ))}
          </div>
        </motion.section>
      </div>
    </div>
  )
}
