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
import { getLeague, LEAGUE_INFO } from '@/lib/types'
import type {
  CompetencyEvent,
  CompetencyEventType,
  Course,
  NextStepPlan,
  SkillCategory,
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
  gameTitle: string
  courseTitle: string
  score: number
  xpEarned: number
  courseThumbnail: string
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
      <div className="w-full max-w-lg overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.98)_0%,rgba(17,24,39,0.98)_100%)] text-white shadow-[0_30px_120px_rgba(2,6,23,0.55)]">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-300/80">Share to community</p>
            <h3 className="mt-1 text-xl font-black">Your score post is ready</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-white/10 bg-white/5 p-2 text-white transition hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          <div className="overflow-hidden rounded-[1.75rem] border border-cyan-300/15 bg-slate-900/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <div className="relative h-44 overflow-hidden">
              <img
                src={draft.courseThumbnail || '/placeholder.svg'}
                alt={draft.courseTitle}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/55 to-transparent" />
              <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 py-3">
                <div className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/80 backdrop-blur-sm">
                  {draft.gameTitle}
                </div>
                <div className="rounded-full bg-emerald-400 px-3 py-1 text-sm font-black text-slate-950 shadow-lg">
                  {draft.score}%
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-0 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-300/80">Attached preview</p>
                <h4 className="mt-1 text-2xl font-black">{draft.courseTitle}</h4>
                <div className="mt-3 inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-white/85 backdrop-blur-sm">
                  +{draft.xpEarned} XP locked in
                </div>
              </div>
            </div>
          </div>

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
  const [user, setUser] = useState(currentUser)
  const [isDark, setIsDark] = useState(false)
  const [skillProfile, setSkillProfile] = useState(userSkillProfile)
  const [communityPosts, setCommunityPosts] = useState<CommunityFeedPost[]>([])
  const [shareDraft, setShareDraft] = useState<ShareComposerDraft | null>(null)
  // For "Continue Learning" direct play
  const [autoPlayCourseId, setAutoPlayCourseId] = useState<string | null>(null)
  const [openCourseId, setOpenCourseId] = useState<string | null>(null)
  const [xpToast, setXpToast] = useState<{ id: number; xp: number; label?: string } | null>(null)
  const currentLeague = getLeague(user.xp)
  const currentLeagueInfo = LEAGUE_INFO[currentLeague]

  useEffect(() => {
    const stored = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const shouldBeDark = stored === 'dark' || (!stored && prefersDark)
    setIsDark(shouldBeDark)
    document.documentElement.classList.toggle('dark', shouldBeDark)
  }, [])

  const toggleTheme = () => {
    const newTheme = !isDark
    setIsDark(newTheme)
    localStorage.setItem('theme', newTheme ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark', newTheme)
  }

  const triggerXPToast = useCallback((xp: number, label?: string) => {
    setXpToast({ id: Date.now(), xp, label })
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

  const handleSkillUpdate = useCallback((skillCategory: SkillCategory | string, score: number) => {
    const typedSkill = skillCategory as SkillCategory
    const eventType: CompetencyEventType = activeTab === 'practice' ? 'ai_practice' : 'assessment'

    handleCompetencyEvent({
      type: eventType,
      skillCategory: typedSkill,
      score,
      sourceId: activeTab === 'practice' ? 'ai-practice-session' : 'course-assessment',
      sourceTitle: activeTab === 'practice' ? 'AI practice' : 'Assessment',
    })

    const xpGain = Math.round(score * (eventType === 'ai_practice' ? 0.6 : 0.5))
    setUser(prev => ({
      ...prev,
      xp: prev.xp + xpGain,
      dailyGoals: {
        ...prev.dailyGoals,
        xpEarned: prev.dailyGoals.xpEarned + xpGain,
      },
    }))
    triggerXPToast(xpGain, eventType === 'ai_practice' ? 'from AI practice' : 'from assessment')
  }, [activeTab, handleCompetencyEvent, triggerXPToast])

  const handleXPGain = useCallback((xp: number, label = 'from practice') => {
    setUser(prev => ({
      ...prev,
      xp: prev.xp + xp,
      dailyGoals: {
        ...prev.dailyGoals,
        xpEarned: prev.dailyGoals.xpEarned + xp,
      },
    }))
    triggerXPToast(xp, label)
  }, [triggerXPToast])

  const handleLessonComplete = useCallback((xp: number) => {
    setUser(prev => ({
      ...prev,
      xp: prev.xp + xp,
      totalLessonsCompleted: prev.totalLessonsCompleted + 1,
      dailyGoals: {
        ...prev.dailyGoals,
        lessonsCompleted: prev.dailyGoals.lessonsCompleted + 1,
        xpEarned: prev.dailyGoals.xpEarned + xp,
      },
    }))
    triggerXPToast(xp, 'lesson complete!')
  }, [triggerXPToast])

  // "Continue Learning" play button → switch to Courses tab AND auto-open the course
  const handleContinueLearning = useCallback((courseId: string) => {
    setOpenCourseId(null)
    setAutoPlayCourseId(courseId)
    setActiveTab('courses')
  }, [])

  const handleOpenCourseJourney = useCallback((courseId: string) => {
    setAutoPlayCourseId(null)
    setOpenCourseId(courseId)
    setActiveTab('courses')
  }, [])

  const handlePracticeFromCourses = useCallback(() => {
    setAutoPlayCourseId(null)
    setOpenCourseId(null)
    setSkillProfile(prev => ({
      ...prev,
      nextStepPlan: {
        type: 'ai_practice',
        skillCategory: prev.weakAreas[0] ?? 'technical',
        title: 'AI focus session',
        status: 'selected',
      },
    }))
    setPracticeView('ai-coach')
    setActiveTab('practice')
  }, [])

  const openAIPracticeCoach = useCallback(() => {
    setAutoPlayCourseId(null)
    setOpenCourseId(null)
    setPracticeView('ai-coach')
    setActiveTab('practice')
  }, [])

  const handleShareGameScore = useCallback((payload: {
    gameTitle: string
    courseTitle: string
    score: number
    xpEarned: number
    courseThumbnail: string
  }) => {
    const starterMessage = payload.score >= 95
      ? `Just landed a ${payload.score}% run in ${payload.gameTitle}. ${payload.courseTitle} is starting to feel second nature.`
      : payload.score >= 85
        ? `Wrapped ${payload.gameTitle} with ${payload.score}% while moving through ${payload.courseTitle}. Feeling the progress.`
        : `Finished ${payload.gameTitle} at ${payload.score}% in ${payload.courseTitle}. Back in for another stronger run soon.`

    setShareDraft({
      id: `draft-${Date.now()}`,
      message: starterMessage,
      gameTitle: payload.gameTitle,
      courseTitle: payload.courseTitle,
      score: payload.score,
      xpEarned: payload.xpEarned,
      courseThumbnail: payload.courseThumbnail,
    })
  }, [user.avatar, user.level, user.name])

  const handlePostShareDraft = useCallback((message: string) => {
    setShareDraft(prevDraft => {
      if (!prevDraft) return prevDraft

      setCommunityPosts(prev => [
        {
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
          scoreShare: {
            gameTitle: prevDraft.gameTitle,
            courseTitle: prevDraft.courseTitle,
            score: prevDraft.score,
            xpEarned: prevDraft.xpEarned,
          },
        },
        ...prev,
      ])

      return null
    })
  }, [user.avatar, user.level, user.name])

  const handleTabChange = useCallback((tab: Tab) => {
    // Clear auto-play when user manually navigates
    if (tab !== 'courses') {
      setAutoPlayCourseId(null)
      setOpenCourseId(null)
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
              <div className="flex items-center gap-1">
                <span className="text-xs text-yellow-600 dark:text-yellow-400">
                  {currentLeagueInfo.icon} {currentLeagueInfo.name}
                </span>
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
            <button className="relative w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-destructive rounded-full" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Home Tab ── */}
      {activeTab === 'home' && (
        <div className="space-y-6 px-4 py-4">
          <div>
            <h1 className="text-2xl font-bold">Hey, {user.name.split(' ')[0]}!</h1>
            <p className="text-muted-foreground">Ready to level up today?</p>
          </div>

          {/* Streak Card */}
          <section className="glass-card rounded-2xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                  <Flame className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current Streak</p>
                  <p className="text-2xl font-bold">{user.streak} days</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Keep it up!</p>
                <p className="text-primary font-bold">+50 XP daily</p>
              </div>
            </div>
            <div className="flex justify-between gap-2">
              {['T', 'F', 'S', 'S', 'M', 'T', 'W'].map((day, idx) => {
                const isActive = idx < user.streak % 7 || user.streak >= 7
                return (
                  <div
                    key={idx}
                    className={cn(
                      'flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-all',
                      isActive ? 'bg-primary' : 'bg-secondary',
                    )}
                  >
                    <Flame className={cn('w-4 h-4', isActive ? 'text-primary-foreground' : 'text-muted-foreground')} />
                    <span className={cn('text-xs font-medium', isActive ? 'text-primary-foreground' : 'text-muted-foreground')}>
                      {day}
                    </span>
                  </div>
                )
              })}
            </div>
          </section>

          {/* Daily Tips */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Daily Tips
              </h2>
            </div>
            <StoryCircles stories={stories} />
          </section>

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
                  <span className="text-muted-foreground">Updates competency score</span>
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
            onSkillUpdate={handleSkillUpdate}
            onCompetencyEvent={handleCompetencyEvent}
            autoPlayCourseId={autoPlayCourseId}
            openCourseId={openCourseId}
            onLessonComplete={handleLessonComplete}
            onXPGain={handleXPGain}
            onPracticeWithAI={handlePracticeFromCourses}
            onShareGameScore={handleShareGameScore}
          />
        </div>
      )}

      {/* ── Practice Tab ── */}
      {activeTab === 'practice' && (
        practiceView === 'ai-coach' ? (
          <AIPracticeScreen
            profile={skillProfile}
            courses={courses}
            onSkillUpdate={handleSkillUpdate}
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
          <Community user={user} discussions={discussions} achievements={sharedAchievements} posts={communityPosts} />
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
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  )
}
