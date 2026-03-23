'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { MiniGame } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { X, Zap, TimerReset, Trophy, Flame, Target, RotateCcw } from 'lucide-react'

interface SpeedMcqGameProps {
  game: MiniGame
  onComplete: (score: number, xpEarned: number) => void
  onShareScore?: (score: number, xpEarned: number) => void
  onClose: () => void
}

const QUESTION_TIME_MS = 8000
const TICK_MS = 100
const LOW_SCORE_THRESHOLD = 70
const HIGH_SCORE_THRESHOLD = 80

export function SpeedMcqGame({ game, onComplete, onShareScore, onClose }: SpeedMcqGameProps) {
  const [questionIndex, setQuestionIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_MS)
  const [score, setScore] = useState(0)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [phase, setPhase] = useState<'playing' | 'feedback' | 'results'>('playing')
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState(false)
  const [speedBonusTotal, setSpeedBonusTotal] = useState(0)
  const [shared, setShared] = useState(false)

  const question = game.questions[questionIndex]
  const timerPercent = Math.max(0, (timeLeft / QUESTION_TIME_MS) * 100)

  useEffect(() => {
    if (phase !== 'playing') return

    const interval = window.setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= TICK_MS) {
          window.clearInterval(interval)
          handleAnswer(-1)
          return 0
        }

        return prev - TICK_MS
      })
    }, TICK_MS)

    return () => window.clearInterval(interval)
  }, [phase, questionIndex])

  const advance = (nextCorrectStreak: number) => {
    window.setTimeout(() => {
      if (questionIndex < game.questions.length - 1) {
        setQuestionIndex(prev => prev + 1)
        setTimeLeft(QUESTION_TIME_MS)
        setSelectedAnswer(null)
        setPhase('playing')
        setBestStreak(prev => Math.max(prev, nextCorrectStreak))
        return
      }

      setBestStreak(prev => Math.max(prev, nextCorrectStreak))
      setPhase('results')
    }, 850)
  }

  const handleAnswer = (answerIndex: number) => {
    if (phase !== 'playing') return

    const isCorrect = answerIndex === question.correctAnswer
    const speedBonus = isCorrect ? Math.round(timerPercent) : 0
    const nextStreak = isCorrect ? streak + 1 : 0

    setSelectedAnswer(answerIndex)
    setLastAnswerCorrect(isCorrect)

    if (isCorrect) {
      const streakBonus = Math.max(0, streak) * 20
      setCorrectAnswers(prev => prev + 1)
      setSpeedBonusTotal(prev => prev + speedBonus)
      setScore(prev => prev + 100 + speedBonus + streakBonus)
      setStreak(nextStreak)
    } else {
      setStreak(0)
    }

    setPhase('feedback')
    advance(nextStreak)
  }

  const maxScore = game.questions.length * 220
  const accuracy = game.questions.length ? Math.round((correctAnswers / game.questions.length) * 100) : 0
  const speedRatio = maxScore ? Math.min(1, score / maxScore) : 0
  const xpEarned = useMemo(() => {
    const blendedRatio = Math.min(1, (accuracy / 100) * 0.75 + speedRatio * 0.25)
    return Math.round(game.xpReward * blendedRatio)
  }, [accuracy, game.xpReward, speedRatio])

  const resetGame = () => {
    setQuestionIndex(0)
    setTimeLeft(QUESTION_TIME_MS)
    setScore(0)
    setCorrectAnswers(0)
    setStreak(0)
    setBestStreak(0)
    setPhase('playing')
    setSelectedAnswer(null)
    setLastAnswerCorrect(false)
    setSpeedBonusTotal(0)
    setShared(false)
  }

  if (phase === 'results') {
    const shouldOfferRetry = accuracy < LOW_SCORE_THRESHOLD
    const shouldOfferShare = accuracy >= HIGH_SCORE_THRESHOLD

    return (
      <div className="fixed inset-0 z-[70] bg-black flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-sm rounded-[2rem] border border-cyan-400/20 bg-slate-950 p-6 text-white shadow-[0_0_60px_rgba(34,211,238,0.12)]"
        >
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-cyan-400 shadow-[0_0_30px_rgba(56,189,248,0.35)]">
            <Trophy className="h-10 w-10 text-white" />
          </div>

          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300/80">Speed Blitz</p>
            <h2 className="mt-2 text-3xl font-black">Round Complete</h2>
            <p className="mt-2 text-sm text-slate-300">You kept the pressure on and banked bonus XP from fast answers.</p>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Accuracy</p>
              <p className="mt-2 text-3xl font-bold text-cyan-300">{accuracy}%</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">XP Earned</p>
              <p className="mt-2 text-3xl font-bold text-orange-300">+{xpEarned}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Score</p>
              <p className="mt-2 text-3xl font-bold text-white">{score}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Best Streak</p>
              <p className="mt-2 text-3xl font-bold text-fuchsia-300">{bestStreak}x</p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-orange-400/20 bg-orange-400/10 p-4 text-sm text-orange-100">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Speed bonus banked
              </span>
              <span className="font-bold">+{speedBonusTotal}</span>
            </div>
          </div>

          {shouldOfferRetry && (
            <p className="mt-4 text-sm text-slate-300">
              Run it back once more to sharpen the quick-recall parts before the next lesson.
            </p>
          )}

          {shouldOfferShare && (
            <p className="mt-4 text-sm text-slate-300">
              That was quick and clean. Share the score to your community feed if you want.
            </p>
          )}

          <div className={cn('mt-4 gap-3', shouldOfferRetry && !shouldOfferShare ? 'flex justify-center' : 'grid sm:grid-cols-2')}>
            {shouldOfferRetry && (
              <Button
                variant="outline"
                className={cn('w-full border-white/10 bg-white/5 text-white hover:bg-white/10', !shouldOfferShare && 'max-w-[220px]')}
                onClick={resetGame}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            )}
            {shouldOfferShare && (
              <Button
                variant="outline"
                className="w-full border-white/10 bg-white/5 text-white hover:bg-white/10"
                disabled={shared}
                onClick={() => {
                  onShareScore?.(accuracy, xpEarned)
                  setShared(true)
                }}
              >
                {shared ? 'Draft Ready' : 'Share Your Score'}
              </Button>
            )}
          </div>

          <Button
            className="mt-6 w-full bg-gradient-to-r from-orange-500 via-amber-400 to-cyan-400 font-bold text-slate-950 hover:opacity-90"
            onClick={() => onComplete(accuracy, xpEarned)}
          >
            Continue Journey
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[70] overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.22),_transparent_30%),radial-gradient(circle_at_bottom,_rgba(249,115,22,0.2),_transparent_35%),linear-gradient(180deg,#020617_0%,#09090b_45%,#0f172a_100%)] text-white">
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:28px_28px]" />

      <div className="absolute inset-x-0 top-0 z-20 px-4 pb-4 pt-12">
        <div className="flex items-center justify-between">
          <button onClick={onClose} className="rounded-full border border-white/10 bg-white/5 p-2 backdrop-blur-sm">
            <X className="h-5 w-5 text-white" />
          </button>
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300/80">Speed MCQ</p>
            <p className="mt-1 text-sm text-slate-300">
              Question {questionIndex + 1}/{game.questions.length}
            </p>
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold backdrop-blur-sm">
            <TimerReset className="mr-1 inline h-4 w-4 text-orange-300" />
            {Math.ceil(timeLeft / 1000)}s
          </div>
        </div>

        <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
          <motion.div
            className={cn(
              'h-full rounded-full',
              timerPercent > 50 ? 'bg-gradient-to-r from-cyan-400 to-emerald-400' : timerPercent > 25 ? 'bg-gradient-to-r from-amber-400 to-orange-400' : 'bg-gradient-to-r from-rose-500 to-orange-500',
            )}
            animate={{ width: `${timerPercent}%` }}
            transition={{ ease: 'linear', duration: TICK_MS / 1000 }}
          />
        </div>
      </div>

      <div className="absolute left-4 right-4 top-32 z-20 grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm">
          <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400">Score</p>
          <p className="mt-2 text-2xl font-black text-cyan-300">{score}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm">
          <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400">Streak</p>
          <p className="mt-2 text-2xl font-black text-fuchsia-300">{streak}x</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm">
          <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400">Correct</p>
          <p className="mt-2 text-2xl font-black text-orange-300">{correctAnswers}</p>
        </div>
      </div>

      <div className="relative z-10 flex min-h-full flex-col justify-center px-4 pb-10 pt-52">
        <motion.div
          key={question.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto w-full max-w-md rounded-[2rem] border border-cyan-400/20 bg-slate-950/80 p-6 shadow-[0_0_40px_rgba(14,165,233,0.16)] backdrop-blur-xl"
        >
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            <span className="flex items-center gap-2">
              <Target className="h-4 w-4 text-cyan-300" />
              Rapid Response
            </span>
            <span>{game.title}</span>
          </div>

          <h2 className="mt-4 text-2xl font-black leading-tight text-white">{question.text}</h2>
          <p className="mt-2 text-sm text-slate-300">Fast answers keep your streak alive and juice the XP payout.</p>

          <div className="mt-6 space-y-3">
            {question.options.map((option, index) => {
              const isCorrect = index === question.correctAnswer
              const isSelected = index === selectedAnswer

              return (
                <motion.button
                  key={`${question.id}-${index}`}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleAnswer(index)}
                  disabled={phase !== 'playing'}
                  className={cn(
                    'w-full rounded-2xl border px-4 py-4 text-left text-sm font-semibold transition-all',
                    phase === 'playing' && 'border-white/10 bg-white/5 hover:border-cyan-300/40 hover:bg-cyan-400/10 active:scale-[0.99]',
                    phase === 'feedback' && isCorrect && 'border-emerald-400/50 bg-emerald-400/20 text-emerald-50',
                    phase === 'feedback' && isSelected && !isCorrect && 'border-rose-400/50 bg-rose-400/20 text-rose-50',
                    phase === 'feedback' && !isSelected && !isCorrect && !isCorrect && 'border-white/10 bg-white/5 text-slate-300',
                    phase !== 'playing' && !isCorrect && !isSelected && 'opacity-70',
                  )}
                >
                  <span className="flex items-center justify-between gap-3">
                    <span>{option}</span>
                    {phase === 'feedback' && isCorrect && <Zap className="h-4 w-4 text-emerald-200" />}
                    {phase === 'feedback' && isSelected && !isCorrect && <X className="h-4 w-4 text-rose-100" />}
                  </span>
                </motion.button>
              )
            })}
          </div>
        </motion.div>

        <AnimatePresence>
          {phase === 'feedback' && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              className={cn(
                'mx-auto mt-5 flex w-full max-w-md items-start gap-3 rounded-2xl border px-4 py-4 backdrop-blur-sm',
                lastAnswerCorrect ? 'border-emerald-400/30 bg-emerald-400/15 text-emerald-50' : 'border-rose-400/30 bg-rose-400/15 text-rose-50',
              )}
            >
              <div className={cn(
                'mt-0.5 flex h-9 w-9 items-center justify-center rounded-full',
                lastAnswerCorrect ? 'bg-emerald-400/25' : 'bg-rose-400/25',
              )}>
                {lastAnswerCorrect ? <Flame className="h-4 w-4" /> : <TimerReset className="h-4 w-4" />}
              </div>
              <div>
                <p className="font-bold">{lastAnswerCorrect ? 'Nice hit' : 'Keep moving'}</p>
                <p className="mt-1 text-sm opacity-90">{question.explanation}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
