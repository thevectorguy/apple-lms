'use client'

import { useEffect, useState } from 'react'
import { Chakra_Petch, Russo_One } from 'next/font/google'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  Check,
  ChevronRight,
  Clock3,
  Crown,
  Gamepad2,
  Gem,
  Medal,
  Play,
  Shield,
  Sparkles,
  Target,
  Trophy,
  X,
  Zap,
  type LucideIcon,
} from 'lucide-react'

import {
  buildLeagueJourneyState,
  type CourseProgressSnapshot,
  type LeagueRequirementProgress,
  type LeagueTheme,
  type LeagueTierState,
} from '@/lib/league-system'
import type { Course, League, User, UserSkillProfile } from '@/lib/types'
import { cn } from '@/lib/utils'

const leagueDisplay = Russo_One({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-league-display',
})

const leagueBody = Chakra_Petch({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-league-body',
})

const LEAGUE_ICONS: Record<League, LucideIcon> = {
  bronze: Shield,
  silver: Medal,
  gold: Trophy,
  diamond: Gem,
  champion: Crown,
}

const METRIC_ICONS: Record<string, LucideIcon> = {
  xp: Zap,
  readiness: Sparkles,
  videos: Play,
  assessments: Check,
  miniGames: Gamepad2,
  focusMinutes: Clock3,
  speedChecks: Target,
}

const PATH_LAYOUT = [
  { left: 14, top: 74 },
  { left: 34, top: 54 },
  { left: 60, top: 62 },
  { left: 48, top: 30 },
  { left: 78, top: 16 },
]

const PATH_WIDTH = 320
const PATH_HEIGHT = 260

const ATMOSPHERE_PARTICLES = [
  { left: '8%', top: '20%', size: 10, delay: 0 },
  { left: '22%', top: '70%', size: 12, delay: 0.35 },
  { left: '46%', top: '18%', size: 11, delay: 0.7 },
  { left: '68%', top: '60%', size: 13, delay: 1.05 },
  { left: '84%', top: '24%', size: 10, delay: 1.4 },
]

function toSvgX(percent: number) {
  return (percent / 100) * PATH_WIDTH
}

function toSvgY(percent: number) {
  return (percent / 100) * PATH_HEIGHT
}

function buildPathSegment(index: number) {
  const current = PATH_LAYOUT[index]
  const next = PATH_LAYOUT[index + 1]
  const startX = toSvgX(current.left)
  const startY = toSvgY(current.top)
  const endX = toSvgX(next.left)
  const endY = toSvgY(next.top)
  const midY = (startY + endY) / 2

  return `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`
}

function getFriendlyRequirementLabel(requirement: LeagueRequirementProgress) {
  switch (requirement.key) {
    case 'videos':
      return 'Lessons finished'
    case 'assessments':
      return 'Quizzes passed'
    case 'miniGames':
      return 'Mini-games won'
    case 'focusMinutes':
      return 'Focus time'
    case 'speedChecks':
      return 'Live practice wins'
    default:
      return requirement.label
  }
}

function getRequirementAction(requirement: LeagueRequirementProgress) {
  const remaining = Math.max(requirement.target - requirement.value, 0)

  switch (requirement.key) {
    case 'xp':
      return {
        title: `Earn ${remaining.toLocaleString()} more XP`,
        description: 'Lessons, quizzes, mini-games, and practice rounds all push this up.',
      }
    case 'readiness':
      return {
        title: `Lift readiness by ${remaining} points`,
        description: 'Cleaner scores across learning and practice will move this fastest.',
      }
    case 'videos':
      return {
        title: `Finish ${remaining} more lesson${remaining === 1 ? '' : 's'}`,
        description: 'A few more completed learning sessions keep the climb moving.',
      }
    case 'assessments':
      return {
        title: `Pass ${remaining} more quiz${remaining === 1 ? '' : 'zes'}`,
        description: 'Checkpoint wins prove the knowledge is sticking.',
      }
    case 'miniGames':
      return {
        title: `Win ${remaining} more mini-game${remaining === 1 ? '' : 's'}`,
        description: 'Fast recall rounds help show confidence under pressure.',
      }
    case 'focusMinutes':
      return {
        title: `Add ${remaining} more focus minute${remaining === 1 ? '' : 's'}`,
        description: 'Time spent in real learning and practice still counts toward promotion.',
      }
    case 'speedChecks':
      return {
        title: `Land ${remaining} more live-practice win${remaining === 1 ? '' : 's'}`,
        description: 'Strong roleplay performance is one of the clearest signals on the board.',
      }
    default:
      return {
        title: requirement.label,
        description: requirement.description,
      }
  }
}

function getTierStatusLabel(tier: LeagueTierState, nextLeague?: League) {
  if (tier.current) return 'You are here'
  if (tier.completed) return 'Cleared'
  if (nextLeague === tier.league) return 'Next up'
  return 'Locked'
}

function getHeroCopy(currentTier: LeagueTierState, nextTier: LeagueTierState | null) {
  if (!nextTier) {
    return `You have reached the top league. Keep the streak alive, keep practicing, and hold the crown.`
  }

  return `You are in ${currentTier.name} League right now. ${nextTier.name} is next, and the smartest climb is to close the few progress gaps still left on the board.`
}

function getProgressCopy(nextTier: LeagueTierState | null) {
  if (!nextTier) {
    return 'Everything is unlocked. The ladder is complete.'
  }

  return `${nextTier.name} is ${nextTier.progress}% within reach. These are the moves that matter most right now.`
}

function getTopFocusItems(nextTier: LeagueTierState | null, count = 3) {
  if (!nextTier) return []

  return [...nextTier.requirements]
    .filter(requirement => !requirement.met)
    .sort((left, right) => left.progress - right.progress)
    .slice(0, count)
}

function LeagueAtmosphere({
  theme,
  reduceMotion,
}: {
  theme: LeagueTheme
  reduceMotion: boolean
}) {
  return (
    <>
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `${theme.ambience}, ${theme.texture}, ${theme.haze}`,
        }}
      />
      <motion.div
        aria-hidden
        className="absolute -left-20 top-8 h-44 w-44 rounded-full blur-3xl"
        style={{ background: theme.accentSoft }}
        animate={reduceMotion ? undefined : { x: [0, 12, -4, 0], y: [0, -12, 10, 0], scale: [1, 1.08, 0.96, 1] }}
        transition={reduceMotion ? undefined : { duration: 14, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden
        className="absolute right-0 top-10 h-52 w-52 rounded-full blur-3xl"
        style={{ background: `${theme.highlight}2b` }}
        animate={reduceMotion ? undefined : { x: [0, -10, 6, 0], y: [0, 12, -8, 0], scale: [0.96, 1.06, 1, 0.96] }}
        transition={reduceMotion ? undefined : { duration: 16, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut', delay: 0.7 }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-36"
        style={{
          backgroundImage: theme.landscape,
          clipPath: 'polygon(0 74%, 14% 60%, 26% 68%, 40% 48%, 56% 66%, 72% 38%, 86% 54%, 100% 36%, 100% 100%, 0 100%)',
        }}
      />
      {ATMOSPHERE_PARTICLES.map((particle, index) => (
        <motion.div
          key={`${particle.left}-${particle.top}`}
          aria-hidden
          className="absolute rounded-full border border-white/20 bg-white/10 backdrop-blur-sm"
          style={{
            left: particle.left,
            top: particle.top,
            width: particle.size,
            height: particle.size,
          }}
          animate={reduceMotion ? undefined : { y: [0, -12, 0], opacity: [0.2, 0.7, 0.2], scale: [1, 1.16, 1] }}
          transition={reduceMotion ? undefined : { duration: 6 + index, repeat: Infinity, ease: 'easeInOut', delay: particle.delay }}
        />
      ))}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0)_24%,rgba(2,6,23,0.34)_100%)]" />
    </>
  )
}

function TierBadge({
  tier,
  compact = false,
}: {
  tier: LeagueTierState
  compact?: boolean
}) {
  const TierIcon = LEAGUE_ICONS[tier.league]

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 uppercase tracking-[0.22em]',
        compact ? 'text-[10px]' : 'text-[11px]',
      )}
      style={{
        borderColor: tier.theme.accentSoft,
        background: 'rgba(255,255,255,0.08)',
        color: tier.theme.text,
      }}
    >
      <TierIcon className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
      <span className="font-semibold">{tier.name}</span>
    </div>
  )
}

function FocusRow({
  requirement,
  accent,
}: {
  requirement: LeagueRequirementProgress
  accent: string
}) {
  const MetricIcon = METRIC_ICONS[requirement.key]
  const action = getRequirementAction(requirement)

  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
      <div className="flex items-start gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10"
          style={{ background: `${accent}1f` }}
        >
          <MetricIcon className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-white">{action.title}</p>
              <p className="mt-1 text-xs leading-5 text-white/60">{action.description}</p>
            </div>
            <p className="shrink-0 text-sm font-bold text-white">
              {requirement.progressValueDisplay} / {requirement.progressTargetDisplay}
            </p>
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${accent} 0%, white 140%)` }}
              initial={{ width: 0 }}
              animate={{ width: `${requirement.progress}%` }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function LeaguePathPreview({
  tiers,
  currentLeague,
  nextTier,
}: {
  tiers: LeagueTierState[]
  currentLeague: League
  nextTier: LeagueTierState | null
}) {
  const reduceMotion = useReducedMotion()

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,250,252,0.96)_100%)] p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(6,11,23,0.9)_0%,rgba(10,15,26,0.94)_100%)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.24)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-500 dark:text-white/45">The climb</p>
          <h2
            className="mt-2 text-[2rem] leading-none text-slate-950 sm:text-3xl dark:text-white"
            style={{ fontFamily: 'var(--font-league-display)' }}
          >
            From Bronze to Champion
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:leading-7 dark:text-white/68">
            Your league path is simple to scan here. The full ladder opens only when you want the deeper breakdown.
          </p>
        </div>
        <div className="w-fit rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600 dark:bg-white/10 dark:text-white/72">
          {nextTier ? `${nextTier.name} next` : 'Top league'}
        </div>
      </div>

      <div className="relative mt-5 h-[18.75rem] overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.96)_0%,rgba(241,245,249,0.96)_48%,rgba(248,250,252,0.98)_100%)] p-4 pt-6 sm:h-[17rem] sm:p-5 sm:pb-10 dark:border-white/10 dark:bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.07)_0%,rgba(15,23,42,0.4)_52%,rgba(2,6,23,0.68)_100%)]">
        <div className="relative h-full w-full">
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full text-slate-200 dark:text-white/10"
            viewBox={`0 0 ${PATH_WIDTH} ${PATH_HEIGHT}`}
            preserveAspectRatio="none"
          >
            {PATH_LAYOUT.slice(0, -1).map((_, index) => {
              const segmentPath = buildPathSegment(index)
              const fromTier = tiers[index]
              const isReached = fromTier.league === currentLeague || fromTier.completed

              return (
                <g key={segmentPath}>
                  <path
                    d={segmentPath}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="18"
                    strokeLinecap="round"
                  />
                  <path
                    d={segmentPath}
                    fill="none"
                    stroke={isReached ? fromTier.theme.accent : 'rgba(255,255,255,0)'}
                    strokeWidth="10"
                    strokeLinecap="round"
                  />
                </g>
              )
            })}
          </svg>

          {tiers.map((tier, index) => {
            const Icon = LEAGUE_ICONS[tier.league]
            const position = PATH_LAYOUT[index]
            const isCurrent = tier.current
            const isCleared = tier.completed
            const isNext = nextTier?.league === tier.league
            const size = isCurrent ? 82 : 62

            return (
              <motion.div
                key={tier.league}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${position.left}%`, top: `${position.top}%` }}
                initial={{ opacity: 0, y: reduceMotion ? 0 : 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: 'easeOut', delay: index * 0.05 }}
              >
                <div className="flex flex-col items-center gap-2.5 text-center sm:gap-3">
                  <div className="relative">
                    {isCurrent && (
                      <motion.div
                        className="absolute -inset-3 rounded-full"
                        style={{ border: `2px solid ${tier.theme.accent}` }}
                        animate={reduceMotion ? undefined : { scale: [1, 1.08, 1], opacity: [0.55, 0.9, 0.55] }}
                        transition={reduceMotion ? undefined : { duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                      />
                    )}
                    <div
                      className={cn(
                        'relative flex items-center justify-center rounded-full border-[5px] shadow-[0_16px_40px_rgba(15,23,42,0.18)] sm:border-[6px]',
                        isCleared && 'text-white',
                        !isCurrent && !isCleared && 'text-slate-900 dark:text-white',
                      )}
                      style={{
                        width: size,
                        height: size,
                        borderColor: isCurrent || isCleared ? 'rgba(255,255,255,0.9)' : tier.theme.accentSoft,
                        background: isCurrent || isCleared
                          ? `linear-gradient(180deg, ${tier.theme.accent} 0%, ${tier.theme.highlight} 140%)`
                          : 'rgba(255,255,255,0.82)',
                      }}
                    >
                      {isCleared ? <Check className="h-6 w-6 sm:h-7 sm:w-7" /> : <Icon className={cn('h-5 w-5 sm:h-6 sm:w-6', isCurrent && 'h-6 w-6 text-white sm:h-7 sm:w-7')} />}
                    </div>
                  </div>

                  <div className="min-w-[4.75rem] sm:min-w-[5.5rem]">
                    <p className="text-[13px] font-semibold text-slate-950 sm:text-sm dark:text-white">{tier.name}</p>
                    <p className="mt-1 text-[9px] uppercase tracking-[0.22em] text-slate-500 sm:text-[10px] dark:text-white/45">
                      {getTierStatusLabel(tier, nextTier?.league)}
                    </p>
                    {isNext && (
                      <p className="mt-1 text-[10px] font-semibold text-slate-600 sm:text-[11px] dark:text-white/70">
                        {tier.progress}% ready
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function RequirementLine({
  requirement,
  accent,
}: {
  requirement: LeagueRequirementProgress
  accent: string
}) {
  const MetricIcon = METRIC_ICONS[requirement.key]

  return (
    <div className="rounded-[1.35rem] border border-white/10 bg-black/20 p-4">
      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10"
          style={{ background: `${accent}20` }}
        >
          <MetricIcon className="h-4 w-4 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-white">{getFriendlyRequirementLabel(requirement)}</p>
            <p className="text-sm font-bold text-white">
              {requirement.progressValueDisplay} / {requirement.progressTargetDisplay}
            </p>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full"
              style={{
                width: `${requirement.progress}%`,
                background: `linear-gradient(90deg, ${accent} 0%, white 140%)`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function LeagueLadderModal({
  open,
  tiers,
  selectedLeague,
  onClose,
  onSelectLeague,
}: {
  open: boolean
  tiers: LeagueTierState[]
  selectedLeague: League
  onClose: () => void
  onSelectLeague: (league: League) => void
}) {
  const reduceMotion = useReducedMotion()

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[105] flex items-end justify-center bg-slate-950/76 backdrop-blur-xl sm:items-center sm:p-4"
          onClick={(event) => {
            if (event.target === event.currentTarget) onClose()
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className={cn(
              leagueDisplay.variable,
              leagueBody.variable,
              'relative flex h-[88svh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[2rem] border border-white/10 text-white shadow-[0_30px_120px_rgba(2,6,23,0.55)] sm:h-[90svh] sm:rounded-[2rem]',
            )}
            style={{ fontFamily: 'var(--font-league-body)' }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.96)_0%,rgba(15,23,42,0.96)_100%)]" />

            <div className="relative z-10 flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/45">League ladder</p>
                <h2
                  className="mt-2 text-2xl text-white"
                  style={{ fontFamily: 'var(--font-league-display)' }}
                >
                  See every league and what it takes to reach it
                </h2>
              </div>
              <button
                onClick={onClose}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/8 transition-colors hover:bg-white/14"
                aria-label="Close league ladder"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative z-10 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
              <div className="space-y-3">
                {tiers.map(tier => {
                  const Icon = LEAGUE_ICONS[tier.league]
                  const isSelected = tier.league === selectedLeague
                  const status = getTierStatusLabel(tier, tiers.find(item => !item.completed && !item.current)?.league)

                  return (
                    <motion.div
                      key={tier.league}
                      layout
                      className="overflow-hidden rounded-[1.85rem] border border-white/10"
                      style={{
                        backgroundImage: isSelected
                          ? `${tier.theme.ambience}, ${tier.theme.texture}, ${tier.theme.haze}`
                          : tier.theme.panel,
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => onSelectLeague(isSelected ? tier.league : tier.league)}
                        className="w-full px-4 py-4 text-left"
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10"
                            style={{ background: `${tier.theme.accent}24` }}
                          >
                            <Icon className="h-5 w-5 text-white" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-lg font-semibold text-white">{tier.name}</p>
                                  <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70">
                                    {status}
                                  </span>
                                </div>
                                <p className="mt-1 text-[11px] uppercase tracking-[0.24em] text-white/45">{tier.headline}</p>
                              </div>
                              <ChevronRight className={cn('h-5 w-5 shrink-0 text-white/55 transition-transform', isSelected && 'rotate-90')} />
                            </div>
                            <p className="mt-3 text-sm leading-6 text-white/72">{tier.description}</p>
                            {tier.requirements.length > 0 && !isSelected && (
                              <div className="mt-4 flex flex-wrap gap-2">
                                {tier.requirements.slice(0, 3).map(requirement => (
                                  <span
                                    key={`${tier.league}-${requirement.key}`}
                                    className="rounded-full border border-white/12 bg-white/10 px-3 py-1 text-xs font-semibold text-white/82"
                                  >
                                    {getFriendlyRequirementLabel(requirement)} {requirement.progressTargetDisplay}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </button>

                      <AnimatePresence initial={false}>
                        {isSelected && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: reduceMotion ? 0 : 0.28, ease: 'easeOut' }}
                            className="overflow-hidden border-t border-white/10 bg-black/18"
                          >
                            <div className="space-y-3 px-4 py-4">
                              {tier.requirements.length > 0 ? (
                                tier.requirements.map(requirement => (
                                  <RequirementLine
                                    key={`${tier.league}-${requirement.key}`}
                                    requirement={requirement}
                                    accent={tier.theme.accent}
                                  />
                                ))
                              ) : (
                                <div className="rounded-[1.35rem] border border-white/10 bg-black/20 p-4 text-sm leading-7 text-white/72">
                                  Bronze is where everyone starts. Build your rhythm here, then start stacking enough learning, quizzes,
                                  practice, and XP to reach Silver.
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function LeagueJourneyPage({
  user,
  profile,
  progressState,
  courses,
}: {
  user: User
  profile: UserSkillProfile
  progressState: CourseProgressSnapshot
  courses: Course[]
}) {
  const reduceMotion = useReducedMotion()
  const journey = buildLeagueJourneyState({
    user,
    profile,
    progress: progressState,
    courses,
  })
  const [ladderOpen, setLadderOpen] = useState(false)
  const [selectedLeague, setSelectedLeague] = useState<League>(journey.currentLeague)

  const currentTier = journey.currentTier
  const nextTier = journey.nextTier
  const TierIcon = LEAGUE_ICONS[currentTier.league]
  const focusItems = getTopFocusItems(nextTier)

  useEffect(() => {
    setSelectedLeague(journey.currentLeague)
  }, [journey.currentLeague])

  return (
    <>
      <div
        className={cn(leagueDisplay.variable, leagueBody.variable, 'space-y-4 px-4 py-4')}
        style={{ fontFamily: 'var(--font-league-body)' }}
      >
        <section className="overflow-hidden rounded-[2.2rem] border border-white/10 shadow-[0_28px_90px_rgba(2,6,23,0.24)]">
          <div className="relative overflow-hidden px-5 py-5 sm:px-6 sm:py-6">
            <LeagueAtmosphere theme={currentTier.theme} reduceMotion={Boolean(reduceMotion)} />

            <div className="relative z-10 grid gap-5">
              <div className="flex items-start justify-between gap-4">
                <div className="max-w-2xl">
                  <TierBadge tier={currentTier} />
                  <p className="mt-4 text-[11px] uppercase tracking-[0.24em] text-white/50">{currentTier.headline}</p>
                  <h1
                    className="mt-2 text-4xl text-white sm:text-5xl"
                    style={{ fontFamily: 'var(--font-league-display)' }}
                  >
                    {currentTier.name} League
                  </h1>
                  <p className="mt-3 max-w-xl text-sm leading-7 text-white/78">{getHeroCopy(currentTier, nextTier)}</p>
                </div>

                <motion.div
                  className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-[1.8rem] border border-white/10 bg-black/25 shadow-[0_22px_50px_rgba(15,23,42,0.24)]"
                  style={{ boxShadow: `0 24px 70px ${currentTier.theme.accentSoft}` }}
                  animate={reduceMotion ? undefined : { rotate: [0, 3, -3, 0], y: [0, -4, 0] }}
                  transition={reduceMotion ? undefined : { duration: 7, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <div
                    className="absolute inset-3 rounded-[1.2rem] blur-2xl"
                    style={{ background: currentTier.theme.accentSoft }}
                  />
                  <TierIcon className="relative z-10 h-9 w-9 text-white" />
                </motion.div>
              </div>

              <div
                className="rounded-[2rem] border border-white/10 bg-black/20 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                style={{ backgroundImage: currentTier.theme.panel }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/45">
                      {nextTier ? `On the way to ${nextTier.name}` : 'Top league reached'}
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">
                      {nextTier ? `${nextTier.progress}% of the climb is already done` : 'You own the whole ladder'}
                    </h2>
                    <p className="mt-2 max-w-xl text-sm leading-7 text-white/68">{getProgressCopy(nextTier)}</p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedLeague(nextTier?.league ?? currentTier.league)
                      window.setTimeout(() => setLadderOpen(true), 0)
                    }}
                    className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_16px_38px_rgba(15,23,42,0.22)] transition-transform duration-300 hover:-translate-y-0.5"
                  >
                    See full ladder
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                {nextTier ? (
                  <>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                      <motion.div
                        className="h-full rounded-full"
                        style={{
                          background: `linear-gradient(90deg, ${currentTier.theme.accent} 0%, white 145%)`,
                        }}
                        initial={{ width: 0 }}
                        animate={{ width: `${nextTier.progress}%` }}
                        transition={{ duration: 0.65, ease: 'easeOut' }}
                      />
                    </div>

                    <div className="mt-4 grid gap-3">
                      {focusItems.map(requirement => (
                        <FocusRow
                          key={requirement.key}
                          requirement={requirement}
                          accent={nextTier.theme.accent}
                        />
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-black/20 p-4 text-sm leading-7 text-white/72">
                    Keep finishing lessons, quizzes, and practice anyway. Champion still feels better when the momentum never drops.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <LeaguePathPreview
          tiers={journey.tiers}
          currentLeague={journey.currentLeague}
          nextTier={nextTier}
        />
      </div>

      <LeagueLadderModal
        open={ladderOpen}
        tiers={journey.tiers}
        selectedLeague={selectedLeague}
        onClose={() => setLadderOpen(false)}
        onSelectLeague={setSelectedLeague}
      />
    </>
  )
}
