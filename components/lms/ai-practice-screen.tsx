'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, BookOpen, Brain, CheckCircle2, ChevronLeft, Mic, PhoneOff, Sparkles, Target, Timer, TrendingUp, Volume2, VolumeX, X, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SpeedChecklistSummary } from '@/components/lms/speed-checklist-summary'
import { projectSpeedFrameworkStages } from '@/lib/speed-framework'
import { cn } from '@/lib/utils'
import type { Course, SkillCategory, SkillUpdateContext, SpeedStageKey, UserSkillProfile } from '@/lib/types'

interface AIPracticeScreenProps {
  autoStartFromPlan?: boolean
  profile: UserSkillProfile
  courses: Course[]
  onSkillUpdate: (skillCategory: SkillCategory, score: number, context?: SkillUpdateContext) => void
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
  voiceGender: 'female' as const,
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
      content: `Practice mode ready. Focus area: ${focusLabel}. Press Start to begin.`,
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

function buildGuidedSpeedSignals(
  skill: SkillCategory,
  topic: string,
  score: number,
): Partial<Record<SpeedStageKey, number>> {
  const normalizedTopic = topic.toLowerCase()
  const hasStartCue = /open|opening|hook|intro|start/.test(normalizedTopic)
  const hasProbeCue = /discover|question|probe|understand|qualif/.test(normalizedTopic)
  const hasValueCue = /value|pitch|feature|benefit|roi|explain|compare|product/.test(normalizedTopic)
  const hasObjectionCue = /objection|pushback|price|hesitat|concern/.test(normalizedTopic)
  const hasCloseCue = /close|closing|next step|next-step|decision|commit/.test(normalizedTopic)

  const cueBoosts = {
    start_right: hasStartCue ? 2 : 0,
    plan_to_probe: hasProbeCue ? 2 : 0,
    explain_value: hasValueCue ? 2 : 0,
    eliminate_objection: hasObjectionCue ? 2 : 0,
    drive_closure: hasCloseCue ? 2 : 0,
  }

  switch (skill) {
    case 'communication':
      return {
        start_right: Math.min(100, score + 2 + cueBoosts.start_right),
        plan_to_probe: Math.min(100, score + 4 + cueBoosts.plan_to_probe),
        explain_value: Math.min(100, score + 1 + cueBoosts.explain_value),
        eliminate_objection: Math.min(100, score + 2 + cueBoosts.eliminate_objection),
        drive_closure: Math.min(100, score + 1 + cueBoosts.drive_closure),
      }
    case 'leadership':
    case 'compliance':
      return {
        start_right: Math.min(100, score + 1 + cueBoosts.start_right),
        plan_to_probe: Math.min(100, score + 2 + cueBoosts.plan_to_probe),
        explain_value: Math.min(100, score + 1 + cueBoosts.explain_value),
        eliminate_objection: Math.min(100, score + 4 + cueBoosts.eliminate_objection),
        drive_closure: Math.min(100, score + 1 + cueBoosts.drive_closure),
      }
    case 'technical':
    default:
      return {
        start_right: Math.min(100, score + 2 + cueBoosts.start_right),
        plan_to_probe: Math.min(100, score + 1 + cueBoosts.plan_to_probe),
        explain_value: Math.min(100, score + 4 + cueBoosts.explain_value),
        eliminate_objection: Math.min(100, score + 1 + cueBoosts.eliminate_objection),
        drive_closure: Math.min(100, score + 1 + cueBoosts.drive_closure),
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
  speedStages,
  returnToCourseLabel,
  onClose,
  onRestart,
  onReturnToCourse,
}: {
  result: SessionResult
  duration: number
  speedStages: UserSkillProfile['speedFramework']['stages']
  returnToCourseLabel?: string
  onClose: () => void
  onRestart: () => void
  onReturnToCourse?: () => void
}) {
  return (
    <div className="fixed inset-0 z-[130] flex items-end justify-center bg-slate-950/38 p-3 backdrop-blur-md sm:items-center sm:p-4">
      <div className="max-h-[calc(100svh-1.5rem)] w-full max-w-lg overflow-y-auto rounded-[32px] border border-white/75 bg-[radial-gradient(circle_at_top,rgba(125,211,252,0.18),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(247,249,252,0.98)_100%)] p-5 text-slate-950 shadow-[0_30px_120px_rgba(15,23,42,0.18)] sm:p-6">
        <div className="text-center">
          <div className="mx-auto flex h-18 w-18 items-center justify-center rounded-full bg-[linear-gradient(180deg,#22c55e_0%,#10b981_100%)] text-white shadow-[0_18px_40px_rgba(16,185,129,0.24)]">
            <Sparkles className="h-8 w-8" />
          </div>
          <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">AI practice summary</p>
          <h2 className="mt-2 text-[2rem] font-black tracking-[-0.045em] text-slate-950 sm:text-[2.2rem]">Practice complete</h2>
          <p className="mt-2 text-[15px] font-medium leading-6 text-slate-600">
            Your readiness profile and SPEED benchmark have been updated.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <div className="rounded-[24px] border border-slate-200/80 bg-white/82 p-4 text-center shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
            <div className="text-[2rem] font-black tracking-[-0.05em] text-slate-950">{formatDuration(duration)}</div>
            <div className="mt-1 text-[11px] font-semibold text-slate-500">Duration</div>
          </div>
          <div className="rounded-[24px] border border-slate-200/80 bg-white/82 p-4 text-center shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
            <div className="text-[2rem] font-black tracking-[-0.05em] text-amber-500">{result.score}%</div>
            <div className="mt-1 text-[11px] font-semibold text-slate-500">Score</div>
          </div>
          <div className="rounded-[24px] border border-slate-200/80 bg-white/82 p-4 text-center shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
            <div className="text-[2rem] font-black tracking-[-0.05em] text-cyan-500">+{result.xp}</div>
            <div className="mt-1 text-[11px] font-semibold text-slate-500">XP</div>
          </div>
        </div>

        <SpeedChecklistSummary stages={speedStages} variant="light" className="mt-5" />

        <div className="mt-5 space-y-3">
          <div className="rounded-[26px] border border-emerald-200/90 bg-[linear-gradient(180deg,rgba(240,253,250,0.96)_0%,rgba(220,252,231,0.96)_100%)] p-5 shadow-[0_16px_40px_rgba(16,185,129,0.08)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">Strengths</p>
            <ul className="mt-4 space-y-3 text-[15px] font-medium leading-6 text-slate-700">
              {result.strengths.map(item => <li key={item}>- {item}</li>)}
            </ul>
          </div>
          <div className="rounded-[26px] border border-amber-200/90 bg-[linear-gradient(180deg,rgba(255,251,235,0.96)_0%,rgba(254,249,195,0.9)_100%)] p-5 shadow-[0_16px_40px_rgba(245,158,11,0.08)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700">Focus next</p>
            <ul className="mt-4 space-y-3 text-[15px] font-medium leading-6 text-slate-700">
              {result.improvements.map(item => <li key={item}>- {item}</li>)}
            </ul>
            <p className="mt-4 border-t border-amber-200/80 pt-3 text-[13px] font-medium leading-5 text-slate-500">
              Visit the Profile section to see your updated SPEED scores.
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          {onReturnToCourse && returnToCourseLabel ? (
            <Button className="h-12 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-sm font-semibold text-white shadow-[0_16px_36px_rgba(14,165,233,0.22)] hover:opacity-95" onClick={onReturnToCourse}>
              {returnToCourseLabel}
            </Button>
          ) : (
            <Button variant="outline" className="h-12 rounded-full border-slate-200 bg-white text-slate-900 hover:bg-slate-50" onClick={onClose}>
              Done
            </Button>
          )}
          <Button className="h-12 rounded-full bg-gradient-to-r from-sky-400 via-cyan-400 to-teal-400 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(56,189,248,0.26)] hover:opacity-95" onClick={onRestart}>
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
  const [hasConversationStarted, setHasConversationStarted] = useState(false)
  const [isLoopPaused, setIsLoopPaused] = useState(false)
  const [result, setResult] = useState<SessionResult | null>(null)
  const [speedStageSnapshot, setSpeedStageSnapshot] = useState<UserSkillProfile['speedFramework']['stages'] | null>(null)
  const [sessionContext, setSessionContext] = useState<SessionContext | null>(null)
  const transcriptRef = useRef<HTMLDivElement | null>(null)
  const autoStartedRef = useRef<string | null>(null)
  const sessionMessagesRef = useRef<SessionMessage[]>([])
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const silenceIntervalRef = useRef<number | null>(null)
  const listenTimeoutRef = useRef<number | null>(null)
  const audioChunksRef = useRef<BlobPart[]>([])
  const hasDetectedSpeechRef = useRef(false)
  const lastSpeechAtRef = useRef<number | null>(null)
  const shouldProcessRecordingRef = useRef(false)
  const stopRequestedRef = useRef(false)
  const isSubmittingTurnRef = useRef(false)
  const hasConversationStartedRef = useRef(false)
  const isLoopPausedRef = useRef(false)
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)
  const currentAudioUrlRef = useRef<string | null>(null)
  const playbackResolveRef = useRef<((completed: boolean) => void) | null>(null)
  const beginListeningRef = useRef<() => Promise<void>>(async () => {})

  useEffect(() => {
    sessionMessagesRef.current = sessionMessages
  }, [sessionMessages])

  useEffect(() => {
    if (screen !== 'active') return
    const interval = window.setInterval(() => setElapsedSeconds(prev => prev + 1), 1000)
    return () => window.clearInterval(interval)
  }, [screen])

  useEffect(() => {
    if (!transcriptRef.current) return
    transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight
  }, [sessionMessages, screen])

  const clearListenTimeout = useCallback(() => {
    if (listenTimeoutRef.current !== null) {
      window.clearTimeout(listenTimeoutRef.current)
      listenTimeoutRef.current = null
    }
  }, [])

  const clearSilenceMonitor = useCallback(() => {
    if (silenceIntervalRef.current !== null) {
      window.clearInterval(silenceIntervalRef.current)
      silenceIntervalRef.current = null
    }
  }, [])

  const stopPlayback = useCallback(() => {
    const resolver = playbackResolveRef.current
    playbackResolveRef.current = null

    if (currentAudioRef.current) {
      currentAudioRef.current.onended = null
      currentAudioRef.current.onerror = null
      currentAudioRef.current.pause()
      currentAudioRef.current.currentTime = 0
      currentAudioRef.current = null
    }

    if (currentAudioUrlRef.current) {
      URL.revokeObjectURL(currentAudioUrlRef.current)
      currentAudioUrlRef.current = null
    }

    resolver?.(false)
  }, [])

  const releaseMicrophone = useCallback(() => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect()
      sourceNodeRef.current = null
    }

    if (analyserRef.current) {
      analyserRef.current.disconnect()
      analyserRef.current = null
    }

    if (audioContextRef.current) {
      const context = audioContextRef.current
      audioContextRef.current = null
      if (context.state !== 'closed') {
        void context.close()
      }
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop())
      mediaStreamRef.current = null
    }
  }, [])

  const stopRecorder = useCallback((processRecording: boolean) => {
    clearSilenceMonitor()
    shouldProcessRecordingRef.current = processRecording

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
      return
    }

    mediaRecorderRef.current = null
  }, [clearSilenceMonitor])

  const resetVoiceRuntime = useCallback((releaseMic: boolean) => {
    stopRequestedRef.current = true
    isSubmittingTurnRef.current = false
    clearListenTimeout()
    stopRecorder(false)
    stopPlayback()

    if (releaseMic) {
      releaseMicrophone()
    }

    setAiState('idle')
    setHasConversationStarted(false)
    setIsLoopPaused(false)
    hasConversationStartedRef.current = false
    isLoopPausedRef.current = false
  }, [clearListenTimeout, releaseMicrophone, stopPlayback, stopRecorder])

  const appendSystemMessage = useCallback((content: string) => {
    const trimmedContent = content.trim()
    if (!trimmedContent) return

    setSessionMessages(prev => [
      ...prev,
      {
        id: `system-${Date.now()}`,
        role: 'system',
        content: trimmedContent,
      },
    ])
  }, [])

  const ensureMicrophoneAccess = useCallback(async () => {
    if (mediaStreamRef.current) {
      if (audioContextRef.current?.state === 'suspended') {
        await audioContextRef.current.resume()
      }
      return mediaStreamRef.current
    }

    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      throw new Error('Microphone input is not supported in this browser.')
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    })

    const AudioContextConstructor =
      window.AudioContext ||
      (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext

    if (!AudioContextConstructor) {
      stream.getTracks().forEach(track => track.stop())
      throw new Error('Audio analysis is not supported in this browser.')
    }

    const context = new AudioContextConstructor()
    await context.resume()

    const sourceNode = context.createMediaStreamSource(stream)
    const analyser = context.createAnalyser()
    analyser.fftSize = 2048
    sourceNode.connect(analyser)

    mediaStreamRef.current = stream
    audioContextRef.current = context
    sourceNodeRef.current = sourceNode
    analyserRef.current = analyser

    return stream
  }, [])

  const decodeBase64ToBlob = useCallback((audioBase64: string, mimeType: string) => {
    const binary = window.atob(audioBase64)
    const bytes = new Uint8Array(binary.length)

    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index)
    }

    return new Blob([bytes], { type: mimeType })
  }, [])

  const playAudioFromBase64 = useCallback(async (audioBase64: string, mimeType: string) => {
    if (!audioBase64 || isMuted) {
      return false
    }

    stopPlayback()

    const blob = decodeBase64ToBlob(audioBase64, mimeType)
    const audioUrl = URL.createObjectURL(blob)
    const audio = new Audio(audioUrl)

    currentAudioRef.current = audio
    currentAudioUrlRef.current = audioUrl

    return await new Promise<boolean>((resolve) => {
      playbackResolveRef.current = resolve

      const finalize = (completed: boolean) => {
        if (playbackResolveRef.current) {
          playbackResolveRef.current = null
        }

        if (currentAudioRef.current === audio) {
          currentAudioRef.current = null
        }

        if (currentAudioUrlRef.current === audioUrl) {
          URL.revokeObjectURL(audioUrl)
          currentAudioUrlRef.current = null
        }

        resolve(completed)
      }

      audio.onended = () => finalize(true)
      audio.onerror = () => finalize(false)
      audio.play().catch(() => finalize(false))
    })
  }, [decodeBase64ToBlob, isMuted, stopPlayback])

  const getSupportedAudioMimeType = useCallback(() => {
    if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') {
      return ''
    }

    const supportedTypes = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus',
    ]

    return supportedTypes.find((type) => MediaRecorder.isTypeSupported(type)) ?? ''
  }, [])

  const scheduleListening = useCallback((callback: () => Promise<void>, delayMs = 200) => {
    clearListenTimeout()

    if (!hasConversationStartedRef.current || isLoopPausedRef.current || stopRequestedRef.current) {
      return
    }

    listenTimeoutRef.current = window.setTimeout(() => {
      listenTimeoutRef.current = null
      void callback()
    }, delayMs)
  }, [clearListenTimeout])

  const submitAudioTurn = useCallback(async (audioBlob: Blob, mimeType: string) => {
    if (!selectedTopic) return

    isSubmittingTurnRef.current = true
    setAiState('thinking')

    try {
      const history = sessionMessagesRef.current
        .filter((message) => message.role === 'ai' || message.role === 'user')
        .slice(-12)
        .map((message) => ({
          role: message.role,
          content: message.content,
        }))

      const formData = new FormData()
      formData.append('audio', audioBlob, `practice-turn.${mimeType.includes('mp4') ? 'm4a' : 'webm'}`)
      formData.append('scenario', selectedTopic)
      formData.append('focusSkill', focusSkill)
      formData.append('coachName', PRACTICE_COACH.name)
      formData.append('coachGender', PRACTICE_COACH.voiceGender)
      formData.append('history', JSON.stringify(history))

      const response = await fetch('/api/ai-practice/respond', {
        method: 'POST',
        body: formData,
      })

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(typeof payload?.error === 'string' ? payload.error : 'Unable to process the recording.')
      }

      const transcript = typeof payload?.transcript === 'string' ? payload.transcript.trim() : ''
      const reply = typeof payload?.reply === 'string' ? payload.reply.trim() : ''
      const audioBase64 = typeof payload?.audioBase64 === 'string' ? payload.audioBase64 : ''
      const audioMimeType = typeof payload?.audioMimeType === 'string' ? payload.audioMimeType : 'audio/wav'

      if (!transcript) {
        throw new Error('No speech was detected in the latest turn.')
      }

      if (!reply) {
        throw new Error('The coach did not return a reply.')
      }

      setSessionMessages(prev => [
        ...prev,
        {
          id: `user-${Date.now()}`,
          role: 'user',
          content: transcript,
        },
        {
          id: `ai-${Date.now() + 1}`,
          role: 'ai',
          content: reply,
        },
      ])

      if (isMuted || !audioBase64) {
        setAiState('idle')
        scheduleListening(beginListeningRef.current, 120)
        return
      }

      setAiState('speaking')
      const completedPlayback = await playAudioFromBase64(audioBase64, audioMimeType)
      setAiState('idle')

      if (completedPlayback) {
        scheduleListening(beginListeningRef.current, 120)
        return
      }

      if (!isLoopPausedRef.current && hasConversationStartedRef.current && !stopRequestedRef.current) {
        scheduleListening(beginListeningRef.current, 0)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'The coach could not process that turn.'
      appendSystemMessage(message)
      setAiState('idle')
      scheduleListening(beginListeningRef.current, 250)
    } finally {
      isSubmittingTurnRef.current = false
    }
  }, [appendSystemMessage, focusSkill, isMuted, playAudioFromBase64, scheduleListening, selectedTopic])

  const beginListening = useCallback(async () => {
    if (
      stopRequestedRef.current ||
      isLoopPausedRef.current ||
      isSubmittingTurnRef.current ||
      !hasConversationStartedRef.current
    ) {
      return
    }

    try {
      const stream = await ensureMicrophoneAccess()
      const mimeType = getSupportedAudioMimeType()
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)
      const analyser = analyserRef.current

      audioChunksRef.current = []
      hasDetectedSpeechRef.current = false
      lastSpeechAtRef.current = null
      shouldProcessRecordingRef.current = true
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      recorder.onstop = async () => {
        clearSilenceMonitor()
        mediaRecorderRef.current = null

        const shouldProcess = shouldProcessRecordingRef.current
        const detectedSpeech = hasDetectedSpeechRef.current
        const chunkData = [...audioChunksRef.current]

        audioChunksRef.current = []
        shouldProcessRecordingRef.current = false

        if (!shouldProcess || !detectedSpeech || !chunkData.length) {
          if (!stopRequestedRef.current && !isLoopPausedRef.current && hasConversationStartedRef.current) {
            scheduleListening(beginListeningRef.current, 0)
          }
          return
        }

        const blob = new Blob(chunkData, { type: recorder.mimeType || mimeType || 'audio/webm' })
        if (blob.size < 2048) {
          if (!stopRequestedRef.current && !isLoopPausedRef.current && hasConversationStartedRef.current) {
            scheduleListening(beginListeningRef.current, 0)
          }
          return
        }

        await submitAudioTurn(blob, recorder.mimeType || mimeType || 'audio/webm')
      }

      recorder.start()
      setAiState('listening')

      if (!analyser) {
        appendSystemMessage('Audio analysis is unavailable, so the mic cannot auto-stop on silence.')
        stopRecorder(false)
        setAiState('idle')
        setIsLoopPaused(true)
        isLoopPausedRef.current = true
        return
      }

      const sampleBuffer = new Uint8Array(analyser.fftSize)
      clearSilenceMonitor()

      silenceIntervalRef.current = window.setInterval(() => {
        analyser.getByteTimeDomainData(sampleBuffer)

        let averageDeviation = 0
        for (let index = 0; index < sampleBuffer.length; index += 1) {
          averageDeviation += Math.abs(sampleBuffer[index] - 128)
        }

        averageDeviation /= sampleBuffer.length * 128

        if (averageDeviation > 0.03) {
          hasDetectedSpeechRef.current = true
          lastSpeechAtRef.current = Date.now()
          return
        }

        if (
          hasDetectedSpeechRef.current &&
          lastSpeechAtRef.current &&
          Date.now() - lastSpeechAtRef.current > 1200
        ) {
          stopRecorder(true)
        }
      }, 150)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to start the microphone.'
      appendSystemMessage(message)
      setAiState('idle')
      setIsLoopPaused(true)
      isLoopPausedRef.current = true
    }
  }, [appendSystemMessage, clearSilenceMonitor, ensureMicrophoneAccess, getSupportedAudioMimeType, scheduleListening, stopRecorder, submitAudioTurn])

  const startConversationLoop = useCallback(async () => {
    const opener = sessionMessagesRef.current.find((message) => message.role === 'ai')?.content?.trim()
    if (!opener) return

    stopRequestedRef.current = false
    setHasConversationStarted(true)
    setIsLoopPaused(false)
    hasConversationStartedRef.current = true
    isLoopPausedRef.current = false

    try {
      await ensureMicrophoneAccess()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to access the microphone.'
      appendSystemMessage(message)
      setAiState('idle')
      setHasConversationStarted(false)
      hasConversationStartedRef.current = false
      return
    }

    try {
      setAiState('speaking')
      const response = await fetch('/api/ai-practice/speak', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: opener,
          coachGender: PRACTICE_COACH.voiceGender,
        }),
      })

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(typeof payload?.error === 'string' ? payload.error : 'Unable to play the opening line.')
      }

      if (!isMuted && typeof payload?.audioBase64 === 'string') {
        await playAudioFromBase64(payload.audioBase64, typeof payload?.audioMimeType === 'string' ? payload.audioMimeType : 'audio/wav')
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'The opening line could not be played.'
      appendSystemMessage(message)
    } finally {
      setAiState('idle')
      scheduleListening(beginListeningRef.current, 120)
    }
  }, [appendSystemMessage, beginListening, ensureMicrophoneAccess, isMuted, playAudioFromBase64, scheduleListening])

  const pauseConversationLoop = useCallback(() => {
    setIsLoopPaused(true)
    isLoopPausedRef.current = true
    stopRequestedRef.current = false
    clearListenTimeout()
    stopRecorder(false)
    stopPlayback()
    setAiState('idle')
  }, [clearListenTimeout, stopPlayback, stopRecorder])

  const resumeConversationLoop = useCallback(() => {
    if (!hasConversationStartedRef.current) return

    stopRequestedRef.current = false
    setIsLoopPaused(false)
    isLoopPausedRef.current = false
    setAiState('idle')
    scheduleListening(beginListeningRef.current, 120)
  }, [scheduleListening])

  const prepareSession = useCallback((topic: string, nextContext: SessionContext) => {
    resetVoiceRuntime(true)

    const initialMessages = buildPracticeSessionMessages(topic, focusLabel)
    sessionMessagesRef.current = initialMessages

    setSelectedTopic(topic)
    setTopicDraft(topic)
    setPracticeOpen(false)
    setSessionContext(nextContext)
    setSessionMessages(initialMessages)
    setElapsedSeconds(0)
    setResult(null)
    setSpeedStageSnapshot(null)
    setAiState('idle')
    setScreen('active')
  }, [focusLabel, resetVoiceRuntime])

  useEffect(() => {
    if (!autoStartFromPlan) return
    const scenario = profile.nextStepPlan?.scenario
    if (scenario && profile.nextStepPlan?.type === 'ai_practice' && autoStartedRef.current !== scenario) {
      autoStartedRef.current = scenario
      prepareSession(scenario, {
        scenario,
        roleplayId: profile.nextStepPlan.roleplayId,
        courseId: profile.nextStepPlan.courseId,
      })
    }
  }, [autoStartFromPlan, prepareSession, profile.nextStepPlan])

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

    prepareSession(topic, { scenario: topic })
  }

  const handleVoiceControlPress = () => {
    if (!selectedTopic?.trim()) return

    if (!hasConversationStartedRef.current) {
      void startConversationLoop()
      return
    }

    if (isLoopPausedRef.current) {
      resumeConversationLoop()
      return
    }

    if (aiState === 'listening' || aiState === 'thinking') {
      return
    }

    pauseConversationLoop()
  }

  const finishSession = () => {
    resetVoiceRuntime(true)

    const nextResult = buildPracticeResult(focusSkill)
    const scenarioLabel = sessionContext?.scenario ?? selectedTopic ?? 'AI Coach Practice'
    const practiceContext: SkillUpdateContext = {
      sourceId: sessionContext?.roleplayId ?? `guided-ai-${focusSkill}`,
      sourceTitle: scenarioLabel,
      practiceMode: 'guided_ai',
      speedSignals: buildGuidedSpeedSignals(focusSkill, scenarioLabel, nextResult.score),
    }

    setResult(nextResult)
    setSpeedStageSnapshot(projectSpeedFrameworkStages(profile.speedFramework.stages, nextResult.score, practiceContext))
    onSkillUpdate(focusSkill, nextResult.score, practiceContext)
    if (sessionContext?.roleplayId) {
      onRoleplayComplete?.(sessionContext.roleplayId)
    }
    setScreen('complete')
  }

  const restartSession = () => {
    if (!selectedTopic) {
      setScreen('dashboard')
      return
    }

    prepareSession(selectedTopic, sessionContext ?? { scenario: selectedTopic })
  }

  const handleReturnToDashboard = useCallback(() => {
    resetVoiceRuntime(true)
    setScreen('dashboard')
  }, [resetVoiceRuntime])

  useEffect(() => {
    beginListeningRef.current = beginListening
  }, [beginListening])

  useEffect(() => {
    if (!isMuted || !currentAudioRef.current) return

    stopPlayback()
    setAiState('idle')
    scheduleListening(beginListeningRef.current, 0)
  }, [isMuted, scheduleListening, stopPlayback])

  useEffect(() => {
    return () => {
      resetVoiceRuntime(true)
    }
  }, [resetVoiceRuntime])

  const voiceControlLabel = !hasConversationStarted
    ? 'Start'
    : isLoopPaused
      ? 'Resume'
      : aiState === 'listening'
        ? 'Listening'
        : aiState === 'thinking'
          ? 'Thinking'
          : 'Pause'

  const voiceControlDisabled = aiState === 'thinking'

  if (screen === 'active' || screen === 'complete') {
    return (
      <div className="space-y-4 px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleReturnToDashboard}
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
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                {isMuted ? 'Unmute' : 'Mute'}
              </button>
              <button
                type="button"
                onClick={handleVoiceControlPress}
                disabled={voiceControlDisabled}
                className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-accent px-4 py-3 text-sm font-semibold text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Mic className="h-4 w-4" />
                {voiceControlLabel}
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
            speedStages={speedStageSnapshot ?? profile.speedFramework.stages}
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
