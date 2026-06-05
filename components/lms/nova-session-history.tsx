'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Sparkles, TrendingUp, X } from 'lucide-react'

import { SpeedChecklistSummary } from '@/components/lms/speed-checklist-summary'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { PracticeSessionHistoryEntry } from '@/lib/types'

type NovaSessionHistoryModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  sessions: PracticeSessionHistoryEntry[]
}

type NovaSessionReportPageProps = {
  session: PracticeSessionHistoryEntry
}

function formatSessionTimestamp(completedAt: string) {
  if (completedAt.startsWith('Today')) return 'Today'
  if (completedAt.startsWith('Yesterday')) return 'Yesterday'

  return completedAt.split(',')[0] ?? completedAt
}

export function NovaSessionHistoryModal({
  open,
  onOpenChange,
  sessions,
}: NovaSessionHistoryModalProps) {
  const sessionsPerPage = 4
  const [page, setPage] = useState(0)
  const totalPages = Math.max(1, Math.ceil(sessions.length / sessionsPerPage))
  const visibleSessions = useMemo(
    () => sessions.slice(page * sessionsPerPage, (page + 1) * sessionsPerPage),
    [page, sessions],
  )

  useEffect(() => {
    if (open) {
      setPage(0)
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        overlayClassName="z-[140]"
        className="z-[141] w-[calc(100%-1.5rem)] max-w-[31rem] gap-0 overflow-hidden rounded-[2.15rem] border border-white/80 bg-[linear-gradient(180deg,rgba(248,251,255,0.98)_0%,rgba(236,242,250,0.98)_100%)] p-0 shadow-[0_36px_90px_-42px_rgba(15,23,42,0.42),inset_0_1px_0_rgba(255,255,255,0.9)] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(18,24,38,0.98)_0%,rgba(10,15,26,0.98)_100%)] dark:shadow-[0_36px_90px_-42px_rgba(2,6,23,0.82),inset_0_1px_0_rgba(255,255,255,0.08)]"
      >
        <div className="relative overflow-hidden px-5 pb-5 pt-5">
          <div className="absolute left-5 top-0 h-16 w-40 rounded-b-[2rem] bg-white/35 blur-2xl dark:bg-white/5" />
          <div className="absolute -left-8 top-0 h-28 w-28 rounded-full bg-sky-200/60 blur-3xl dark:bg-sky-400/12" />
          <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-emerald-100/70 blur-3xl dark:bg-emerald-400/10" />
          <div className="absolute inset-x-12 top-0 h-px rounded-full bg-white/80 dark:bg-white/10" />

          <DialogHeader className="sr-only">
            <DialogTitle>Session history</DialogTitle>
            <DialogDescription>Open any past Nova session to view its report.</DialogDescription>
          </DialogHeader>

          <div className="relative flex items-start justify-between gap-3 pr-12">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-slate-500 dark:text-slate-400">
                Recent Sessions
              </p>
            </div>

            <DialogClose asChild>
              <button
                type="button"
                className="ios-icon-button absolute right-0 top-0 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-foreground"
                aria-label="Close history"
              >
                <X className="h-4 w-4" />
              </button>
            </DialogClose>
          </div>

          <div className="relative mt-5 space-y-3.5">
            {visibleSessions.map((session) => (
              <DialogClose key={session.id} asChild>
                <Link
                  href={`/practice-history/${session.id}`}
                  className="group block overflow-hidden rounded-[2rem] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.95)_0%,rgba(249,250,252,0.92)_100%)] px-4 py-4 shadow-[0_20px_45px_-30px_rgba(15,23,42,0.26)] transition-transform duration-300 hover:-translate-y-0.5 dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(27,35,51,0.88)_0%,rgba(14,20,33,0.82)_100%)]"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.35rem] bg-slate-950 text-[2rem] font-black tracking-[-0.06em] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] dark:bg-slate-50 dark:text-slate-950">
                      {session.score}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[1.05rem] font-black tracking-[-0.045em] text-foreground">
                        {session.scenarioName}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm">
                        <span className="font-semibold text-sky-700 dark:text-sky-300">
                          +{session.xpEarned} XP
                        </span>
                        <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                        <span className="text-slate-500 dark:text-slate-400">
                          {formatSessionTimestamp(session.completedAt)}
                        </span>
                      </div>
                    </div>

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition-transform duration-300 group-hover:-translate-y-0.5 dark:bg-white/10 dark:text-slate-100">
                      <TrendingUp className="h-4.5 w-4.5" />
                    </div>
                  </div>
                </Link>
              </DialogClose>
            ))}
          </div>

          <div className="relative mt-4 flex items-center justify-center gap-3">
            {totalPages > 1 ? (
              <div className="flex items-center gap-6">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(0, current - 1))}
                  disabled={page === 0}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/65 text-slate-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] transition-colors disabled:pointer-events-none disabled:opacity-35 dark:bg-white/8 dark:text-white"
                  aria-label="Show newer session history"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <span className="text-sm font-bold tracking-[-0.03em] text-slate-900 dark:text-white">
                  {page + 1}/{totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))}
                  disabled={page === totalPages - 1}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/65 text-slate-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] transition-colors disabled:pointer-events-none disabled:opacity-35 dark:bg-white/8 dark:text-white"
                  aria-label="Show older session history"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function NovaSessionReportPage({ session }: NovaSessionReportPageProps) {
  const router = useRouter()

  useEffect(() => {
    const stored = window.localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const shouldBeDark = stored === 'dark' || (!stored && prefersDark)

    document.documentElement.classList.toggle('dark', shouldBeDark)
  }, [])

  return (
    <div className="relative min-h-screen overflow-x-hidden pb-12">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[28rem]">
        <div className="absolute left-[-4rem] top-[-2rem] h-56 w-56 rounded-full bg-sky-300/28 blur-3xl dark:bg-sky-500/12" />
        <div className="absolute right-[-3rem] top-8 h-60 w-60 rounded-full bg-violet-200/62 blur-3xl dark:bg-violet-500/12" />
      </div>

      <div className="relative mx-auto w-full max-w-2xl px-4 pt-4">
        <button
          type="button"
          onClick={() => {
            if (window.history.length > 1) {
              router.back()
              return
            }

            router.push('/')
          }}
          className="ios-icon-button inline-flex h-11 w-11 items-center justify-center rounded-full text-foreground"
          aria-label="Back"
        >
          <ChevronLeft className="h-[1.05rem] w-[1.05rem]" />
        </button>

        <div className="mt-4 overflow-hidden rounded-[32px] border border-white/75 bg-[radial-gradient(circle_at_top,rgba(125,211,252,0.18),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(247,249,252,0.98)_100%)] p-5 text-slate-950 shadow-[0_30px_120px_rgba(15,23,42,0.18)] sm:p-6">
          <div className="text-center">
            <div className="mx-auto flex h-18 w-18 items-center justify-center rounded-full bg-[linear-gradient(180deg,#22c55e_0%,#10b981_100%)] text-white shadow-[0_18px_40px_rgba(16,185,129,0.24)]">
              <Sparkles className="h-8 w-8" />
            </div>
            <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Session report</p>
            <h1 className="mt-2 text-[2rem] font-black tracking-[-0.045em] text-slate-950 sm:text-[2.2rem]">
              {session.scenarioName}
            </h1>
            <p className="mt-2 text-[15px] font-medium leading-6 text-slate-600">
              {session.report.summary}
            </p>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="rounded-[24px] border border-slate-200/80 bg-white/82 p-4 text-center shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
              <div className="text-[2rem] font-black tracking-[-0.05em] text-slate-950">{session.durationLabel}</div>
              <div className="mt-1 text-[11px] font-semibold text-slate-500">Duration</div>
            </div>
            <div className="rounded-[24px] border border-slate-200/80 bg-white/82 p-4 text-center shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
              <div className="text-[2rem] font-black tracking-[-0.05em] text-amber-500">{session.score}%</div>
              <div className="mt-1 text-[11px] font-semibold text-slate-500">Score</div>
            </div>
            <div className="rounded-[24px] border border-slate-200/80 bg-white/82 p-4 text-center shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
              <div className="text-[2rem] font-black tracking-[-0.05em] text-cyan-500">+{session.xpEarned}</div>
              <div className="mt-1 text-[11px] font-semibold text-slate-500">XP</div>
            </div>
          </div>

          <SpeedChecklistSummary stages={session.speedStages} variant="light" className="mt-5" />

          <div className="mt-5 space-y-3">
            <div className="rounded-[26px] border border-emerald-200/90 bg-[linear-gradient(180deg,rgba(240,253,250,0.96)_0%,rgba(220,252,231,0.96)_100%)] p-5 shadow-[0_16px_40px_rgba(16,185,129,0.08)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">Strengths</p>
              <ul className="mt-4 space-y-3 text-[15px] font-medium leading-6 text-slate-700">
                {session.report.strengths.map(item => <li key={item}>- {item}</li>)}
              </ul>
            </div>
            <div className="rounded-[26px] border border-amber-200/90 bg-[linear-gradient(180deg,rgba(255,251,235,0.96)_0%,rgba(254,249,195,0.9)_100%)] p-5 shadow-[0_16px_40px_rgba(245,158,11,0.08)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700">Focus next</p>
              <ul className="mt-4 space-y-3 text-[15px] font-medium leading-6 text-slate-700">
                {session.report.improvements.map(item => <li key={item}>- {item}</li>)}
              </ul>
              <p className="mt-4 border-t border-amber-200/80 pt-3 text-[13px] font-medium leading-5 text-slate-500">
                Visit the Profile section to see your updated SPEED scores.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
