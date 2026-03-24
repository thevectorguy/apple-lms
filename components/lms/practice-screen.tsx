'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Brain,
  ChevronLeft,
  ChevronRight,
  Clock,
  MessageCircle,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Sparkles,
  Timer,
  TrendingUp,
  Volume2,
  VolumeX,
  X,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SpeedMcqGame } from '@/components/lms/games/speed-mcq-game'
import { cn } from '@/lib/utils'
import type { Course, MiniGame, SkillCategory, UserSkillProfile } from '@/lib/types'

type PracticeMode = 'roleplay' | 'pitch'
type ScreenState = 'landing' | 'setup' | 'active' | 'complete'
type AIState = 'idle' | 'listening' | 'thinking' | 'speaking'

interface PracticeScreenProps {
  profile: UserSkillProfile
  courses: Course[]
  onStartPractice: (skillCategory: SkillCategory, score: number) => void
  onOpenCourse: (courseId: string) => void
  onOpenAICoach: () => void
}

interface CoachConfig {
  name: string
  role: string
  company: string
  avatar: string
  scenario: string
  skill: SkillCategory
  duration: string
  xp: number
}

interface ChatMessage {
  id: string
  role: 'ai' | 'user' | 'system'
  content: string
}

const coaches: Record<PracticeMode, CoachConfig> = {
  roleplay: {
    name: 'Alex',
    role: 'Sales Director',
    company: 'Enterprise Solutions',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
    scenario: "You're pitching iPhone 16 Pro to a buyer who thinks the price is too high for their current fleet.",
    skill: 'communication',
    duration: '5-10 min',
    xp: 50,
  },
  pitch: {
    name: 'Coach Meera',
    role: 'Pitch Coach',
    company: 'Apple Sales Academy',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=face',
    scenario: "Deliver your MacBook M4 Pro pitch and get live AI feedback on clarity, structure, and confidence.",
    skill: 'technical',
    duration: '3-5 min',
    xp: 75,
  },
}

const practiceModes = [
  {
    id: 'roleplay' as const,
    title: 'Roleplay with AI',
    description: 'Practice objection handling with our AI sales coach',
    duration: '5-10 min',
    xp: 50,
    Icon: MessageCircle,
    popular: true,
    badge: 'AI Avatar',
    shellClassName: 'bg-[linear-gradient(180deg,#faf5ff_0%,#f5ecff_48%,#ffffff_100%)] dark:bg-[linear-gradient(180deg,rgba(91,33,182,0.26)_0%,rgba(30,27,75,0.92)_100%)]',
    iconClassName: 'bg-[linear-gradient(180deg,#a855f7_0%,#7c3aed_100%)]',
  },
  {
    id: 'quiz' as const,
    title: 'Quick Quiz',
    description: '5 questions to test your knowledge in 60 seconds',
    duration: '60 sec',
    xp: 25,
    Icon: Brain,
    popular: false,
    badge: null,
    shellClassName: 'bg-[linear-gradient(180deg,#eff6ff_0%,#ecfeff_100%)] dark:bg-[linear-gradient(180deg,rgba(14,116,144,0.22)_0%,rgba(15,23,42,0.92)_100%)]',
    iconClassName: 'bg-[linear-gradient(180deg,#0ea5e9_0%,#2563eb_100%)]',
  },
  {
    id: 'pitch' as const,
    title: 'Pitch Practice',
    description: 'Record your pitch and get AI-powered feedback',
    duration: '3-5 min',
    xp: 75,
    Icon: Mic,
    popular: false,
    badge: 'AI Avatar',
    shellClassName: 'bg-[linear-gradient(180deg,#fff7ed_0%,#fff1f2_100%)] dark:bg-[linear-gradient(180deg,rgba(194,65,12,0.22)_0%,rgba(67,20,7,0.92)_100%)]',
    iconClassName: 'bg-[linear-gradient(180deg,#fb923c_0%,#f97316_100%)]',
  },
] as const

const recentSessions = [
  { id: 'session-1', label: 'Roleplay: Price Objection', meta: '+50 XP • 2h ago', score: 85, mode: 'roleplay' as const },
  { id: 'session-2', label: 'Quiz: Discovery Questions', meta: '+25 XP • Yesterday', score: 92, mode: 'pitch' as const },
] as const

type DailyChallengeConfig = {
  game: MiniGame
  skillCategory: SkillCategory
  themeLabel: string
  description: string
}

function buildFallbackDailyChallenge(): DailyChallengeConfig {
  return {
    game: {
      id: 'daily-price-objections',
      title: 'Price Objection Daily Challenge',
      gameType: 'speed-mcq',
      xpReward: 100,
      questions: [
        {
          id: 'daily-price-1',
          text: 'What is the strongest first move when a buyer says the price feels too high?',
          options: ['Offer a discount immediately', 'Ask what outcome matters most', 'Repeat the product specs', 'Move to closing'],
          correctAnswer: 1,
          explanation: 'Start by understanding what matters most so you can tie the response to real value.',
        },
        {
          id: 'daily-price-2',
          text: 'Which response handles a price objection most effectively?',
          options: ['Highlight long-term value and ROI', 'Tell them everyone pays this price', 'Avoid the objection and keep pitching', 'Ask them to decide later'],
          correctAnswer: 0,
          explanation: 'Price objections are easier to overcome when the customer can see concrete business value.',
        },
        {
          id: 'daily-price-3',
          text: 'What proves you are actively listening during an objection?',
          options: ['Jumping in with a rebuttal', 'Restating the concern and confirming it', 'Reading the feature list', 'Talking faster to keep control'],
          correctAnswer: 1,
          explanation: 'Reflecting the concern back shows attention and helps the customer feel understood.',
        },
      ],
    },
    skillCategory: 'communication',
    themeLabel: 'Handling Price Objections',
    description: 'Three quick MCQs on objection handling, value framing, and active listening.',
  }
}

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function buildInitialMessages(mode: PracticeMode): ChatMessage[] {
  return mode === 'pitch'
    ? [
        { id: 'ai-1', role: 'ai', content: "Give me your opening MacBook M4 Pro pitch. I'll look for clarity, confidence, and business value." },
        { id: 'sys-1', role: 'system', content: 'Pitch mode ready. Tap the mic to speak.' },
      ]
    : [
        { id: 'ai-1', role: 'ai', content: "I've reviewed the proposal, but the iPhone 16 Pro pricing looks high. Help me understand the value." },
        { id: 'user-1', role: 'user', content: 'Before we talk price, what matters most to your team right now?' },
        { id: 'ai-2', role: 'ai', content: 'Battery life and camera quality are the biggest issues for our reps.' },
      ]
}

function buildSessionResult(mode: PracticeMode) {
  return mode === 'pitch'
    ? {
        score: 88,
        xp: 75,
        strengths: ['Strong product framing', 'Good confidence and energy', 'Clear value summary'],
        improvements: ['Open with customer pain', 'Use one concrete ROI proof', 'Finish with a stronger close'],
      }
    : {
        score: 84,
        xp: 50,
        strengths: ['Asked a strong discovery question', 'Kept the tone calm', 'Addressed the objection directly'],
        improvements: ['Add one sharper proof point', 'Quantify the value sooner', 'Close with a clearer recommendation'],
      }
}

function Avatar({ coach, aiState }: { coach: CoachConfig; aiState: AIState }) {
  return (
    <div className="relative mx-auto flex h-44 w-44 items-center justify-center">
      <div className={cn('absolute h-40 w-40 rounded-full blur-2xl transition-all', aiState === 'speaking' ? 'bg-primary/30 scale-110' : aiState === 'listening' ? 'bg-accent/25 scale-105' : 'bg-slate-300/35 dark:bg-slate-700/35')} />
      <div className={cn('absolute h-36 w-36 rounded-full border-2 border-dashed transition-all', aiState === 'speaking' ? 'border-primary/60 animate-spin [animation-duration:8s]' : 'border-slate-300 dark:border-slate-700')} />
      <div className="relative h-28 w-28 overflow-hidden rounded-full border-4 border-white shadow-2xl dark:border-slate-900">
        <img src={coach.avatar} alt={coach.name} className="h-full w-full object-cover" />
      </div>
      <div className="absolute -bottom-2 rounded-full border border-white/60 bg-white/90 px-3 py-1 text-[10px] font-semibold text-slate-700 shadow-sm dark:border-white/10 dark:bg-slate-900/90 dark:text-white/80">
        {aiState === 'speaking' ? 'Speaking' : aiState === 'listening' ? 'Listening' : aiState === 'thinking' ? 'Thinking' : 'Ready'}
      </div>
    </div>
  )
}

function VoiceBars({ active, tone }: { active: boolean; tone: 'ai' | 'user' }) {
  return (
    <div className="flex h-6 items-end justify-center gap-1">
      {Array.from({ length: 10 }).map((_, index) => (
        <div
          key={index}
          className={cn('w-1 rounded-full transition-all duration-300', tone === 'ai' ? 'bg-primary' : 'bg-accent', active ? ['h-2', 'h-4', 'h-6', 'h-3'][index % 4] : 'h-2')}
        />
      ))}
    </div>
  )
}

function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.role === 'system') {
    return (
      <div className="my-3 flex justify-center">
        <div className="rounded-full bg-secondary px-3 py-1.5 text-xs text-muted-foreground">{message.content}</div>
      </div>
    )
  }

  const isUser = message.role === 'user'
  return (
    <div className={cn('mb-3 flex', isUser ? 'justify-end' : 'justify-start')}>
      <div className={cn('max-w-[84%] rounded-2xl px-4 py-3 text-sm leading-6', isUser ? 'border border-primary/20 bg-primary/10 text-slate-900 dark:text-white' : 'border border-border bg-card')}>
        {message.content}
      </div>
    </div>
  )
}

function SessionComplete({
  result,
  duration,
  onClose,
  onRestart,
}: {
  result: ReturnType<typeof buildSessionResult>
  duration: number
  onClose: () => void
  onRestart: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.98)_0%,rgba(17,24,39,0.98)_100%)] p-6 text-white shadow-[0_30px_120px_rgba(2,6,23,0.55)]">
        <div className="text-center">
          <div className="mx-auto flex h-18 w-18 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-green-500 shadow-lg">
            <Sparkles className="h-8 w-8" />
          </div>
          <h2 className="mt-4 text-2xl font-black">Practice complete</h2>
          <p className="mt-1 text-sm text-white/70">Your readiness profile has been updated.</p>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-white/5 p-4 text-center">
            <div className="text-2xl font-black">{formatDuration(duration)}</div>
            <div className="mt-1 text-xs text-white/50">Duration</div>
          </div>
          <div className="rounded-2xl bg-white/5 p-4 text-center">
            <div className="text-2xl font-black text-yellow-300">{result.score}%</div>
            <div className="mt-1 text-xs text-white/50">Score</div>
          </div>
          <div className="rounded-2xl bg-white/5 p-4 text-center">
            <div className="text-2xl font-black text-cyan-300">+{result.xp}</div>
            <div className="mt-1 text-xs text-white/50">XP</div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">Strengths</p>
            <ul className="mt-3 space-y-2 text-sm text-white/80">
              {result.strengths.map(item => <li key={item}>• {item}</li>)}
            </ul>
          </div>
          <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-yellow-300">Focus next</p>
            <ul className="mt-3 space-y-2 text-sm text-white/80">
              {result.improvements.map(item => <li key={item}>• {item}</li>)}
            </ul>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Button variant="outline" className="flex-1 rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={onClose}>
            Done
          </Button>
          <Button className="flex-1 rounded-full bg-gradient-to-r from-primary to-accent font-semibold text-white" onClick={onRestart}>
            Practice again
          </Button>
        </div>
      </div>
    </div>
  )
}

export function PracticeScreen({ profile, courses, onStartPractice, onOpenAICoach }: PracticeScreenProps) {
  const [screen, setScreen] = useState<ScreenState>('landing')
  const [mode, setMode] = useState<PracticeMode>('roleplay')
  const [aiState, setAiState] = useState<AIState>('idle')
  const [messages, setMessages] = useState<ChatMessage[]>(buildInitialMessages('roleplay'))
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [result, setResult] = useState<ReturnType<typeof buildSessionResult> | null>(null)
  const [dailyChallengeOpen, setDailyChallengeOpen] = useState(false)
  const transcriptRef = useRef<HTMLDivElement | null>(null)
  const focusSkill = profile.weakAreas[0] ?? 'communication'
  const coach = coaches[mode]
  const dailyChallenge = useMemo<DailyChallengeConfig>(() => {
    for (const course of courses) {
      for (const module of course.modules ?? []) {
        const challengeGame = module.miniGames.find(({ game }) =>
          game.gameType === 'speed-mcq' && game.questions.some(question => /price objection/i.test(question.text)),
        )?.game

        if (!challengeGame) continue

        const priceEpisode = module.episodes.find(episode => /price objection/i.test(episode.title))

        return {
          game: challengeGame,
          skillCategory: course.skillCategory,
          themeLabel: priceEpisode?.title ?? module.title,
          description: 'Three quick MCQs pulled from the price-objection theme so the challenge opens straight into the drill.',
        }
      }
    }

    return buildFallbackDailyChallenge()
  }, [courses])

  useEffect(() => {
    if (screen !== 'active') return
    const interval = window.setInterval(() => setElapsedSeconds(prev => prev + 1), 1000)
    return () => window.clearInterval(interval)
  }, [screen])

  useEffect(() => {
    if (!transcriptRef.current) return
    transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight
  }, [messages, screen])

  const openMode = (nextMode: PracticeMode) => {
    setMode(nextMode)
    setMessages(buildInitialMessages(nextMode))
    setElapsedSeconds(0)
    setResult(null)
    setAiState('idle')
    setScreen('setup')
  }

  const beginSession = () => {
    setScreen('active')
    setAiState('speaking')
    window.setTimeout(() => setAiState('idle'), 1100)
  }

  const handleMicPress = () => {
    setAiState('listening')
    window.setTimeout(() => {
      setMessages(prev => [
        ...prev,
        {
          id: `user-${Date.now()}`,
          role: 'user',
          content: mode === 'pitch'
            ? 'The MacBook M4 Pro helps teams move faster with stronger performance, battery life, and pro workflows.'
            : 'I would connect the price to better battery life, camera quality, and fewer device pain points for the team.',
        },
      ])
      setAiState('thinking')
    }, 900)

    window.setTimeout(() => {
      setMessages(prev => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: 'ai',
          content: mode === 'pitch'
            ? 'Good framing. Now make the business value more specific. What changes for the customer after they switch?'
            : 'That is heading in the right direction. What proof point would make that answer feel more credible?',
        },
      ])
      setAiState('speaking')
    }, 2000)

    window.setTimeout(() => setAiState('idle'), 3200)
  }

  const finishSession = () => {
    const nextResult = buildSessionResult(mode)
    setResult(nextResult)
    onStartPractice(coach.skill, nextResult.score)
    setAiState('idle')
    setScreen('complete')
  }

  if (screen === 'setup') {
    return (
      <div className="space-y-4 px-4 py-4">
        <button type="button" onClick={() => setScreen('landing')} className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-foreground hover:bg-secondary/80">
          <ChevronLeft className="h-4 w-4" />
          Back to Practice
        </button>
        <div className="overflow-hidden rounded-[30px] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(247,249,252,0.98)_100%)] p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.98)_0%,rgba(17,24,39,0.98)_100%)]">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[28px] bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] p-6 dark:bg-[linear-gradient(180deg,rgba(30,41,59,0.92)_0%,rgba(15,23,42,0.92)_100%)]">
              <Avatar coach={coach} aiState={aiState} />
              <div className="mt-8 text-center">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">{coach.role}</p>
                <h2 className="mt-2 text-2xl font-black text-slate-950 dark:text-white">{coach.name}</h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{coach.company}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">{mode === 'roleplay' ? 'Roleplay with AI' : 'Pitch Practice'}</p>
                <h1 className="mt-2 text-3xl font-black text-slate-950 dark:text-white">Start the coach when you’re ready</h1>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">This session focuses on {coach.skill} and updates readiness after you finish.</p>
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Scenario</p>
                <p className="mt-3 text-base leading-7 text-slate-700 dark:text-slate-300">{coach.scenario}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]"><p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Mode</p><p className="mt-2 font-bold text-slate-950 dark:text-white">{mode === 'roleplay' ? 'Roleplay' : 'Pitch'}</p></div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]"><p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Duration</p><p className="mt-2 font-bold text-slate-950 dark:text-white">{coach.duration}</p></div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]"><p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Reward</p><p className="mt-2 font-bold text-slate-950 dark:text-white">+{coach.xp} XP</p></div>
              </div>
              <div className="flex gap-3">
                <Button className="rounded-full bg-gradient-to-r from-primary to-accent px-6 font-semibold text-white" onClick={beginSession}>
                  <Phone className="mr-2 h-4 w-4" />
                  Start Session
                </Button>
                <Button variant="outline" className="rounded-full bg-transparent" onClick={() => setScreen('landing')}>
                  Choose another mode
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (screen === 'active' || screen === 'complete') {
    return (
      <div className="space-y-4 px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <button type="button" onClick={() => setScreen('landing')} className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-foreground hover:bg-secondary/80">
            <ChevronLeft className="h-4 w-4" />
            Back to Practice
          </button>
          <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-muted-foreground">
            <Timer className="h-4 w-4 text-primary" />
            {formatDuration(elapsedSeconds)}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="space-y-4 rounded-[30px] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(247,249,252,0.98)_100%)] p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.98)_0%,rgba(17,24,39,0.98)_100%)]">
            <div className="rounded-[28px] bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] p-6 dark:bg-[linear-gradient(180deg,rgba(30,41,59,0.92)_0%,rgba(15,23,42,0.92)_100%)]">
              <Avatar coach={coach} aiState={aiState} />
              <div className="mt-8 text-center">
                <h2 className="text-2xl font-black text-slate-950 dark:text-white">{coach.name}</h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{coach.role} • {coach.company}</p>
              </div>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.04]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Live coach state</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{aiState === 'idle' ? 'Ready for your next response' : `Coach is ${aiState}`}</p>
                </div>
                <VoiceBars active={aiState === 'speaking'} tone="ai" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <button type="button" onClick={() => setIsMuted(prev => !prev)} className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 dark:border-white/10 dark:bg-white/[0.04] dark:text-white">
                {isMuted ? <MicOff className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                {isMuted ? 'Unmute' : 'Mute'}
              </button>
              <button type="button" onClick={handleMicPress} className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-accent px-4 py-3 text-sm font-semibold text-white shadow-lg">
                <Mic className="h-4 w-4" />
                Talk
              </button>
              <button type="button" onClick={finishSession} className="flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
                <PhoneOff className="h-4 w-4" />
                End
              </button>
            </div>
            <div className="flex justify-center">
              <VoiceBars active={aiState === 'listening'} tone="user" />
            </div>
          </div>

          <div className="rounded-[30px] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(247,249,252,0.98)_100%)] p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.98)_0%,rgba(17,24,39,0.98)_100%)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">{mode === 'roleplay' ? 'Roleplay Practice' : 'Pitch Practice'}</p>
                <h3 className="mt-2 text-2xl font-black text-slate-950 dark:text-white">Transcript</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{coach.scenario}</p>
              </div>
              <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">+{coach.xp} XP</div>
            </div>
            <div ref={transcriptRef} className="mt-5 h-[420px] overflow-y-auto rounded-[24px] border border-slate-200 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-slate-950/40">
              {messages.map(message => (
                <MessageBubble key={message.id} message={message} />
              ))}
            </div>
          </div>
        </div>

        {screen === 'complete' && result && (
          <SessionComplete
            result={result}
            duration={elapsedSeconds}
            onClose={() => setScreen('landing')}
            onRestart={() => openMode(mode)}
          />
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4 px-4 py-4">
      <div>
        <h1 className="text-3xl font-black text-slate-950 dark:text-white">Practice</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Sharpen your skills with real scenarios</p>
      </div>

      <button
        type="button"
        onClick={() => setDailyChallengeOpen(true)}
        className="w-full overflow-hidden rounded-[28px] border border-fuchsia-200/70 bg-[linear-gradient(135deg,#faf5ff_0%,#f5d0fe_18%,#eef2ff_100%)] p-5 text-left shadow-[0_20px_60px_rgba(124,58,237,0.12)] transition-transform hover:-translate-y-0.5 dark:border-fuchsia-500/20 dark:bg-[linear-gradient(135deg,rgba(88,28,135,0.34)_0%,rgba(49,46,129,0.72)_100%)] dark:shadow-[0_20px_60px_rgba(15,23,42,0.3)]"
      >
        <div className="flex items-center gap-2 text-fuchsia-700 dark:text-fuchsia-200">
          <Zap className="h-4 w-4" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.28em]">Daily Challenge</span>
        </div>
        <h2 className="mt-4 text-3xl font-black text-slate-950 dark:text-white">Handle 3 Price Objections</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{dailyChallenge.description}</p>
        <div className="mt-5 flex flex-wrap items-center gap-3 text-sm font-semibold">
          <span className="rounded-full bg-white/80 px-3 py-1.5 text-slate-800 shadow-sm dark:bg-white/10 dark:text-white/85">
            {dailyChallenge.game.questions.length} MCQs
          </span>
          <span className="rounded-full bg-fuchsia-500/10 px-3 py-1.5 text-fuchsia-700 dark:text-fuchsia-200">
            +{dailyChallenge.game.xpReward} XP
          </span>
          <span className="text-slate-700 dark:text-white/80">{dailyChallenge.themeLabel}</span>
        </div>
      </button>

      <section>
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Practice Modes</h2>
        <div className="mt-3 space-y-3">
          <button
            type="button"
            onClick={onOpenAICoach}
            className="w-full rounded-[28px] border border-white/70 bg-[linear-gradient(180deg,#f7f9fc_0%,#edf4ff_100%)] p-4 text-left shadow-[0_16px_40px_rgba(15,23,42,0.08)] transition-transform hover:-translate-y-0.5 dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.92)_0%,rgba(20,33,61,0.96)_100%)] dark:shadow-[0_16px_40px_rgba(2,6,23,0.28)]"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-[22px] bg-[linear-gradient(180deg,#1d4ed8_0%,#0f172a_100%)] text-white shadow-lg">
                <Brain className="h-7 w-7" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-2xl font-black text-slate-950 dark:text-white">Practice with AI Coach</h3>
                  <span className="rounded-full bg-white/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600 dark:bg-white/10 dark:text-white/75">
                    Guided
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Open a concrete coaching dashboard with scenario starters, focused drills, and the next course tie-in for your weakest area.
                </p>
                <div className="mt-3 flex items-center gap-4 text-sm font-semibold text-slate-700 dark:text-white/80">
                  <span className="inline-flex items-center gap-1.5"><Sparkles className="h-4 w-4" /> Concrete next steps</span>
                  <span className="inline-flex items-center gap-1.5 text-primary"><Zap className="h-4 w-4" /> Guided practice round</span>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 flex-shrink-0 text-slate-400 dark:text-slate-500" />
            </div>
          </button>

          {practiceModes.map(item => {
            const Icon = item.Icon
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => item.id === 'quiz' ? onStartPractice(focusSkill, 76) : openMode(item.id)}
                className={cn('w-full rounded-[28px] border border-white/70 p-4 text-left shadow-[0_16px_40px_rgba(15,23,42,0.08)] transition-transform hover:-translate-y-0.5 dark:border-white/10 dark:shadow-[0_16px_40px_rgba(2,6,23,0.28)]', item.shellClassName)}
              >
                <div className="flex items-center gap-4">
                  <div className={cn('flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-[22px] text-white shadow-lg', item.iconClassName)}>
                    <Icon className="h-7 w-7" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-2xl font-black text-slate-950 dark:text-white">{item.title}</h3>
                      {item.popular && <span className="rounded-full bg-white/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600 dark:bg-white/10 dark:text-white/75">Popular</span>}
                      {item.badge && <span className="rounded-full bg-violet-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-700 dark:text-violet-300">{item.badge}</span>}
                    </div>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{item.description}</p>
                    <div className="mt-3 flex items-center gap-4 text-sm font-semibold text-slate-700 dark:text-white/80">
                      <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4" /> {item.duration}</span>
                      <span className="inline-flex items-center gap-1.5 text-primary"><Zap className="h-4 w-4" /> +{item.xp} XP</span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 flex-shrink-0 text-slate-400 dark:text-slate-500" />
                </div>
              </button>
            )
          })}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Recent Sessions</h2>
          <div className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            Focus: {focusSkill}
          </div>
        </div>
        <div className="mt-3 space-y-3">
          {recentSessions.map(session => (
            <div key={session.id} className="flex items-center gap-4 rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-white/[0.03]">
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-xl font-black text-white dark:bg-white dark:text-slate-950">
                {session.score}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-base font-bold text-slate-950 dark:text-white">{session.label}</h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{session.meta}</p>
              </div>
              <button type="button" onClick={() => openMode(session.mode)} className="rounded-full bg-secondary p-2 text-foreground hover:bg-secondary/80">
                <TrendingUp className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {dailyChallengeOpen && (
        <SpeedMcqGame
          game={dailyChallenge.game}
          continueLabel="Back to Practice"
          displayCopy={{
            topEyebrow: 'Daily Challenge',
            topTitle: 'Price Objections',
            cardEyebrow: 'Daily Challenge',
            cardTitle: 'Handle 3 Price Objections',
            questionHint: 'Move through three quick objection-handling prompts and lock in the strongest value-based response.',
            resultsEyebrow: 'Daily Challenge',
            resultsTitle: 'Challenge Complete',
            resultsDescription: 'You worked through the objection drill and banked bonus XP from quick decisions.',
            retryHint: 'Give it another run to tighten the price-objection instincts before your next live scenario.',
          }}
          onClose={() => setDailyChallengeOpen(false)}
          onComplete={(score) => {
            onStartPractice(dailyChallenge.skillCategory, score)
            setDailyChallengeOpen(false)
          }}
        />
      )}
    </div>
  )
}
