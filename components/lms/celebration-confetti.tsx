'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'

const CONFETTI_COLORS = [
  '#fb7185',
  '#f59e0b',
  '#facc15',
  '#34d399',
  '#38bdf8',
  '#818cf8',
  '#f472b6',
  '#fb923c',
]

const CONFETTI_PARTICLES = Array.from({ length: 28 }, (_, index) => {
  const lane = index % 14
  const clusterOffset = index < 14 ? -56 : 56

  return {
    color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
    clusterOffset,
    delay: lane * 0.018,
    fall: 220 + ((lane % 7) * 26) + (index < 14 ? 0 : 24),
    height: lane % 4 === 0 ? 14 : lane % 3 === 0 ? 10 : 8,
    lift: 16 + ((lane % 5) * 8),
    rotate: (lane * 42) - 220,
    spread: (lane * 28) - 182,
    width: lane % 4 === 0 ? 6 : lane % 3 === 0 ? 10 : 8,
  }
})

export type CelebrationBurst = {
  id: number
  label?: string
  variant: 'reward' | 'score'
}

interface CelebrationConfettiProps {
  burst: CelebrationBurst | null
}

export function CelebrationConfetti({ burst }: CelebrationConfettiProps) {
  return (
    <AnimatePresence>
      {burst && (
        <motion.div
          key={burst.id}
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className="pointer-events-none fixed inset-0 z-[120] overflow-hidden"
          aria-hidden="true"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: [0, 0.28, 0], scale: [0.6, 1.08, 1.2] }}
            transition={{ duration: 1.15, ease: 'easeOut' }}
            className={cn(
              'absolute left-1/2 h-28 w-28 -translate-x-1/2 rounded-full blur-3xl',
              burst.variant === 'reward' ? 'bg-amber-300/35' : 'bg-sky-300/30',
            )}
            style={{ top: burst.variant === 'reward' ? '12%' : '17%' }}
          />

          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.96 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className={cn(
              'absolute left-1/2 top-[10%] -translate-x-1/2 rounded-full border px-4 py-2 text-sm font-semibold shadow-[0_14px_40px_rgba(15,23,42,0.14)] backdrop-blur-xl',
              burst.variant === 'reward'
                ? 'border-amber-200/60 bg-white/88 text-amber-700 dark:border-amber-300/20 dark:bg-slate-950/82 dark:text-amber-200'
                : 'border-sky-200/60 bg-white/88 text-sky-700 dark:border-sky-300/20 dark:bg-slate-950/82 dark:text-sky-200',
            )}
          >
            {burst.label ?? (burst.variant === 'reward' ? 'Reward unlocked' : 'Great score')}
          </motion.div>

          <div
            className="absolute left-1/2 top-0 h-0 w-0"
            style={{ top: burst.variant === 'reward' ? '19%' : '24%' }}
          >
            {CONFETTI_PARTICLES.map((particle, index) => (
              <motion.span
                key={`${burst.id}-${index}`}
                initial={{
                  opacity: 0,
                  rotate: 0,
                  scale: 0.6,
                  x: particle.clusterOffset * 0.18,
                  y: 0,
                }}
                animate={{
                  opacity: [0, 1, 1, 0],
                  rotate: [0, particle.rotate],
                  scale: [0.6, 1, 1, 0.82],
                  x: [particle.clusterOffset * 0.18, particle.clusterOffset * 0.56, particle.clusterOffset + particle.spread],
                  y: [0, -particle.lift, particle.fall],
                }}
                transition={{
                  delay: particle.delay,
                  duration: burst.variant === 'reward' ? 1.65 : 1.45,
                  ease: [0.22, 1, 0.36, 1],
                  times: [0, 0.18, 1],
                }}
                className={cn(
                  'absolute block shadow-[0_0_16px_rgba(255,255,255,0.16)]',
                  index % 4 === 0 ? 'rounded-full' : index % 3 === 0 ? 'rounded-sm' : 'rounded-[999px]',
                )}
                style={{
                  backgroundColor: particle.color,
                  height: particle.height,
                  width: particle.width,
                }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
