'use client'

import {
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  animate,
  AnimatePresence,
  motion,
  useAnimationControls,
  useDragControls,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from 'framer-motion'
import {
  MoveRight,
  MessageCircle,
  Mic,
  Send,
  Sparkles,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { SkillCategory, UserSkillProfile } from '@/lib/types'

export type MascotEmotion = 'idle' | 'excited' | 'waving' | 'celebrating'
export type MascotTriggerKind = 'intro' | 'idle' | 'hint' | 'celebrate' | 'chat'

export interface MascotTriggerEvent {
  id: string
  trigger: MascotTriggerKind
  title: string
  message: string
  emotion?: MascotEmotion
  courseTitle?: string
  itemTitle?: string
  skill?: SkillCategory
  openChat?: boolean
}

type MascotChatMessage = {
  id: string
  role: 'user' | 'mascot' | 'system'
  content: string
  emotion?: MascotEmotion
  contextTrigger?: MascotTriggerKind
}

type MascotFraming = 'full' | 'upper'
type MascotNudgeMode = 'auto' | 'manual'
type IntroStep = 0 | 1

interface MascotOverlayProps {
  activeTab: string
  userName: string
  skillProfile: UserSkillProfile
  event: MascotTriggerEvent | null
}

const INTRO_STORAGE_KEY = 'snaplearn-mascot-intro-seen-v1'

const entranceSpring = { type: 'spring' as const, stiffness: 200, damping: 15 }
const bounceSpring = { type: 'spring' as const, stiffness: 260, damping: 14 }
const idleSpring = { type: 'spring' as const, stiffness: 120, damping: 14 }
const introStepTransition = { type: 'spring' as const, stiffness: 240, damping: 26 }
const introStepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 72 : -72,
    opacity: 0,
    scale: 0.96,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -72 : 72,
    opacity: 0,
    scale: 0.96,
  }),
}

// Keep the mascot experience in the codebase for later, but hide the visual
// mascot and welcome flow until the production mascot is ready.
const SHOW_MASCOT_VISUALS = false
const SHOW_MASCOT_WELCOME_FLOW = false
const SHOW_MASCOT_AUTO_NUDGES = false

function formatSkill(skill?: SkillCategory) {
  if (!skill) return null
  return skill.charAt(0).toUpperCase() + skill.slice(1)
}

function getEmotionForTrigger(trigger: MascotTriggerKind): MascotEmotion {
  switch (trigger) {
    case 'celebrate':
      return 'celebrating'
    case 'chat':
      return 'excited'
    case 'hint':
      return 'waving'
    case 'idle':
      return 'idle'
    case 'intro':
    default:
      return 'waving'
  }
}

function buildManualTrigger(userName: string, skillProfile: UserSkillProfile): MascotTriggerEvent {
  const focusSkill = formatSkill(skillProfile.weakAreas[0])
  return {
    id: `manual-${Date.now()}`,
    trigger: 'chat',
    title: `Nova is on standby, ${userName}.`,
    message: focusSkill
      ? `Want a chaotic game plan for your ${focusSkill.toLowerCase()} gap? Tap me and I will make it weirdly useful.`
      : 'Tap me and I will turn the next move into a loud, useful plan.',
    emotion: 'waving',
  }
}

function buildIntroMessages(userName: string, event: MascotTriggerEvent | null, skillProfile: UserSkillProfile) {
  const focusSkill = formatSkill(event?.skill ?? skillProfile.weakAreas[0]) ?? 'your next focus area'
  const title = event?.itemTitle ?? event?.courseTitle ?? 'this run'

  if (!SHOW_MASCOT_VISUALS) {
    return [
      {
        id: 'intro-system',
        role: 'system' as const,
        content: 'Nova chat is ready.',
        contextTrigger: event?.trigger ?? 'intro',
      },
      {
        id: 'intro-mascot',
        role: 'mascot' as const,
        content: `I am Nova. I am tracking ${title} and your ${focusSkill.toLowerCase()} progress, ${userName}. Ask me what to do next and I will keep it useful.`,
        emotion: 'waving' as const,
        contextTrigger: event?.trigger ?? 'intro',
      },
    ]
  }

  return [
    {
      id: 'intro-system',
      role: 'system' as const,
      content: `Nova jumped in from the right edge.`,
      contextTrigger: event?.trigger ?? 'intro',
    },
    {
      id: 'intro-mascot',
      role: 'mascot' as const,
      content: `I am Nova. I pop up when you stall, drift, or absolutely cook a checkpoint. Right now I am watching ${title} and your ${focusSkill.toLowerCase()} progress, ${userName}.`,
      emotion: 'waving' as const,
      contextTrigger: event?.trigger ?? 'intro',
    },
  ]
}

function buildQuickPrompts(event: MascotTriggerEvent | null, skillProfile: UserSkillProfile) {
  const focusSkill = formatSkill(event?.skill ?? skillProfile.weakAreas[0]) ?? 'my weakest skill'
  const itemLabel = event?.itemTitle ?? event?.courseTitle ?? 'this lesson'

  return [
    `What should I do next in ${itemLabel}?`,
    `Coach me on ${focusSkill.toLowerCase()}.`,
    'Give me a streak-saving move.',
  ]
}

function buildMascotReply(
  input: string,
  userName: string,
  activeTab: string,
  skillProfile: UserSkillProfile,
  event: MascotTriggerEvent | null,
  rapidFireCount: number,
): { content: string; emotion: MascotEmotion } {
  const normalized = input.toLowerCase()
  const focusSkill = formatSkill(event?.skill ?? skillProfile.weakAreas[0]) ?? 'focus'
  const contextLabel = event?.itemTitle ?? event?.courseTitle ?? 'this screen'
  const streakCue = rapidFireCount >= 3

  if (normalized.includes('who are you')) {
    return {
      emotion: 'waving',
      content: `Nova. Chaos friend. Momentum gremlin. I jump into ${contextLabel.toLowerCase()} when it feels like you need a nudge, then I get out of your way.`,
    }
  }

  if (normalized.includes('streak')) {
    return {
      emotion: 'celebrating',
      content: `Streak mode is simple: finish one meaningful action before you drift. If you are in ${contextLabel.toLowerCase()}, clear the current beat first, then I want one more tiny win before you leave.`,
    }
  }

  if (
    normalized.includes('wrong')
    || normalized.includes('stuck')
    || normalized.includes('help')
    || normalized.includes('hint')
  ) {
    return {
      emotion: 'excited',
      content: `Here is the move: slow the pace, call out the one thing this step is testing, and answer for that target only. In ${contextLabel.toLowerCase()}, I would focus on ${focusSkill.toLowerCase()} before trying to sound impressive.`,
    }
  }

  if (
    normalized.includes('practice')
    || normalized.includes('improve')
    || normalized.includes('weak')
    || normalized.includes('skill')
    || normalized.includes('communication')
    || normalized.includes('technical')
    || normalized.includes('leadership')
    || normalized.includes('compliance')
  ) {
    return {
      emotion: 'excited',
      content: `${focusSkill} is the fastest win right now. I would run one focused rep, keep it short, and measure it against what ${contextLabel.toLowerCase()} actually demands instead of practicing in the abstract.`,
    }
  }

  if (normalized.includes('next') || normalized.includes('now')) {
    return {
      emotion: 'waving',
      content: `Next move: stay on ${contextLabel.toLowerCase()}, finish the active task, then either chain the next challenge or switch into a quick ${focusSkill.toLowerCase()} rep while the context is still warm.`,
    }
  }

  return {
    emotion: streakCue ? 'celebrating' : activeTab === 'courses' ? 'excited' : 'waving',
    content: streakCue
      ? `You are talking fast, which I respect. Here is the clean version: lock one win in ${contextLabel.toLowerCase()}, then ask me for the next one so we keep the momentum stupidly high, ${userName}.`
      : `I am reading this as a momentum question. Stay sharp on ${contextLabel.toLowerCase()}, keep the answer simple, and bias toward the part that improves ${focusSkill.toLowerCase()} instead of trying to solve everything at once.`,
  }
}

function MascotCharacter({
  emotion,
  size = 220,
  animationKey = 0,
  framing = 'full',
}: {
  emotion: MascotEmotion
  size?: number
  animationKey?: number
  framing?: MascotFraming
}) {
  const stageControls = useAnimationControls()
  const hipsControls = useAnimationControls()
  const torsoControls = useAnimationControls()
  const headControls = useAnimationControls()
  const leftArmControls = useAnimationControls()
  const leftForearmControls = useAnimationControls()
  const rightArmControls = useAnimationControls()
  const rightForearmControls = useAnimationControls()
  const leftLegControls = useAnimationControls()
  const leftCalfControls = useAnimationControls()
  const rightLegControls = useAnimationControls()
  const rightCalfControls = useAnimationControls()
  const reducedMotion = useReducedMotion()

  const pose = {
    idle: {
      head: { rotate: -4, y: 0 },
      torso: { rotate: -2, y: 0, scaleX: 1, scaleY: 1 },
      hips: { rotate: 0, y: 0 },
      leftArm: { rotate: 18 },
      leftForearm: { rotate: 12 },
      rightArm: { rotate: -8 },
      rightForearm: { rotate: -18 },
      leftLeg: { rotate: -6 },
      leftCalf: { rotate: 8 },
      rightLeg: { rotate: 8 },
      rightCalf: { rotate: -6 },
      pupils: { x: 0, y: 0 },
    },
    excited: {
      head: { rotate: 5, y: -4 },
      torso: { rotate: -5, y: -4, scaleX: 1.02, scaleY: 0.99 },
      hips: { rotate: -3, y: -2 },
      leftArm: { rotate: -18 },
      leftForearm: { rotate: -12 },
      rightArm: { rotate: 26 },
      rightForearm: { rotate: 18 },
      leftLeg: { rotate: -3 },
      leftCalf: { rotate: 4 },
      rightLeg: { rotate: 8 },
      rightCalf: { rotate: -4 },
      pupils: { x: 2, y: 0 },
    },
    waving: {
      head: { rotate: -8, y: -3 },
      torso: { rotate: -6, y: -2, scaleX: 1.01, scaleY: 1 },
      hips: { rotate: 2, y: 0 },
      leftArm: { rotate: 12 },
      leftForearm: { rotate: 6 },
      rightArm: { rotate: -62 },
      rightForearm: { rotate: 34 },
      leftLeg: { rotate: -7 },
      leftCalf: { rotate: 8 },
      rightLeg: { rotate: 12 },
      rightCalf: { rotate: -7 },
      pupils: { x: -3, y: -1 },
    },
    celebrating: {
      head: { rotate: 2, y: -7 },
      torso: { rotate: 0, y: -8, scaleX: 1.04, scaleY: 0.98 },
      hips: { rotate: 0, y: -6 },
      leftArm: { rotate: -70 },
      leftForearm: { rotate: -18 },
      rightArm: { rotate: 66 },
      rightForearm: { rotate: 18 },
      leftLeg: { rotate: -2 },
      leftCalf: { rotate: 6 },
      rightLeg: { rotate: 14 },
      rightCalf: { rotate: -4 },
      pupils: { x: 0, y: 1 },
    },
  }[emotion]

  useEffect(() => {
    if (reducedMotion) return
    let cancelled = false

    const run = async () => {
      await Promise.all([
        stageControls.start({ x: 0, y: -24, scaleX: 1, scaleY: 1, transition: bounceSpring }),
        headControls.start({ rotate: pose.head.rotate - 10, y: pose.head.y - 10, transition: bounceSpring }),
        torsoControls.start({ rotate: pose.torso.rotate - 3, y: pose.torso.y - 3, transition: bounceSpring }),
        leftArmControls.start({ rotate: pose.leftArm.rotate + 10, transition: bounceSpring }),
        rightArmControls.start({ rotate: pose.rightArm.rotate - 14, transition: bounceSpring }),
      ])
      if (cancelled) return
      await Promise.all([
        stageControls.start({ x: 0, y: 0, scaleX: 1.05, scaleY: 0.94, transition: bounceSpring }),
        hipsControls.start({ rotate: pose.hips.rotate + 2, y: pose.hips.y + 6, transition: bounceSpring }),
        torsoControls.start({ rotate: pose.torso.rotate + 2, y: pose.torso.y + 5, scaleX: 0.96, scaleY: 1.05, transition: bounceSpring }),
        headControls.start({ rotate: pose.head.rotate + 6, y: pose.head.y + 8, transition: bounceSpring }),
        leftLegControls.start({ rotate: pose.leftLeg.rotate + 3, transition: bounceSpring }),
        rightLegControls.start({ rotate: pose.rightLeg.rotate - 3, transition: bounceSpring }),
      ])
      if (cancelled) return
      await Promise.all([
        stageControls.start({ x: 0, y: 0, scaleX: 1, scaleY: 1, transition: bounceSpring }),
        hipsControls.start({ ...pose.hips, transition: bounceSpring }),
        torsoControls.start({ ...pose.torso, transition: bounceSpring }),
        headControls.start({ ...pose.head, transition: bounceSpring }),
        leftArmControls.start({ ...pose.leftArm, transition: bounceSpring }),
        leftForearmControls.start({ ...pose.leftForearm, transition: bounceSpring }),
        rightArmControls.start({ ...pose.rightArm, transition: bounceSpring }),
        rightForearmControls.start({ ...pose.rightForearm, transition: bounceSpring }),
        leftLegControls.start({ ...pose.leftLeg, transition: bounceSpring }),
        leftCalfControls.start({ ...pose.leftCalf, transition: bounceSpring }),
        rightLegControls.start({ ...pose.rightLeg, transition: bounceSpring }),
        rightCalfControls.start({ ...pose.rightCalf, transition: bounceSpring }),
      ])
      if (cancelled) return

      if (emotion === 'waving') {
        await rightForearmControls.start({ rotate: 54, transition: bounceSpring })
        if (cancelled) return
        await rightForearmControls.start({ rotate: 18, transition: bounceSpring })
        if (cancelled) return
        await rightForearmControls.start({ ...pose.rightForearm, transition: bounceSpring })
      } else if (emotion === 'celebrating') {
        await Promise.all([
          stageControls.start({ y: -10, transition: bounceSpring }),
          leftArmControls.start({ rotate: -82, transition: bounceSpring }),
          rightArmControls.start({ rotate: 78, transition: bounceSpring }),
        ])
        if (cancelled) return
        await Promise.all([
          stageControls.start({ y: 0, transition: bounceSpring }),
          leftArmControls.start({ ...pose.leftArm, transition: bounceSpring }),
          rightArmControls.start({ ...pose.rightArm, transition: bounceSpring }),
        ])
      } else {
        await Promise.all([
          rightForearmControls.start({ rotate: pose.rightForearm.rotate + 10, transition: bounceSpring }),
          headControls.start({ rotate: pose.head.rotate - 4, y: pose.head.y - 2, transition: bounceSpring }),
        ])
        if (cancelled) return
        await Promise.all([
          rightForearmControls.start({ ...pose.rightForearm, transition: bounceSpring }),
          headControls.start({ ...pose.head, transition: bounceSpring }),
        ])
      }
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [
    animationKey,
    emotion,
    headControls,
    hipsControls,
    leftArmControls,
    leftCalfControls,
    leftForearmControls,
    leftLegControls,
    pose,
    reducedMotion,
    rightArmControls,
    rightCalfControls,
    rightForearmControls,
    rightLegControls,
    stageControls,
    torsoControls,
  ])

  const brows = {
    idle: {
      leftStart: { x: 96, y: 81 },
      leftEnd: { x: 116, y: 78 },
      rightStart: { x: 138, y: 78 },
      rightEnd: { x: 157, y: 81 },
    },
    excited: {
      leftStart: { x: 94, y: 76 },
      leftEnd: { x: 117, y: 72 },
      rightStart: { x: 137, y: 72 },
      rightEnd: { x: 159, y: 76 },
    },
    waving: {
      leftStart: { x: 95, y: 78 },
      leftEnd: { x: 116, y: 75 },
      rightStart: { x: 136, y: 73 },
      rightEnd: { x: 158, y: 77 },
    },
    celebrating: {
      leftStart: { x: 94, y: 74 },
      leftEnd: { x: 117, y: 69 },
      rightStart: { x: 137, y: 69 },
      rightEnd: { x: 160, y: 74 },
    },
  }[emotion]

  const mouth = {
    idle: { d: 'M104 119 C113 128 137 128 146 118', fill: 'none', strokeWidth: 6 },
    excited: { d: 'M102 114 C112 129 139 129 149 114', fill: 'none', strokeWidth: 7 },
    waving: { d: 'M103 116 C113 132 138 132 147 116', fill: 'none', strokeWidth: 7 },
    celebrating: {
      d: 'M103 108 C110 138 140 138 147 108 C138 116 112 116 103 108 Z',
      fill: '#0F172A',
      strokeWidth: 0,
    },
  }[emotion]

  const eyeOffset = pose.pupils
  const viewBox = framing === 'upper' ? '28 18 204 224' : '0 0 260 340'
  const stageAnimate = reducedMotion ? { x: 0, y: 0, scaleX: 1, scaleY: 1 } : stageControls
  const hipsAnimate = reducedMotion ? pose.hips : hipsControls
  const torsoAnimate = reducedMotion ? pose.torso : torsoControls
  const headAnimate = reducedMotion ? pose.head : headControls
  const leftArmAnimate = reducedMotion ? pose.leftArm : leftArmControls
  const leftForearmAnimate = reducedMotion ? pose.leftForearm : leftForearmControls
  const rightArmAnimate = reducedMotion ? pose.rightArm : rightArmControls
  const rightForearmAnimate = reducedMotion ? pose.rightForearm : rightForearmControls
  const leftLegAnimate = reducedMotion ? pose.leftLeg : leftLegControls
  const leftCalfAnimate = reducedMotion ? pose.leftCalf : leftCalfControls
  const rightLegAnimate = reducedMotion ? pose.rightLeg : rightLegControls
  const rightCalfAnimate = reducedMotion ? pose.rightCalf : rightCalfControls

  return (
    <motion.div
      className="pointer-events-none"
      animate={stageAnimate}
      transition={reducedMotion ? undefined : entranceSpring}
      style={{ width: size, height: size }}
    >
      <svg viewBox={viewBox} className="h-full w-full overflow-visible">
        <ellipse cx="130" cy="309" rx="42" ry="11" fill="#0F172A" opacity="0.12" />

        <motion.g
          animate={hipsAnimate}
          transition={reducedMotion ? undefined : bounceSpring}
          style={{ originX: '130px', originY: '236px' }}
        >
          <motion.g
            animate={reducedMotion ? undefined : { rotate: 1.2, y: -2 }}
            transition={reducedMotion ? undefined : { ...idleSpring, repeat: Infinity, repeatType: 'mirror', repeatDelay: 0.55 }}
            style={{ originX: '130px', originY: '236px' }}
          >
            <motion.g
              animate={leftLegAnimate}
              transition={reducedMotion ? undefined : bounceSpring}
              style={{ originX: '116px', originY: '238px' }}
            >
              <rect x="111" y="233" width="13" height="34" rx="6.5" fill="#22306B" />
              <motion.g
                animate={leftCalfAnimate}
                transition={reducedMotion ? undefined : bounceSpring}
                style={{ originX: '117px', originY: '264px' }}
              >
                <rect x="111" y="259" width="12" height="27" rx="6" fill="#22306B" />
                <ellipse cx="116" cy="290" rx="14" ry="7" fill="#FF8677" />
              </motion.g>
            </motion.g>

            <motion.g
              animate={rightLegAnimate}
              transition={reducedMotion ? undefined : bounceSpring}
              style={{ originX: '145px', originY: '238px' }}
            >
              <rect x="139" y="233" width="13" height="36" rx="6.5" fill="#22306B" />
              <motion.g
                animate={rightCalfAnimate}
                transition={reducedMotion ? undefined : bounceSpring}
                style={{ originX: '145px', originY: '266px' }}
              >
                <rect x="140" y="261" width="12" height="26" rx="6" fill="#22306B" />
                <ellipse cx="146" cy="291" rx="14" ry="7" fill="#FF8677" />
              </motion.g>
            </motion.g>

            <motion.g
              animate={leftArmAnimate}
              transition={reducedMotion ? undefined : bounceSpring}
              style={{ originX: '89px', originY: '170px' }}
            >
              <path d="M81 165 C72 175 72 192 83 203 C91 212 102 214 109 207 C112 202 112 196 108 192 C101 186 96 180 95 172 Z" fill="#36D3C7" />
              <motion.g
                animate={leftForearmAnimate}
                transition={reducedMotion ? undefined : bounceSpring}
                style={{ originX: '97px', originY: '205px' }}
              >
                <path d="M97 195 C88 201 87 214 94 222 C100 229 110 231 116 225 C119 220 119 213 114 208 C108 202 104 198 102 193 Z" fill="#8CF0E2" />
                <circle cx="110" cy="225" r="7" fill="#FFE6D5" />
              </motion.g>
            </motion.g>

            <motion.g
              animate={torsoAnimate}
              transition={reducedMotion ? undefined : bounceSpring}
              style={{ originX: '130px', originY: '201px' }}
            >
              <motion.g
                animate={reducedMotion ? undefined : { y: -2, scaleY: 1.015 }}
                transition={reducedMotion ? undefined : { ...idleSpring, repeat: Infinity, repeatType: 'mirror', repeatDelay: 0.45 }}
                style={{ originX: '130px', originY: '205px' }}
              >
                <path
                  d="M92 162 C99 146 113 138 130 138 C147 138 161 146 168 162 C175 180 174 208 167 226 C159 242 145 252 130 252 C114 252 100 242 92 226 C84 208 84 180 92 162 Z"
                  fill="#22306B"
                />
                <path
                  d="M107 165 C113 157 121 153 130 153 C139 153 147 157 153 165 C159 174 159 204 153 216 C147 228 139 233 130 233 C120 233 112 228 106 216 C100 204 100 174 107 165 Z"
                  fill="#36D3C7"
                />
                <path
                  d="M117 170 C120 166 126 164 130 164 C135 164 140 166 143 170 C147 176 147 198 143 205 C139 211 135 214 130 214 C125 214 120 211 117 205 C113 198 113 176 117 170 Z"
                  fill="#EFFFFC"
                />
                <path
                  d="M130 224 L134 232 L143 233 L136 239 L138 248 L130 243 L122 248 L124 239 L117 233 L126 232 Z"
                  fill="#FFB36B"
                />
              </motion.g>
            </motion.g>

            <motion.g
              animate={rightArmAnimate}
              transition={reducedMotion ? undefined : bounceSpring}
              style={{ originX: '172px', originY: '170px' }}
            >
              <path d="M179 165 C188 175 188 192 177 203 C169 212 158 214 151 207 C148 202 148 196 152 192 C159 186 164 180 165 172 Z" fill="#36D3C7" />
              <motion.g
                animate={rightForearmAnimate}
                transition={reducedMotion ? undefined : bounceSpring}
                style={{ originX: '163px', originY: '205px' }}
              >
                <path d="M162 193 C170 198 174 209 169 220 C165 229 157 233 149 231 C144 226 143 219 147 213 C152 206 156 200 157 194 Z" fill="#8CF0E2" />
                <circle cx="149" cy="224" r="7" fill="#FFE6D5" />
              </motion.g>
            </motion.g>

            <motion.g
              animate={headAnimate}
              transition={reducedMotion ? undefined : bounceSpring}
              style={{ originX: '130px', originY: '96px' }}
            >
              <motion.g
                animate={reducedMotion ? undefined : { rotate: 1.3, y: -1 }}
                transition={reducedMotion ? undefined : { ...idleSpring, repeat: Infinity, repeatType: 'mirror', repeatDelay: 1 }}
                style={{ originX: '130px', originY: '96px' }}
              >
                <path d="M130 23 C139 17 150 21 153 31 C147 38 136 39 128 34 Z" fill="#FF9B6B" />
                <path d="M88 76 C77 73 69 80 69 90 C69 99 76 107 86 106 C92 97 94 84 88 76 Z" fill="#465BC3" />
                <path d="M172 76 C183 73 191 80 191 90 C191 99 184 107 174 106 C168 97 166 84 172 76 Z" fill="#465BC3" />
                <path
                  d="M86 83 C86 48 105 29 130 29 C155 29 174 48 174 83 V111 C174 136 155 154 130 154 C104 154 86 136 86 111 Z"
                  fill="#2B3A84"
                />
                <path
                  d="M99 78 C99 56 112 44 130 44 C148 44 161 56 161 78 V110 C161 128 149 140 130 140 C111 140 99 128 99 110 Z"
                  fill="#FFF4E8"
                />
                <path d="M98 77 C103 55 116 43 135 43 C149 43 160 49 166 62 C155 60 145 62 135 68 C128 61 118 60 109 65 C105 68 101 72 98 77 Z" fill="#6079EA" />
                <path d="M110 52 C116 45 125 41 136 41 C128 50 125 63 125 75 H108 C107 66 107 58 110 52 Z" fill="#2B3A84" />
                <motion.g
                  animate={reducedMotion ? undefined : { scaleY: [1, 1, 0.08, 1, 1] }}
                  transition={reducedMotion ? undefined : { duration: 0.18, repeat: Infinity, repeatDelay: 3.4 }}
                  style={{ originX: '130px', originY: '93px' }}
                >
                  <ellipse cx="114" cy="95" rx="13" ry="16" fill="#FFFFFF" />
                  <ellipse cx="146" cy="95" rx="13" ry="16" fill="#FFFFFF" />
                  <motion.g
                    animate={reducedMotion ? undefined : { x: eyeOffset.x + 1.5, y: eyeOffset.y - 0.5 }}
                    transition={reducedMotion ? undefined : { ...idleSpring, repeat: Infinity, repeatType: 'mirror', repeatDelay: 1.2 }}
                  >
                    <circle cx="116" cy="99" r="6.5" fill="#172038" />
                    <circle cx="148" cy="99" r="6.5" fill="#172038" />
                    <circle cx="119" cy="95" r="2" fill="#FFFFFF" />
                    <circle cx="151" cy="95" r="2" fill="#FFFFFF" />
                  </motion.g>
                </motion.g>
                <line
                  x1={brows.leftStart.x}
                  y1={brows.leftStart.y}
                  x2={brows.leftEnd.x}
                  y2={brows.leftEnd.y}
                  stroke="#172038"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
                <line
                  x1={brows.rightStart.x}
                  y1={brows.rightStart.y}
                  x2={brows.rightEnd.x}
                  y2={brows.rightEnd.y}
                  stroke="#172038"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
                <circle cx="102" cy="113" r="5" fill="#FFB7C4" />
                <circle cx="158" cy="113" r="5" fill="#FFB7C4" />
                <path d="M130 99 C136 106 136 113 130 117" fill="none" stroke="#172038" strokeWidth="4" strokeLinecap="round" />
                <path
                  d={mouth.d}
                  fill={mouth.fill}
                  stroke={mouth.fill === 'none' ? '#172038' : 'none'}
                  strokeWidth={mouth.strokeWidth}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </motion.g>
            </motion.g>
          </motion.g>
        </motion.g>
      </svg>
    </motion.div>
  )
}

export function MascotOverlay({
  activeTab,
  userName,
  skillProfile,
  event,
}: MascotOverlayProps) {
  const [introSeen, setIntroSeen] = useState(true)
  const [isIntroOpen, setIsIntroOpen] = useState(false)
  const [isNudgeVisible, setIsNudgeVisible] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState<MascotChatMessage[]>([])
  const [emotion, setEmotion] = useState<MascotEmotion>('idle')
  const [activeEvent, setActiveEvent] = useState<MascotTriggerEvent | null>(null)
  const [nudgeMode, setNudgeMode] = useState<MascotNudgeMode>('auto')
  const [animationKey, setAnimationKey] = useState(0)
  const [rapidFireCount, setRapidFireCount] = useState(0)
  const [pendingReply, setPendingReply] = useState(false)
  const [chatSheetOpenCycle, setChatSheetOpenCycle] = useState(0)
  const [introStep, setIntroStep] = useState<IntroStep>(0)
  const [introStepDirection, setIntroStepDirection] = useState(1)
  const draftDeferred = useDeferredValue(draft)
  const handledEventIdRef = useRef<string | null>(null)
  const introReadyRef = useRef(false)
  const lastSendAtRef = useRef(0)
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null)
  const queuedChatOpenRef = useRef<number | null>(null)
  const chatSheetEntranceFrameRef = useRef<number | null>(null)
  const draftTextareaRef = useRef<HTMLTextAreaElement | null>(null)
  const sheetDismissAnimationRef = useRef<ReturnType<typeof animate> | null>(null)
  const sheetDragControls = useDragControls()
  const sheetY = useMotionValue(0)
  const backdropOpacity = useTransform(sheetY, [0, 380], [1, 0])
  const getClosedSheetY = () => (typeof window !== 'undefined' ? Math.max(window.innerHeight * 0.88, 560) : 900)

  const stopSheetDismissAnimation = () => {
    if (sheetDismissAnimationRef.current) {
      sheetDismissAnimationRef.current.stop()
      sheetDismissAnimationRef.current = null
    }
  }

  const animateChatSheetOpen = () => animate(sheetY, 0, { type: 'spring', stiffness: 300, damping: 30 })

  const openChatSheet = () => {
    sheetY.set(getClosedSheetY())
    setChatSheetOpenCycle(prev => prev + 1)

    if (!isChatOpen) {
      setIsChatOpen(true)
    }
  }

  const markIntroSeen = () => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(INTRO_STORAGE_KEY, 'true')
      } catch {
        // noop
      }
    }
    setIntroSeen(true)
  }

  const resetIntroFlow = () => {
    setIntroStep(0)
    setIntroStepDirection(1)
  }

  const resizeDraftTextarea = (node: HTMLTextAreaElement | null = draftTextareaRef.current) => {
    if (!node) return

    node.style.height = '0px'
    const computed = window.getComputedStyle(node)
    const minHeight = Number.parseFloat(computed.minHeight) || 56
    const lineHeight = Number.parseFloat(computed.lineHeight) || 24
    const verticalPadding =
      (Number.parseFloat(computed.paddingTop) || 0)
      + (Number.parseFloat(computed.paddingBottom) || 0)
    const maxHeight = lineHeight * 6 + verticalPadding
    const nextHeight = Math.max(minHeight, Math.min(node.scrollHeight, maxHeight))

    node.style.height = `${nextHeight}px`
    node.style.overflowY = node.scrollHeight > maxHeight ? 'auto' : 'hidden'
  }

  useEffect(() => {
    try {
      setIntroSeen(window.localStorage.getItem(INTRO_STORAGE_KEY) === 'true')
    } catch {
      setIntroSeen(true)
    } finally {
      introReadyRef.current = true
    }
  }, [])

  useEffect(() => {
    if (!draftDeferred || !isChatOpen) return
    setEmotion('excited')
  }, [draftDeferred, isChatOpen])

  useEffect(() => {
    resizeDraftTextarea()
  }, [draft, isChatOpen])

  useEffect(() => {
    if (!isChatOpen || chatSheetOpenCycle === 0) return

    if (typeof window !== 'undefined') {
      if (chatSheetEntranceFrameRef.current) {
        window.cancelAnimationFrame(chatSheetEntranceFrameRef.current)
      }

      chatSheetEntranceFrameRef.current = window.requestAnimationFrame(() => {
        chatSheetEntranceFrameRef.current = null
        animateChatSheetOpen()
      })

      return () => {
        if (chatSheetEntranceFrameRef.current) {
          window.cancelAnimationFrame(chatSheetEntranceFrameRef.current)
          chatSheetEntranceFrameRef.current = null
        }
      }
    }

    const controls = animateChatSheetOpen()
    return () => {
      controls.stop()
    }
  }, [chatSheetOpenCycle, isChatOpen, sheetY])

  useEffect(() => {
    if (!isChatOpen || typeof document === 'undefined') return

    const { body, documentElement } = document
    const previousBodyOverflow = body.style.overflow
    const previousBodyOverscrollBehavior = body.style.overscrollBehavior
    const previousHtmlOverscrollBehavior = documentElement.style.overscrollBehavior

    body.style.overflow = 'hidden'
    body.style.overscrollBehavior = 'none'
    documentElement.style.overscrollBehavior = 'none'

    return () => {
      body.style.overflow = previousBodyOverflow
      body.style.overscrollBehavior = previousBodyOverscrollBehavior
      documentElement.style.overscrollBehavior = previousHtmlOverscrollBehavior
    }
  }, [isChatOpen])

  useEffect(() => {
    return () => {
      if (queuedChatOpenRef.current) {
        window.clearTimeout(queuedChatOpenRef.current)
      }
      if (typeof window !== 'undefined' && chatSheetEntranceFrameRef.current) {
        window.cancelAnimationFrame(chatSheetEntranceFrameRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!event || handledEventIdRef.current === event.id || !introReadyRef.current) return
    handledEventIdRef.current = event.id
    setActiveEvent(event)
    setEmotion(event.emotion ?? getEmotionForTrigger(event.trigger))
    setAnimationKey(prev => prev + 1)

    if (event.openChat) {
      if (queuedChatOpenRef.current) {
        window.clearTimeout(queuedChatOpenRef.current)
        queuedChatOpenRef.current = null
      }
      stopSheetDismissAnimation()
      setIsNudgeVisible(false)
      setIsIntroOpen(false)
      openChatSheet()
      setMessages(prev => {
        const seeded = prev.length ? prev : buildIntroMessages(userName, event, skillProfile)
        return [
          ...seeded,
          {
            id: `system-${Date.now()}`,
            role: 'system',
            content: `${event.title}`,
            contextTrigger: event.trigger,
          },
        ]
      })
      return
    }

    if (SHOW_MASCOT_WELCOME_FLOW && !introSeen && event.trigger === 'intro') {
      resetIntroFlow()
      setIsIntroOpen(true)
      setIsNudgeVisible(false)
      return
    }

    if (!SHOW_MASCOT_AUTO_NUDGES) {
      setIsIntroOpen(false)
      setIsNudgeVisible(false)
      return
    }

    setNudgeMode('auto')
    setIsIntroOpen(false)
    setIsNudgeVisible(true)
  }, [event, introSeen, skillProfile, userName])

  useEffect(() => {
    if (!isNudgeVisible || isChatOpen || isIntroOpen) return
    const timeout = window.setTimeout(() => {
      setIsNudgeVisible(false)
      setEmotion('idle')
    }, 7200)
    return () => window.clearTimeout(timeout)
  }, [isChatOpen, isIntroOpen, isNudgeVisible])

  const quickPrompts = useMemo(
    () => buildQuickPrompts(activeEvent, skillProfile),
    [activeEvent, skillProfile],
  )
  const isConversationExpanded = pendingReply || messages.some(message => message.role === 'user')
  const shouldHideSummonControlsInFeed = activeTab === 'courses'

  const openIntro = () => {
    if (queuedChatOpenRef.current) {
      window.clearTimeout(queuedChatOpenRef.current)
      queuedChatOpenRef.current = null
    }
    stopSheetDismissAnimation()
    setActiveEvent(buildManualTrigger(userName, skillProfile))
    setEmotion('waving')
    setAnimationKey(prev => prev + 1)
    resetIntroFlow()
    setIsNudgeVisible(false)
    setIsIntroOpen(true)
  }

  const openChat = (
    nextEvent: MascotTriggerEvent | null = activeEvent,
    options: { skipIntro?: boolean } = {},
  ) => {
    if (queuedChatOpenRef.current) {
      window.clearTimeout(queuedChatOpenRef.current)
      queuedChatOpenRef.current = null
    }
    stopSheetDismissAnimation()
    if (SHOW_MASCOT_WELCOME_FLOW && !introSeen && !options.skipIntro) {
      openIntro()
      return
    }
    if (SHOW_MASCOT_WELCOME_FLOW && options.skipIntro) {
      markIntroSeen()
    }
    setIsIntroOpen(false)
    setIsNudgeVisible(false)
    resetIntroFlow()
    openChatSheet()
    setEmotion('excited')
    setAnimationKey(prev => prev + 1)
    setMessages(prev => prev.length ? prev : buildIntroMessages(userName, nextEvent, skillProfile))
  }

  const startSummonSequence = () => {
    if (SHOW_MASCOT_WELCOME_FLOW && !introSeen) {
      openIntro()
      return
    }

    const manualEvent = buildManualTrigger(userName, skillProfile)
    if (queuedChatOpenRef.current) {
      window.clearTimeout(queuedChatOpenRef.current)
    }
    setActiveEvent(manualEvent)

    if (!SHOW_MASCOT_VISUALS || !SHOW_MASCOT_AUTO_NUDGES) {
      openChat(manualEvent, { skipIntro: true })
      return
    }

    setNudgeMode('manual')
    setEmotion('waving')
    setAnimationKey(prev => prev + 1)
    setIsIntroOpen(false)
    setIsChatOpen(false)
    setIsNudgeVisible(true)
    queuedChatOpenRef.current = window.setTimeout(() => {
      openChat(manualEvent)
    }, 460)
  }

  const handleSummon = () => {
    startSummonSequence()
  }

  const goToIntroStep = (step: IntroStep) => {
    setIntroStepDirection(step > introStep ? 1 : -1)
    setIntroStep(step)
  }

  const handleIntroDismiss = () => {
    if (queuedChatOpenRef.current) {
      window.clearTimeout(queuedChatOpenRef.current)
      queuedChatOpenRef.current = null
    }
    stopSheetDismissAnimation()
    setIsIntroOpen(false)
    resetIntroFlow()
    markIntroSeen()
    setIsNudgeVisible(false)
  }

  const closeChat = () => {
    if (queuedChatOpenRef.current) {
      window.clearTimeout(queuedChatOpenRef.current)
      queuedChatOpenRef.current = null
    }
    if (typeof window !== 'undefined' && chatSheetEntranceFrameRef.current) {
      window.cancelAnimationFrame(chatSheetEntranceFrameRef.current)
      chatSheetEntranceFrameRef.current = null
    }
    stopSheetDismissAnimation()
    setIsChatOpen(false)
    setPendingReply(false)
    setDraft('')
    setEmotion('idle')
    sheetY.set(getClosedSheetY())
  }

  const dismissChatSheet = () => {
    if (!isChatOpen) return

    stopSheetDismissAnimation()
    const target = getClosedSheetY()
    sheetDismissAnimationRef.current = animate(sheetY, target, {
      type: 'spring',
      stiffness: 205,
      damping: 32,
      onComplete: () => {
        sheetDismissAnimationRef.current = null
        closeChat()
      },
    })
  }

  const handleSend = (forcedPrompt?: string) => {
    const content = (forcedPrompt ?? draft).trim()
    if (!content) return

    const now = Date.now()
    const burst = now - lastSendAtRef.current < 6500 ? rapidFireCount + 1 : 1
    lastSendAtRef.current = now
    setRapidFireCount(burst)
    setPendingReply(true)
    setEmotion('waving')
    setDraft('')

    const userMessage: MascotChatMessage = {
      id: `user-${now}`,
      role: 'user',
      content,
      contextTrigger: activeEvent?.trigger,
    }

    startTransition(() => {
      setMessages(prev => [...prev, userMessage])
    })

    const reply = buildMascotReply(content, userName, activeTab, skillProfile, activeEvent, burst)
    window.setTimeout(() => {
      startTransition(() => {
        setMessages(prev => [
          ...prev,
          {
            id: `mascot-${Date.now()}`,
            role: 'mascot',
            content: reply.content,
            emotion: reply.emotion,
            contextTrigger: activeEvent?.trigger,
          },
        ])
      })
      setEmotion(reply.emotion)
      setPendingReply(false)
      setAnimationKey(prev => prev + 1)
    }, 650)
  }

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    swipeStartRef.current = { x: event.clientX, y: event.clientY }
  }

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = swipeStartRef.current
    swipeStartRef.current = null
    if (!start) return

    const deltaX = start.x - event.clientX
    const deltaY = Math.abs(start.y - event.clientY)
    if (deltaX > 64 && deltaY < 120) {
      handleSummon()
    }
  }

  const handleSheetDragStart = (event: React.PointerEvent<HTMLDivElement>) => {
    sheetDragControls.start(event)
  }

  return (
    <>
      {!shouldHideSummonControlsInFeed && (
        <>
          <div
            aria-hidden
            className="fixed inset-y-0 right-0 z-[108] w-5 touch-pan-y"
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
          />

          <div className="pointer-events-none fixed bottom-24 right-4 z-[109] sm:bottom-7 sm:right-6">
            <Button
              type="button"
              onClick={handleSummon}
              className="pointer-events-auto rounded-full border border-white/40 bg-white/82 px-4 py-6 text-slate-900 shadow-[0_24px_60px_rgba(15,23,42,0.2)] backdrop-blur-2xl hover:bg-white dark:border-white/10 dark:bg-slate-900/80 dark:text-white dark:shadow-[0_24px_60px_rgba(0,0,0,0.36)]"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Call Nova
            </Button>
          </div>
        </>
      )}

      <AnimatePresence>
        {/* Keep the mascot entrance in the file, but hide it until the production mascot is ready. */}
        {SHOW_MASCOT_AUTO_NUDGES && isNudgeVisible && activeEvent && !isChatOpen && !isIntroOpen && (
          <motion.button
            type="button"
            onClick={() => openChat()}
            initial={{ x: 180, opacity: 0, scale: 0.92 }}
            animate={{ x: 0, opacity: 1, scale: 1, transition: entranceSpring }}
            exit={{ x: 180, opacity: 0, scale: 0.9, transition: entranceSpring }}
            className={cn(
              'fixed bottom-36 right-0 z-[110] text-left sm:bottom-8',
              nudgeMode === 'manual' ? 'w-44 sm:w-52' : 'w-[min(24rem,calc(100vw-1.25rem))] sm:right-24',
            )}
          >
            <div className={cn('flex items-end', nudgeMode === 'manual' ? 'justify-end' : 'gap-3')}>
              {nudgeMode === 'auto' && (
                <div className="pointer-events-none relative max-w-[15rem] rounded-[1.6rem] border border-white/50 bg-white/88 px-4 py-3 text-slate-900 shadow-[0_24px_70px_rgba(15,23,42,0.18)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/88 dark:text-white">
                  <div className="absolute -right-2 bottom-6 h-4 w-4 rotate-45 border-r border-b border-white/50 bg-white/88 dark:border-white/10 dark:bg-slate-900/88" />
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-white/45">
                    Nova tip
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-white/82">
                    {activeEvent.message}
                  </p>
                </div>
              )}

              <div
                className={cn(
                  'relative flex items-end justify-center overflow-hidden',
                  nudgeMode === 'manual'
                    ? 'mr-[-2.5rem] h-[13rem] w-[11rem] sm:mr-[-3rem] sm:h-[14rem] sm:w-[12rem]'
                    : 'mr-[-1.75rem] h-[10rem] w-[9.5rem] sm:mr-[-2rem] sm:h-[11rem] sm:w-[10.5rem]',
                )}
              >
                <div className="absolute left-1/2 top-5 h-16 w-16 -translate-x-1/2 rounded-full bg-cyan-200/75 blur-2xl dark:bg-cyan-300/15" />
                <div className="absolute bottom-3 left-[44%] h-5 w-24 -translate-x-1/2 rounded-full bg-slate-950/14 blur-md dark:bg-black/45" />
                <div className={cn('translate-x-5', nudgeMode === 'manual' && 'translate-x-8')}>
                  <MascotCharacter
                    emotion={emotion}
                    size={nudgeMode === 'manual' ? 190 : 160}
                    animationKey={animationKey}
                    framing="upper"
                  />
                </div>
              </div>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {/* Keep the welcome cards in the file so they can be restored later. */}
        {SHOW_MASCOT_WELCOME_FLOW && isIntroOpen && activeEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[118] flex items-end justify-center bg-[radial-gradient(circle_at_right,rgba(56,189,248,0.1),transparent_32%),rgba(15,23,42,0.16)] px-4 pb-20 pt-10 sm:items-center sm:px-6 sm:py-8"
          >
            <motion.div
              layout
              initial={{ x: 120, opacity: 0, scale: 0.92 }}
              animate={{ x: 0, opacity: 1, scale: 1, transition: entranceSpring }}
              exit={{ x: 140, opacity: 0, scale: 0.9, transition: entranceSpring }}
              transition={introStepTransition}
              className="w-full max-w-[29rem] overflow-hidden rounded-[2.2rem] border border-white/50 bg-white/90 shadow-[0_40px_120px_rgba(15,23,42,0.22)] backdrop-blur-3xl dark:border-white/10 dark:bg-slate-950/90 dark:shadow-[0_40px_120px_rgba(0,0,0,0.45)]"
            >
              <AnimatePresence initial={false} custom={introStepDirection} mode="wait">
                {introStep === 0 ? (
                  <motion.div
                    key="intro-step-hero"
                    custom={introStepDirection}
                    variants={introStepVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={introStepTransition}
                  >
                    <div className="relative min-h-[clamp(15.5rem,34dvh,20.5rem)] overflow-hidden border-b border-white/35 bg-[radial-gradient(circle_at_32%_18%,rgba(103,232,249,0.46),transparent_28%),linear-gradient(180deg,#ecfeff_0%,#e0f2fe_48%,#f8fafc_100%)] px-5 pb-3 pt-5 dark:border-white/10 dark:bg-[radial-gradient(circle_at_32%_18%,rgba(34,211,238,0.22),transparent_26%),linear-gradient(180deg,rgba(15,23,42,0.2)_0%,rgba(8,47,73,0.24)_42%,rgba(2,6,23,0.52)_100%)]">
                      <div className="absolute left-5 top-5 z-10 inline-flex items-center gap-2 rounded-full border border-sky-300/35 bg-white/72 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-sky-700 shadow-[0_14px_28px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-cyan-300/20 dark:bg-cyan-400/10 dark:text-cyan-100">
                        <Sparkles className="h-3.5 w-3.5" />
                        Meet Nova
                      </div>
                      <div className="absolute right-5 top-5 inline-flex items-center rounded-full border border-white/55 bg-white/68 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 shadow-[0_12px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06] dark:text-white/45">
                        1 / 2
                      </div>
                      <div className="absolute -left-8 bottom-10 h-32 w-32 rounded-full bg-cyan-200/70 blur-3xl dark:bg-cyan-300/10" />
                      <div className="absolute right-6 top-16 h-24 w-24 rounded-full bg-sky-200/75 blur-3xl dark:bg-sky-400/10" />
                      <div className="absolute bottom-6 left-1/2 h-6 w-36 -translate-x-1/2 rounded-full bg-slate-950/12 blur-lg dark:bg-black/40" />
                      <div className="relative flex h-full items-end justify-center">
                        <div className="w-full max-w-[15rem] sm:max-w-[16rem]">
                          <MascotCharacter emotion="waving" size={280} animationKey={animationKey} />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/92 px-5 pb-5 pt-5 dark:bg-slate-950/92 sm:px-6 sm:pb-6">
                      <h2 className="text-[2.35rem] font-black leading-[0.95] tracking-[-0.06em] text-slate-950 dark:text-white sm:text-[2.7rem]">
                        Loud when useful.
                        <br />
                        Gone when not.
                      </h2>
                      <p className="mt-4 text-[15px] leading-8 text-slate-600 dark:text-white/78">
                        Nova is your chaos coach. She pops in when you look stuck, idle, or one move away from cooking a streak-saving win.
                      </p>

                      <div className="mt-6 flex flex-wrap gap-3">
                        <Button
                          onClick={() => goToIntroStep(1)}
                          className="rounded-full bg-slate-950 text-white shadow-[0_20px_50px_rgba(15,23,42,0.24)] hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
                        >
                          Next
                          <MoveRight className="ml-2 h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleIntroDismiss}
                          className="rounded-full border-slate-300 bg-white/70 shadow-[0_18px_44px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.05]"
                        >
                          Let her roam
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="intro-step-recall"
                    custom={introStepDirection}
                    variants={introStepVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={introStepTransition}
                    className="bg-white/92 dark:bg-slate-950/92"
                  >
                    <div className="relative overflow-hidden border-b border-white/35 bg-[radial-gradient(circle_at_top_right,rgba(125,211,252,0.22),transparent_30%),linear-gradient(180deg,rgba(248,250,252,0.92)_0%,rgba(255,255,255,0.98)_100%)] px-5 pb-5 pt-5 dark:border-white/10 dark:bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.18),transparent_26%),linear-gradient(180deg,rgba(15,23,42,0.46)_0%,rgba(2,6,23,0.84)_100%)] sm:px-6">
                      <div className="absolute -right-6 top-8 h-24 w-24 rounded-full bg-cyan-200/55 blur-3xl dark:bg-cyan-300/10" />
                      <div className="relative flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-white/45">
                            If you need her anytime
                          </p>
                          <h2 className="mt-3 text-[2rem] font-black leading-[0.98] tracking-[-0.05em] text-slate-950 dark:text-white sm:text-[2.3rem]">
                            Nova is one move away.
                          </h2>
                        </div>
                        <div className="inline-flex items-center rounded-full border border-white/55 bg-white/68 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 shadow-[0_12px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06] dark:text-white/45">
                          2 / 2
                        </div>
                      </div>
                      <p className="mt-3 max-w-[24rem] text-sm leading-7 text-slate-600 dark:text-white/76">
                        Two quick ways to pull her back in when you want help without breaking your flow.
                      </p>
                      <button
                        type="button"
                        onClick={() => goToIntroStep(0)}
                        className="mt-5 inline-flex items-center rounded-full border border-slate-200 bg-white/78 px-4 py-2 text-sm font-semibold text-slate-700 shadow-[0_16px_32px_rgba(15,23,42,0.08)] transition-colors hover:bg-white dark:border-white/10 dark:bg-white/[0.05] dark:text-white/78 dark:hover:bg-white/[0.09]"
                      >
                        Back
                      </button>
                    </div>

                    <div className="space-y-3 px-5 py-5 sm:px-6">
                      <div className="rounded-[1.5rem] border border-slate-200/80 bg-white/78 p-4 shadow-[0_12px_32px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/[0.04]">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-white/45">
                          Call her back
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                          Tap the summon button
                        </p>
                        <p className="mt-1 text-sm text-slate-600 dark:text-white/70">
                          The floating button keeps Nova one tap away from any screen.
                        </p>
                      </div>
                      <div className="rounded-[1.5rem] border border-slate-200/80 bg-white/78 p-4 shadow-[0_12px_32px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/[0.04]">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-white/45">
                          Gesture recall
                        </p>
                        <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                          <MoveRight className="h-4 w-4" />
                          Swipe in from the right edge
                        </p>
                        <p className="mt-1 text-sm text-slate-600 dark:text-white/70">
                          Nova slides in from the right with a springy entrance when you swipe her in.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 border-t border-slate-200/70 px-5 pb-5 pt-3 dark:border-white/10 sm:px-6 sm:pb-6">
                      <Button
                        onClick={() => openChat(activeEvent, { skipIntro: true })}
                        className="rounded-full bg-slate-950 text-white shadow-[0_20px_50px_rgba(15,23,42,0.24)] hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
                      >
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Talk to Nova
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleIntroDismiss}
                        className="rounded-full border-slate-300 bg-white/70 shadow-[0_18px_44px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.05]"
                      >
                        Let her roam
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[119]"
          >
            <motion.div
              onClick={() => {
                dismissChatSheet()
              }}
              style={{ opacity: backdropOpacity }}
              className="absolute inset-0 bg-[rgba(148,163,184,0.18)] backdrop-blur-md dark:bg-[rgba(2,6,23,0.34)]"
            />
            <motion.div
              initial={{ opacity: 0.96 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0.96 }}
              drag="y"
              dragControls={sheetDragControls}
              dragListener={false}
              dragConstraints={{ top: 0, bottom: 1200 }}
              dragElastic={{ top: 0, bottom: 0.02 }}
              dragMomentum={false}
              onDragEnd={(_, info) => {
                if (info.offset.y > 120 || info.velocity.y > 700) {
                  dismissChatSheet()
                  return
                }

                animate(sheetY, 0, { type: 'spring', stiffness: 300, damping: 32 })
              }}
              onClick={event => event.stopPropagation()}
              style={{
                y: sheetY,
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
              }}
              className={cn(
                'absolute inset-x-0 bottom-0 overflow-hidden rounded-t-[28px] border-t border-white/65 bg-[radial-gradient(circle_at_top,rgba(103,232,249,0.18),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.97)_0%,rgba(241,245,249,0.95)_100%)] text-slate-950 shadow-[0_-24px_70px_rgba(15,23,42,0.16),0_-1px_0_rgba(255,255,255,0.8)_inset] backdrop-blur-[36px] transition-[top] duration-300 ease-out before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-white/90 before:opacity-90 before:blur-sm dark:border-white/[0.12] dark:bg-[radial-gradient(circle_at_top,rgba(91,231,216,0.12),transparent_26%),linear-gradient(180deg,rgba(15,23,42,0.94)_0%,rgba(2,6,23,0.92)_100%)] dark:text-white dark:shadow-[0_-24px_80px_rgba(0,0,0,0.34),0_-1px_0_rgba(255,255,255,0.08)_inset] dark:before:bg-white/20 sm:inset-x-4 sm:bottom-4 sm:rounded-[28px] sm:border sm:border-white/[0.08]',
                isConversationExpanded ? 'top-2 sm:top-8' : 'top-6 sm:top-14',
              )}
            >
              <div
                aria-hidden
                onPointerDown={handleSheetDragStart}
                style={{ touchAction: 'none' }}
                className="absolute inset-x-0 top-2 z-30 flex h-7 cursor-grab items-start justify-center active:cursor-grabbing"
              >
                <span className="h-1.5 w-10 rounded-full bg-slate-400/40 shadow-[0_0_14px_rgba(148,163,184,0.2)] dark:bg-white/28 dark:shadow-[0_0_14px_rgba(255,255,255,0.12)]" />
              </div>

              <div
                className={cn(
                  'grid h-full grid-cols-1',
                  SHOW_MASCOT_VISUALS && 'sm:grid-cols-[34%_66%] lg:grid-cols-[38%_62%]',
                  isConversationExpanded ? 'pt-1 sm:pt-5' : 'pt-2 sm:pt-8',
                )}
              >
                {SHOW_MASCOT_VISUALS && (
                  <div className="relative hidden min-h-0 overflow-hidden bg-[radial-gradient(circle_at_32%_18%,rgba(103,232,249,0.34),transparent_24%),radial-gradient(circle_at_80%_16%,rgba(125,211,252,0.28),transparent_18%),linear-gradient(180deg,rgba(236,254,255,0.94)_0%,rgba(224,242,254,0.88)_46%,rgba(248,250,252,0.98)_100%)] sm:block dark:bg-[radial-gradient(circle_at_32%_18%,rgba(91,231,216,0.22),transparent_24%),radial-gradient(circle_at_80%_16%,rgba(96,121,234,0.22),transparent_18%),linear-gradient(180deg,rgba(18,28,59,0.58)_0%,rgba(9,14,30,0.82)_58%,rgba(3,7,18,0.96)_100%)]">
                    <div className="pointer-events-none absolute -left-10 bottom-16 h-40 w-40 rounded-full bg-cyan-300/24 blur-3xl dark:bg-cyan-300/18" />
                    <div className="pointer-events-none absolute right-0 top-12 h-28 w-28 rounded-full bg-sky-300/22 blur-3xl dark:bg-indigo-300/16" />
                    <div className="pointer-events-none absolute left-5 top-6 z-10">
                      <p className="text-[1.75rem] font-bold leading-[1.05] tracking-[-0.04em] text-slate-950/92 lg:text-[2.2rem] dark:text-white/92">
                        Nova
                      </p>
                    </div>
                    <div className="pointer-events-none absolute bottom-8 left-4 select-none text-[4.2rem] font-bold leading-none tracking-[-0.08em] text-slate-950/[0.05] lg:text-[5.6rem] dark:text-white/[0.05]">
                      Nova
                    </div>
                    <div className="pointer-events-none absolute bottom-7 left-1/2 h-7 w-40 -translate-x-1/2 rounded-full bg-slate-950/12 blur-xl dark:bg-black/45" />
                    <div className="relative flex h-full items-end justify-center pb-6 lg:pb-8">
                      <div className="w-full max-w-[15rem] drop-shadow-[0_28px_30px_rgba(2,6,23,0.42)] lg:max-w-[18rem]">
                        <MascotCharacter
                          emotion={pendingReply ? 'waving' : emotion}
                          size={320}
                          animationKey={animationKey}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex min-h-0 flex-col bg-[linear-gradient(180deg,rgba(255,255,255,0.5)_0%,rgba(255,255,255,0.2)_100%)] dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.02)_100%)]">
                  <AnimatePresence initial={false}>
                    {!isConversationExpanded && (
                      <motion.div
                        key="chat-intro-header"
                        initial={{ height: 0, opacity: 0, y: -12 }}
                        animate={{ height: 'auto', opacity: 1, y: 0 }}
                        exit={{ height: 0, opacity: 0, y: -12 }}
                        transition={{ duration: 0.26, ease: 'easeOut' }}
                        className="overflow-hidden px-4 pb-3 pt-9 sm:px-5 sm:pt-6"
                      >
                        <p className="inline-flex items-center gap-2 rounded-full border border-sky-200/80 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-700 shadow-[0_10px_24px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-white/[0.05] dark:text-white/55">
                          <Sparkles className="h-3.5 w-3.5" />
                          Coach Chat
                        </p>
                        <h3 className="mt-4 text-[2rem] font-black leading-[0.98] tracking-[-0.05em] text-slate-950 sm:text-[2.2rem] dark:text-white">
                          Ask Nova anything about the current run
                        </h3>
                        <p className="mt-3 max-w-[34rem] text-[15px] font-normal leading-7 text-slate-600 dark:text-white/60">
                          {pendingReply ? 'Nova is winding up a reply.' : activeEvent?.message ?? 'Ask about the next move, your weak spot, or how to keep the streak alive.'}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className={cn('min-h-0 flex-1 overflow-y-auto px-4 pb-4 sm:px-5', isConversationExpanded && 'pt-3 sm:pt-4')}>
                    <div className="space-y-3">
                      {messages.map((message, index) => (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, scale: 0.95, y: 12 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          transition={{ type: 'spring', stiffness: 280, damping: 24, delay: index * 0.06 }}
                          className={cn(
                            'flex',
                            message.role === 'user' ? 'justify-end' : message.role === 'system' ? 'justify-center' : 'justify-start',
                          )}
                        >
                          {message.role === 'system' ? (
                            <div className="rounded-full border border-slate-200/80 bg-white/76 px-3 py-1.5 text-[11px] font-medium text-slate-500 shadow-[0_10px_26px_rgba(15,23,42,0.05)] dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-white/50">
                              {message.content}
                            </div>
                          ) : (
                            <div
                              className={cn(
                                'max-w-[92%] rounded-[22px] px-4 py-3 text-[15px] font-normal leading-[1.6] sm:max-w-[88%]',
                                message.role === 'user'
                                  ? 'rounded-br-[10px] bg-[linear-gradient(180deg,#0f172a_0%,#1e293b_100%)] text-white shadow-[0_16px_36px_rgba(15,23,42,0.22)]'
                                  : 'rounded-bl-[10px] border border-white/80 bg-white/84 text-slate-700 shadow-[0_18px_40px_rgba(15,23,42,0.08)] dark:border-white/[0.10] dark:bg-white/[0.08] dark:text-white/88',
                              )}
                            >
                              {message.content}
                            </div>
                          )}
                        </motion.div>
                      ))}
                      {pendingReply && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: 12 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          transition={{ type: 'spring', stiffness: 280, damping: 24, delay: messages.length * 0.06 }}
                          className="flex justify-start"
                        >
                          <div className="rounded-[20px] rounded-bl-[10px] border border-white/80 bg-white/84 px-4 py-3 shadow-[0_18px_40px_rgba(15,23,42,0.08)] dark:border-white/[0.10] dark:bg-white/[0.08]">
                            <div className="flex items-center gap-2 text-cyan-600/60 dark:text-white/55">
                              <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-400" />
                              <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-400 [animation-delay:120ms]" />
                              <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-400 [animation-delay:240ms]" />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>

                  <div
                    className="border-t border-slate-200/70 px-4 pt-3 dark:border-white/[0.06] sm:px-5"
                    style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
                  >
                    <div className="mb-3 flex flex-wrap gap-2">
                      {quickPrompts.map((prompt, index) => (
                        <motion.button
                          key={prompt}
                          type="button"
                          onClick={() => handleSend(prompt)}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            type: 'spring',
                            stiffness: 260,
                            damping: 24,
                            delay: Math.max(messages.length, 1) * 0.06 + 0.18 + index * 0.06,
                          }}
                          className="rounded-full border border-slate-200/80 bg-white/70 px-3.5 py-2 text-xs font-semibold text-slate-600 shadow-[0_10px_24px_rgba(15,23,42,0.04)] transition-[border-color,box-shadow,background-color,color] duration-200 hover:border-cyan-300/60 hover:bg-cyan-300/[0.08] hover:text-slate-950 hover:shadow-[0_0_24px_rgba(91,231,216,0.12)] dark:border-white/20 dark:bg-transparent dark:text-white/78"
                        >
                          {prompt}
                        </motion.button>
                      ))}
                    </div>

                    <div className="flex items-end gap-3 rounded-[28px] border border-slate-200/80 bg-white/82 px-4 py-3 shadow-[0_18px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-white/[0.06] dark:shadow-[0_16px_32px_rgba(2,6,23,0.18)]">
                      <textarea
                        ref={draftTextareaRef}
                        value={draft}
                        onChange={event => {
                          setDraft(event.target.value)
                          resizeDraftTextarea(event.target)
                        }}
                        onKeyDown={event => {
                          if (event.key === 'Enter' && !event.shiftKey) {
                            event.preventDefault()
                            handleSend()
                          }
                        }}
                        rows={1}
                        placeholder="Ask Nova what to do next, where you are weak, or how to save the streak."
                        className="min-h-[56px] max-h-[10.5rem] flex-1 resize-none overflow-y-hidden bg-transparent py-2 text-[15px] font-normal leading-[1.6] text-slate-700 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-white/40"
                      />
                      <div className="flex items-center gap-2 self-end pb-1">
                        <Button
                          type="button"
                          variant="ghost"
                          className="h-11 w-11 rounded-full border border-slate-200 bg-slate-50 p-0 text-slate-500 hover:bg-white hover:text-slate-700 dark:border-white/[0.10] dark:bg-white/[0.05] dark:text-white/72 dark:hover:bg-white/[0.09] dark:hover:text-white"
                        >
                          <Mic className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleSend()}
                          className="h-11 w-11 rounded-full bg-[linear-gradient(180deg,#67e8f9_0%,#22d3ee_100%)] p-0 text-slate-950 shadow-[0_14px_30px_rgba(34,211,238,0.26)] hover:bg-[linear-gradient(180deg,#8df5ff_0%,#4be8f5_100%)]"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
