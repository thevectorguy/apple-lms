'use client'

import { useState, useEffect, useCallback } from 'react'
import { StoryCircles } from '@/components/lms/story-circles'
import { DailyGoals } from '@/components/lms/daily-goals'
import { BadgesGrid } from '@/components/lms/badges-grid'
import { ProfileHeader } from '@/components/lms/profile-header'
import { BottomNav, type Tab } from '@/components/lms/bottom-nav'
import { Community, type CommunityFeedPost } from '@/components/lms/community'
import { CoursesPage } from '@/components/lms/courses-page'
import { SkillRadar } from '@/components/lms/skill-radar'
import { PracticeScreen } from '@/components/lms/practice-screen'
import { AIPracticeScreen } from '@/components/lms/ai-practice-screen'
import { LeagueJourneyPage } from '@/components/lms/league-journey-page'
import { MascotOverlay, type MascotTriggerEvent } from '@/components/lms/mascot-overlay'
import { CelebrationConfetti, type CelebrationBurst } from '@/components/lms/celebration-confetti'
import { ShareCelebrationCard, type ShareCardData } from '@/components/lms/share-celebration-card'
import {
  currentUser, stories, allBadges, discussions, peerChallenges,
  sharedAchievements, courses, userSkillProfile,
} from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import { motion, useReducedMotion } from 'framer-motion'
import {
  Bell, Flame, Zap, Sun, Moon, Sparkles, Clock, ChevronRight,
  Play, Star, TrendingUp, Brain, Trophy, Users, Check, Send, X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  buildLeagueJourneyState,
  type LeagueRequirementProgress,
  type LeagueTierState,
} from '@/lib/league-system'
import type {
  CompetencyEvent,
  CompetencyEventType,
  Assessment,
  Course,
  DailyGoals as DailyGoalsState,
  Episode,
  Module,
  NextStepPlan,
  SkillCategory,
  SkillUpdateContext,
  SpeedPracticeMode,
  SpeedStageKey,
} from '@/lib/types'

type CompetencyEventInput = {
  type: CompetencyEventType
  skillCategory: SkillCategory
  score: number
  sourceId: string
  sourceTitle: string
}

type ShareComposerDraft = {
  id: string
  message: string
  title: string
  card: ShareCardData
}

// ─────────────────────────────────────────────────────────────────────────────
// XP Toast
// ─────────────────────────────────────────────────────────────────────────────
function XPToast({ xp, label, onDone }: { xp: number; label?: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2600)
    return () => clearTimeout(t)
  }, [onDone])
  return (
    <div className="fixed top-20 left-1/2 z-[100] -translate-x-1/2 pointer-events-none">
      <div className="animate-bounce bg-gradient-to-r from-primary to-accent text-white px-5 py-2.5 rounded-full shadow-xl flex items-center gap-2 font-bold text-sm">
        <Zap className="w-4 h-4 fill-white" />
        +{xp} XP {label && <span className="font-normal opacity-80">{label}</span>}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
const COMPETENCY_WEIGHTS: Record<CompetencyEventType, number> = {
  assessment: 0.25,
  mini_game: 0.15,
  module_completion: 0.05,
  ai_practice: 0.45,
}

const SPEED_SIGNAL_WEIGHT = 0.55
const GOOD_SCORE_THRESHOLD = 85

const SPEED_STAGE_KEYS: SpeedStageKey[] = [
  'start_right',
  'plan_to_probe',
  'explain_value',
  'eliminate_objection',
  'drive_closure',
]

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

function resolveSpeedPracticeMode(mode?: SkillUpdateContext['practiceMode']): SpeedPracticeMode | undefined {
  if (mode === 'pitch' || mode === 'roleplay' || mode === 'guided_ai') return mode
  return undefined
}

function getDefaultSpeedSignals(mode: SpeedPracticeMode | undefined, score: number): Partial<Record<SpeedStageKey, number>> {
  switch (mode) {
    case 'pitch':
      return {
        start_right: clampScore(score + 4),
        plan_to_probe: clampScore(score - 2),
        explain_value: clampScore(score + 3),
        eliminate_objection: clampScore(score - 1),
        drive_closure: clampScore(score + 1),
      }
    case 'roleplay':
      return {
        start_right: clampScore(score + 1),
        plan_to_probe: clampScore(score + 4),
        explain_value: clampScore(score),
        eliminate_objection: clampScore(score + 5),
        drive_closure: clampScore(score + 2),
      }
    case 'guided_ai':
      return {
        start_right: clampScore(score + 2),
        plan_to_probe: clampScore(score + 2),
        explain_value: clampScore(score + 2),
        eliminate_objection: clampScore(score + 2),
        drive_closure: clampScore(score + 1),
      }
    default:
      return {}
  }
}

function applySpeedSignals(
  profile: typeof userSkillProfile,
  score: number,
  context?: SkillUpdateContext,
) {
  const practiceMode = resolveSpeedPracticeMode(context?.practiceMode)
  const incomingSignals = context?.speedSignals ?? getDefaultSpeedSignals(practiceMode, score)
  const nextStages = { ...profile.speedFramework.stages }
  let hasUpdates = false

  SPEED_STAGE_KEYS.forEach(stageKey => {
    const stageScore = incomingSignals[stageKey]
    if (typeof stageScore !== 'number') return

    const currentStage = nextStages[stageKey]
    const currentScore = currentStage?.score ?? 0

    nextStages[stageKey] = {
      ...currentStage,
      score: clampScore((currentScore * (1 - SPEED_SIGNAL_WEIGHT)) + (stageScore * SPEED_SIGNAL_WEIGHT)),
      updatedAt: new Date().toISOString(),
      sourceTitle: context?.sourceTitle ?? currentStage?.sourceTitle,
      practiceMode: practiceMode ?? currentStage?.practiceMode,
    }
    hasUpdates = true
  })

  if (!hasUpdates) return profile

  return {
    ...profile,
    speedFramework: {
      stages: nextStages,
    },
  }
}

function getSkillGapByCategory(radarData: { communication: number; technical: number; leadership: number; compliance: number }) {
  return {
    communication: Math.max(0, 100 - radarData.communication),
    technical: Math.max(0, 100 - radarData.technical),
    leadership: Math.max(0, 100 - radarData.leadership),
    compliance: Math.max(0, 100 - radarData.compliance),
  }
}

function getWeakAreas(radarData: { communication: number; technical: number; leadership: number; compliance: number }) {
  return (Object.entries(radarData).filter(([, value]) => value < 60).map(([skill]) => skill) as SkillCategory[])
}

function getStrongAreas(radarData: { communication: number; technical: number; leadership: number; compliance: number }) {
  return (Object.entries(radarData).filter(([, value]) => value >= 70).map(([skill]) => skill) as SkillCategory[])
}

function createCompetencyEvent(
  skillCategory: SkillCategory,
  score: number,
  type: CompetencyEventType,
  sourceId: string,
  sourceTitle: string,
): CompetencyEvent {
  return {
    id: `${type}-${sourceId}-${Date.now()}`,
    type,
    skillCategory,
    score,
    impactWeight: COMPETENCY_WEIGHTS[type],
    sourceId,
    sourceTitle,
    timestamp: new Date().toISOString(),
  }
}

function buildNextStep(profile: typeof userSkillProfile) {
  const entries = Object.entries(profile.skillGapByCategory)
    .map(([skill, gap]) => ({ skill: skill as SkillCategory, gap }))
    .sort((a, b) => b.gap - a.gap)

  const primary = entries[0] ?? { skill: 'technical' as SkillCategory, gap: 0 }
  const nextStepPlan: NextStepPlan = {
    type: 'ai_practice',
    skillCategory: primary.skill,
    title: `${primary.skill.charAt(0).toUpperCase() + primary.skill.slice(1)} focus session`,
    status: profile.nextStepPlan?.skillCategory === primary.skill && profile.nextStepPlan?.status === 'completed'
      ? 'completed'
      : 'selected',
  }

  const recommendations = [
    nextStepPlan.status === 'completed'
      ? `Keep building ${primary.skill} to close the remaining gap.`
      : `Practice with AI Coach to strengthen ${primary.skill}.`,
    ...entries
      .filter(entry => entry.skill !== primary.skill && entry.gap > 0)
      .slice(0, 2)
      .map(entry => `Keep moving on ${entry.skill} to narrow the gap.`),
  ]

  return { nextStepPlan, recommendations }
}

function applyCompetencyEvent(profile: typeof userSkillProfile, event: CompetencyEvent) {
  const radarData = { ...profile.radarData }
  const current = radarData[event.skillCategory]
  const updated = Math.round((current * (1 - event.impactWeight)) + (event.score * event.impactWeight))
  radarData[event.skillCategory] = Math.max(0, Math.min(100, updated))

  const skillGapByCategory = getSkillGapByCategory(radarData)
  const weakAreas = getWeakAreas(radarData)
  const strongAreas = getStrongAreas(radarData)
  const readinessScore = Math.round(Object.values(radarData).reduce((sum, value) => sum + value, 0) / Object.values(radarData).length)
  const competencyHistory = [event, ...(profile.competencyHistory ?? [])].slice(0, 20)
  const nextStep = buildNextStep({
    ...profile,
    radarData,
    skillGapByCategory,
    weakAreas,
    strongAreas,
    readinessScore,
    competencyHistory,
  })

  return {
    ...profile,
    radarData,
    skillGapByCategory,
    weakAreas,
    strongAreas,
    readinessScore,
    competencyHistory,
    nextStepPlan: nextStep.nextStepPlan,
    recommendations: nextStep.recommendations,
  }
}

function parseDurationToMinutes(duration: string) {
  const timestampMatch = duration.match(/^(\d+):(\d+)$/)
  if (timestampMatch) {
    const minutes = Number(timestampMatch[1])
    const seconds = Number(timestampMatch[2])
    return Math.max(1, Math.ceil(((minutes * 60) + seconds) / 60))
  }

  const numericMinutes = Number.parseInt(duration, 10)
  return Number.isFinite(numericMinutes) ? Math.max(1, numericMinutes) : 5
}

function areAllDailyGoalsComplete(dailyGoals: DailyGoalsState) {
  return (
    dailyGoals.lessonsCompleted >= dailyGoals.lessonsGoal &&
    dailyGoals.xpEarned >= dailyGoals.xpGoal &&
    dailyGoals.timeSpent >= dailyGoals.timeGoal
  )
}

function getDailyGoalStreakReward<T extends { streak: number; dailyGoalsStreakClaimed?: boolean }>(
  user: T,
  dailyGoals: DailyGoalsState,
) {
  const shouldAwardStreak = areAllDailyGoalsComplete(dailyGoals) && !user.dailyGoalsStreakClaimed

  return {
    streak: shouldAwardStreak ? user.streak + 1 : user.streak,
    dailyGoalsStreakClaimed: user.dailyGoalsStreakClaimed || shouldAwardStreak,
  }
}

function buildInitialCourseProgress(allCourses: Course[]) {
  const completedEpisodes = new Set<string>()
  const completedGames = new Set<string>()
  const completedAssessments = new Set<string>()
  const completedModules = new Set<string>()
  const completedRoleplays = new Set<string>()

  allCourses.forEach(course => {
    const courseEpisodes = course.modules?.length ? course.modules.flatMap(module => module.episodes) : course.episodes
    courseEpisodes.forEach(episode => {
      if (episode.completed) completedEpisodes.add(episode.id)
    })

    course.modules?.forEach(courseModule => {
      if (courseModule.completed) {
        completedModules.add(courseModule.id)
        courseModule.episodes.forEach(episode => completedEpisodes.add(episode.id))
        courseModule.miniGames.forEach(({ game }) => completedGames.add(game.id))
        completedAssessments.add(courseModule.finalAssessment.id)
        if (courseModule.aiRoleplay) completedRoleplays.add(courseModule.aiRoleplay.id)
      }
    })
  })

  return {
    completedEpisodes,
    completedGames,
    completedAssessments,
    completedModules,
    completedRoleplays,
  }
}

const COURSE_PROGRESS_STORAGE_KEY = 'lms-course-progress-v1'

type CourseProgressState = ReturnType<typeof buildInitialCourseProgress>

type StoredCourseProgress = {
  completedEpisodes?: string[]
  completedGames?: string[]
  completedAssessments?: string[]
  completedModules?: string[]
  completedRoleplays?: string[]
}

function readCourseProgressFromStorage(fallback: CourseProgressState): CourseProgressState {
  if (typeof window === 'undefined') return fallback

  try {
    const storedValue = window.localStorage.getItem(COURSE_PROGRESS_STORAGE_KEY)
    if (!storedValue) return fallback

    const parsed = JSON.parse(storedValue) as StoredCourseProgress

    return {
      completedEpisodes: new Set(Array.isArray(parsed.completedEpisodes) ? parsed.completedEpisodes : []),
      completedGames: new Set(Array.isArray(parsed.completedGames) ? parsed.completedGames : []),
      completedAssessments: new Set(Array.isArray(parsed.completedAssessments) ? parsed.completedAssessments : []),
      completedModules: new Set(Array.isArray(parsed.completedModules) ? parsed.completedModules : []),
      completedRoleplays: new Set(Array.isArray(parsed.completedRoleplays) ? parsed.completedRoleplays : []),
    }
  } catch {
    return fallback
  }
}

function writeCourseProgressToStorage(progress: CourseProgressState) {
  if (typeof window === 'undefined') return

  const serializedProgress: StoredCourseProgress = {
    completedEpisodes: Array.from(progress.completedEpisodes),
    completedGames: Array.from(progress.completedGames),
    completedAssessments: Array.from(progress.completedAssessments),
    completedModules: Array.from(progress.completedModules),
    completedRoleplays: Array.from(progress.completedRoleplays),
  }

  window.localStorage.setItem(COURSE_PROGRESS_STORAGE_KEY, JSON.stringify(serializedProgress))
}

function createGameShareCard(payload: {
  gameTitle: string
  courseTitle: string
  score: number
  xpEarned: number
}): ShareCardData {
  return {
    kind: 'game_score',
    icon: payload.score >= 95 ? '⚡' : '🎮',
    eyebrow: 'Community Share',
    achievement: payload.gameTitle,
    title: `${payload.score}% run locked`,
    subtitle: payload.courseTitle,
    primaryStat: {
      label: 'Score',
      value: `${payload.score}%`,
    },
    secondaryStat: {
      label: 'XP Earned',
      value: `+${payload.xpEarned}`,
    },
    footer: payload.score >= 95
      ? 'Elite round. This one deserves a spotlight in the feed.'
      : 'Strong checkpoint cleared on the way through the course.',
  }
}

function createAssessmentShareCard(payload: {
  assessment: Assessment
  courseTitle: string
  score: number
}): ShareCardData {
  const badgeName = payload.assessment.badgeReward?.name

  return {
    kind: 'assessment_pass',
    icon: payload.assessment.badgeReward?.icon ?? '🏆',
    eyebrow: badgeName ? 'Badge Unlocked' : 'Assessment Cleared',
    achievement: payload.assessment.title,
    title: badgeName ? `${badgeName} unlocked` : `${payload.score}% passed`,
    subtitle: payload.courseTitle,
    primaryStat: {
      label: 'Score',
      value: `${payload.score}%`,
    },
    secondaryStat: {
      label: 'XP Earned',
      value: `+${payload.assessment.xpReward}`,
    },
    footer: badgeName
      ? `Passed the checkpoint and earned the ${badgeName} badge.`
      : 'Checkpoint passed and the next part of the journey is open.',
  }
}

function createModuleRewardShareCard(payload: {
  module: Module
  courseTitle: string
}): ShareCardData {
  return {
    kind: 'module_reward',
    icon: '🏅',
    eyebrow: 'Module Reward',
    achievement: `Level ${payload.module.level} Finisher`,
    title: payload.module.title,
    subtitle: payload.courseTitle,
    primaryStat: {
      label: 'Level',
      value: `${payload.module.level}`,
    },
    secondaryStat: {
      label: 'Status',
      value: 'Unlocked',
    },
    footer: 'Journey checkpoint secured and stamped to your profile.',
  }
}

function getLeagueHomeFocus(requirement: LeagueRequirementProgress | null) {
  if (!requirement) return 'Top league'

  const remaining = Math.max(requirement.target - requirement.value, 0)

  switch (requirement.key) {
    case 'xp':
      return `${remaining.toLocaleString()} XP to go`
    case 'readiness':
      return `${remaining} readiness points`
    case 'videos':
      return `${remaining} more lessons`
    case 'assessments':
      return `${remaining} more quizzes`
    case 'miniGames':
      return `${remaining} more mini-games`
    case 'focusMinutes':
      return `${remaining} more focus min`
    case 'speedChecks':
      return `${remaining} more live wins`
    default:
      return requirement.label
  }
}

function getLeagueHomeCopy(currentTier: LeagueTierState, nextTier: LeagueTierState | null) {
  if (!nextTier) {
    return `You are in ${currentTier.name} League and already at the top of the ladder.`
  }

  return `You are in ${currentTier.name} League. ${nextTier.name} is next, and a few strong wins will move you closer.`
}

function PracticePanel({
  profile,
  onSkillUpdate,
}: {
  profile: typeof userSkillProfile
  onSkillUpdate: (skillCategory: SkillCategory | string, score: number) => void
}) {
  const focusSkill = profile.weakAreas[0] ?? 'technical'
  const focusLabel = focusSkill.charAt(0).toUpperCase() + focusSkill.slice(1)

  return (
    <div className="space-y-4 px-4 py-4">
      <div className="overflow-hidden rounded-[28px] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(248,250,252,0.96)_100%)] p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">AI coach</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">Practice with guided feedback</h2>
            <p className="mt-2 max-w-xl text-sm text-slate-600">
              Keep the flow moving with a focused practice round.
            </p>
wo        </div>
          <div className="rounded-2xl bg-slate-950 px-4 py-3 text-right text-white">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/55">Current focus</p>
            <p className="mt-1 text-sm font-bold">{focusLabel}</p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Readiness</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{profile.readinessScore}</p>
            <p className="mt-1 text-xs text-slate-600">Live profile signal</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Gap to close</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{profile.skillGapByCategory[focusSkill]}%</p>
            <p className="mt-1 text-xs text-slate-600">Largest improvement opportunity</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">History</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{profile.competencyHistory.length}</p>
            <p className="mt-1 text-xs text-slate-600">Recent competency signals</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <Button
            className="rounded-full bg-gradient-to-r from-primary to-accent px-5 font-semibold text-white"
            onClick={() => {
              onSkillUpdate(focusSkill, 84)
            }}
          >
            Start practice round
          </Button>
          <Button
            variant="outline"
            className="rounded-full border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
            onClick={() => onSkillUpdate(focusSkill, 76)}
          >
            Quick refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_0.95fr]">
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">What the coach is watching</p>
          <div className="mt-4 space-y-3">
            {profile.weakAreas.slice(0, 3).map(skill => (
              <div key={skill} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                <span className="text-sm font-semibold text-slate-900">{skill.charAt(0).toUpperCase() + skill.slice(1)}</span>
                <span className="text-sm font-black text-slate-700">{profile.skillGapByCategory[skill]}%</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[24px] border border-slate-200 bg-slate-950 p-5 text-white shadow-[0_16px_40px_rgba(15,23,42,0.14)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/55">Next step</p>
          <h3 className="mt-2 text-2xl font-black">
            {profile.nextStepPlan ? profile.nextStepPlan.title : `Practice ${focusLabel}`}
          </h3>
          <p className="mt-2 text-sm text-white/70">
            Your profile stays in sync as you move through the course, game checkpoints, and coach practice.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/85">
              {profile.nextStepPlan?.status === 'completed' ? 'Completed' : 'Ready now'}
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/85">
              {profile.strongAreas.length} strong areas
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function ShareComposerModal({
  draft,
  onClose,
  onPost,
}: {
  draft: ShareComposerDraft
  onClose: () => void
  onPost: (message: string) => void
}) {
  const [message, setMessage] = useState(draft.message)

  useEffect(() => {
    setMessage(draft.message)
  }, [draft])

	  return (
	    <div className="fixed inset-0 z-[110] flex items-end justify-center bg-slate-950/70 p-4 backdrop-blur-sm sm:items-center">
	      <div className="max-h-[calc(100svh-2rem)] w-full max-w-lg overflow-y-auto rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.98)_0%,rgba(17,24,39,0.98)_100%)] text-white shadow-[0_30px_120px_rgba(2,6,23,0.55)]">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-300/80">Share to community</p>
            <h3 className="mt-1 text-xl font-black">{draft.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-white/10 bg-white/5 p-2 text-white transition hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

	        <div className="space-y-4 px-5 py-5">
	          <ShareCelebrationCard card={draft.card} compact className="mx-auto max-w-[25rem]" />

          <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/55">Caption</p>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={4}
              className="mt-3 w-full resize-none rounded-[1.25rem] border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-cyan-300/35"
              placeholder="Share what you learned..."
            />
            <p className="mt-2 text-xs text-white/45">
              The preview card is attached automatically. You can post this as-is or tune the copy first.
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10"
              onClick={onClose}
            >
              Save for Later
            </Button>
            <Button
              className="flex-1 rounded-full bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600 font-bold text-white shadow-lg hover:opacity-95"
              onClick={() => onPost(message.trim() || draft.message)}
            >
              <Send className="mr-2 h-4 w-4" />
              Post to Community
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LMSPage() {
  const [activeTab, setActiveTab] = useState<Tab>('home')
  const [practiceView, setPracticeView] = useState<'landing' | 'ai-coach'>('landing')
  const [aiCoachAutoStartFromPlan, setAiCoachAutoStartFromPlan] = useState(false)
  const [aiCoachKey, setAiCoachKey] = useState(0)
  const [user, setUser] = useState(currentUser)
  const [isDark, setIsDark] = useState(false)
  const [skillProfile, setSkillProfile] = useState(userSkillProfile)
  const [courseProgress, setCourseProgress] = useState(() => buildInitialCourseProgress(courses))
  const [courseProgressHydrated, setCourseProgressHydrated] = useState(false)
  const [communityPosts, setCommunityPosts] = useState<CommunityFeedPost[]>([])
  const [shareDraft, setShareDraft] = useState<ShareComposerDraft | null>(null)
  // For "Continue Learning" direct play
  const [autoPlayCourseId, setAutoPlayCourseId] = useState<string | null>(null)
  const [openCourseId, setOpenCourseId] = useState<string | null>(null)
  const [resumeRewardModuleId, setResumeRewardModuleId] = useState<string | null>(null)
  const [xpToast, setXpToast] = useState<{ id: number; xp: number; label?: string } | null>(null)
  const [celebrationBurst, setCelebrationBurst] = useState<CelebrationBurst | null>(null)
  const [mascotEvent, setMascotEvent] = useState<MascotTriggerEvent | null>(null)
  const prefersReducedMotion = useReducedMotion()
  const leagueJourney = buildLeagueJourneyState({
    user,
    profile: skillProfile,
    progress: courseProgress,
    courses,
  })
  const currentLeagueTier = leagueJourney.currentTier
  const nextLeagueTier = leagueJourney.nextTier
  const primaryLeagueFocus = nextLeagueTier
    ? [...nextLeagueTier.requirements]
        .filter(requirement => !requirement.met)
        .sort((left, right) => left.progress - right.progress)[0] ?? null
    : null

  useEffect(() => {
    const stored = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const shouldBeDark = stored === 'dark' || (!stored && prefersDark)
    setIsDark(shouldBeDark)
    document.documentElement.classList.toggle('dark', shouldBeDark)
  }, [courses])

  useEffect(() => {
    setCourseProgress(readCourseProgressFromStorage(buildInitialCourseProgress(courses)))
    setCourseProgressHydrated(true)
  }, [courses])

  useEffect(() => {
    if (!courseProgressHydrated) return
    writeCourseProgressToStorage(courseProgress)
  }, [courseProgress, courseProgressHydrated])

  useEffect(() => {
    if (!celebrationBurst) return

    const timeoutId = window.setTimeout(() => {
      setCelebrationBurst(current => (current?.id === celebrationBurst.id ? null : current))
    }, celebrationBurst.variant === 'reward' ? 1800 : 1550)

    return () => window.clearTimeout(timeoutId)
  }, [celebrationBurst])

  const toggleTheme = () => {
    const newTheme = !isDark
    setIsDark(newTheme)
    localStorage.setItem('theme', newTheme ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark', newTheme)
  }

  const triggerXPToast = useCallback((xp: number, label?: string) => {
    setXpToast({ id: Date.now(), xp, label })
  }, [])

  const triggerCelebration = useCallback((variant: CelebrationBurst['variant'], label?: string) => {
    if (prefersReducedMotion) return

    setCelebrationBurst({
      id: Date.now(),
      label,
      variant,
    })
  }, [prefersReducedMotion])

  const showMascot = useCallback((event: Omit<MascotTriggerEvent, 'id'> & { id?: string }) => {
    setMascotEvent({
      ...event,
      id: event.id ?? `${event.trigger}-${Date.now()}`,
    })
  }, [])

  const handleCompetencyEvent = useCallback((input: CompetencyEventInput) => {
    const event = createCompetencyEvent(
      input.skillCategory,
      input.score,
      input.type,
      input.sourceId,
      input.sourceTitle,
    )
    setSkillProfile(prev => applyCompetencyEvent(prev, event))
  }, [])

  const handleSkillUpdate = useCallback((skillCategory: SkillCategory | string, score: number, context?: SkillUpdateContext) => {
    const typedSkill = skillCategory as SkillCategory
    const eventType: CompetencyEventType = context?.eventType ?? (activeTab === 'practice' ? 'ai_practice' : 'assessment')
    const sourceId = context?.sourceId ?? (activeTab === 'practice' ? 'ai-practice-session' : 'course-assessment')
    const sourceTitle = context?.sourceTitle ?? (activeTab === 'practice' ? 'AI practice' : 'Assessment')
    const event = createCompetencyEvent(
      typedSkill,
      score,
      eventType,
      sourceId,
      sourceTitle,
    )

    setSkillProfile(prev => applySpeedSignals(applyCompetencyEvent(prev, event), score, context))

    const xpGain = Math.round(score * (eventType === 'ai_practice' ? 0.6 : 0.5))
    setUser(prev => {
      const dailyGoals = {
        ...prev.dailyGoals,
        xpEarned: prev.dailyGoals.xpEarned + xpGain,
      }
      const streakReward = getDailyGoalStreakReward(prev, dailyGoals)

      return {
        ...prev,
        xp: prev.xp + xpGain,
        dailyGoals,
        ...streakReward,
      }
    })
    const toastLabel = eventType === 'ai_practice'
      ? 'from AI practice'
      : eventType === 'mini_game'
        ? 'game cleared'
        : 'from assessment'
    triggerXPToast(xpGain, toastLabel)
    if (score >= GOOD_SCORE_THRESHOLD) {
      triggerCelebration('score', `${score}% score`)
    }
  }, [activeTab, triggerCelebration, triggerXPToast])

  const handleXPGain = useCallback((xp: number, label = 'from practice') => {
    setUser(prev => {
      const dailyGoals = {
        ...prev.dailyGoals,
        xpEarned: prev.dailyGoals.xpEarned + xp,
      }
      const streakReward = getDailyGoalStreakReward(prev, dailyGoals)

      return {
        ...prev,
        xp: prev.xp + xp,
        dailyGoals,
        ...streakReward,
      }
    })
    triggerXPToast(xp, label)
  }, [triggerXPToast])

  const handleLessonComplete = useCallback((episode: Episode) => {
    const xp = episode.xp || 50
    const minutesSpent = parseDurationToMinutes(episode.duration)

    setUser(prev => {
      const dailyGoals = {
        ...prev.dailyGoals,
        lessonsCompleted: prev.dailyGoals.lessonsCompleted + 1,
        xpEarned: prev.dailyGoals.xpEarned + xp,
        timeSpent: prev.dailyGoals.timeSpent + minutesSpent,
      }
      const streakReward = getDailyGoalStreakReward(prev, dailyGoals)

      return {
        ...prev,
        xp: prev.xp + xp,
        totalLessonsCompleted: prev.totalLessonsCompleted + 1,
        dailyGoals,
        ...streakReward,
      }
    })
    triggerXPToast(xp, 'lesson complete!')
  }, [triggerXPToast])

  // "Continue Learning" play button → switch to Courses tab AND auto-open the course
  const handleContinueLearning = useCallback((courseId: string) => {
    setOpenCourseId(null)
    setResumeRewardModuleId(null)
    setAutoPlayCourseId(courseId)
    setActiveTab('courses')
  }, [])

  const handleOpenCourseJourney = useCallback((courseId: string) => {
    setAutoPlayCourseId(null)
    setResumeRewardModuleId(null)
    setOpenCourseId(courseId)
    setActiveTab('courses')
  }, [])

  const handleReturnToCourseReward = useCallback((courseId: string, roleplayId: string) => {
    const course = courses.find(item => item.id === courseId)
    const moduleId = course?.modules?.find(module => module.aiRoleplay?.id === roleplayId)?.id ?? null

    setAutoPlayCourseId(null)
    setResumeRewardModuleId(moduleId)
    setOpenCourseId(courseId)
    setActiveTab('courses')
  }, [])

  const handlePracticeFromCourses = useCallback((scenario?: string, roleplayId?: string, courseId?: string) => {
    setAutoPlayCourseId(null)
    setOpenCourseId(null)
    setAiCoachAutoStartFromPlan(true)
    const courseSkill = courseId ? courses.find(course => course.id === courseId)?.skillCategory : undefined
    setSkillProfile(prev => ({
      ...prev,
      nextStepPlan: {
        type: 'ai_practice',
        skillCategory: courseSkill ?? prev.weakAreas[0] ?? 'technical',
        title: 'AI focus session',
        status: 'selected',
        courseId,
        roleplayId,
        scenario,
      },
    }))
    setPracticeView('ai-coach')
    setActiveTab('practice')
  }, [])

  const handleCourseProgressChange = useCallback((progress: {
    completedEpisodes: Set<string>
    completedGames: Set<string>
    completedAssessments: Set<string>
    completedModules: Set<string>
    completedRoleplays: Set<string>
  }) => {
    setCourseProgress({
      completedEpisodes: new Set(progress.completedEpisodes),
      completedGames: new Set(progress.completedGames),
      completedAssessments: new Set(progress.completedAssessments),
      completedModules: new Set(progress.completedModules),
      completedRoleplays: new Set(progress.completedRoleplays),
    })
  }, [])

  const handleRoleplayComplete = useCallback((roleplayId: string) => {
    setCourseProgress(prev => ({
      ...prev,
      completedRoleplays: new Set(prev.completedRoleplays).add(roleplayId),
    }))

    setSkillProfile(prev => ({
      ...prev,
      nextStepPlan: prev.nextStepPlan?.roleplayId === roleplayId
        ? {
            ...prev.nextStepPlan,
            status: 'completed',
            roleplayId: undefined,
            scenario: undefined,
          }
        : prev.nextStepPlan,
    }))
  }, [])

  const openAIPracticeCoach = useCallback(() => {
    setAutoPlayCourseId(null)
    setOpenCourseId(null)
    setAiCoachAutoStartFromPlan(false)
    setAiCoachKey(prev => prev + 1)
    setPracticeView('ai-coach')
    setActiveTab('practice')
  }, [])

  const handleShareGameScore = useCallback((payload: {
    gameTitle: string
    courseTitle: string
    score: number
    xpEarned: number
  }) => {
    const starterMessage = payload.score >= 95
      ? `Just landed a ${payload.score}% run in ${payload.gameTitle}. ${payload.courseTitle} is starting to feel second nature.`
      : payload.score >= 85
        ? `Wrapped ${payload.gameTitle} with ${payload.score}% while moving through ${payload.courseTitle}. Feeling the progress.`
        : `Finished ${payload.gameTitle} at ${payload.score}% in ${payload.courseTitle}. Back in for another stronger run soon.`

    setShareDraft({
      id: `draft-${Date.now()}`,
      title: 'Your share card is ready',
      message: starterMessage,
      card: createGameShareCard(payload),
    })
  }, [])

  const handleShareAssessmentResult = useCallback((payload: {
    assessment: Assessment
    courseTitle: string
    score: number
  }) => {
    const badgeName = payload.assessment.badgeReward?.name
    const starterMessage = badgeName
      ? `Passed ${payload.assessment.title} with ${payload.score}% and unlocked the ${badgeName} badge in ${payload.courseTitle}.`
      : payload.score >= 95
        ? `Scored ${payload.score}% on ${payload.assessment.title}. ${payload.courseTitle} is really clicking now.`
        : `Cleared ${payload.assessment.title} with ${payload.score}% and kept the momentum going in ${payload.courseTitle}.`

    setShareDraft({
      id: `draft-${Date.now()}`,
      title: 'Your achievement card is ready',
      message: starterMessage,
      card: createAssessmentShareCard(payload),
    })
  }, [])

  const handleShareModuleReward = useCallback((payload: {
    module: Module
    courseTitle: string
  }) => {
    const starterMessage = `Just closed out Level ${payload.module.level} in ${payload.courseTitle} and unlocked the ${payload.module.title} Finisher reward.`

    setShareDraft({
      id: `draft-${Date.now()}`,
      title: 'Your reward card is ready',
      message: starterMessage,
      card: createModuleRewardShareCard(payload),
    })
  }, [])

  const handlePostShareDraft = useCallback((message: string) => {
    if (!shareDraft) return

    const nextPost: CommunityFeedPost = {
      id: `score-${Date.now()}`,
      author: {
        name: user.name,
        avatar: user.avatar || '/placeholder.svg',
        level: user.level,
      },
      type: 'milestone',
      content: message,
      timestamp: 'Just now',
      likes: 0,
      comments: 0,
      isLiked: false,
      canDelete: true,
      shareCard: shareDraft.card,
    }

    setCommunityPosts(prev => [nextPost, ...prev])
    setShareDraft(null)
    setActiveTab('community')
  }, [shareDraft, user.avatar, user.level, user.name])

  const handleDeleteCommunityPost = useCallback((postId: string) => {
    setCommunityPosts(prev => prev.filter(post => post.id !== postId))
  }, [])

  const handleTabChange = useCallback((tab: Tab) => {
    // Clear auto-play when user manually navigates
    if (tab !== 'courses') {
      setAutoPlayCourseId(null)
      setOpenCourseId(null)
      setResumeRewardModuleId(null)
    }
    if (tab !== 'practice') setPracticeView('landing')
    if (tab === 'practice') setPracticeView('landing')
    setActiveTab(tab)
  }, [])

  const inProgressCourse = courses.find(c => c.status === 'in_progress')
  const firstName = user.name.split(' ')[0]
  const nextEpisode = inProgressCourse?.episodes.find(episode => !episode.completed && !episode.locked) ?? null
  const progressEpisodes = inProgressCourse?.episodes.filter(episode => episode.completed).length ?? 0
  const courseProgressPercent = inProgressCourse ? (progressEpisodes / inProgressCourse.episodes.length) * 100 : 0
  const unlockedBadges = user.badges.filter(badge => !badge.locked)
  const recommendationCards = skillProfile.weakAreas
    .slice(0, 2)
    .map(area => courses.find(course => course.skillCategory === area && course.status !== 'completed'))
    .filter((course): course is Course => Boolean(course))
  const streakDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  const quickStats = [
    {
      label: 'Streak',
      value: `${user.streak} days`,
      helper: '+50 XP daily',
      icon: Flame,
      tint: 'text-amber-500',
      glow: 'from-amber-300/65 via-orange-200/35 to-transparent dark:from-amber-300/22 dark:via-orange-400/10',
    },
    {
      label: 'Readiness',
      value: `${skillProfile.readinessScore}%`,
      helper: skillProfile.weakAreas[0] ? `Boost ${skillProfile.weakAreas[0]}` : 'All core skills on track',
      icon: Sparkles,
      tint: 'text-sky-500',
      glow: 'from-sky-300/65 via-blue-200/35 to-transparent dark:from-sky-300/22 dark:via-blue-400/10',
    },
    {
      label: 'XP',
      value: user.xp.toLocaleString(),
      helper: `${user.xpToNextLevel} to next level`,
      icon: Zap,
      tint: 'text-indigo-500',
      glow: 'from-indigo-300/65 via-violet-200/35 to-transparent dark:from-indigo-300/22 dark:via-violet-400/10',
    },
  ] as const
  type QuickStatLabel = typeof quickStats[number]['label']
  const getQuickStatCardStyle = (label: QuickStatLabel) => {
    switch (label) {
      case 'Streak':
        return {
          borderColor: 'rgba(251,191,36,0.24)',
          backgroundImage: 'radial-gradient(circle at 14% 18%, rgba(251,191,36,0.26), transparent 30%), linear-gradient(180deg, rgba(255,248,228,0.94) 0%, rgba(244,232,211,0.78) 100%)',
        }
      case 'Readiness':
        return {
          borderColor: 'rgba(96,165,250,0.24)',
          backgroundImage: 'radial-gradient(circle at 14% 18%, rgba(125,211,252,0.32), transparent 30%), linear-gradient(180deg, rgba(235,248,255,0.94) 0%, rgba(214,231,249,0.8) 100%)',
        }
      case 'XP':
      default:
        return {
          borderColor: 'rgba(167,139,250,0.24)',
          backgroundImage: 'radial-gradient(circle at 14% 18%, rgba(196,181,253,0.3), transparent 30%), linear-gradient(180deg, rgba(245,243,255,0.94) 0%, rgba(228,228,248,0.8) 100%)',
        }
    }
  }
  const getQuickStatIconShellStyle = (label: QuickStatLabel) => {
    switch (label) {
      case 'Streak':
        return {
          borderColor: 'rgba(251,191,36,0.18)',
          backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(255,244,214,0.82) 100%)',
        }
      case 'Readiness':
        return {
          borderColor: 'rgba(96,165,250,0.18)',
          backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(224,244,255,0.82) 100%)',
        }
      case 'XP':
      default:
        return {
          borderColor: 'rgba(167,139,250,0.18)',
          backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(239,235,255,0.84) 100%)',
        }
    }
  }
  const consistencyPillStyle = {
    background: 'rgba(255,255,255,0.52)',
    backdropFilter: 'blur(12px)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.85)',
  }
  const heroSurfaceStyle = {
    borderColor: 'rgba(255,255,255,0.72)',
    backgroundImage: 'radial-gradient(circle at 14% 18%, rgba(125,211,252,0.34), transparent 28%), radial-gradient(circle at 86% 14%, rgba(253,224,71,0.24), transparent 26%), radial-gradient(circle at 74% 18%, rgba(255,255,255,0.9), transparent 18%), repeating-linear-gradient(135deg, rgba(255,255,255,0.16) 0 1px, transparent 1px 20px), linear-gradient(180deg, rgba(255,255,255,0.94) 0%, rgba(247,244,235,0.82) 42%, rgba(232,239,251,0.8) 100%)',
    boxShadow: '0 34px 60px -36px rgba(125,146,175,0.42), inset 0 1px 0 rgba(255,255,255,0.92)',
  }
  const heroLeagueChipStyle = {
    borderColor: `${currentLeagueTier.theme.highlight}24`,
    backgroundImage: `radial-gradient(circle at 100% 0%, ${currentLeagueTier.theme.highlight}18, transparent 52%), linear-gradient(135deg, rgba(255,255,255,0.88) 0%, ${currentLeagueTier.theme.accentSoft} 100%)`,
  }
  // Practice with Nova — vivid violet/fuchsia liquid glass (LIGHT)
  const novaSurfaceStyle = {
    background: 'linear-gradient(135deg, rgba(167,139,250,0.62) 0%, rgba(192,132,252,0.48) 45%, rgba(236,72,153,0.32) 75%, rgba(186,230,253,0.38) 100%)',
    backdropFilter: 'blur(28px) saturate(180%)',
    WebkitBackdropFilter: 'blur(28px) saturate(180%)',
    boxShadow: '0 32px 64px -28px rgba(124,58,237,0.38), inset 0 1px 0 rgba(255,255,255,0.65)',
  }
  const novaFrostStyle = {
    background: 'rgba(255,255,255,0.52)',
    backdropFilter: 'blur(14px)',
  }
  const novaMetricStyle = {
    background: 'rgba(255,255,255,0.42)',
    backdropFilter: 'blur(14px) saturate(160%)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.75)',
  }
  const leagueSurfaceStyle = {
    borderColor: `${currentLeagueTier.theme.highlight}1f`,
    backgroundImage: `radial-gradient(circle at 18% 14%, ${currentLeagueTier.theme.highlight}24, transparent 26%), radial-gradient(circle at 84% 12%, ${currentLeagueTier.theme.accent}1f, transparent 24%), radial-gradient(circle at 64% 56%, rgba(255,255,255,0.04), transparent 34%), ${currentLeagueTier.theme.ambience}, ${currentLeagueTier.theme.texture}, ${currentLeagueTier.theme.haze}, linear-gradient(180deg, rgba(7,12,21,0.12) 0%, rgba(4,8,16,0.34) 100%)`,
    boxShadow: `0 34px 64px -38px rgba(15,23,42,0.72), 0 0 0 1px ${currentLeagueTier.theme.highlight}12, inset 0 1px 0 rgba(255,255,255,0.06)`,
  }
  const leagueLandscapeStyle = {
    backgroundImage: currentLeagueTier.theme.landscape,
  }
  const leagueChipStyle = {
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundImage: `radial-gradient(circle at 100% 0%, ${currentLeagueTier.theme.highlight}18, transparent 54%), linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(148,163,184,0.12) 100%)`,
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 18px 32px -26px rgba(2,6,23,0.72)',
  }
  const leagueDetailStyle = {
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundImage: `radial-gradient(circle at 100% 0%, ${currentLeagueTier.theme.highlight}18, transparent 42%), radial-gradient(circle at 0% 100%, ${currentLeagueTier.theme.accent}18, transparent 42%), ${currentLeagueTier.theme.panel}, linear-gradient(180deg, rgba(38,46,62,0.94) 0%, rgba(18,24,38,0.86) 100%)`,
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 22px 42px -30px rgba(2,6,23,0.78)',
  }
  const leagueBadgeTileStyle = {
    borderColor: 'rgba(255,255,255,0.06)',
    backgroundImage: `radial-gradient(circle at 24% 22%, ${currentLeagueTier.theme.highlight}16, transparent 34%), linear-gradient(180deg, rgba(40,49,66,0.96) 0%, rgba(24,31,46,0.92) 100%)`,
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 24px 34px -28px rgba(2,6,23,0.92)',
  }
  const leagueActionStyle = {
    backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(241,245,249,0.94) 100%)',
    boxShadow: '0 20px 30px -22px rgba(15,23,42,0.84), inset 0 1px 0 rgba(255,255,255,0.9)',
  }
  const headerSurfaceStyle = {
    backgroundImage: isDark
      ? 'radial-gradient(circle at 12% 20%, rgba(56,189,248,0.12), transparent 28%), radial-gradient(circle at 84% 14%, rgba(148,163,184,0.12), transparent 24%), linear-gradient(180deg, rgba(22,29,44,0.18) 0%, rgba(7,11,20,0.04) 100%), var(--glass-bg)'
      : 'radial-gradient(circle at 12% 20%, rgba(125,211,252,0.2), transparent 26%), radial-gradient(circle at 84% 14%, rgba(196,181,253,0.16), transparent 22%), linear-gradient(180deg, rgba(255,255,255,0.84) 0%, rgba(236,244,255,0.58) 100%), var(--glass-bg)',
  }
  const continueSurfaceStyle = {
    backgroundImage: isDark
      ? 'radial-gradient(circle at 14% 84%, rgba(34,211,238,0.14), transparent 26%), radial-gradient(circle at 82% 12%, rgba(59,130,246,0.12), transparent 22%), linear-gradient(180deg, rgba(15,24,39,0.24) 0%, rgba(6,10,18,0.08) 100%), var(--glass-bg)'
      : 'radial-gradient(circle at 14% 84%, rgba(103,232,249,0.2), transparent 28%), radial-gradient(circle at 82% 12%, rgba(96,165,250,0.18), transparent 24%), linear-gradient(180deg, rgba(255,255,255,0.84) 0%, rgba(232,244,255,0.56) 100%), var(--glass-bg)',
  }
  const recommendationsSurfaceStyle = {
    backgroundImage: isDark
      ? 'radial-gradient(circle at 10% 16%, rgba(251,191,36,0.12), transparent 24%), radial-gradient(circle at 84% 16%, rgba(244,114,182,0.1), transparent 22%), radial-gradient(circle at 50% 100%, rgba(59,130,246,0.08), transparent 32%), linear-gradient(180deg, rgba(20,20,30,0.2) 0%, rgba(7,10,18,0.06) 100%), var(--glass-bg)'
      : 'radial-gradient(circle at 10% 16%, rgba(251,191,36,0.22), transparent 24%), radial-gradient(circle at 84% 16%, rgba(244,114,182,0.14), transparent 22%), radial-gradient(circle at 50% 100%, rgba(96,165,250,0.12), transparent 34%), linear-gradient(180deg, rgba(255,255,255,0.84) 0%, rgba(255,246,228,0.58) 100%), var(--glass-bg)',
  }
  const recommendationCardStyle = {
    backgroundImage: isDark
      ? 'radial-gradient(circle at 100% 0%, rgba(96,165,250,0.1), transparent 42%), linear-gradient(180deg, rgba(29,36,54,0.82) 0%, rgba(12,18,32,0.68) 100%)'
      : 'radial-gradient(circle at 100% 0%, rgba(96,165,250,0.12), transparent 42%), linear-gradient(180deg, rgba(255,255,255,0.8) 0%, rgba(240,245,255,0.56) 100%)',
  }
  const badgesSurfaceStyle = {
    backgroundImage: isDark
      ? 'radial-gradient(circle at 12% 18%, rgba(251,191,36,0.1), transparent 24%), radial-gradient(circle at 88% 12%, rgba(99,102,241,0.1), transparent 24%), linear-gradient(180deg, rgba(36,31,33,0.66) 0%, rgba(17,18,28,0.72) 100%)'
      : 'radial-gradient(circle at 12% 18%, rgba(251,191,36,0.16), transparent 24%), radial-gradient(circle at 88% 12%, rgba(99,102,241,0.14), transparent 24%), linear-gradient(180deg, rgba(255,255,255,0.84) 0%, rgba(244,245,255,0.58) 100%)',
  }
  const consistencySurfaceStyle = {
    background: 'linear-gradient(135deg, rgba(251,191,36,0.65) 0%, rgba(249,115,22,0.46) 55%, rgba(253,230,138,0.38) 100%)',
    backdropFilter: 'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    boxShadow: '0 20px 48px -20px rgba(234,88,12,0.38), inset 0 1px 0 rgba(255,255,255,0.60)',
  }
  const badgeTileStyle = {
    backgroundImage: isDark
      ? 'radial-gradient(circle at 100% 0%, rgba(251,191,36,0.12), transparent 44%), linear-gradient(180deg, rgba(38,34,42,0.86) 0%, rgba(20,20,30,0.72) 100%)'
      : 'radial-gradient(circle at 100% 0%, rgba(251,191,36,0.14), transparent 44%), linear-gradient(180deg, rgba(255,255,255,0.8) 0%, rgba(247,244,255,0.58) 100%)',
  }
  const getRecommendationToneStyle = (skillCategory: SkillCategory) => {
    switch (skillCategory) {
      case 'communication':
        return {
          borderColor: isDark ? 'rgba(244,114,182,0.18)' : 'rgba(244,114,182,0.24)',
          backgroundImage: isDark
            ? 'radial-gradient(circle at 0% 0%, rgba(244,114,182,0.16), transparent 34%), linear-gradient(180deg, rgba(52,28,46,0.82) 0%, rgba(24,18,32,0.72) 100%)'
            : 'radial-gradient(circle at 0% 0%, rgba(244,114,182,0.18), transparent 34%), linear-gradient(180deg, rgba(255,255,255,0.82) 0%, rgba(255,240,247,0.6) 100%)',
        }
      case 'technical':
        return {
          borderColor: isDark ? 'rgba(96,165,250,0.18)' : 'rgba(96,165,250,0.24)',
          backgroundImage: isDark
            ? 'radial-gradient(circle at 0% 0%, rgba(96,165,250,0.16), transparent 34%), linear-gradient(180deg, rgba(24,36,54,0.82) 0%, rgba(14,20,34,0.72) 100%)'
            : 'radial-gradient(circle at 0% 0%, rgba(96,165,250,0.18), transparent 34%), linear-gradient(180deg, rgba(255,255,255,0.82) 0%, rgba(236,245,255,0.62) 100%)',
        }
      case 'leadership':
        return {
          borderColor: isDark ? 'rgba(251,191,36,0.18)' : 'rgba(251,191,36,0.24)',
          backgroundImage: isDark
            ? 'radial-gradient(circle at 0% 0%, rgba(251,191,36,0.16), transparent 34%), linear-gradient(180deg, rgba(54,39,20,0.82) 0%, rgba(30,20,14,0.72) 100%)'
            : 'radial-gradient(circle at 0% 0%, rgba(251,191,36,0.18), transparent 34%), linear-gradient(180deg, rgba(255,255,255,0.82) 0%, rgba(255,247,231,0.62) 100%)',
        }
      case 'compliance':
        return {
          borderColor: isDark ? 'rgba(52,211,153,0.18)' : 'rgba(52,211,153,0.24)',
          backgroundImage: isDark
            ? 'radial-gradient(circle at 0% 0%, rgba(52,211,153,0.16), transparent 34%), linear-gradient(180deg, rgba(20,47,44,0.82) 0%, rgba(14,28,24,0.72) 100%)'
            : 'radial-gradient(circle at 0% 0%, rgba(52,211,153,0.18), transparent 34%), linear-gradient(180deg, rgba(255,255,255,0.82) 0%, rgba(235,251,247,0.62) 100%)',
        }
      default:
        return recommendationCardStyle
    }
  }

  const getRevealProps = (delay = 0) => {
    if (prefersReducedMotion) {
      return {
        initial: { opacity: 1, y: 0, scale: 1 },
        animate: { opacity: 1, y: 0, scale: 1 },
        transition: { duration: 0 },
      }
    }

    return {
      initial: { opacity: 0, y: 18, scale: 0.985 },
      animate: { opacity: 1, y: 0, scale: 1 },
      transition: { type: 'spring' as const, stiffness: 230, damping: 24, delay },
    }
  }

  const hoverLift = prefersReducedMotion ? undefined : { y: -4, scale: 1.01 }
  const subtleHover = prefersReducedMotion ? undefined : { y: -2 }
  const pressDown = prefersReducedMotion ? undefined : { scale: 0.985 }

  return (
    <div className="relative min-h-screen overflow-x-hidden pb-32">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[28rem]">
        <div className="absolute left-[-4rem] top-[-3rem] h-56 w-56 rounded-full bg-sky-300/30 blur-3xl dark:bg-sky-500/14" />
        <div className="absolute right-[-3rem] top-10 h-60 w-60 rounded-full bg-white/80 blur-3xl dark:bg-indigo-400/12" />
        <div className="absolute left-1/2 top-32 h-48 w-48 -translate-x-1/2 rounded-full bg-cyan-200/35 blur-3xl dark:bg-cyan-400/10" />
      </div>
      {/* XP Toast */}
      {xpToast && (
        <XPToast key={xpToast.id} xp={xpToast.xp} label={xpToast.label} onDone={() => setXpToast(null)} />
      )}
      <CelebrationConfetti burst={celebrationBurst} />

      {shareDraft && (
        <ShareComposerModal
          draft={shareDraft}
            onClose={() => setShareDraft(null)}
            onPost={handlePostShareDraft}
          />
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 px-4 pt-4">
        <motion.div
          {...getRevealProps(0.03)}
          className="ios-shell relative overflow-hidden rounded-[2rem] px-4 py-3"
          style={headerSurfaceStyle}
        >
          <div className="absolute inset-x-10 top-0 h-px rounded-full bg-white/75 dark:bg-white/20" />
          <div className="absolute -left-10 top-0 h-20 w-24 rounded-full bg-sky-200/50 blur-3xl dark:bg-sky-400/10" />
          <div className="absolute right-0 top-0 h-20 w-28 rounded-full bg-white/70 blur-3xl dark:bg-indigo-400/12" />

          <div className="relative flex items-center justify-between gap-3">
            <motion.button
              whileHover={subtleHover}
              whileTap={pressDown}
              onClick={() => handleTabChange('profile')}
              className="flex min-w-0 items-center gap-3 text-left"
            >
              <img
                src={user.avatar || '/placeholder.svg'}
                alt={user.name}
                className="h-12 w-12 rounded-[1.1rem] object-cover ring-1 ring-white/70 shadow-[0_14px_28px_-18px_rgba(15,23,42,0.4)]"
              />
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground/80">Dashboard</p>
                <h1 className="truncate text-[1.08rem] font-bold tracking-[-0.03em] text-foreground">
                  {firstName}
                </h1>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>Level {user.level}</span>
                  <span className="h-1 w-1 rounded-full bg-foreground/20" />
                  <span>{currentLeagueTier.name} tier</span>
                </div>
              </div>
            </motion.button>

            <div className="flex items-center gap-2">
              <div className="ios-frost hidden rounded-full px-3 py-2 sm:flex sm:items-center sm:gap-2">
                <Flame className="h-4 w-4 text-amber-500" />
                <div className="leading-none">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Streak</p>
                  <p className="mt-1 text-sm font-semibold tracking-[-0.02em] text-foreground">{user.streak} days</p>
                </div>
              </div>

              <div className="ios-frost hidden rounded-full px-3 py-2 md:flex md:items-center md:gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <div className="leading-none">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">XP</p>
                  <p className="mt-1 text-sm font-semibold tracking-[-0.02em] text-foreground">{user.xp.toLocaleString()}</p>
                </div>
              </div>

              <motion.button
                whileHover={subtleHover}
                whileTap={pressDown}
                onClick={toggleTheme}
                className="ios-icon-button flex h-11 w-11 items-center justify-center rounded-full text-foreground transition-colors"
              >
                {isDark ? <Sun className="h-[1.05rem] w-[1.05rem]" /> : <Moon className="h-[1.05rem] w-[1.05rem]" />}
              </motion.button>

              <motion.button
                whileHover={subtleHover}
                whileTap={pressDown}
                onClick={() => {
                  showMascot({
                    trigger: 'chat',
                    title: 'Nova is online',
                    message: 'Ask Nova what to do next, where you are weak, or how to keep the streak alive.',
                    emotion: 'excited',
                    openChat: true,
                  })
                }}
                className="ios-icon-button relative flex h-11 w-11 items-center justify-center rounded-full text-foreground transition-colors"
              >
                <Bell className="h-[1.05rem] w-[1.05rem]" />
                <span className="absolute right-[0.72rem] top-[0.72rem] h-2.5 w-2.5 rounded-full bg-destructive shadow-[0_0_0_4px_rgba(255,255,255,0.68)] dark:shadow-[0_0_0_4px_rgba(15,23,42,0.42)]" />
              </motion.button>
            </div>
          </div>
        </motion.div>
      </header>

      {/* ── Home Tab ── */}
      {activeTab === 'home' && (
        <div className="space-y-5 px-4 pb-6 pt-3">
          <motion.section
            {...getRevealProps(0.08)}
            className="ios-shell relative overflow-hidden rounded-[2.35rem] p-5 sm:p-6"
            style={heroSurfaceStyle}
          >
            <div className="absolute inset-x-10 top-0 h-px rounded-full bg-white/75 dark:bg-white/18" />
            <div className="absolute -left-16 top-0 h-36 w-36 rounded-full blur-3xl" style={{ background: isDark ? 'rgba(56,189,248,0.18)' : 'rgba(125,211,252,0.52)' }} />
            <div className="absolute right-0 top-0 h-40 w-40 rounded-full blur-3xl" style={{ background: isDark ? 'rgba(192,132,252,0.18)' : 'rgba(253,230,138,0.4)' }} />
            <div className="absolute bottom-0 left-1/3 h-28 w-28 rounded-full blur-3xl" style={{ background: isDark ? 'rgba(251,146,60,0.12)' : 'rgba(196,181,253,0.3)' }} />

            <div className="relative grid gap-5 xl:grid-cols-[minmax(0,1.12fr)_minmax(320px,0.88fr)] xl:items-start">
              <div className="space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="max-w-xl">

                    <div className="mt-4 flex items-center gap-3">
                      <h2 className="text-[2.28rem] font-black tracking-[-0.078em] text-foreground sm:text-[2.85rem]">
                        hey {firstName.toLowerCase()}
                      </h2>
                      <motion.div
                        initial={prefersReducedMotion ? { rotate: 0, scale: 1 } : { rotate: -12, scale: 0.95 }}
                        animate={prefersReducedMotion ? { rotate: 0, scale: 1 } : { rotate: [0, 16, -10, 10, 0], scale: [1, 1.06, 1, 1.04, 1] }}
                        transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.85, delay: 0.18 }}
                        className="ios-frost flex h-9 w-9 items-center justify-center rounded-full text-[0px]"
                        style={novaFrostStyle}
                      >
                        👋
                        <Sparkles className="h-4.5 w-4.5 text-primary" />
                      </motion.div>
                    </div>
                    <p className="mt-3 max-w-2xl text-[0.96rem] font-medium leading-6 text-muted-foreground">
                      Your next lesson, practice round, and progress signals are ready below without the screen feeling busy.
                    </p>
                  </div>

                  <motion.button
                    whileHover={subtleHover}
                    whileTap={pressDown}
                    onClick={() => handleTabChange('leagues')}
                    className="ios-frost flex items-center gap-2 rounded-full px-3 py-2 text-left"
                    style={heroLeagueChipStyle}
                  >
                    <Trophy className="h-4 w-4" style={{ color: currentLeagueTier.theme.highlight }} />
                    <div className="leading-none">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">League</p>
                      <p className="mt-1 text-sm font-semibold tracking-[-0.02em] text-foreground">{currentLeagueTier.name}</p>
                    </div>
                  </motion.button>
                </div>

                {/* Quick Stats — Apple widget style */}
                <div className="grid grid-cols-3 gap-2.5">
                  {quickStats.map(({ label, value, helper, icon: Icon, tint }, index) => (
                    <motion.div
                      key={label}
                      initial={getRevealProps(0.12 + (index * 0.05)).initial}
                      animate={getRevealProps(0.12 + (index * 0.05)).animate}
                      transition={getRevealProps(0.12 + (index * 0.05)).transition}
                      whileHover={hoverLift}
                      className="ios-frost relative overflow-hidden rounded-[1.55rem] p-3.5"
                      style={getQuickStatCardStyle(label)}
                    >
                      {/* Icon row */}
                      <div className="flex items-center justify-between">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full" style={getQuickStatIconShellStyle(label)}>
                          <Icon className={cn('h-4 w-4', tint)} />
                        </div>
                        <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-muted-foreground/80">{label}</p>
                      </div>
                      {/* Big number */}
                      <p className="mt-3 text-[1.65rem] font-black leading-none tracking-[-0.06em] text-foreground">
                        {value}
                      </p>
                      <p className="mt-1.5 text-[10px] font-medium leading-tight text-muted-foreground line-clamp-2">{helper}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Consistency — wide bold number treatment */}
                <div className="ios-frost rounded-[1.7rem] px-4 py-3.5" style={consistencySurfaceStyle}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-[0.26em] text-muted-foreground">Consistency</p>
                      <p className="mt-1.5 text-[1.55rem] font-black leading-none tracking-[-0.06em] text-foreground">
                        {Math.min(user.streak, 7)}<span className="text-base font-semibold text-muted-foreground">/7</span>
                      </p>
                      <p className="mt-1 text-[11px] font-medium text-muted-foreground">days lit this week</p>
                    </div>
                    <div className="rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-foreground" style={consistencyPillStyle}>
                      +50 XP daily
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-7 gap-1.5">
                    {streakDays.map((day, index) => {
                      const isActive = index < Math.min(user.streak, 7)

                      return (
                        <motion.div
                          key={`${day}-${index}`}
                          whileHover={subtleHover}
                          className={cn(
                            'rounded-[1.1rem] border py-2.5 text-center transition-colors',
                            isActive
                              ? 'border-white/80 bg-white/80 text-foreground shadow-[0_10px_22px_-16px_rgba(59,130,246,0.45)] dark:border-white/10 dark:bg-slate-900/76 dark:text-white'
                              : 'border-white/40 bg-white/25 text-muted-foreground dark:border-white/8 dark:bg-slate-950/55'
                          )}
                        >
                          <p className="text-[9px] font-bold uppercase tracking-[0.12em]">{day}</p>
                          <Flame className={cn('mx-auto mt-1.5 h-3 w-3', isActive ? 'text-amber-500' : 'text-muted-foreground/40')} />
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {inProgressCourse ? (
                <motion.button
                  whileHover={hoverLift}
                  whileTap={pressDown}
                  onClick={() => handleContinueLearning(inProgressCourse.id)}
                  className="ios-frost group relative overflow-hidden rounded-[2rem] p-4 text-left"
                  style={continueSurfaceStyle}
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.75),transparent_34%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_34%)]" />
                  <div className="relative">
                    <div className="relative overflow-hidden rounded-[1.55rem]">
                      <img
                        src={inProgressCourse.thumbnail || '/placeholder.svg'}
                        alt={inProgressCourse.title}
                        className="h-44 w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/82 via-slate-950/30 to-transparent" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <div className="inline-flex items-center gap-2 rounded-full bg-white/18 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white backdrop-blur-md">
                          <Play className="h-3.5 w-3.5 fill-white" />
                          Continue learning
                        </div>
                        <h3 className="mt-3 text-[1.55rem] font-black leading-tight tracking-[-0.055em] text-white">
                          {inProgressCourse.title}
                        </h3>
                        <p className="mt-1 text-sm text-white/78">
                          {nextEpisode ? `Next episode: ${nextEpisode.title}` : 'Your next lesson is ready.'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-[0.26em] text-muted-foreground">Course progress</p>
                          <p className="mt-1.5 text-[1.55rem] font-black leading-none tracking-[-0.06em] text-foreground">
                            {progressEpisodes}<span className="text-sm font-semibold text-muted-foreground">/{inProgressCourse.episodes.length} eps</span>
                          </p>
                        </div>
                        <div className="rounded-[1.15rem] border bg-white/70 px-4 py-2.5 text-right shadow-[inset_0_1px_0_rgba(255,255,255,0.88)] dark:bg-slate-900/76 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                          <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-muted-foreground">Done</p>
                          <p className="mt-1 text-[1.42rem] font-black leading-none tracking-[-0.055em] text-foreground">
                            {Math.round(courseProgressPercent)}%
                          </p>
                        </div>
                      </div>

                      <div className="h-2 rounded-full bg-white/55 dark:bg-white/8">
                        <motion.div
                          initial={{ width: prefersReducedMotion ? `${courseProgressPercent}%` : 0 }}
                          animate={{ width: `${courseProgressPercent}%` }}
                          transition={prefersReducedMotion ? { duration: 0 } : { delay: 0.24, duration: 0.7, ease: 'easeOut' }}
                          className="h-full rounded-full bg-gradient-to-r from-primary via-accent to-sky-300"
                        />
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4 shrink-0" />
                          <span className="truncate">{nextEpisode ? nextEpisode.title : 'Course ready to resume'}</span>
                        </div>
                        <div className="flex items-center gap-2 rounded-full bg-white/70 px-3 py-2 text-sm font-semibold text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.88)] dark:bg-slate-900/82 dark:text-white dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                          <span>{nextEpisode ? `+${nextEpisode.xp} XP` : 'Resume now'}</span>
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.button>
              ) : (
                <motion.button
                  whileHover={hoverLift}
                  whileTap={pressDown}
                  onClick={() => handleTabChange('courses')}
                  className="ios-frost flex min-h-[22rem] items-center justify-center rounded-[2rem] p-5 text-left"
                >
                  <div className="max-w-sm text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Courses</p>
                    <h3 className="mt-4 text-3xl font-semibold tracking-[-0.06em] text-foreground">Your next path is ready.</h3>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                      Jump into the next course and keep the streak moving without losing momentum.
                    </p>
                  </div>
                </motion.button>
              )}
            </div>
          </motion.section>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.04fr)_minmax(300px,0.96fr)]">
            <motion.div {...getRevealProps(0.16)} whileHover={hoverLift}>
              <DailyGoals user={user} />
            </motion.div>

            <motion.button
              {...getRevealProps(0.2)}
              whileHover={hoverLift}
              whileTap={pressDown}
              onClick={openAIPracticeCoach}
              className="ios-shell relative overflow-hidden rounded-[2.15rem] p-4 text-left"
              style={novaSurfaceStyle}
            >
              <div className="absolute -right-8 top-0 h-32 w-32 rounded-full blur-3xl" style={{ background: isDark ? 'rgba(168,85,247,0.2)' : 'rgba(196,181,253,0.56)' }} />
              <div className="absolute bottom-0 left-0 h-28 w-28 rounded-full blur-3xl" style={{ background: isDark ? 'rgba(34,211,238,0.14)' : 'rgba(125,211,252,0.48)' }} />
              <div className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl" style={{ background: isDark ? 'rgba(236,72,153,0.1)' : 'rgba(244,114,182,0.14)' }} />

              <div className="relative">
                <div className="flex items-start justify-between gap-3">
                  <div className="ios-frost flex h-12 w-12 items-center justify-center rounded-[1.3rem]" style={novaFrostStyle}>
                    <Brain className="h-6 w-6 text-violet-500" />
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="ios-frost flex h-11 w-11 items-center justify-center rounded-full" style={novaFrostStyle}>
                      <div className="flex items-end gap-0.5">
                        <span className="h-2.5 w-1 rounded-full bg-violet-500/65" />
                        <span className="h-4 w-1 rounded-full bg-fuchsia-500/75" />
                        <span className="h-3 w-1 rounded-full bg-sky-500/70" />
                      </div>
                    </div>
                    <div className="ios-frost rounded-full px-3 py-2 text-right" style={novaFrostStyle}>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Current focus</p>
                      <p className="mt-1 text-sm font-semibold tracking-[-0.02em] text-foreground">
                        {skillProfile.weakAreas[0] ? skillProfile.weakAreas[0].charAt(0).toUpperCase() + skillProfile.weakAreas[0].slice(1) : 'All skills'}
                      </p>
                    </div>
                  </div>
                </div>

                <h3 className="mt-4 text-[2.05rem] font-black leading-[0.9] tracking-[-0.07em] text-foreground uppercase">
                  Practice<br />with Nova
                </h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Run a guided roleplay, get feedback immediately, and keep your readiness signal moving in the right direction.
                </p>

                <div className="mt-4 grid grid-cols-3 gap-2.5">
                  <div className="ios-frost rounded-[1.25rem] px-3 py-2.5" style={novaMetricStyle}>
                    <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-muted-foreground">Readiness</p>
                    <p className="mt-2 text-[1.42rem] font-black leading-none tracking-[-0.055em] text-foreground">{skillProfile.readinessScore}<span className="text-xs font-bold text-muted-foreground">%</span></p>
                  </div>
                  <div className="ios-frost rounded-[1.25rem] px-3 py-2.5" style={novaMetricStyle}>
                    <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-muted-foreground">Gap</p>
                    <p className="mt-2 text-[1.42rem] font-black leading-none tracking-[-0.055em] text-foreground">
                      {skillProfile.weakAreas[0] ? skillProfile.skillGapByCategory[skillProfile.weakAreas[0]] : 0}<span className="text-xs font-bold text-muted-foreground">%</span>
                    </p>
                  </div>
                  <div className="ios-frost rounded-[1.25rem] px-3 py-2.5" style={novaMetricStyle}>
                    <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-muted-foreground">Signals</p>
                    <p className="mt-2 text-[1.42rem] font-black leading-none tracking-[-0.055em] text-foreground">{skillProfile.competencyHistory.length}</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-violet-950/55">+50 XP each session</p>
                  <div
                    className="flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold text-violet-900"
                    style={{ background: 'rgba(255,255,255,0.62)', backdropFilter: 'blur(14px)', boxShadow: '0 8px 24px -10px rgba(124,58,237,0.28), inset 0 1px 0 rgba(255,255,255,0.9)' }}
                  >
                    Start session
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </motion.button>
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)]">
            <motion.button
              {...getRevealProps(0.24)}
              whileHover={hoverLift}
              whileTap={pressDown}
              onClick={() => handleTabChange('leagues')}
              className="ios-shell relative overflow-hidden rounded-[2.15rem] p-5 text-left"
              style={leagueSurfaceStyle}
            >
              <div className="absolute inset-x-0 bottom-0 h-28 opacity-70" style={leagueLandscapeStyle} />
              <div className="absolute -left-12 top-6 h-40 w-40 rounded-full blur-3xl" style={{ background: `${currentLeagueTier.theme.accent}20` }} />
              <div className="absolute right-0 top-8 h-36 w-36 rounded-full blur-3xl" style={{ background: `${currentLeagueTier.theme.highlight}2b` }} />
              <div className="absolute left-[46%] top-[55%] h-4 w-4 rounded-full border border-white/10" />
              <div className="absolute right-14 top-[70%] h-3.5 w-3.5 rounded-full border border-white/10" />

              <div className="relative grid gap-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/88" style={leagueChipStyle}>
                    <Trophy className="h-3.5 w-3.5" style={{ color: currentLeagueTier.theme.highlight }} />
                    {currentLeagueTier.name}
                  </div>
                  <div className="flex h-24 w-24 items-center justify-center rounded-[1.8rem] border" style={leagueBadgeTileStyle}>
                    <Trophy className="h-9 w-9" style={{ color: currentLeagueTier.theme.text }} />
                  </div>
                </div>

                <div className="max-w-[18.5rem]">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-white/42">
                    {currentLeagueTier.headline}
                  </p>
                  <h3 className="mt-3 text-[2.85rem] font-black uppercase leading-[0.88] tracking-[-0.08em] text-white">
                    {currentLeagueTier.name}
                    <br />
                    League
                  </h3>
                  <p className="mt-4 text-[0.98rem] leading-8 text-white/72">
                    {getLeagueHomeCopy(currentLeagueTier, nextLeagueTier)}
                  </p>
                </div>

                <div className="relative overflow-hidden rounded-[1.6rem] border p-4 backdrop-blur-xl" style={leagueDetailStyle}>
                  <div className="absolute inset-x-0 top-0 h-px bg-white/10" />
                  <div className="absolute -right-10 top-0 h-24 w-24 rounded-full blur-3xl" style={{ background: `${currentLeagueTier.theme.highlight}18` }} />

                  <div className="relative flex items-end justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/42">
                        {nextLeagueTier ? `On the way to ${nextLeagueTier.name}` : 'Top tier status'}
                      </p>
                      <p className="mt-2 text-[1.6rem] font-black tracking-[-0.06em] text-white">
                        {nextLeagueTier ? `${nextLeagueTier.progress}% to ${nextLeagueTier.name}` : 'Top tier reached'}
                      </p>
                      <div className="mt-2 flex items-center gap-2 text-sm font-medium text-white/62">
                        <Users className="h-4 w-4" style={{ color: currentLeagueTier.theme.highlight }} />
                        <span>{nextLeagueTier ? getLeagueHomeFocus(primaryLeagueFocus) : 'Every milestone is already secured.'}</span>
                      </div>
                    </div>

                    <div className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-3 text-sm font-semibold text-slate-950" style={leagueActionStyle}>
                      See ladder
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.button>

            <motion.div {...getRevealProps(0.28)} className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Profile signal</p>
                  <h3 className="mt-1 text-lg font-bold tracking-[-0.04em] text-foreground">Sales readiness</h3>
                </div>
                <motion.button
                  whileHover={subtleHover}
                  whileTap={pressDown}
                  onClick={() => handleTabChange('profile')}
                  className="flex items-center gap-1 text-sm font-medium text-primary"
                >
                  View details
                  <ChevronRight className="h-4 w-4" />
                </motion.button>
              </div>
              <motion.div whileHover={hoverLift}>
                <SkillRadar profile={skillProfile} compact />
              </motion.div>
            </motion.div>
          </div>

          <motion.section
            {...getRevealProps(0.32)}
            whileHover={hoverLift}
            className="ios-shell relative overflow-hidden rounded-[2.15rem] p-5"
            style={recommendationsSurfaceStyle}
          >
            <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-amber-200/40 blur-3xl dark:bg-amber-500/10" />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Continue improving</p>
                <h3 className="mt-1 text-[1.55rem] font-bold tracking-[-0.05em] text-foreground">
                  Recommendations and recent wins
                </h3>
              </div>

              <motion.button
                whileHover={subtleHover}
                whileTap={pressDown}
                onClick={() => handleTabChange('courses')}
                className="flex items-center gap-1 text-sm font-medium text-primary"
              >
                View all courses
                <ChevronRight className="h-4 w-4" />
              </motion.button>
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(280px,0.92fr)]">
              <div className="space-y-3">
                {recommendationCards.length > 0 ? recommendationCards.map((rec, index) => (
                  <motion.button
                    key={rec.id}
                    initial={getRevealProps(0.36 + (index * 0.04)).initial}
                    animate={getRevealProps(0.36 + (index * 0.04)).animate}
                    transition={getRevealProps(0.36 + (index * 0.04)).transition}
                    whileHover={hoverLift}
                    whileTap={pressDown}
                    onClick={() => handleContinueLearning(rec.id)}
                    className="ios-frost group flex w-full items-center gap-3 rounded-[1.55rem] p-3 text-left"
                    style={recommendationCardStyle}
                  >
                    <div className="relative h-16 w-16 overflow-hidden rounded-[1.15rem]">
                      <img
                        src={rec.thumbnail || '/placeholder.svg'}
                        alt={rec.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="h-3.5 w-3.5 text-primary" />
                        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          Improve {rec.skillCategory}
                        </span>
                      </div>
                      <h4 className="mt-1 truncate text-base font-semibold tracking-[-0.03em] text-foreground">{rec.title}</h4>
                      <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {rec.totalDuration}
                        </span>
                        <span className="font-semibold text-primary">+{rec.xpReward} XP</span>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-300 group-hover:translate-x-0.5" />
                  </motion.button>
                )) : (
                  <div className="ios-frost rounded-[1.55rem] p-4">
                    <p className="text-sm font-medium text-muted-foreground">No recommendations right now. You&apos;re in a great place to explore new courses.</p>
                  </div>
                )}
              </div>

              <div className="ios-frost rounded-[1.8rem] p-4" style={badgesSurfaceStyle}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Recent badges</p>
                    <p className="mt-1 text-base font-bold tracking-[-0.03em] text-foreground">Unlocked momentum</p>
                  </div>
                  <motion.button
                    whileHover={subtleHover}
                    whileTap={pressDown}
                    onClick={() => handleTabChange('profile')}
                    className="text-sm font-medium text-primary"
                  >
                    View all
                  </motion.button>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-2">
                  {unlockedBadges.slice(0, 4).map((badge, index) => (
                    <motion.div
                      key={badge.id}
                      initial={getRevealProps(0.4 + (index * 0.03)).initial}
                      animate={getRevealProps(0.4 + (index * 0.03)).animate}
                      transition={getRevealProps(0.4 + (index * 0.03)).transition}
                      whileHover={subtleHover}
                      className="rounded-[1.35rem] border border-white/60 bg-white/55 px-3 py-4 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.86)] dark:border-white/10 dark:bg-white/8"
                    >
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[1rem] bg-gradient-to-br from-primary/18 via-white/70 to-accent/20 text-2xl shadow-[0_14px_24px_-18px_rgba(59,130,246,0.35)] dark:from-primary/24 dark:via-white/8 dark:to-accent/18">
                        {badge.icon}
                      </div>
                      <p className="mt-3 line-clamp-2 text-[11px] font-semibold leading-4 text-muted-foreground">
                        {badge.name}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.section>

          <div className="hidden">
          {/* Continue Learning */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-lg">Continue Learning</h2>
              <button
                onClick={() => handleTabChange('courses')}
                className="text-sm text-primary flex items-center gap-1"
              >
                All Courses <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            {inProgressCourse && (() => {
              const completedEps = inProgressCourse.episodes.filter(e => e.completed).length
              const nextEp = inProgressCourse.episodes.find(e => !e.completed && !e.locked)
              const pct = (completedEps / inProgressCourse.episodes.length) * 100
              return (
                <div
                  className="glass-card rounded-2xl overflow-hidden cursor-pointer hover:bg-secondary/30 transition-all active:scale-[0.99]"
                  onClick={() => handleContinueLearning(inProgressCourse.id)}
                >
                  <div className="relative h-32">
                    <img
                      src={inProgressCourse.thumbnail || '/placeholder.svg'}
                      alt={inProgressCourse.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-14">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/60 text-white font-medium">
                        {inProgressCourse.category}
                      </span>
                      <h3 className="text-white font-bold mt-1">{inProgressCourse.title}</h3>
                    </div>
                    {/* ▶ Play button — clearly tappable */}
                    <div className="absolute top-1/2 right-4 -translate-y-1/2">
                      <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg ring-4 ring-primary/30">
                        <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                      </div>
                    </div>
                  </div>
                  <div className="px-3 py-2.5">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                      <span>{completedEps}/{inProgressCourse.episodes.length} episodes</span>
                      <span className="font-semibold text-primary">{Math.round(pct)}% complete</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-1.5 mb-2">
                      <div className="h-full bg-gradient-to-r from-primary to-accent rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    {nextEp && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground">Next:</span>
                        <span className="font-medium truncate">{nextEp.title}</span>
                        <span className="text-primary font-semibold ml-auto flex-shrink-0">+{nextEp.xp} XP</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })()}
          </section>

          {/* Sales Readiness — compact */}
	          <section>
	            <div className="mb-3 flex items-center justify-between">
	              <h2 className="flex items-center gap-2 text-lg font-bold">
	                <Trophy className="w-5 h-5 text-amber-500" />
	                League Journey
	              </h2>
	              <button onClick={() => handleTabChange('leagues')} className="flex items-center gap-1 text-sm text-primary">
	                See ladder <ChevronRight className="w-4 h-4" />
	              </button>
	            </div>

	            <button
	              onClick={() => handleTabChange('leagues')}
	              className="relative w-full overflow-hidden rounded-[28px] border border-white/10 p-5 text-left text-white shadow-[0_24px_70px_rgba(15,23,42,0.18)] transition-transform duration-300 hover:-translate-y-0.5"
	              style={{
	                backgroundImage: `${currentLeagueTier.theme.ambience}, ${currentLeagueTier.theme.texture}, ${currentLeagueTier.theme.haze}`,
	              }}
	            >
	              <div className="absolute inset-x-0 bottom-0 h-24 opacity-80" style={{ backgroundImage: currentLeagueTier.theme.landscape }} />
	              <div className="absolute -left-10 top-8 h-40 w-40 rounded-full blur-3xl" style={{ background: currentLeagueTier.theme.accentSoft }} />
	              <div className="absolute right-0 top-10 h-36 w-36 rounded-full blur-3xl" style={{ background: `${currentLeagueTier.theme.highlight}35` }} />

	              <div className="relative z-10 grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
	                <div>
	                  <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em]">
	                    <Trophy className="h-3.5 w-3.5" />
	                    {currentLeagueTier.name}
	                  </div>
	                  <h3 className="mt-4 text-3xl font-black">{currentLeagueTier.name} League</h3>
	                  <p className="mt-2 max-w-2xl text-sm leading-7 text-white/78">
	                    {getLeagueHomeCopy(currentLeagueTier, nextLeagueTier)}
	                  </p>
	                </div>

	                <div className="rounded-[24px] border border-white/10 bg-black/20 p-4 backdrop-blur-xl">
	                  <p className="text-[10px] uppercase tracking-[0.22em] text-white/45">Best next move</p>
	                  <p className="mt-2 text-2xl font-black">
	                    {getLeagueHomeFocus(primaryLeagueFocus)}
	                  </p>
	                  <p className="mt-2 text-sm text-white/70">
	                    {nextLeagueTier
	                      ? `${nextLeagueTier.progress}% of the way to ${nextLeagueTier.name}.`
	                      : 'Champion is already locked in.'}
	                  </p>
	                </div>
	              </div>
	            </button>
	          </section>

	          <section>
	            <div className="flex items-center justify-between mb-3">
	              <h2 className="font-bold text-lg">Sales Readiness</h2>
              <button onClick={() => handleTabChange('profile')} className="text-sm text-primary flex items-center gap-1">
                View Details <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <SkillRadar profile={skillProfile} compact />
          </section>

          {/* Practice CTA */}
          <section
            className="glass-card rounded-2xl p-[18px] cursor-pointer hover:bg-secondary/30 transition-all overflow-hidden relative"
            onClick={openAIPracticeCoach}
          >
            <div className="absolute top-0 right-0 h-30 w-30 bg-gradient-to-bl from-violet-500/20 to-transparent rounded-bl-full" />
            <div className="flex items-center gap-4">
              <div className="h-[52px] w-[52px] rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center flex-shrink-0">
                <Brain className="w-6 h-6 text-violet-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold">Practice with AI Coach</h3>
                <p className="text-sm text-muted-foreground">Roleplay real sales scenarios &amp; improve your skills</p>
                <div className="flex items-center gap-2 mt-1.5 text-xs">
                  <span className="bg-violet-500/10 text-violet-500 px-2 py-0.5 rounded-full font-semibold">+50 XP / session</span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </section>

          {/* Recommended */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Recommended
              </h2>
              <button onClick={() => handleTabChange('courses')} className="text-sm text-primary">View All</button>
            </div>
            <div className="space-y-3">
              {skillProfile.weakAreas.slice(0, 2).map(area => {
                const rec = courses.find(c => c.skillCategory === area && c.status !== 'completed')
                if (!rec) return null
                return (
                  <div
                    key={rec.id}
                    className="glass-card rounded-xl p-3 flex gap-3 cursor-pointer hover:bg-secondary/30 transition-all"
                    onClick={() => handleContinueLearning(rec.id)}
                  >
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                      <img src={rec.thumbnail || '/placeholder.svg'} alt={rec.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Improve {area}</span>
                      </div>
                      <h4 className="font-semibold text-sm truncate">{rec.title}</h4>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" /><span>{rec.totalDuration}</span>
                        <span className="text-primary font-medium">+{rec.xpReward} XP</span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 self-center" />
                  </div>
                )
              })}
            </div>
          </section>

          {/* Recent Badges */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-lg">Recent Badges</h2>
              <button onClick={() => handleTabChange('profile')} className="text-sm text-primary">View All</button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {user.badges.filter(b => !b.locked).slice(0, 4).map(badge => (
                <div key={badge.id} className="flex-shrink-0 w-20 glass-card rounded-xl p-3 flex flex-col items-center gap-1.5">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-xl">{badge.icon}</div>
                  <span className="text-[10px] text-center font-medium text-muted-foreground line-clamp-1 w-full">{badge.name}</span>
                </div>
              ))}
            </div>
          </section>
          </div>
        </div>
      )}

      {/* ── Courses Tab ── */}
      {activeTab === 'courses' && (
        <div className="px-4 py-4">
          <CoursesPage
            courses={courses}
            progressState={courseProgress}
            onProgressStateChange={handleCourseProgressChange}
            onSkillUpdate={handleSkillUpdate}
            onCompetencyEvent={handleCompetencyEvent}
            autoPlayCourseId={autoPlayCourseId}
            openCourseId={openCourseId}
            resumeRewardModuleId={resumeRewardModuleId}
            onLessonComplete={handleLessonComplete}
            onXPGain={handleXPGain}
            onPracticeWithAI={handlePracticeFromCourses}
            onShareGameScore={handleShareGameScore}
            onShareAssessmentResult={handleShareAssessmentResult}
            onShareModuleReward={handleShareModuleReward}
            onCelebrate={({ variant, label }) => triggerCelebration(variant, label)}
            onMascotTrigger={showMascot}
          />
        </div>
      )}

      {/* ── Practice Tab ── */}
	      {activeTab === 'leagues' && (
	        <LeagueJourneyPage
	          user={user}
	          profile={skillProfile}
	          progressState={courseProgress}
	          courses={courses}
	        />
	      )}

	      {activeTab === 'practice' && (
        practiceView === 'ai-coach' ? (
          <AIPracticeScreen
            key={aiCoachKey}
            autoStartFromPlan={aiCoachAutoStartFromPlan}
            profile={skillProfile}
            courses={courses}
            onSkillUpdate={handleSkillUpdate}
            onRoleplayComplete={handleRoleplayComplete}
            onReturnToCourseReward={handleReturnToCourseReward}
            onOpenCourse={handleOpenCourseJourney}
            onBack={() => setPracticeView('landing')}
          />
        ) : (
          <PracticeScreen
            profile={skillProfile}
            courses={courses}
            onStartPractice={handleSkillUpdate}
            onOpenCourse={handleContinueLearning}
            onOpenAICoach={openAIPracticeCoach}
          />
        )
      )}

      {/* ── Community Tab ── */}
      {activeTab === 'community' && (
        <div className="px-4 py-4">
	          <Community
	            user={user}
	            discussions={discussions}
	            achievements={sharedAchievements}
	            posts={communityPosts}
	            onDeletePost={handleDeleteCommunityPost}
	          />
	        </div>
	      )}

      {/* ── Profile Tab ── */}
      {activeTab === 'profile' && (
        <div className="px-4 py-4 space-y-6">
          <ProfileHeader user={user} />
          <section>
            <h3 className="font-bold text-lg mb-4">Skill Analytics</h3>
            <SkillRadar profile={skillProfile} />
          </section>
          <div className="space-y-3">
            <h3 className="font-bold text-lg">Statistics</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="glass-card rounded-xl p-4">
                <p className="text-3xl font-bold text-primary">{user.totalLessonsCompleted}</p>
                <p className="text-sm text-muted-foreground">Lessons Completed</p>
              </div>
              <div className="glass-card rounded-xl p-4">
                <p className="text-3xl font-bold text-xp">{user.xp.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total XP</p>
              </div>
              <div className="glass-card rounded-xl p-4">
                <p className="text-3xl font-bold text-streak">{user.streak}</p>
                <p className="text-sm text-muted-foreground">Day Streak</p>
              </div>
              <div className="glass-card rounded-xl p-4">
                <p className="text-3xl font-bold">#{user.rank}</p>
                <p className="text-sm text-muted-foreground">Global Rank</p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="font-bold text-lg">All Badges</h3>
            <BadgesGrid badges={allBadges} />
          </div>
          {/* Practice CTA from Profile */}
          <div
            className="glass-card rounded-2xl p-4 cursor-pointer hover:bg-secondary/30 transition-all flex items-center gap-4"
            onClick={openAIPracticeCoach}
          >
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
              <Brain className="w-5 h-5 text-violet-500" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">Improve weak areas with AI</p>
              <p className="text-xs text-muted-foreground">
                {skillProfile.weakAreas.length > 0
                  ? `Focus: ${skillProfile.weakAreas.map(a => a.charAt(0).toUpperCase() + a.slice(1)).join(', ')}`
                  : 'All skills on track!'}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>
          <Button variant="outline" className="w-full bg-transparent">Edit Profile</Button>
        </div>
      )}

	      {/* Bottom Navigation */}
	      <BottomNav activeTab={activeTab === 'leagues' ? 'home' : activeTab} onTabChange={handleTabChange} />
	      <MascotOverlay
	        activeTab={activeTab}
	        userName={user.name.split(' ')[0]}
        skillProfile={skillProfile}
        event={mascotEvent}
      />
    </div>
  )
}
