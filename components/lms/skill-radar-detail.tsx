'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
  Award,
  Brain,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Flame,
  Gamepad2,
  MessageSquare,
  Play,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
  X,
} from 'lucide-react'
import type { SkillCategory, SpeedPracticeMode, SpeedStageKey, UserSkillProfile } from '@/lib/types'
import { cn } from '@/lib/utils'

export type SkillRadarEventType = 'assessment' | 'mini_game' | 'module_completion' | 'ai_practice'

export interface SkillRadarHistoryEntry {
  type: SkillRadarEventType
  skillCategory: SkillCategory
  score: number
  impactWeight?: number
  sourceId?: string
  sourceTitle?: string
  timestamp?: string | number | Date
}

export interface NextStepPlanLike {
  type: 'next_module' | 'ai_practice' | 'recommended_course'
  skillCategory: SkillCategory
  courseId?: string
  moduleId?: string
  title: string
  status?: 'selected' | 'completed'
}

export type SkillRadarProfile = UserSkillProfile & {
  skillGapByCategory?: Partial<Record<SkillCategory, number>>
  competencyHistory?: SkillRadarHistoryEntry[]
  nextStepPlan?: NextStepPlanLike | null
}

interface SkillRadarDetailPanelProps {
  open: boolean
  profile: SkillRadarProfile
  focusSkill: SkillCategory | null
  onClose: () => void
  onFocusSkill: (skill: SkillCategory) => void
}

const SKILL_META: Array<{
  key: SkillCategory
  label: string
  icon: typeof Brain
  tone: string
}> = [
  { key: 'technical', label: 'Technical', icon: Brain, tone: 'from-cyan-500 to-sky-500' },
  { key: 'communication', label: 'Communication', icon: MessageSquare, tone: 'from-fuchsia-500 to-pink-500' },
  { key: 'leadership', label: 'Leadership', icon: Target, tone: 'from-amber-500 to-orange-500' },
  { key: 'compliance', label: 'Compliance', icon: Zap, tone: 'from-emerald-500 to-teal-500' },
]

const SPEED_CHECK_THRESHOLD = 80

const SPEED_META: Array<{
  key: SpeedStageKey
  label: string
  helper: string
  icon: typeof Brain
  tone: string
}> = [
  {
    key: 'start_right',
    label: 'Start Right',
    helper: 'Open with a confident, customer-focused start.',
    icon: Play,
    tone: 'from-violet-500 to-fuchsia-500',
  },
  {
    key: 'plan_to_probe',
    label: 'Plan to Probe',
    helper: 'Ask better questions before you move into the pitch.',
    icon: Search,
    tone: 'from-sky-500 to-cyan-500',
  },
  {
    key: 'explain_value',
    label: 'Explain Value Proposition',
    helper: 'Tie the offer to outcomes the customer actually cares about.',
    icon: MessageSquare,
    tone: 'from-amber-500 to-orange-500',
  },
  {
    key: 'eliminate_objection',
    label: 'Eliminate Objection',
    helper: 'Handle pushback cleanly and keep momentum in the conversation.',
    icon: CheckCircle2,
    tone: 'from-emerald-500 to-teal-500',
  },
  {
    key: 'drive_closure',
    label: 'Drive Closure',
    helper: 'Finish with a clear next step that moves the deal forward.',
    icon: TrendingUp,
    tone: 'from-rose-500 to-pink-500',
  },
]

function getSkillGap(profile: SkillRadarProfile, skill: SkillCategory) {
  const explicitGap = profile.skillGapByCategory?.[skill]
  if (typeof explicitGap === 'number') return explicitGap
  return Math.max(0, 100 - (profile.radarData?.[skill] ?? 0))
}

function formatRelativeTime(value?: string | number | Date) {
  if (!value) return 'recently'
  const time = new Date(value).getTime()
  if (Number.isNaN(time)) return 'recently'
  const diffMs = Date.now() - time
  const diffMinutes = Math.max(1, Math.round(diffMs / 60000))
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.round(diffHours / 24)
  return `${diffDays}d ago`
}

function getEventCopy(type: SkillRadarEventType) {
  switch (type) {
    case 'assessment':
      return { label: 'Assessment', icon: CheckCircle2 }
    case 'mini_game':
      return { label: 'Mini-game', icon: Gamepad2 }
    case 'module_completion':
      return { label: 'Module complete', icon: Award }
    case 'ai_practice':
      return { label: 'AI practice', icon: Sparkles }
  }
}

function getSkillLabel(skill: SkillCategory) {
  return SKILL_META.find(item => item.key === skill)?.label ?? skill
}

function getPracticeModeLabel(mode?: SpeedPracticeMode) {
  switch (mode) {
    case 'pitch':
      return 'Pitch practice'
    case 'roleplay':
      return 'Avatar conversation'
    case 'guided_ai':
      return 'AI coach round'
    default:
      return 'Live practice'
  }
}

function getSpeedFocusAction(stage?: SpeedStageKey) {
  switch (stage) {
    case 'start_right':
      return 'In your next round, lead with the customer need in the first sentence instead of opening with product detail.'
    case 'plan_to_probe':
      return 'In your next round, ask one sharper discovery question before you explain anything.'
    case 'explain_value':
      return 'In your next round, connect one feature directly to a business outcome the buyer would care about.'
    case 'eliminate_objection':
      return 'In your next round, acknowledge the concern first, then answer it with value and proof.'
    case 'drive_closure':
      return 'In your next round, end by naming the exact next step you want the customer to take.'
    default:
      return 'Keep practicing one live conversation at a time and the benchmark will become more balanced.'
  }
}

function getSpeedStageStatus(score: number) {
  if (score >= SPEED_CHECK_THRESHOLD) return 'Strong right now'
  if (score >= 65) return 'Improving with practice'
  return 'Best next place to focus'
}

function getGapActionSteps(skill: SkillCategory, nextPlan?: NextStepPlanLike | null) {
  const firstStep = nextPlan
    ? nextPlan.type === 'ai_practice'
      ? `Start ${nextPlan.title} in AI Coach.`
      : nextPlan.type === 'next_module'
        ? `Open ${nextPlan.title} and finish the next lesson in that module.`
        : `Go to ${nextPlan.title} and complete the first unfinished lesson.`
    : `Open the next ${getSkillLabel(skill).toLowerCase()} activity in your learning path.`

  switch (skill) {
    case 'communication':
      return [
        firstStep,
        'Run one practice round where you explain a product clearly and handle one objection.',
        'Retake the communication checkpoint after reviewing the feedback you missed.',
      ]
    case 'leadership':
      return [
        firstStep,
        'Complete one leadership module focused on coaching, delegation, or decision-making.',
        'Use AI Coach to rehearse a manager-style conversation and then clear the next checkpoint.',
      ]
    case 'compliance':
      return [
        firstStep,
        'Review the policy or ethics examples that tripped you up before moving on.',
        'Finish the compliance checkpoint to prove the gap is actually closing.',
      ]
    case 'technical':
    default:
      return [
        firstStep,
        'Finish one technical lesson and its mini-game so the concept gets reinforced twice.',
        'Clear the next technical checkpoint to lock in the improvement.',
      ]
  }
}

function getNextStepCopy(profile: SkillRadarProfile) {
  const weakestSkill = [...SKILL_META]
    .map(item => ({ key: item.key, gap: getSkillGap(profile, item.key) }))
    .sort((a, b) => b.gap - a.gap)[0]?.key ?? 'technical'
  const weakestSkillLabel = getSkillLabel(weakestSkill)
  const nextPlan = profile.nextStepPlan
  return {
    title: `Build ${weakestSkillLabel}`,
    description: `${weakestSkillLabel} is the biggest gap right now. Use these steps to improve it in the app instead of guessing what to do next.`,
    skill: weakestSkillLabel,
    cta: nextPlan?.status === 'completed' ? 'Recently completed' : 'Recommended now',
    steps: getGapActionSteps(weakestSkill, nextPlan),
  }
}

export function SkillReadinessDetailPanel({
  open,
  profile,
  focusSkill,
  onClose,
  onFocusSkill,
}: SkillRadarDetailPanelProps) {
  const skillMeta = focusSkill ? SKILL_META.find(item => item.key === focusSkill) : null
  const history = profile.competencyHistory ?? []
  const nextStep = getNextStepCopy(profile)
  const gapEntries = SKILL_META.map(item => ({
    ...item,
    gap: getSkillGap(profile, item.key),
    value: profile.radarData?.[item.key] ?? 0,
  })).sort((a, b) => b.gap - a.gap)
  const strongest = gapEntries[gapEntries.length - 1]
  const weakest = gapEntries[0]
  const historyPreview = history.slice(0, 5)
  const speedStages = SPEED_META.map(item => {
    const stage = profile.speedFramework?.stages?.[item.key]
    const score = stage?.score ?? 0
    return {
      ...item,
      score,
      checked: score >= SPEED_CHECK_THRESHOLD,
      updatedAt: stage?.updatedAt,
      sourceTitle: stage?.sourceTitle,
      practiceMode: stage?.practiceMode,
    }
  })
  const speedCheckedCount = speedStages.filter(stage => stage.checked).length
  const speedBenchmarkScore = Math.round(speedStages.reduce((sum, stage) => sum + stage.score, 0) / speedStages.length)
  const speedFocus = [...speedStages].sort((a, b) => a.score - b.score)[0]
  const speedStrongest = [...speedStages].sort((a, b) => b.score - a.score)[0]
  const latestSpeedSignal = [...speedStages]
    .filter(stage => stage.updatedAt)
    .sort((a, b) => new Date(b.updatedAt!).getTime() - new Date(a.updatedAt!).getTime())[0]

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/55 px-3 py-3 backdrop-blur-md sm:items-center sm:px-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className="relative flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[32px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,250,252,0.98)_100%)] shadow-[0_32px_120px_rgba(15,23,42,0.28)] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(16,24,37,0.98)_0%,rgba(12,18,30,0.99)_100%)] dark:shadow-[0_32px_120px_rgba(2,6,23,0.55)]"
            onClick={e => e.stopPropagation()}
          >
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.08),transparent_30%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.08),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.08),transparent_26%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.08),transparent_26%),radial-gradient(circle_at_top_right,rgba(99,102,241,0.08),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(34,197,94,0.06),transparent_24%)]" />

            <div className="relative flex items-center justify-between border-b border-slate-200/80 px-5 py-4 sm:px-6 dark:border-white/10">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
                  Readiness detail
                </p>
                <h2 className="mt-1 text-xl font-black text-slate-950 sm:text-2xl dark:text-white">
                  {skillMeta ? `${skillMeta.label} focus` : 'Learning readiness'}
                </h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  See what is strong, what needs work, and what to practice next.
                </p>
              </div>

              <button
                onClick={onClose}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition-colors hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                aria-label="Close readiness details"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative grid flex-1 gap-4 overflow-y-auto p-4 sm:p-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
              <section className="space-y-4">
                <div className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-white/[0.03] dark:shadow-[0_16px_40px_rgba(2,6,23,0.3)]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
                        Current readiness
                      </p>
                      <h3 className="mt-1 text-2xl font-black text-slate-950 dark:text-white">
                        {profile.readinessScore}/100
                      </h3>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                        A live snapshot of how prepared the learner is across the full competency model.
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-950 px-3 py-2 text-right text-white dark:bg-white/6">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/60">
                        Strongest area
                      </p>
                      <p className="mt-1 text-sm font-bold">
                        {strongest ? `${getSkillLabel(strongest.key)} ${strongest.value}%` : 'Balanced'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                    <div className="flex items-center justify-center rounded-[28px] bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] p-5 dark:bg-[linear-gradient(180deg,rgba(19,31,50,0.92)_0%,rgba(15,24,41,0.92)_100%)]">
                      <div className="relative h-40 w-40">
                        <svg className="h-full w-full -rotate-90">
                          <circle cx="80" cy="80" r="66" fill="none" stroke="currentColor" strokeWidth="10" className="text-slate-200 dark:text-slate-800" />
                          <circle
                            cx="80"
                            cy="80"
                            r="66"
                            fill="none"
                            stroke="url(#readinessDetailGradient)"
                            strokeWidth="10"
                            strokeLinecap="round"
                            strokeDasharray={`${(profile.readinessScore / 100) * 414.69} 414.69`}
                          />
                          <defs>
                            <linearGradient id="readinessDetailGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#8fb1dd" />
                              <stop offset="100%" stopColor="#5f7fb3" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-4xl font-black text-slate-950 dark:text-white">{profile.readinessScore}</div>
                            <div className="mt-1 text-xs font-medium uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                              readiness
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                        <div className="flex items-center gap-2">
                          <Flame className="h-4 w-4 text-orange-500" />
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Largest gap</p>
                        </div>
                        <p className="mt-2 text-xl font-black text-slate-950 dark:text-white">
                          {weakest ? `${getSkillLabel(weakest.key)} ${weakest.gap}%` : 'No gap'}
                        </p>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                          Focused practice here will move the readiness score fastest.
                        </p>
                      </div>

                      <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-primary" />
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Next step</p>
                        </div>
                        <p className="mt-2 text-lg font-black text-slate-950 dark:text-white">{nextStep.title}</p>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{nextStep.description}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                            {nextStep.skill}
                          </span>
                          <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white dark:bg-white/10 dark:text-white">
                            {nextStep.cta}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-white/[0.03] dark:shadow-[0_16px_40px_rgba(2,6,23,0.3)]">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
                        Skill gaps
                      </p>
                      <h3 className="mt-1 text-lg font-black text-slate-950 dark:text-white">Where the gap is widest</h3>
                    </div>
                    <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-white/8 dark:text-slate-300">
                      {profile.weakAreas?.length ?? 0} weak areas
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    {gapEntries.map(item => {
                      const active = focusSkill === item.key
                      return (
                        <button
                          key={item.key}
                          onClick={() => onFocusSkill(item.key)}
                          className={cn(
                            'group flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all',
                            active
                              ? 'border-primary/30 bg-primary/5 shadow-[0_10px_30px_rgba(59,130,246,0.08)]'
                              : 'border-slate-200 bg-slate-50/70 hover:border-slate-300 hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.07]',
                          )}
                        >
                          <div className={cn('flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-sm', item.tone)}>
                            <item.icon className="h-5 w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.label}</span>
                              <span className="text-sm font-black text-slate-950 dark:text-white">{item.value}%</span>
                            </div>
                            <div className="mt-2 h-2 rounded-full bg-slate-200 dark:bg-slate-800">
                              <div
                                className="h-2 rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                                style={{ width: `${item.value}%` }}
                              />
                            </div>
                            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                              Gap: {item.gap}% {active ? 'selected for detail view' : ''}
                            </p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                        </button>
                      )
                    })}
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <div className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-white/[0.03] dark:shadow-[0_16px_40px_rgba(2,6,23,0.3)]">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
                        Recent competency history
                      </p>
                      <h3 className="mt-1 text-lg font-black text-slate-950 dark:text-white">What changed recently</h3>
                    </div>
                    <Clock3 className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                  </div>

                  <div className="mt-4 space-y-3">
                    {historyPreview.length > 0 ? (
                      historyPreview.map(entry => {
                        const event = getEventCopy(entry.type)
                        const EventIcon = event.icon
                        return (
                          <div
                            key={`${entry.sourceId ?? entry.sourceTitle ?? entry.type}-${entry.timestamp ?? entry.score}`}
                            className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]"
                          >
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white dark:bg-white/10">
                              <EventIcon className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{entry.sourceTitle ?? event.label}</p>
                                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{formatRelativeTime(entry.timestamp)}</span>
                              </div>
                              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                                {event.label} in {getSkillLabel(entry.skillCategory)}
                              </p>
                              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                <span className="rounded-full bg-primary/10 px-2.5 py-1 font-semibold text-primary">
                                  {entry.score}% score
                                </span>
                                <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-600 dark:bg-white/8 dark:text-slate-300">
                                  {getSkillLabel(entry.skillCategory)}
                                </span>
                                {typeof entry.impactWeight === 'number' && (
                                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700 dark:bg-emerald-500/12 dark:text-emerald-300">
                                    impact {Math.round(entry.impactWeight * 100)}%
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-400">
                        No competency events yet. The next completed lesson, game, or AI practice session will appear here.
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-[28px] border border-slate-200/80 bg-[linear-gradient(180deg,#f5f7fb_0%,#edf2f8_100%)] p-5 text-slate-950 shadow-[0_20px_50px_rgba(15,23,42,0.1)] dark:border-white/10 dark:bg-[linear-gradient(180deg,#0f172a_0%,#111827_100%)] dark:text-white dark:shadow-[0_20px_50px_rgba(15,23,42,0.18)]">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-white/55">
                      Recommended action
                    </p>
                  </div>
                  <h3 className="mt-3 text-2xl font-black">{nextStep.title}</h3>
                  <p className="mt-2 text-sm text-slate-600 dark:text-white/70">{nextStep.description}</p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-white/10 dark:text-white/80">
                      {nextStep.skill ?? 'Personalized'}
                    </span>
                    <span className="rounded-full bg-emerald-500/12 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300">
                      {profile.strongAreas?.length ?? 0} strong areas
                    </span>
                    <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-white/10 dark:text-white/80">
                      {profile.weakAreas?.length ?? 0} focus areas
                    </span>
                  </div>

                  <div className="mt-5 rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-white/45">Action plan</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white/90">{nextStep.cta}</p>
                      </div>
                      <Sparkles className="h-5 w-5 text-cyan-500 dark:text-cyan-300" />
                    </div>
                    <div className="mt-4 space-y-3">
                      {nextStep.steps.map((step, index) => (
                        <div key={step} className="flex items-start gap-3">
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white dark:bg-white dark:text-slate-950">
                            {index + 1}
                          </div>
                          <p className="text-sm leading-6 text-slate-700 dark:text-white/75">{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              <section className="lg:col-span-2">
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)]">
                  <div className="rounded-[28px] border border-slate-200/80 bg-white p-4 shadow-[0_16px_40px_rgba(15,23,42,0.06)] sm:p-5 dark:border-white/10 dark:bg-white/[0.03] dark:shadow-[0_16px_40px_rgba(2,6,23,0.3)]">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="max-w-2xl">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
                          SPEED progress
                        </p>
                        <h3 className="mt-1 text-xl font-black text-slate-950 sm:text-2xl dark:text-white">Sales conversation stages</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                          Use these five stages to see where your live conversations are already strong and where your next practice round should focus.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 sm:min-w-[220px]">
                        <div className="rounded-2xl bg-slate-950 px-3 py-3 text-white dark:bg-white/6">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/60">Overall</p>
                          <p className="mt-1 text-lg font-black">{speedBenchmarkScore}/100</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-slate-950 dark:border-white/10 dark:bg-white/[0.04] dark:text-white">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Strong now</p>
                          <p className="mt-1 text-lg font-black">{speedCheckedCount}/5</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {speedStages.map(stage => (
                        <div
                          key={stage.key}
                          className={cn(
                            'rounded-[22px] border p-4',
                            stage.checked
                              ? 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-500/25 dark:bg-emerald-500/10'
                              : 'border-slate-200 bg-slate-50/80 dark:border-white/10 dark:bg-white/[0.04]',
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-sm', stage.tone)}>
                              <stage.icon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-3">
                                <h4 className="text-base font-black leading-tight text-slate-950 dark:text-white">{stage.label}</h4>
                                <span className="text-base font-black text-slate-950 dark:text-white">{stage.score}%</span>
                              </div>
                              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                                {getSpeedStageStatus(stage.score)}
                              </p>
                            </div>
                          </div>

                          <div className="mt-3 h-2 rounded-full bg-slate-200 dark:bg-slate-800">
                            <div
                              className={cn(
                                'h-2 rounded-full transition-all duration-500',
                                stage.checked
                                  ? 'bg-gradient-to-r from-emerald-500 to-cyan-500'
                                  : stage.score >= 65
                                    ? 'bg-gradient-to-r from-primary to-accent'
                                    : 'bg-gradient-to-r from-amber-500 to-orange-500',
                              )}
                              style={{ width: `${stage.score}%` }}
                            />
                          </div>

                          <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">{stage.helper}</p>

                          <p className="mt-3 line-clamp-1 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
                            {stage.sourceTitle
                              ? `${getPracticeModeLabel(stage.practiceMode)}: ${stage.sourceTitle}`
                              : 'Build this stage in your next live practice round.'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-[28px] border border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(16,24,37,0.92)_0%,rgba(12,18,30,0.98)_100%)] dark:shadow-[0_16px_40px_rgba(2,6,23,0.3)]">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
                        Conversation snapshot
                      </p>
                      <h4 className="mt-2 text-2xl font-black text-slate-950 dark:text-white">
                        {speedStrongest?.label ?? 'Keep practicing'}
                      </h4>
                      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                        This is the stage that feels strongest right now. Keep it steady while you bring the weaker stages up.
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white dark:bg-white/10 dark:text-white">
                          {speedBenchmarkScore}/100 overall
                        </span>
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/12 dark:text-emerald-300">
                          {speedCheckedCount}/5 strong
                        </span>
                      </div>
                    </div>

                    <div className="rounded-[28px] border border-slate-200/80 bg-slate-950 p-5 text-white shadow-[0_20px_50px_rgba(15,23,42,0.14)] dark:border-white/10 dark:bg-white/5 dark:shadow-[0_20px_50px_rgba(2,6,23,0.3)]">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/55">
                        Next SPEED focus
                      </p>
                      <h4 className="mt-2 text-2xl font-black">{speedFocus?.label ?? 'Keep practicing'}</h4>
                      <p className="mt-2 text-sm leading-7 text-white/72">
                        {speedFocus?.helper ?? 'The next live practice round will start filling the benchmark.'}
                      </p>
                      <p className="mt-3 text-sm leading-7 text-white/68">
                        {getSpeedFocusAction(speedFocus?.key)}
                      </p>
                      <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
                        <p className="text-xs uppercase tracking-[0.22em] text-white/45">Recent practice</p>
                        <p className="mt-2 text-sm font-semibold text-white/90">
                          {latestSpeedSignal?.sourceTitle ?? 'No practice-linked SPEED updates yet.'}
                        </p>
                        <p className="mt-1 text-xs text-white/60">
                          {latestSpeedSignal?.updatedAt
                            ? `${getPracticeModeLabel(latestSpeedSignal.practiceMode)} • ${formatRelativeTime(latestSpeedSignal.updatedAt)}`
                            : 'Finish a pitch practice or avatar round to start building these stages.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
