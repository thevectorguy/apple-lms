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
        <div
          className="relative overflow-hidden rounded-[2rem] p-5"
          style={{
            background: 'rgba(255,255,255,0.82)',
            backdropFilter: 'blur(32px) saturate(160%)',
            WebkitBackdropFilter: 'blur(32px) saturate(160%)',
            boxShadow: '0 24px 56px -24px rgba(51,65,85,0.22), inset 0 1px 0 rgba(255,255,255,0.95)',
          }}
        >
          {/* Very subtle ambient orbs — barely visible */}
          <div className="pointer-events-none absolute -left-8 top-0 h-28 w-28 rounded-full bg-sky-200/30 blur-[48px]" />
          <div className="pointer-events-none absolute right-0 top-4 h-24 w-24 rounded-full bg-indigo-200/22 blur-[40px]" />
          <div className="pointer-events-none absolute bottom-0 left-1/3 h-20 w-20 rounded-full bg-slate-200/25 blur-[32px]" />

          <div className="relative">
            {/* Card header */}
            <div className="mb-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Profile signal</p>
              <h3 className="text-2xl font-extrabold tracking-tight text-slate-900">Sales Readiness</h3>
            </div>

            <div className="flex items-start gap-4">
              <button
                type="button"
                onClick={() => openDetail()}
                className="relative mt-1 flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-full transition-transform duration-300 hover:scale-[1.02]"
                style={{ background: 'rgba(226,232,240,0.5)', backdropFilter: 'blur(12px)', boxShadow: '0 8px 24px -10px rgba(13,148,136,0.4), inset 0 1px 0 rgba(255,255,255,0.75)' }}
                aria-label="Open readiness details"
              >
                <svg className="h-full w-full -rotate-90">
                  <circle cx="48" cy="48" r="42" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="8" />
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
                      <stop offset="0%" stopColor="#059669" />
                      <stop offset="100%" stopColor="#0d9488" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center leading-none">
                    <span className="text-4xl font-extrabold tracking-tight text-slate-900">{readinessScore}</span>
                    <span className="mt-1.5 block text-[9px] font-bold uppercase tracking-wider text-slate-400">READY</span>
                  </div>
                </div>
              </button>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => openDetail()}
                    className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold text-slate-900 transition-colors" style={{ background: 'rgba(255,255,255,0.50)', backdropFilter: 'blur(10px)' }}
                  >
                    View details
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {skillLabels.map((skill) => {
                    const value = radarData[skill.key]
                    const isWeak = weakAreas.includes(skill.key)
                    return (
                      <button
                        key={skill.key}
                        type="button"
                        onClick={() => handleSkillClick(skill.key)}
                        className="w-full rounded-[1.3rem] px-4 py-3 text-left transition-all duration-300 hover:-translate-y-0.5"
                        style={{
                          background: isWeak ? 'rgba(255,241,242,0.9)' : 'rgba(248,250,252,0.9)',
                          border: isWeak ? '1px solid rgba(253,164,175,0.4)' : '1px solid rgba(226,232,240,0.8)',
                          boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
                        }}
                      >
                        <div className="flex flex-col">
                          <div className="flex items-start gap-2">
                            <div className={cn('mt-1.5 h-2 w-2 flex-shrink-0 rounded-full', isWeak ? 'bg-rose-500' : 'bg-emerald-500')} />
                            <span className="text-[14px] font-semibold tracking-tight leading-tight text-slate-800">
                              {skill.label}
                            </span>
                          </div>
                          <div className="mt-4 flex flex-row items-end justify-between gap-2">
                            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">
                              {isWeak ? 'Focus area' : 'On track'}
                            </p>
                            <span className="text-2xl font-extrabold tracking-tight text-slate-900 leading-none">
                              {value}<span className="text-[11px] font-medium text-slate-400 ml-0.5">%</span>
                            </span>
                          </div>
                        </div>
                        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,0.45)' }}>
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${value}%`,
                              background: isWeak
                                ? 'linear-gradient(90deg, #fb7185, #f97316)'
                                : 'linear-gradient(90deg, #34d399, #0d9488)',
                            }}
                          />
                        </div>
                      </button>
                    )
                  })}
                </div>
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
