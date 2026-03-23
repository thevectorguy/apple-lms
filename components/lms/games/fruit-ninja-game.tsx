'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { MiniGame } from '@/lib/types'
import { cn } from '@/lib/utils'
import { X, Heart, Zap, Trophy, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FruitNinjaGameProps {
  game: MiniGame
  onComplete: (score: number, xpEarned: number) => void
  onShareScore?: (score: number, xpEarned: number) => void
  onClose: () => void
}

const LOW_SCORE_THRESHOLD = 70
const HIGH_SCORE_THRESHOLD = 80

export function FruitNinjaGame({ game, onComplete, onShareScore, onClose }: FruitNinjaGameProps) {
  const [qIndex, setQIndex] = useState(0)
  const [lives, setLives] = useState(3)
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [phase, setPhase] = useState<'playing' | 'correct' | 'wrong' | 'results'>('playing')
  const [flyingOptions, setFlyingOptions] = useState<{
    id: number
    text: string
    optIdx: number
    laneX: number
    driftX: number
    endDriftX: number
    arcHeight: number
    returnDepth: number
    delay: number
    duration: number
    rotateFrom: number
    rotateTo: number
  }[]>([])
  const [slicedOption, setSlicedOption] = useState<number | null>(null)
  const [timer, setTimer] = useState(100)
  const [shared, setShared] = useState(false)

  const q = game.questions[qIndex]

  const resetGame = useCallback(() => {
    setQIndex(0)
    setLives(3)
    setScore(0)
    setCombo(0)
    setPhase('playing')
    setSlicedOption(null)
    setTimer(100)
    setShared(false)
  }, [])

  // Generate flying positions for options
  useEffect(() => {
    if (phase !== 'playing' || !q) return

    const lanes = [16, 36, 58, 78]
    const drifts = [-38, -22, 22, 38]
    const returnDrifts = [18, -12, 12, -18]
    const heights = [118, 132, 124, 138]
    const depths = [110, 126, 118, 132]

    const options = q.options.map((text, optIdx) => ({
      id: optIdx,
      text,
      optIdx,
      laneX: lanes[(optIdx + qIndex) % lanes.length],
      driftX: drifts[(optIdx + qIndex) % drifts.length] + (Math.random() * 8 - 4),
      endDriftX: returnDrifts[(optIdx + qIndex) % returnDrifts.length] + (Math.random() * 8 - 4),
      arcHeight: heights[(optIdx + qIndex) % heights.length] + (Math.random() * 16 - 8),
      returnDepth: depths[(optIdx + qIndex) % depths.length] + (Math.random() * 16 - 8),
      delay: optIdx * 0.16,
      duration: 4.4 + (optIdx % 2) * 0.3,
      rotateFrom: -18 + optIdx * 6,
      rotateTo: 12 - optIdx * 3,
    }))

    setFlyingOptions(options)
    setSlicedOption(null)
    setTimer(100)
  }, [qIndex, phase, q])

  // Timer countdown
  useEffect(() => {
    if (phase !== 'playing') return
    const interval = setInterval(() => {
      setTimer(t => {
        if (t <= 0) {
          handleAnswer(-1)
          return 0
        }
        return t - 2
      })
    }, 100)
    return () => clearInterval(interval)
  }, [phase, qIndex])

  const handleAnswer = useCallback((optIdx: number) => {
    if (phase !== 'playing') return
    setSlicedOption(optIdx)

    if (optIdx === q.correctAnswer) {
      const points = 100 + combo * 25
      setScore(s => s + points)
      setCombo(c => c + 1)
      setPhase('correct')
    } else {
      setLives(l => l - 1)
      setCombo(0)
      setPhase('wrong')
    }

    setTimeout(() => {
      if (qIndex < game.questions.length - 1 && lives > (optIdx !== q.correctAnswer ? 1 : 0)) {
        setQIndex(i => i + 1)
        setPhase('playing')
      } else {
        setPhase('results')
      }
    }, 1200)
  }, [phase, q, combo, qIndex, game.questions.length, lives])

  if (phase === 'results') {
    const maxScore = game.questions.length * 100
    const percent = Math.round((score / maxScore) * 100)
    const xpEarned = Math.round((percent / 100) * game.xpReward)
    const shouldOfferRetry = percent < LOW_SCORE_THRESHOLD
    const shouldOfferShare = percent >= HIGH_SCORE_THRESHOLD

    return (
      <div className="fixed inset-0 z-[70] bg-black flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="glass-card rounded-3xl max-w-sm w-full p-6 space-y-4 text-center"
        >
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold">🍉 Ninja Complete!</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="glass-card rounded-xl p-3"><p className="text-2xl font-bold text-primary">{score}</p><p className="text-xs text-muted-foreground">Score</p></div>
            <div className="glass-card rounded-xl p-3"><p className="text-2xl font-bold text-accent">+{xpEarned}</p><p className="text-xs text-muted-foreground">XP Earned</p></div>
          </div>

          {shouldOfferRetry && (
            <p className="text-sm text-muted-foreground">
              One more run will help lock the key details in before you move on.
            </p>
          )}

          {shouldOfferShare && (
            <p className="text-sm text-muted-foreground">
              Clean round. Share it to the community before you jump back into the journey.
            </p>
          )}

          <div className={cn('gap-3', shouldOfferRetry && !shouldOfferShare ? 'flex justify-center' : 'grid sm:grid-cols-2')}>
            {shouldOfferRetry && (
              <Button
                variant="outline"
                className={cn('w-full', !shouldOfferShare && 'max-w-[220px]')}
                onClick={resetGame}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            )}
            {shouldOfferShare && (
              <Button
                variant="outline"
                className="w-full"
                disabled={shared}
                onClick={() => {
                  onShareScore?.(percent, xpEarned)
                  setShared(true)
                }}
              >
                {shared ? 'Draft Ready' : 'Share Your Score'}
              </Button>
            )}
          </div>

          <Button className="w-full bg-gradient-to-r from-green-500 to-emerald-600" onClick={() => onComplete(percent, xpEarned)}>
            Continue Journey
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[70] bg-gradient-to-b from-green-950 via-black to-green-950 overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 inset-x-0 z-20 pt-12 px-4 flex items-center justify-between">
        <button onClick={onClose} className="p-2 rounded-full bg-white/10"><X className="w-5 h-5 text-white" /></button>
        <div className="text-center">
          <p className="text-white font-bold text-sm">🍉 Fruit Ninja</p>
          <p className="text-white/60 text-xs">Q{qIndex + 1}/{game.questions.length}</p>
        </div>
        <div className="flex items-center gap-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <Heart key={i} className={cn('w-5 h-5', i < lives ? 'text-red-500 fill-red-500' : 'text-white/20')} />
          ))}
        </div>
      </div>

      {/* Score + Combo */}
      <div className="absolute top-28 inset-x-0 z-20 flex justify-center gap-4">
        <div className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm font-bold">
          <Zap className="w-3.5 h-3.5 inline mr-1 text-yellow-400" />{score}
        </div>
        {combo > 1 && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="px-3 py-1 rounded-full bg-orange-500/30 text-orange-300 text-sm font-bold">
            {combo}x Combo!
          </motion.div>
        )}
      </div>

      {/* Timer bar */}
      <div className="absolute top-24 inset-x-4 z-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <motion.div className="h-full rounded-full bg-gradient-to-r from-green-400 to-emerald-500" style={{ width: `${timer}%` }} />
      </div>

      {/* Question */}
      <div className="absolute top-36 inset-x-4 z-20 text-center">
        <p className="text-white text-lg font-bold px-4">{q?.text}</p>
        <p className="text-green-400 text-xs mt-2">Slice the correct answer!</p>
      </div>

      {/* Flying Options */}
      <div className="absolute inset-0 pt-56 pb-20">
        <AnimatePresence mode="wait">
          {flyingOptions.map(opt => (
            <motion.button
              key={`${qIndex}-${opt.id}`}
              initial={{ y: 220, x: 0, left: `${opt.laneX}%`, rotate: opt.rotateFrom, scale: 0.9 }}
              animate={{
                x: [0, opt.driftX, opt.endDriftX, 0],
                y: [220, -opt.arcHeight, opt.returnDepth, 220],
                rotate: [opt.rotateFrom, opt.rotateTo, opt.rotateFrom * -0.45, opt.rotateFrom],
                scale: [0.9, 1.04, 0.96, 0.9],
              }}
              transition={{
                duration: opt.duration,
                delay: opt.delay,
                ease: [0.22, 1, 0.36, 1],
                repeat: Infinity,
                repeatType: 'mirror',
              }}
              onClick={() => handleAnswer(opt.optIdx)}
              className={cn(
                'absolute -translate-x-1/2 transform-gpu px-5 py-3 rounded-2xl font-bold text-sm shadow-xl transition-all will-change-transform',
                slicedOption === opt.optIdx && opt.optIdx === q?.correctAnswer
                  ? 'bg-green-500 text-white scale-125'
                  : slicedOption === opt.optIdx
                    ? 'bg-red-500 text-white opacity-50'
                    : 'bg-white/15 backdrop-blur-md text-white border border-white/20 hover:bg-white/25 active:scale-95',
              )}
            >
              {opt.text}
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      {/* Feedback overlay */}
      <AnimatePresence>
        {phase === 'correct' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1.5 }} className="text-6xl">✅</motion.span>
          </motion.div>
        )}
        {phase === 'wrong' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 bg-red-500/20">
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1.5, rotate: 15 }} className="text-6xl">❌</motion.span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
