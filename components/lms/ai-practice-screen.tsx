'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, BookOpen, Brain, CheckCircle2, ChevronLeft, Mic, MicOff, PhoneOff, Sparkles, Target, Timer, TrendingUp, Volume2, X, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Course, SkillCategory, UserSkillProfile } from '@/lib/types'

interface AIPracticeScreenProps {
  autoStartFromPlan?: boolean
  profile: UserSkillProfile
  courses: Course[]
  onSkillUpdate: (skillCategory: SkillCategory, score: number) => void
  onRoleplayComplete?: (roleplayId: string) => void
  onReturnToCourseReward?: (courseId: string, roleplayId: string) => void
  onOpenCourse?: (courseId: string) => void
  onBack?: () => void
}

interface CoachMessage {
  id: string
  role: 'ai' | 'user'
  content: string
}

interface PracticeCard {
  title: string
  detail: string
  cue: string
}

interface StarterPrompt {
  title: string
  prompt: string
  detail: string
}

interface PracticePlan {
  headline: string
  summary: string
  objective: string
  recommendation: string
  planCards: PracticeCard[]
  starterPrompts: StarterPrompt[]
  quickWins: string[]
}

type SessionScreen = 'dashboard' | 'active' | 'complete'
type SessionAIState = 'idle' | 'listening' | 'thinking' | 'speaking'

interface SessionMessage {
  id: string
  role: 'ai' | 'user' | 'system'
  content: string
}

interface SessionResult {
  score: number
  xp: number
  strengths: string[]
  improvements: string[]
}

interface SessionContext {
  scenario: string
  roleplayId?: string
  courseId?: string
}

const PRACTICE_COACH = {
  name: 'Ava',
  role: 'AI Practice Coach',
  company: 'Readiness Studio',
  avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=face',
  duration: '4-6 min',
  xp: 60,
} as const

const INTRO_QUESTION = 'What would you like to work on today?'

function formatSkillLabel(skill: SkillCategory) {
  return skill.charAt(0).toUpperCase() + skill.slice(1)
}

function getCourseStep(course: Course | null) {
  if (!course) return null

  const nextModule = course.modules?.find(module => !module.completed)
  if (nextModule) return nextModule.title

  const nextEpisode = course.episodes.find(episode => !episode.completed)
  return nextEpisode?.title ?? null
}

function getSupportSkill(profile: UserSkillProfile, focusSkill: SkillCategory) {
  return (
    profile.strongAreas.find(skill => skill !== focusSkill) ??
    profile.weakAreas.find(skill => skill !== focusSkill) ??
    'communication'
  )
}

function getSupportCopy(skill: SkillCategory) {
  switch (skill) {
    case 'communication':
      return 'Use sharper questions and cleaner phrasing to make the round feel more controlled.'
    case 'technical':
      return 'Lead with clear facts and product confidence before you move into the tougher conversation.'
    case 'leadership':
      return 'Be explicit about ownership, timing, and the decision you want from the other person.'
    case 'compliance':
    default:
      return 'Anchor the response in the safe and correct action when the scenario gets messy.'
  }
}

function getSignalNextMove(score: number) {
  if (score >= 85) return 'Raise the difficulty and focus on handling pushback without losing structure.'
  if (score >= 70) return 'You are close. Tighten the middle of the answer and finish with a clearer next step.'
  return 'Keep the scenario simple and repeat the core structure until it sounds natural out loud.'
}

function buildCoachConversation(topic: string, focusLabel: string, courseStep: string | null) {
  const reinforcement = courseStep ? ` After the round, reinforce it with ${courseStep}.` : ''

  return [
    { id: 'intro', role: 'ai' as const, content: INTRO_QUESTION },
    { id: 'user-choice', role: 'user' as const, content: topic },
    {
      id: 'coach-reply',
      role: 'ai' as const,
      content: `Great. We will work on ${topic.toLowerCase()}. I will keep this round grounded in ${focusLabel.toLowerCase()}, push on the hard part of the conversation, and help you leave with one sharper response you can actually use.${reinforcement}`,
    },
  ]
}

function getPracticePlan(skill: SkillCategory, courseTitle: string | null, courseStep: string | null): PracticePlan {
  const reinforcement = courseTitle
    ? courseStep
      ? `Then reinforce it in ${courseTitle} by opening ${courseStep}.`
      : `Then reinforce it in ${courseTitle}.`
    : 'Then reinforce it in your learning path.'

  switch (skill) {
    case 'leadership':
      return {
        headline: 'Build Leadership with AI Coach',
        summary: `Leadership is the biggest gap right now. Use this dashboard to pick one difficult management moment, practice it out loud, and turn it into a cleaner next move.${courseTitle ? ` ${reinforcement}` : ''}`,
        objective: 'Leave this round able to run a clearer feedback, delegation, or decision conversation.',
        recommendation: `Start with a feedback or delegation scenario first. That is the fastest way to make leadership feel more concrete in the app and on the floor.${courseTitle ? ` ${reinforcement}` : ''}`,
        planCards: [
          {
            title: 'Feedback that lands',
            detail: 'Practice naming the issue, the standard, and the next behavior without sounding vague or harsh.',
            cue: 'Best when someone missed a target or repeated the same mistake.',
          },
          {
            title: 'Delegate with a checkpoint',
            detail: 'Rehearse how you assign ownership, define the deadline, and confirm the follow-up before you close.',
            cue: 'Good for launch tasks, daily handoffs, and coaching moments.',
          },
          {
            title: 'Make the call under pressure',
            detail: 'Work through a tense team situation where you need to decide quickly and explain why.',
            cue: 'Useful when you need more confidence in the hard middle of a conversation.',
          },
        ],
        starterPrompts: [
          {
            title: 'Coach a missed target',
            prompt: 'Help me practice a feedback conversation with someone who missed target.',
            detail: 'Use this when you need to be direct without sounding flat or defensive.',
          },
          {
            title: 'Delegate a launch task',
            prompt: 'Practice delegating a launch task clearly.',
            detail: 'Sharpens ownership, timing, and the checkpoint at the end.',
          },
          {
            title: 'Lead a tense decision',
            prompt: 'Coach me through a team decision under pressure.',
            detail: 'Good for staying calm and decisive when there are tradeoffs.',
          },
        ],
        quickWins: [
          'Open with the outcome you need, not the whole backstory.',
          'Name the owner, the date, and the check-in before you finish.',
          'End by confirming what good looks like from the other person.',
        ],
      }
    case 'compliance':
      return {
        headline: 'Sharpen Compliance Judgment with AI Coach',
        summary: `Compliance needs the most work after leadership, so use this space to rehearse cleaner policy calls, safer language, and stronger judgment in edge cases.${courseTitle ? ` ${reinforcement}` : ''}`,
        objective: 'Leave this round able to explain the safe choice clearly when a situation gets uncomfortable.',
        recommendation: `Start with a gray-area scenario where the safe answer is not the popular one.${courseTitle ? ` ${reinforcement}` : ''}`,
        planCards: [
          {
            title: 'Explain the rule simply',
            detail: 'Practice turning policy language into something a customer or teammate can understand quickly.',
            cue: 'Best when the right answer sounds too formal or too technical.',
          },
          {
            title: 'Catch the risky move early',
            detail: 'Rehearse spotting the line that should stop the interaction before it becomes a bigger issue.',
            cue: 'Helpful if you hesitate when a situation starts to feel off.',
          },
          {
            title: 'Offer the safe alternative',
            detail: 'Practice what to say next so the conversation keeps moving after you set the boundary.',
            cue: 'Good when you need to sound firm without sounding abrupt.',
          },
        ],
        starterPrompts: [
          {
            title: 'Talk through a policy scenario',
            prompt: 'Walk me through a policy scenario where the safe answer is harder to say.',
            detail: 'Use this to get comfortable with gray-area judgment calls.',
          },
          {
            title: 'Pressure-test an ethics call',
            prompt: 'Test me on an ethics decision and push back on my answer.',
            detail: 'Useful when you want the coach to challenge your first instinct.',
          },
          {
            title: 'Explain a rule clearly',
            prompt: 'Help me explain a compliance rule clearly to a customer.',
            detail: 'Best for turning formal policy into plain language.',
          },
        ],
        quickWins: [
          'State the safe answer early so the conversation has a clear boundary.',
          'Explain the reason in plain language instead of quoting policy.',
          'Always offer the next safe action instead of ending on a hard no.',
        ],
      }
    case 'communication':
      return {
        headline: 'Tighten Communication with AI Coach',
        summary: `Communication is the easiest place to win quickly right now. Use this dashboard to practice clearer questions, stronger objection handling, and more confident closing language.${courseTitle ? ` ${reinforcement}` : ''}`,
        objective: 'Leave this round able to guide the conversation without rambling or losing the thread.',
        recommendation: `Start with the part of the customer conversation where you usually lose control: the first question, the objection, or the close.${courseTitle ? ` ${reinforcement}` : ''}`,
        planCards: [
          {
            title: 'Ask a sharper discovery question',
            detail: 'Practice opening questions that get you to the real need faster instead of prompting generic answers.',
            cue: 'Best when your calls feel polite but not very productive.',
          },
          {
            title: 'Handle the objection cleanly',
            detail: 'Rehearse acknowledging the concern, reframing it, and moving to the next question without sounding scripted.',
            cue: 'Good for price, value, timing, or comparison objections.',
          },
          {
            title: 'Close with a clearer next step',
            detail: 'Practice the final minute of the conversation so the customer knows what happens next.',
            cue: 'Useful when your conversations end politely but do not move forward.',
          },
        ],
        starterPrompts: [
          {
            title: 'Improve discovery questions',
            prompt: 'Practice discovery questions with me.',
            detail: 'Use this if your early questions do not open the conversation enough.',
          },
          {
            title: 'Handle objections better',
            prompt: 'Help me handle objections better.',
            detail: 'Good for when the conversation gets stuck after price or value pushback.',
          },
          {
            title: 'Say it more clearly',
            prompt: 'Coach me on making my answer clearer.',
            detail: 'Best when you know the answer but it comes out too long or too soft.',
          },
        ],
        quickWins: [
          'Ask one question at a time and wait for the real answer.',
          'Answer the objection, then move back to value fast.',
          'Close by naming one next action instead of ending generally.',
        ],
      }
    case 'technical':
    default:
      return {
        headline: 'Strengthen Technical Selling with AI Coach',
        summary: `Technical selling is the next lever to pull, so use this screen to practice simpler product explanations, stronger comparisons, and more customer-ready answers.${courseTitle ? ` ${reinforcement}` : ''}`,
        objective: 'Leave this round able to explain a product more simply and more confidently.',
        recommendation: `Start with the feature or comparison you hesitate on most, then turn it into customer language.${courseTitle ? ` ${reinforcement}` : ''}`,
        planCards: [
          {
            title: 'Explain one feature simply',
            detail: 'Practice reducing a technical feature down to why it matters in the customer world.',
            cue: 'Best when you know the spec but struggle to translate it.',
          },
          {
            title: 'Compare options without sounding scripted',
            detail: 'Rehearse how you compare two products while staying confident and conversational.',
            cue: 'Useful for side-by-side questions and upgrade discussions.',
          },
          {
            title: 'Link the product to the need',
            detail: 'Practice connecting the feature, the use case, and the payoff in one answer.',
            cue: 'Good when your answers feel knowledgeable but not persuasive.',
          },
        ],
        starterPrompts: [
          {
            title: 'Explain a feature simply',
            prompt: 'Help me explain a feature simply.',
            detail: 'Use this when you need to translate product detail into customer value.',
          },
          {
            title: 'Practice a product pitch',
            prompt: 'Practice a product pitch with me.',
            detail: 'Good for getting more confident and less scripted on the floor.',
          },
          {
            title: 'Build technical confidence',
            prompt: 'Coach me on technical confidence.',
            detail: 'Best when you know the product but still hesitate under pressure.',
          },
        ],
        quickWins: [
          'Lead with the customer outcome before the technical detail.',
          'Use one comparison point instead of listing every spec.',
          'Finish by tying the feature back to the buying decision.',
        ],
      }
  }
}

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function buildPracticeSessionMessages(topic: string, focusLabel: string): SessionMessage[] {
  return [
    {
      id: 'ai-1',
      role: 'ai',
      content: `Got it. Today we are working on ${topic.toLowerCase()}. Start by telling me how you would handle it.`,
    },
    {
      id: 'system-1',
      role: 'system',
      content: `Practice mode ready. Focus area: ${focusLabel}. Tap Talk to respond.`,
    },
  ]
}

function buildPracticeAttempt(skill: SkillCategory, topic: string) {
  switch (skill) {
    case 'leadership':
      return `I would handle ${topic.toLowerCase()} by setting the outcome clearly, giving direct feedback on the gap, and agreeing on a check-in before we close.`
    case 'compliance':
      return `I would handle ${topic.toLowerCase()} by setting the safe boundary early, explaining why it matters, and offering the next safe option.`
    case 'communication':
      return `I would handle ${topic.toLowerCase()} by asking one sharp question first, then answering the concern directly and closing with a clear next step.`
    case 'technical':
    default:
      return `I would handle ${topic.toLowerCase()} by explaining the product in customer language, keeping the comparison simple, and recommending the best fit for their workflow.`
  }
}

function buildPracticeFollowUp(skill: SkillCategory, topic: string) {
  switch (skill) {
    case 'leadership':
      return `That is a solid start. Now make the coaching moment around ${topic.toLowerCase()} more specific. What exact behavior would you call out, and what does good look like next time?`
    case 'compliance':
      return `Good direction. When ${topic.toLowerCase()} gets uncomfortable, what wording keeps the answer safe and still moves the conversation forward?`
    case 'communication':
      return `That is moving in the right direction. For ${topic.toLowerCase()}, how would you make the middle of the answer shorter and more confident?`
    case 'technical':
    default:
      return `Good framing. For ${topic.toLowerCase()}, what is the strongest proof point or comparison you would add to make the recommendation feel more credible?`
  }
}

function buildPracticeResult(skill: SkillCategory): SessionResult {
  switch (skill) {
    case 'leadership':
      return {
        score: 86,
        xp: PRACTICE_COACH.xp,
        strengths: ['Clearer direction setting', 'Good ownership language', 'Stayed calm in a tougher scenario'],
        improvements: ['Be more specific on the expected behavior', 'Confirm the checkpoint more directly', 'Close with a firmer next step'],
      }
    case 'compliance':
      return {
        score: 84,
        xp: PRACTICE_COACH.xp,
        strengths: ['Set the safe boundary early', 'Explained the reasoning clearly', 'Offered a constructive next step'],
        improvements: ['Use simpler language under pressure', 'Name the risk sooner', 'Sound firmer when the line is clear'],
      }
    case 'communication':
      return {
        score: 85,
        xp: PRACTICE_COACH.xp,
        strengths: ['Asked a sharper question', 'Handled the concern directly', 'Moved toward a next step cleanly'],
        improvements: ['Trim one part of the answer', 'Add a stronger proof point', 'Close with more confidence'],
      }
    case 'technical':
    default:
      return {
        score: 87,
        xp: PRACTICE_COACH.xp,
        strengths: ['Explained the product simply', 'Connected the detail to customer value', 'Kept the recommendation clear'],
        improvements: ['Add one stronger comparison', 'Use a more concrete business outcome', 'Finish with a firmer recommendation'],
      }
  }
}

function SessionAvatar({ aiState }: { aiState: SessionAIState }) {
  return (
    <div className="relative mx-auto flex h-44 w-44 items-center justify-center">
      <div className={cn('absolute h-40 w-40 rounded-full blur-2xl transition-all', aiState === 'speaking' ? 'bg-primary/30 scale-110' : aiState === 'listening' ? 'bg-accent/25 scale-105' : 'bg-slate-300/35 dark:bg-slate-700/35')} />
      <div className={cn('absolute h-36 w-36 rounded-full border-2 border-dashed transition-all', aiState === 'speaking' ? 'border-primary/60 animate-spin [animation-duration:8s]' : 'border-slate-300 dark:border-slate-700')} />
      <div className="relative h-28 w-28 overflow-hidden rounded-full border-4 border-white shadow-2xl dark:border-slate-900">
        <img src={PRACTICE_COACH.avatar} alt={PRACTICE_COACH.name} className="h-full w-full object-cover" />
      </div>
      <div className="absolute -bottom-2 rounded-full border border-white/60 bg-white/90 px-3 py-1 text-[10px] font-semibold text-slate-700 shadow-sm dark:border-white/10 dark:bg-slate-900/90 dark:text-white/80">
        {aiState === 'speaking' ? 'Speaking' : aiState === 'listening' ? 'Listening' : aiState === 'thinking' ? 'Thinking' : 'Ready'}
      </div>
    </div>
  )
}

function SessionVoiceBars({ active, tone }: { active: boolean; tone: 'ai' | 'user' }) {
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

function SessionMessageBubble({ message }: { message: SessionMessage }) {
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

function PracticeComplete({
  result,
  duration,
  returnToCourseLabel,
  onClose,
  onRestart,
  onReturnToCourse,
}: {
  result: SessionResult
  duration: number
  returnToCourseLabel?: string
  onClose: () => void
  onRestart: () => void
  onReturnToCourse?: () => void
}) {
  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
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
              {result.strengths.map(item => <li key={item}>- {item}</li>)}
            </ul>
          </div>
          <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-yellow-300">Focus next</p>
            <ul className="mt-3 space-y-2 text-sm text-white/80">
              {result.improvements.map(item => <li key={item}>- {item}</li>)}
            </ul>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          {onReturnToCourse && returnToCourseLabel ? (
            <Button className="flex-1 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 font-semibold text-slate-950 hover:opacity-95" onClick={onReturnToCourse}>
              {returnToCourseLabel}
            </Button>
          ) : (
            <Button variant="outline" className="flex-1 rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={onClose}>
              Done
            </Button>
          )}
          <Button className="flex-1 rounded-full bg-gradient-to-r from-primary to-accent font-semibold text-white" onClick={onRestart}>
            Practice again
          </Button>
        </div>
      </div>
    </div>
  )
}

export function AIPracticeScreen({
  autoStartFromPlan = false,
  profile,
  courses,
  onSkillUpdate,
  onRoleplayComplete,
  onReturnToCourseReward,
  onOpenCourse,
  onBack,
}: AIPracticeScreenProps) {
  const focusSkill = profile.weakAreas[0] ?? 'technical'
  const focusLabel = formatSkillLabel(focusSkill)
  const focusScore = profile.radarData[focusSkill]
  const focusGap = profile.skillGapByCategory[focusSkill]
  const supportSkill = useMemo(() => getSupportSkill(profile, focusSkill), [profile, focusSkill])
  const supportLabel = formatSkillLabel(supportSkill)

  const focusCourse = useMemo(
    () => courses.find(course => course.skillCategory === focusSkill && course.status !== 'completed') ?? courses.find(course => course.skillCategory === focusSkill) ?? null,
    [courses, focusSkill],
  )
  const courseStep = useMemo(() => getCourseStep(focusCourse), [focusCourse])
  const recentFocusEvent = useMemo(
    () => profile.competencyHistory.find(event => event.skillCategory === focusSkill) ?? profile.competencyHistory[0] ?? null,
    [profile.competencyHistory, focusSkill],
  )
  const plan = useMemo(
    () => getPracticePlan(focusSkill, focusCourse?.title ?? null, courseStep),
    [focusSkill, focusCourse?.title, courseStep],
  )

  const [screen, setScreen] = useState<SessionScreen>('dashboard')
  const [practiceOpen, setPracticeOpen] = useState(false)
  const [messages, setMessages] = useState<CoachMessage[]>([
    { id: 'intro', role: 'ai', content: INTRO_QUESTION },
  ])
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const [topicDraft, setTopicDraft] = useState('')
  const [aiState, setAiState] = useState<SessionAIState>('idle')
  const [sessionMessages, setSessionMessages] = useState<SessionMessage[]>([])
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [result, setResult] = useState<SessionResult | null>(null)
  const [sessionContext, setSessionContext] = useState<SessionContext | null>(null)
  const transcriptRef = useRef<HTMLDivElement | null>(null)
  const autoStartedRef = useRef<string | null>(null)

  useEffect(() => {
    if (screen !== 'active') return
    const interval = window.setInterval(() => setElapsedSeconds(prev => prev + 1), 1000)
    return () => window.clearInterval(interval)
  }, [screen])

  useEffect(() => {
    if (!transcriptRef.current) return
    transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight
  }, [sessionMessages, screen])

  useEffect(() => {
    if (!autoStartFromPlan) return
    const scenario = profile.nextStepPlan?.scenario
    if (scenario && profile.nextStepPlan?.type === 'ai_practice' && autoStartedRef.current !== scenario) {
      autoStartedRef.current = scenario
      setSelectedTopic(scenario)
      setTopicDraft(scenario)
      setSessionContext({
        scenario,
        roleplayId: profile.nextStepPlan.roleplayId,
        courseId: profile.nextStepPlan.courseId,
      })
      setSessionMessages(buildPracticeSessionMessages(scenario, formatSkillLabel(profile.nextStepPlan.skillCategory)))
      setElapsedSeconds(0)
      setResult(null)
      setAiState('speaking')
      setScreen('active')
      window.setTimeout(() => setAiState('idle'), 1100)
    }
  }, [autoStartFromPlan, profile.nextStepPlan])

  const openPracticePanel = (initialTopic?: string) => {
    setPracticeOpen(true)

    const topic = initialTopic ?? selectedTopic
    if (topic) {
      setSelectedTopic(topic)
      setTopicDraft(topic)
      setMessages(buildCoachConversation(topic, focusLabel, courseStep))
      return
    }

    setTopicDraft('')
    setSelectedTopic(null)
    setMessages([{ id: 'intro', role: 'ai', content: INTRO_QUESTION }])
  }

  const submitTopic = () => {
    const topic = topicDraft.trim()
    if (!topic) return

    setSelectedTopic(topic)
    setMessages(buildCoachConversation(topic, focusLabel, courseStep))
  }

  const startPracticeRound = () => {
    const topic = (selectedTopic ?? topicDraft).trim()
    if (!topic) return

    setSelectedTopic(topic)
    setTopicDraft(topic)
    setPracticeOpen(false)
    setSessionContext({ scenario: topic })
    setSessionMessages(buildPracticeSessionMessages(topic, focusLabel))
    setElapsedSeconds(0)
    setResult(null)
    setAiState('speaking')
    setScreen('active')
    window.setTimeout(() => setAiState('idle'), 1100)
  }

  const handleMicPress = () => {
    const topic = selectedTopic?.trim()
    if (!topic) return

    setAiState('listening')
    window.setTimeout(() => {
      setSessionMessages(prev => [
        ...prev,
        {
          id: `user-${Date.now()}`,
          role: 'user',
          content: buildPracticeAttempt(focusSkill, topic),
        },
      ])
      setAiState('thinking')
    }, 900)

    window.setTimeout(() => {
      setSessionMessages(prev => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: 'ai',
          content: buildPracticeFollowUp(focusSkill, topic),
        },
      ])
      setAiState('speaking')
    }, 2000)

    window.setTimeout(() => setAiState('idle'), 3200)
  }

  const finishSession = () => {
    const nextResult = buildPracticeResult(focusSkill)
    setResult(nextResult)
    onSkillUpdate(focusSkill, nextResult.score)
    if (sessionContext?.roleplayId) {
      onRoleplayComplete?.(sessionContext.roleplayId)
    }
    setAiState('idle')
    setScreen('complete')
  }

  const restartSession = () => {
    if (!selectedTopic) {
      setScreen('dashboard')
      return
    }

    setSessionMessages(buildPracticeSessionMessages(selectedTopic, focusLabel))
    setElapsedSeconds(0)
    setResult(null)
    setAiState('speaking')
    setScreen('active')
    window.setTimeout(() => setAiState('idle'), 1100)
  }

  if (screen === 'active' || screen === 'complete') {
    return (
      <div className="space-y-4 px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setScreen('dashboard')}
            className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-foreground hover:bg-secondary/80"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to AI Coach
          </button>
          <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-muted-foreground">
            <Timer className="h-4 w-4 text-primary" />
            {formatDuration(elapsedSeconds)}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="space-y-4 rounded-[30px] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(247,249,252,0.98)_100%)] p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.98)_0%,rgba(17,24,39,0.98)_100%)]">
            <div className="rounded-[28px] bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] p-6 dark:bg-[linear-gradient(180deg,rgba(30,41,59,0.92)_0%,rgba(15,23,42,0.92)_100%)]">
              <SessionAvatar aiState={aiState} />
              <div className="mt-8 text-center">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">{PRACTICE_COACH.role}</p>
                <h2 className="mt-2 text-2xl font-black text-slate-950 dark:text-white">{PRACTICE_COACH.name}</h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{PRACTICE_COACH.company}</p>
              </div>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.04]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Live coach state</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{aiState === 'idle' ? 'Ready for your next response' : `Coach is ${aiState}`}</p>
                </div>
                <SessionVoiceBars active={aiState === 'speaking'} tone="ai" />
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
              <SessionVoiceBars active={aiState === 'listening'} tone="user" />
            </div>
          </div>

          <div className="rounded-[30px] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(247,249,252,0.98)_100%)] p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.98)_0%,rgba(17,24,39,0.98)_100%)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Practice Mode</p>
                <h3 className="mt-2 text-2xl font-black text-slate-950 dark:text-white">Live transcript</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{selectedTopic}</p>
              </div>
              <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">+{PRACTICE_COACH.xp} XP</div>
            </div>
            <div ref={transcriptRef} className="mt-5 h-[420px] overflow-y-auto rounded-[24px] border border-slate-200 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-slate-950/40">
              {sessionMessages.map(message => (
                <SessionMessageBubble key={message.id} message={message} />
              ))}
            </div>
          </div>
        </div>

        {screen === 'complete' && result && (
          <PracticeComplete
            result={result}
            duration={elapsedSeconds}
            onClose={() => setScreen('dashboard')}
            onRestart={restartSession}
            returnToCourseLabel={sessionContext?.courseId && sessionContext.roleplayId ? 'Return to reward' : undefined}
            onReturnToCourse={
              sessionContext?.courseId && sessionContext.roleplayId
                ? () => onReturnToCourseReward?.(sessionContext.courseId!, sessionContext.roleplayId!)
                : undefined
            }
          />
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4 px-4 py-4">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-secondary/80"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Practice
        </button>
      )}

      <div className="overflow-hidden rounded-[30px] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(247,249,252,0.98)_100%)] p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.98)_0%,rgba(17,24,39,0.98)_100%)]">
        <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Practice with AI Coach</p>
            <h1 className="mt-3 max-w-3xl text-3xl font-black tracking-[-0.03em] text-slate-950 dark:text-white sm:text-4xl">
              {plan.headline}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">{plan.summary}</p>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white dark:bg-white/10 dark:text-white/85">
                {focusLabel} focus
              </span>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                {focusGap}% gap to close
              </span>
              <span className="rounded-full bg-emerald-500/12 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300">
                Lean on {supportLabel}
              </span>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button className="rounded-full bg-gradient-to-r from-primary to-accent px-5 font-semibold text-white" onClick={() => openPracticePanel()}>
                Start practice round
              </Button>
              {focusCourse && onOpenCourse && (
                <Button
                  variant="outline"
                  className="rounded-full border-slate-200 bg-white text-slate-900 hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:hover:bg-white/[0.08]"
                  onClick={() => onOpenCourse(focusCourse.id)}
                >
                  Quick refresh
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          <div className="rounded-[28px] border border-slate-200 bg-slate-950 p-5 text-white shadow-[0_20px_60px_rgba(15,23,42,0.14)] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.98)_0%,rgba(20,33,61,0.98)_100%)]">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-cyan-300" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/55">Recommended next move</p>
            </div>
            <h2 className="mt-3 text-2xl font-black leading-tight">{plan.objective}</h2>
            <p className="mt-3 text-sm leading-7 text-white/72">{plan.recommendation}</p>

            <div className="mt-5 rounded-[22px] border border-white/10 bg-white/5 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">Best reinforcement</p>
              <p className="mt-2 text-base font-semibold text-white">
                {focusCourse ? focusCourse.title : `${focusLabel} learning path`}
              </p>
              <p className="mt-1 text-sm text-white/65">
                {courseStep
                  ? `Open the journey path and choose between ${courseStep} or the next activity before you come back here.`
                  : 'Open the journey path to choose the next episode, game, or checkpoint for this skill.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.04fr_0.96fr]">
        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-white/[0.03]">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Concrete plan</p>
          </div>
          <h3 className="mt-3 text-2xl font-black text-slate-950 dark:text-white">Three ways to move this skill forward</h3>
          <div className="mt-5 space-y-3">
            {plan.planCards.map((card, index) => (
              <div key={card.title} className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 dark:border-white/10 dark:bg-white/[0.04]">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white dark:bg-white dark:text-slate-950">
                    {index + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="text-base font-bold text-slate-950 dark:text-white">{card.title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{card.detail}</p>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-500">{card.cue}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[28px] border border-white/70 bg-[linear-gradient(180deg,#f7f9fc_0%,#edf4ff_100%)] p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.94)_0%,rgba(20,33,61,0.96)_100%)]">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Start from a real scenario</p>
          </div>
          <h3 className="mt-3 text-2xl font-black text-slate-950 dark:text-white">Pick the first conversation to practice</h3>
          <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
            These starts open the coach with a real goal instead of dropping you into a vague session.
          </p>
          <div className="mt-5 space-y-3">
            {plan.starterPrompts.map(prompt => (
              <button
                key={prompt.title}
                type="button"
                onClick={() => openPracticePanel(prompt.prompt)}
                className="w-full rounded-[24px] border border-slate-200 bg-white px-4 py-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.07]"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white dark:bg-white/10">
                    <Zap className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-base font-bold text-slate-950 dark:text-white">{prompt.title}</p>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{prompt.detail}</p>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary">{prompt.prompt}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-white/[0.03]">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Focus today</p>
          </div>
          <div className="mt-4 flex items-end gap-3">
            <p className="text-4xl font-black text-slate-950 dark:text-white">{focusScore}</p>
            <p className="pb-1 text-sm font-semibold text-slate-500 dark:text-slate-400">current {focusLabel.toLowerCase()} score</p>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Closing this gap starts with one focused round, not a broad review session.
          </p>
          <div className="mt-4 rounded-[22px] bg-slate-50 px-4 py-3 dark:bg-white/[0.04]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-500">Support strength</p>
            <p className="mt-2 text-sm font-semibold text-slate-950 dark:text-white">Lean on {supportLabel}</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{getSupportCopy(supportSkill)}</p>
          </div>
        </section>

        <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-white/[0.03]">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Reinforce in learning</p>
          </div>
          <h3 className="mt-4 text-lg font-black text-slate-950 dark:text-white">
            {focusCourse ? focusCourse.title : `Keep building ${focusLabel}`}
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            {courseStep
              ? `Use the journey path to choose between ${courseStep} and the next activity so you can refresh the skill before coming back to AI Coach.`
              : 'Use the journey path to pick the next course activity that reinforces this skill.'}
          </p>
          {focusCourse && onOpenCourse && (
            <Button
              variant="outline"
              className="mt-5 rounded-full border-slate-200 bg-white text-slate-900 hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:hover:bg-white/[0.08]"
              onClick={() => onOpenCourse(focusCourse.id)}
            >
              Open journey path
            </Button>
          )}
        </section>

        <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-white/[0.03]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Coach notes</p>
          </div>
          <div className="mt-4 space-y-3">
            {plan.quickWins.map(item => (
              <div key={item} className="flex items-start gap-3 rounded-[20px] bg-slate-50 px-4 py-3 dark:bg-white/[0.04]">
                <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
                <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">{item}</p>
              </div>
            ))}
          </div>

          {recentFocusEvent && (
            <div className="mt-4 rounded-[22px] border border-slate-200 px-4 py-3 dark:border-white/10">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-500">Last signal</p>
              <p className="mt-2 text-sm font-semibold text-slate-950 dark:text-white">{recentFocusEvent.sourceTitle}</p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Score {recentFocusEvent.score}. {getSignalNextMove(recentFocusEvent.score)}
              </p>
            </div>
          )}
        </section>
      </div>

      {practiceOpen && (
        <div className="fixed inset-0 z-[120] flex items-end justify-center bg-slate-950/70 p-4 backdrop-blur-sm sm:items-center">
          <div className="max-h-[calc(100svh-2rem)] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.98)_0%,rgba(17,24,39,0.98)_100%)] text-white shadow-[0_30px_120px_rgba(2,6,23,0.55)]">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-300/80">AI practice</p>
                <h3 className="mt-1 text-xl font-black">Practice with AI Coach</h3>
              </div>
              <button
                type="button"
                onClick={() => setPracticeOpen(false)}
                className="rounded-full border border-white/10 bg-white/5 p-2 text-white transition hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 px-5 py-5">
              <div className="rounded-[24px] border border-cyan-300/15 bg-white/5 p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-cyan-300" />
                  <p className="text-sm font-semibold text-white/90">Mode: Practice</p>
                </div>
                <p className="mt-2 text-sm text-white/70">
                  Start with what you want to improve today. The coach will shape the round around that goal.
                </p>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-slate-950/60 p-4">
                <div className="space-y-3">
                  {messages.map(message => (
                    <div key={message.id} className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}>
                      <div
                        className={cn(
                          'max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6',
                          message.role === 'user' ? 'bg-cyan-400 text-slate-950' : 'bg-white/8 text-white/90',
                        )}
                      >
                        {message.content}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                <label htmlFor="coach-topic" className="text-xs font-semibold uppercase tracking-[0.22em] text-white/55">
                  Tell the coach what to work on
                </label>
                <div className="mt-3 flex gap-3">
                  <input
                    id="coach-topic"
                    value={topicDraft}
                    onChange={event => setTopicDraft(event.target.value)}
                    onKeyDown={event => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        submitTopic()
                      }
                    }}
                    placeholder="Example: Help me lead a difficult feedback conversation"
                    className="h-12 flex-1 rounded-full border border-white/10 bg-slate-950/70 px-4 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-cyan-300/50"
                  />
                  <Button className="rounded-full bg-gradient-to-r from-primary to-accent px-5 font-semibold text-white" onClick={submitTopic}>
                    Set scenario
                  </Button>
                </div>
              </div>

              {selectedTopic && (
                <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">Selected scenario</p>
                  <p className="mt-2 text-sm leading-6 text-white/85">{selectedTopic}</p>
                </div>
              )}

              {!selectedTopic && (
                <div className="flex flex-wrap gap-2">
                  {plan.starterPrompts.map(prompt => (
                    <button
                      key={prompt.prompt}
                      type="button"
                      onClick={() => openPracticePanel(prompt.prompt)}
                      className="rounded-full bg-white/8 px-4 py-2 text-sm font-semibold text-white/85 transition hover:bg-white/12"
                    >
                      {prompt.title}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  className="flex-1 rounded-full bg-gradient-to-r from-primary to-accent font-semibold text-white"
                  onClick={startPracticeRound}
                  disabled={!selectedTopic && !topicDraft.trim()}
                >
                  Start practice round
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10"
                  onClick={() => setPracticeOpen(false)}
                >
                  Save for later
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
