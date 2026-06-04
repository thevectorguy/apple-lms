'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Clock3, History, Trophy, X } from 'lucide-react'

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

function renderFocusLabel(label: string) {
  if (label !== 'Plan to Probe') {
    return label
  }

  return (
    <>
      <span className="sm:hidden">Probing</span>
      <span className="hidden sm:inline">Plan to Probe</span>
    </>
  )
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
        className="z-[141] w-[calc(100%-1.5rem)] max-w-[25rem] gap-0 overflow-hidden rounded-[1.9rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(243,246,252,0.98)_100%)] p-0 shadow-[0_36px_90px_-42px_rgba(15,23,42,0.52),inset_0_1px_0_rgba(255,255,255,0.9)] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(18,24,38,0.98)_0%,rgba(10,15,26,0.98)_100%)] dark:shadow-[0_36px_90px_-42px_rgba(2,6,23,0.82),inset_0_1px_0_rgba(255,255,255,0.08)]"
      >
        <div className="relative overflow-hidden px-4 pb-4 pt-4">
          <div className="absolute -left-12 top-0 h-24 w-24 rounded-full bg-sky-200/50 blur-3xl dark:bg-sky-400/12" />
          <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-violet-200/55 blur-3xl dark:bg-violet-400/12" />
          <div className="absolute inset-x-10 top-0 h-px rounded-full bg-white/80 dark:bg-white/10" />

          <div className="relative flex items-start justify-between gap-3">
            <DialogHeader className="space-y-1 text-left">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/70 bg-white/60 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] dark:border-white/10 dark:bg-white/8 dark:text-slate-200">
                <History className="h-3.5 w-3.5" />
                History
              </div>
              <DialogTitle className="text-[1.45rem] font-black tracking-[-0.07em] text-foreground">
                Session history
              </DialogTitle>
              <DialogDescription className="text-sm leading-5 text-slate-600 dark:text-slate-300">
                Open any past Nova session to view its report.
              </DialogDescription>
            </DialogHeader>

            <DialogClose asChild>
              <button
                type="button"
                className="ios-icon-button flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-foreground"
                aria-label="Close history"
              >
                <X className="h-4 w-4" />
              </button>
            </DialogClose>
          </div>

          <div className="relative mt-4 space-y-2.5">
            {visibleSessions.map((session) => (
              <DialogClose key={session.id} asChild>
                <Link
                  href={`/practice-history/${session.id}`}
                  className="block overflow-hidden rounded-[1.4rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.88)_0%,rgba(241,245,255,0.72)_100%)] p-3 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.22)] transition-transform duration-300 hover:-translate-y-0.5 dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(27,35,51,0.88)_0%,rgba(14,20,33,0.82)_100%)]"
                >
                  <div className="flex min-w-0 items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[1rem] font-bold tracking-[-0.04em] text-foreground">
                        {session.scenarioName}
                      </p>
                      <div className="mt-1.5 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock3 className="h-3.5 w-3.5" />
                          {session.completedAt}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        Score
                      </p>
                      <p className="mt-1 text-[1.2rem] font-black tracking-[-0.05em] text-foreground">
                        {session.score}
                      </p>
                    </div>
                  </div>
                </Link>
              </DialogClose>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="relative mt-5">
              <div className="mx-auto flex w-full max-w-[8.5rem] items-center justify-between">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(0, current - 1))}
                  disabled={page === 0}
                  className="inline-flex items-center justify-center py-1 text-slate-950 transition-colors disabled:pointer-events-none disabled:opacity-35 dark:text-white"
                  aria-label="Show newer session history"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <span className="text-[15px] font-semibold tracking-[-0.045em] text-slate-950 dark:text-white">
                  {page + 1}/{totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))}
                  disabled={page === totalPages - 1}
                  className="inline-flex items-center justify-center py-1 text-slate-950 transition-colors disabled:pointer-events-none disabled:opacity-35 dark:text-white"
                  aria-label="Show older session history"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
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

      <div className="relative mx-auto w-full max-w-3xl px-4 pt-4">
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

        <div className="mt-4 overflow-hidden rounded-[2.3rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(242,246,255,0.92)_100%)] p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.96)_0%,rgba(17,24,39,0.96)_100%)]">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/60 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] dark:border-white/10 dark:bg-white/8 dark:text-white/82">
            <Trophy className="h-3.5 w-3.5" />
            Session report
          </div>

          <h1 className="mt-4 text-[2.1rem] font-black leading-[0.95] tracking-[-0.075em] text-slate-950 dark:text-white sm:text-[2.6rem]">
            {session.scenarioName}
          </h1>
          <p className="mt-3 text-[1rem] font-semibold leading-7 tracking-[-0.02em] text-slate-950 dark:text-white">
            {session.report.summary}
          </p>

          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="ios-frost rounded-[1.35rem] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Score</p>
              <p className="mt-2 text-[1.7rem] font-black tracking-[-0.06em] text-foreground">{session.score}</p>
            </div>
            <div className="ios-frost rounded-[1.35rem] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Focus</p>
              <p className="mt-2 text-[1.08rem] font-black tracking-[-0.04em] text-foreground sm:text-[1.16rem]">
                {renderFocusLabel(session.focusLabel)}
              </p>
            </div>
            <div className="ios-frost rounded-[1.35rem] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">XP</p>
              <p className="mt-2 text-[1.08rem] font-black tracking-[-0.04em] text-foreground sm:text-[1.16rem]">+{session.xpEarned}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-4">
          <section className="ios-shell rounded-[2rem] p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-900 dark:text-white">
              Snapshot
            </p>
            <h2 className="mt-2 text-[1.42rem] font-black tracking-[-0.055em] text-slate-950 dark:text-white">
              {session.report.headline}
            </h2>
            <div className="mt-4 flex items-center gap-4 text-sm tracking-[-0.02em] text-slate-950 dark:text-white">
              <span className="font-normal">{session.completedAt}</span>
              <span className="font-semibold">{session.durationLabel}</span>
            </div>
          </section>

          <section className="ios-shell rounded-[2rem] p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-900 dark:text-white">
              What worked
            </p>
            <div className="mt-4 overflow-hidden rounded-[1.45rem] border border-white/70 bg-white/62 shadow-[inset_0_1px_0_rgba(255,255,255,0.84)] dark:border-white/10 dark:bg-white/6">
              {session.report.strengths.map((item) => (
                <div key={item} className="border-b border-slate-200/85 px-4 py-4 last:border-b-0 dark:border-white/10">
                  <p className="text-[1.07rem] font-semibold leading-8 tracking-[-0.03em] text-slate-800 dark:text-white">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="ios-shell rounded-[2rem] p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-900 dark:text-white">
              Next round
            </p>
            <div className="mt-4 overflow-hidden rounded-[1.45rem] border border-white/70 bg-white/62 shadow-[inset_0_1px_0_rgba(255,255,255,0.84)] dark:border-white/10 dark:bg-white/6">
              {session.report.improvements.map((item) => (
                <div key={item} className="border-b border-slate-200/85 px-4 py-4 last:border-b-0 dark:border-white/10">
                  <p className="text-[1.07rem] font-semibold leading-8 tracking-[-0.03em] text-slate-800 dark:text-white">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="ios-shell rounded-[2rem] p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-900 dark:text-white">
              SPEED checklist
            </p>
            <SpeedChecklistSummary stages={session.speedStages} variant="light" embedded className="mt-4" />
          </section>
        </div>
      </div>
    </div>
  )
}
