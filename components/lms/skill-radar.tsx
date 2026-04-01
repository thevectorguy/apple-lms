'use client'

import { useState } from 'react'
import type { SkillCategory, SpeedStageKey } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Brain, CheckCircle2, ChevronRight, MessageSquare, Play, Search, Sparkles, Target, TrendingUp, Zap } from 'lucide-react'
import {
  SkillReadinessDetailPanel,
  type SkillRadarProfile,
} from './skill-radar-detail'

interface SkillRadarProps {
  profile: SkillRadarProfile
  compact?: boolean
  onOpenDetail?: (skill: SkillCategory) => void
  onSkillSelect?: (skill: SkillCategory) => void
}

const skillLabels = [
  { key: 'communication' as SkillCategory, label: 'Communication', icon: MessageSquare, position: 'top', tone: 'from-fuchsia-500 to-pink-500' },
  { key: 'technical' as SkillCategory, label: 'Technical', icon: Brain, position: 'right', tone: 'from-cyan-500 to-sky-500' },
  { key: 'leadership' as SkillCategory, label: 'Leadership', icon: Target, position: 'bottom', tone: 'from-amber-500 to-orange-500' },
  { key: 'compliance' as SkillCategory, label: 'Compliance', icon: Zap, position: 'left', tone: 'from-emerald-500 to-teal-500' },
] as const

const speedStageLabels = [
  { key: 'start_right' as SpeedStageKey, label: 'Start Right', icon: Play, tone: 'from-violet-500 to-fuchsia-500' },
  { key: 'plan_to_probe' as SpeedStageKey, label: 'Plan to Probe', icon: Search, tone: 'from-sky-500 to-cyan-500' },
  { key: 'explain_value' as SpeedStageKey, label: 'Explain Value', icon: MessageSquare, tone: 'from-amber-500 to-orange-500' },
  { key: 'eliminate_objection' as SpeedStageKey, label: 'Eliminate Objection', icon: CheckCircle2, tone: 'from-emerald-500 to-teal-500' },
  { key: 'drive_closure' as SpeedStageKey, label: 'Drive Closure', icon: TrendingUp, tone: 'from-rose-500 to-pink-500' },
] as const

function getSkillGap(profile: SkillRadarProfile, skill: SkillCategory) {
  const explicitGap = profile.skillGapByCategory?.[skill]
  if (typeof explicitGap === 'number') return explicitGap
  return Math.max(0, 100 - (profile.radarData?.[skill] ?? 0))
}

function getSkillLabel(skill: SkillCategory) {
  return skill === 'communication'
    ? 'Communication'
    : skill === 'technical'
      ? 'Technical'
      : skill === 'leadership'
        ? 'Leadership'
        : 'Compliance'
}

function getWeakestSkill(profile: SkillRadarProfile) {
  return [...skillLabels]
    .map(item => ({ ...item, gap: getSkillGap(profile, item.key), value: profile.radarData?.[item.key] ?? 0 }))
    .sort((a, b) => b.gap - a.gap)[0]?.key ?? 'technical'
}

function getNextStepCopy(profile: SkillRadarProfile) {
  const plan = profile.nextStepPlan
  if (plan) {
    const action =
      plan.type === 'ai_practice'
        ? 'Practice with AI Coach'
        : plan.type === 'next_module'
          ? 'Continue to Next Module'
          : 'Open Recommended Course'

    return {
      title: action,
      description: plan.title,
      badge: plan.status === 'completed' ? 'Completed' : 'Ready now',
      skill: plan.skillCategory,
    }
  }

  if (profile.recommendations?.length) {
    return {
      title: 'Recommended next step',
      description: profile.recommendations[0],
      badge: 'Personalized',
      skill: null,
    }
  }

  return {
    title: 'Recommended next step',
    description: 'Keep learning to unlock the next competency bump.',
    badge: 'Personalized',
    skill: null,
  }
}

export function SkillRadar({ profile, compact = false, onOpenDetail, onSkillSelect }: SkillRadarProps) {
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailSkill, setDetailSkill] = useState<SkillCategory | null>(null)

  const radarData = profile.radarData
  const readinessScore = profile.readinessScore
  const weakAreas = profile.weakAreas ?? []
  const strongAreas = profile.strongAreas ?? []
  const nextStep = getNextStepCopy(profile)
  const weakestSkill = getWeakestSkill(profile)
  const speedCheckedCount = Object.values(profile.speedFramework.stages).filter(stage => stage.score >= 80).length
  const speedStages = speedStageLabels.map(stage => ({
    ...stage,
    value: profile.speedFramework.stages[stage.key]?.score ?? 0,
  }))

  const openDetail = (skill: SkillCategory = weakestSkill) => {
    setDetailSkill(skill)
    setDetailOpen(true)
    onOpenDetail?.(skill)
    onSkillSelect?.(skill)
  }

  const handleSkillClick = (skill: SkillCategory) => {
    setDetailSkill(skill)
    setDetailOpen(true)
    onOpenDetail?.(skill)
    onSkillSelect?.(skill)
  }

  const centerX = 100
  const centerY = 100
  const maxRadius = 70

  const angles = {
    communication: -90,
    technical: 0,
    leadership: 90,
    compliance: 180,
  }

  const getPoint = (skill: keyof typeof radarData, radius: number) => {
    const angle = (angles[skill] * Math.PI) / 180
    const value = (radarData[skill] / 100) * radius
    const x = centerX + value * Math.cos(angle)
    const y = centerY + value * Math.sin(angle)
    return { x, y }
  }

  const radarPoints = Object.keys(radarData)
    .map((skill) => {
      const point = getPoint(skill as keyof typeof radarData, maxRadius)
      return `${point.x},${point.y}`
    })
    .join(' ')

  const gridLevels = [25, 50, 75, 100]

  const detailPanel = (
    <SkillReadinessDetailPanel
      open={detailOpen}
      profile={profile}
      focusSkill={detailSkill}
      onClose={() => setDetailOpen(false)}
      onFocusSkill={(skill: SkillCategory) => {
        setDetailSkill(skill)
        onSkillSelect?.(skill)
      }}
    />
  )

  if (compact) {
    return (
      <>
        <div className="ios-shell relative overflow-hidden rounded-[2rem] p-5">
          <div className="pointer-events-none absolute inset-x-10 top-0 h-px rounded-full bg-white/70 dark:bg-white/18" />
          <div className="pointer-events-none absolute -left-8 top-0 h-24 w-24 rounded-full bg-sky-200/30 blur-3xl dark:bg-sky-500/12" />
          <div className="pointer-events-none absolute right-0 top-8 h-24 w-24 rounded-full bg-indigo-200/25 blur-3xl dark:bg-indigo-500/10" />
          <div className="pointer-events-none absolute bottom-0 left-1/3 h-20 w-20 rounded-full bg-cyan-200/20 blur-3xl dark:bg-cyan-400/8" />
          <div className="relative flex items-start gap-4">
            <button
              type="button"
              onClick={() => openDetail()}
              className="ios-frost relative mt-1 flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-full transition-transform duration-300 hover:scale-[1.02]"
              aria-label="Open readiness details"
            >
              <svg className="h-full w-full -rotate-90">
                <circle cx="48" cy="48" r="42" fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-200/90 dark:text-slate-700" />
                <circle
                  cx="48"
                  cy="48"
                  r="42"
                  fill="none"
                  stroke="url(#readinessGradientCompact)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${(readinessScore / 100) * 263.9} 263.9`}
                />
                <defs>
                  <linearGradient id="readinessGradientCompact" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#8cc0ff" />
                    <stop offset="100%" stopColor="#4f78f2" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center leading-none">
                  <span className="text-[2rem] font-semibold tracking-[-0.04em] text-slate-950 dark:text-white">{readinessScore}</span>
                  <span className="mt-1 block text-[9px] font-medium tracking-[0.18em] text-slate-500 dark:text-slate-400">READINESS</span>
                </div>
              </div>
            </button>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Sales readiness</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Your strongest lift points for this week.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => openDetail()}
                  className="inline-flex items-center gap-1 rounded-full bg-white/60 px-3 py-1 text-xs font-semibold text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition-colors hover:text-primary/80 dark:bg-slate-900/76 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                >
                  View details
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {skillLabels.map((skill) => {
                  const value = radarData[skill.key]
                  const isWeak = weakAreas.includes(skill.key)
                  const trackClass = isWeak
                    ? 'bg-rose-200/90 dark:bg-rose-950/30'
                    : 'bg-slate-200/90 dark:bg-slate-800/90'
                  const fillClass = isWeak
                    ? 'bg-[linear-gradient(90deg,rgba(251,113,133,0.95)_0%,rgba(251,146,60,0.95)_100%)]'
                    : 'bg-[linear-gradient(90deg,rgba(142,197,255,0.95)_0%,rgba(88,122,255,0.92)_100%)]'
                  return (
                    <button
                      key={skill.key}
                      type="button"
                      onClick={() => handleSkillClick(skill.key)}
                      className={cn(
                        'ios-frost w-full rounded-[1.45rem] px-4 py-3.5 text-left transition-all duration-300 hover:-translate-y-0.5',
                        isWeak
                          ? 'border-rose-200/80 bg-rose-50/75 dark:border-rose-900/30 dark:bg-rose-950/16'
                          : 'border-white/70 bg-white/45 dark:border-white/8 dark:bg-slate-950/52',
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2.5">
                            <div className={cn('h-2.5 w-2.5 rounded-full', isWeak ? 'bg-rose-400' : 'bg-sky-400')} />
                            <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{skill.label}</span>
                          </div>
                          <p className="mt-1 text-[11px] font-semibold tracking-[0.12em] text-slate-500 dark:text-slate-400">
                            {isWeak ? 'Focus area' : 'On track'}
                          </p>
                        </div>
                        <span className="rounded-full bg-white/65 px-2.5 py-1 text-xs font-semibold text-slate-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] dark:bg-slate-900/72 dark:text-slate-200 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                          {value}%
                        </span>
                      </div>
                      <div className={cn('mt-3 h-1.5 overflow-hidden rounded-full', trackClass)}>
                        <div
                          className={cn('h-full rounded-full shadow-[0_12px_24px_-16px_rgba(59,130,246,0.65)]', fillClass)}
                          style={{ width: `${value}%` }}
                        />
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {detailPanel}
      </>
    )
  }

  return (
    <>
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <button
            type="button"
            onClick={() => openDetail(weakestSkill)}
            className="group rounded-2xl border border-slate-200/80 bg-white p-4 text-left shadow-[0_16px_40px_rgba(15,23,42,0.06)] transition-transform hover:-translate-y-0.5 dark:border-cyan-950/60 dark:bg-[linear-gradient(180deg,rgba(12,24,42,0.98)_0%,rgba(14,28,48,0.98)_100%)] dark:shadow-[0_16px_40px_rgba(2,6,23,0.36)]"
            aria-label="Open skill readiness details"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
                  Skill gap radar
                </p>
                <h3 className="mt-1 text-lg font-black text-slate-950">Readiness snapshot</h3>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400 transition-transform group-hover:translate-x-0.5" />
            </div>

            <div className="relative mx-auto aspect-square w-full max-w-[260px]">
              <svg viewBox="0 0 200 200" className="h-full w-full">
                {gridLevels.map((level) => {
                  const radius = (level / 100) * maxRadius
                  return (
                    <polygon
                      key={level}
                      points={Object.keys(angles)
                        .map((skill) => {
                          const angle = (angles[skill as keyof typeof angles] * Math.PI) / 180
                          const x = centerX + radius * Math.cos(angle)
                          const y = centerY + radius * Math.sin(angle)
                          return `${x},${y}`
                        })
                        .join(' ')}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                  className="text-slate-200 dark:text-slate-800"
                    />
                  )
                })}

                {Object.values(angles).map((angle, i) => {
                  const rad = (angle * Math.PI) / 180
                  const x2 = centerX + maxRadius * Math.cos(rad)
                  const y2 = centerY + maxRadius * Math.sin(rad)
                  return (
                    <line
                      key={i}
                      x1={centerX}
                      y1={centerY}
                      x2={x2}
                      y2={y2}
                      stroke="currentColor"
                      strokeWidth="1"
                      className="text-slate-200 dark:text-slate-800"
                    />
                  )
                })}

	                <polygon
	                  points={radarPoints}
	                  fill="color-mix(in oklab, var(--primary) 16%, transparent)"
	                  stroke="var(--primary)"
	                  strokeWidth="2.2"
	                />

                {Object.keys(radarData).map((skill) => {
                  const point = getPoint(skill as keyof typeof radarData, maxRadius)
                  return (
	                    <circle
	                      key={skill}
	                      cx={point.x}
	                      cy={point.y}
	                      r="4"
	                      fill="var(--primary)"
	                    />
	                  )
	                })}
              </svg>

              {skillLabels.map(({ key, label, position }) => (
                <div
                  key={key}
                  className={cn(
                    'absolute text-[11px] font-semibold text-slate-500 dark:text-slate-400',
                    position === 'top' && 'left-1/2 top-0 -translate-x-1/2 -translate-y-2',
                    position === 'right' && 'right-0 top-1/2 translate-x-2 -translate-y-1/2',
                    position === 'bottom' && 'bottom-0 left-1/2 translate-y-2 -translate-x-1/2',
                    position === 'left' && 'left-0 top-1/2 -translate-x-2 -translate-y-1/2',
                  )}
                >
                  {label}
                </div>
              ))}
            </div>
          </button>

          <button
            type="button"
            onClick={() => openDetail(weakestSkill)}
            className="group rounded-2xl border border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-4 text-left shadow-[0_16px_40px_rgba(15,23,42,0.06)] transition-transform hover:-translate-y-0.5 dark:border-cyan-950/60 dark:bg-[linear-gradient(180deg,rgba(16,29,49,0.98)_0%,rgba(12,23,40,0.98)_100%)] dark:shadow-[0_16px_40px_rgba(2,6,23,0.36)]"
            aria-label="Open readiness details"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
                  Readiness score
                </p>
                <h3 className="mt-1 text-lg font-black text-slate-950">Current learning fit</h3>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400 transition-transform group-hover:translate-x-0.5" />
            </div>

            <div className="mt-5 flex items-center gap-4">
              <div className="relative h-32 w-32 flex-shrink-0">
                <svg className="h-full w-full -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-slate-200 dark:text-slate-800"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    fill="none"
                    stroke="url(#scoreGradient)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${(readinessScore / 100) * 351.86} 351.86`}
                  />
                  <defs>
	                    <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
	                      <stop offset="0%" stopColor="#38bdf8" />
	                      <stop offset="100%" stopColor="#8b5cf6" />
	                    </linearGradient>
	                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <span className="block text-4xl font-black text-slate-950">{readinessScore}</span>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">/100</span>
                  </div>
                </div>
              </div>

              <div className="min-w-0 flex-1 space-y-3">
                <div className="rounded-2xl bg-slate-950 p-4 text-white dark:bg-[linear-gradient(180deg,#123250_0%,#0f2238_100%)]">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-white/55">
                    Largest gap
                  </p>
                  <p className="mt-1 text-lg font-black">{getSkillLabel(weakestSkill)}</p>
                  <p className="mt-1 text-sm text-white/70">
                    Focused practice here will lift your profile fastest.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-900/70">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <p className="text-sm font-semibold text-slate-900">{nextStep.title}</p>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{nextStep.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {nextStep.skill && (
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                        {nextStep.skill}
                      </span>
                    )}
                      <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white dark:bg-cyan-950/70">
                        {nextStep.badge}
                      </span>
                  </div>
                </div>
              </div>
            </div>
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_16px_40px_rgba(15,23,42,0.06)] dark:border-cyan-950/60 dark:bg-[linear-gradient(180deg,rgba(13,24,42,0.98)_0%,rgba(16,30,50,0.98)_100%)] dark:shadow-[0_16px_40px_rgba(2,6,23,0.36)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
                Skill breakdown
              </p>
              <h3 className="mt-1 text-lg font-black text-slate-950">Tap a skill to open the detail view</h3>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-900/70 dark:text-slate-200">
              {weakAreas.length} focus areas
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {skillLabels.map(({ key, label, icon: Icon, tone }) => {
              const value = radarData[key]
              const gap = getSkillGap(profile, key)
              const isWeak = weakAreas.includes(key)
              const isStrong = strongAreas.includes(key)

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleSkillClick(key)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all',
                    isWeak
                          ? 'border-rose-200 bg-rose-50/70 hover:bg-rose-50 dark:border-rose-900/50 dark:bg-rose-950/25 dark:hover:bg-rose-950/35'
                          : 'border-slate-200 bg-slate-50/70 hover:border-slate-300 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900/70 dark:hover:border-cyan-900/60 dark:hover:bg-slate-900/85',
                  )}
                >
                  <div className={cn('flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-sm', tone)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-slate-900">{label}</span>
                      <span
                        className={cn(
                          'text-sm font-black',
                          isStrong ? 'text-emerald-600' : isWeak ? 'text-rose-600' : 'text-slate-900',
                        )}
                      >
                        {value}%
                      </span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-slate-200 dark:bg-slate-800">
                      <div
                        className={cn(
                          'h-2 rounded-full bg-gradient-to-r transition-all duration-500',
                          isWeak ? 'from-rose-500 to-orange-500' : 'from-primary to-accent',
                        )}
                        style={{ width: `${value}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-slate-500">Gap: {gap}%</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </button>
              )
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_16px_40px_rgba(15,23,42,0.06)] dark:border-cyan-950/60 dark:bg-[linear-gradient(180deg,rgba(13,24,42,0.98)_0%,rgba(16,30,50,0.98)_100%)] dark:shadow-[0_16px_40px_rgba(2,6,23,0.36)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
                SPEED stages
              </p>
              <h3 className="mt-1 text-lg font-black text-slate-950">Live sales conversation breakdown</h3>
            </div>
            <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/12 dark:text-emerald-300">
              {speedCheckedCount}/5 checked
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {speedStages.map(({ key, label, icon: Icon, tone, value }) => {
              const checked = value >= 80

              return (
                <div
                  key={key}
                  className={cn(
                    'flex items-center gap-3 rounded-2xl border px-4 py-3',
                    checked
                      ? 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-500/25 dark:bg-emerald-500/10'
                      : 'border-slate-200 bg-slate-50/70 dark:border-white/10 dark:bg-slate-900/70',
                  )}
                >
                  <div className={cn('flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-sm', tone)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{label}</span>
                      <span className={cn('text-sm font-black', checked ? 'text-emerald-600 dark:text-emerald-300' : 'text-slate-900 dark:text-white')}>
                        {value}%
                      </span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-slate-200 dark:bg-slate-800">
                      <div
                        className={cn(
                          'h-2 rounded-full bg-gradient-to-r transition-all duration-500',
                          checked ? 'from-emerald-500 to-cyan-500' : 'from-primary to-accent',
                        )}
                        style={{ width: `${value}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      {checked ? 'At benchmark in live practice' : `${Math.max(0, 80 - value)}% to benchmark`}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {detailPanel}
    </>
  )
}
