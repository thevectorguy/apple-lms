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
import { ShareCelebrationCard, type ShareCardData } from '@/components/lms/share-celebration-card'
import {
  currentUser, stories, allBadges, discussions, peerChallenges,
  sharedAchievements, courses, userSkillProfile,
} from '@/lib/mock-data'
import { cn } from '@/lib/utils'
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
          </div>
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
  const [mascotEvent, setMascotEvent] = useState<MascotTriggerEvent | null>(null)
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

  const toggleTheme = () => {
    const newTheme = !isDark
    setIsDark(newTheme)
    localStorage.setItem('theme', newTheme ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark', newTheme)
  }

  const triggerXPToast = useCallback((xp: number, label?: string) => {
    setXpToast({ id: Date.now(), xp, label })
  }, [])

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
  }, [activeTab, triggerXPToast])

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

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* XP Toast */}
      {xpToast && (
        <XPToast key={xpToast.id} xp={xpToast.xp} label={xpToast.label} onDone={() => setXpToast(null)} />
      )}

      {shareDraft && (
        <ShareComposerModal
          draft={shareDraft}
            onClose={() => setShareDraft(null)}
            onPost={handlePostShareDraft}
          />
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 glass">
        <div className="flex items-center justify-between px-4 py-3">
	          <div className="flex items-center gap-3">
	            <img
	              src={user.avatar || '/placeholder.svg'}
	              alt={user.name}
	              className="w-10 h-10 rounded-full object-cover border-2 border-primary/30"
	            />
	            <div>
	              <span className="font-bold text-sm">Lv.{user.level}</span>
	              <div className="mt-1 flex items-center gap-1">
	                <button
	                  onClick={() => handleTabChange('leagues')}
	                  className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] transition-colors"
	                  style={{
	                    borderColor: currentLeagueTier.theme.accentSoft,
	                    background: `${currentLeagueTier.theme.accent}18`,
	                    color: isDark ? '#ffffff' : '#0f172a',
	                  }}
	                >
	                  <Trophy className="h-3.5 w-3.5" />
	                  {currentLeagueTier.name}
	                </button>
	              </div>
	            </div>
	          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-streak/10 px-3 py-1.5 rounded-full">
              <Flame className="w-4 h-4 text-streak" />
              <span className="font-bold text-sm text-streak">{user.streak}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-primary px-3 py-1.5 rounded-full">
              <Zap className="w-4 h-4 text-primary-foreground" />
              <span className="font-bold text-sm text-primary-foreground">{user.xp.toLocaleString()}</span>
            </div>
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => {
                showMascot({
                  trigger: 'chat',
                  title: 'Nova is online',
                  message: 'Ask Nova what to do next, where you are weak, or how to keep the streak alive.',
                  emotion: 'excited',
                  openChat: true,
                })
              }}
              className="relative w-9 h-9 rounded-full bg-secondary flex items-center justify-center"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-destructive rounded-full" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Home Tab ── */}
      {activeTab === 'home' && (
        <div className="space-y-6 px-4 py-4">
          <div className="grid gap-4 lg:grid-cols-[minmax(260px,340px)_minmax(0,1fr)] lg:items-center">
            <div>
              <h1 className="text-2xl font-bold">Hey, {user.name.split(' ')[0]}!</h1>
              <p className="text-muted-foreground">Ready to level up today?</p>
            </div>

            <section className="glass-card w-full rounded-2xl px-4 py-3">
              <div className="grid gap-3 sm:grid-cols-[minmax(220px,280px)_minmax(0,1fr)] sm:items-center">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
                    <Flame className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Current Streak</p>
                    <p className="text-lg font-bold leading-tight">{user.streak} day streak</p>
                    <p className="text-xs text-muted-foreground">Keep it up. <span className="font-semibold text-primary">+50 XP daily</span></p>
                  </div>
                </div>

                <div className="grid w-full grid-cols-7 gap-1.5">
                  {['T', 'F', 'S', 'S', 'M', 'T', 'W'].map((day, idx) => {
                    const isActive = idx < Math.min(user.streak, 7)
                    return (
                      <div
                        key={idx}
                        className={cn(
                          'flex h-10 min-w-0 flex-col items-center justify-center rounded-xl transition-all',
                          isActive ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground',
                        )}
                      >
                        <Flame className="h-3.5 w-3.5" />
                        <span className="text-[10px] font-semibold leading-none">{day}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </section>
          </div>

          {/* Daily Goals */}
          <DailyGoals user={user} />

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
