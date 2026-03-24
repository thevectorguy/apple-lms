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
  continueLabel?: string
  displayCopy?: {
    topEyebrow?: string
    topTitle?: string
    cardEyebrow?: string
    cardTitle?: string
    questionHint?: string
    resultsEyebrow?: string
    resultsTitle?: string
    resultsDescription?: string
    retryHint?: string
  }
  onClose: () => void
}

const QUESTION_TIME_MS = 8000
const TICK_MS = 100
const LOW_SCORE_THRESHOLD = 70
const HIGH_SCORE_THRESHOLD = 80

export function SpeedMcqGame({ game, onComplete, onShareScore, continueLabel = 'Continue Journey', displayCopy, onClose }: SpeedMcqGameProps) {
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
  const topEyebrow = displayCopy?.topEyebrow ?? 'Speed MCQ'
  const topTitle = displayCopy?.topTitle
  const cardEyebrow = displayCopy?.cardEyebrow ?? 'Rapid Response'
  const cardTitle = displayCopy?.cardTitle ?? game.title
  const questionHint = displayCopy?.questionHint ?? 'Fast answers keep your streak alive and juice the XP payout.'
  const resultsEyebrow = displayCopy?.resultsEyebrow ?? 'Speed Blitz'
  const resultsTitle = displayCopy?.resultsTitle ?? 'Round Complete'
  const resultsDescription = displayCopy?.resultsDescription ?? 'You kept the pressure on and banked bonus XP from fast answers.'
  const retryHint = displayCopy?.retryHint ?? 'Run it back once more to sharpen the quick-recall parts before the next lesson.'

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
    const canShareScore = shouldOfferShare && typeof onShareScore === 'function'

    return (
      <div className="fixed inset-0 z-[70] overflow-y-auto bg-black/90 p-4 md:p-6">
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mx-auto my-auto w-full max-w-xl overflow-y-auto rounded-[2rem] border border-cyan-400/20 bg-slate-950 p-5 text-white shadow-[0_0_60px_rgba(34,211,238,0.12)] md:max-h-[calc(100svh-3rem)] md:p-6"
        >
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-cyan-400 shadow-[0_0_30px_rgba(56,189,248,0.35)]">
            <Trophy className="h-10 w-10 text-white" />
          </div>

          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300/80">{resultsEyebrow}</p>
            <h2 className="mt-2 text-3xl font-black">{resultsTitle}</h2>
            <p className="mt-2 text-sm text-slate-300">{resultsDescription}</p>
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
              {retryHint}
            </p>
          )}

          {canShareScore && (
            <p className="mt-4 text-sm text-slate-300">
              That was quick and clean. Share the score to your community feed if you want.
            </p>
          )}

          <div className={cn('mt-4 gap-3', shouldOfferRetry !== canShareScore ? 'flex justify-center' : 'grid sm:grid-cols-2')}>
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
            {canShareScore && (
              <Button
                className={cn(
                  'w-full border border-cyan-300/24 bg-[linear-gradient(180deg,rgba(34,211,238,0.24)_0%,rgba(8,47,73,0.34)_100%)] font-semibold text-cyan-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_10px_24px_rgba(8,47,73,0.22)] hover:bg-[linear-gradient(180deg,rgba(34,211,238,0.32)_0%,rgba(8,47,73,0.42)_100%)]',
                  !shouldOfferRetry && 'max-w-[240px]',
                )}
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
            {continueLabel}
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[70] overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.22),_transparent_30%),radial-gradient(circle_at_bottom,_rgba(249,115,22,0.2),_transparent_35%),linear-gradient(180deg,#020617_0%,#09090b_45%,#0f172a_100%)] text-white">
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:28px_28px]" />

      <div className="relative z-10 mx-auto flex h-[100svh] w-full max-w-5xl flex-col px-3 pb-4 pt-4 sm:px-4 sm:pb-5 sm:pt-5">
        <div className="flex items-center justify-between gap-3">
          <button onClick={onClose} className="rounded-full border border-white/10 bg-white/5 p-2 backdrop-blur-sm">
            <X className="h-5 w-5 text-white" />
          </button>
          <div className="min-w-0 flex-1 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-300/80">{topEyebrow}</p>
            <p className="mt-1 text-sm text-slate-300">
              {topTitle ? `${topTitle} • ` : ''}Question {questionIndex + 1}/{game.questions.length}
            </p>
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold backdrop-blur-sm">
            <TimerReset className="mr-1 inline h-4 w-4 text-orange-300" />
            {Math.ceil(timeLeft / 1000)}s
          </div>
        </div>

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
          <motion.div
            className={cn(
              'h-full rounded-full',
              timerPercent > 50 ? 'bg-gradient-to-r from-cyan-400 to-emerald-400' : timerPercent > 25 ? 'bg-gradient-to-r from-amber-400 to-orange-400' : 'bg-gradient-to-r from-rose-500 to-orange-500',
            )}
            animate={{ width: `${timerPercent}%` }}
            transition={{ ease: 'linear', duration: TICK_MS / 1000 }}
          />
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-2.5 backdrop-blur-sm sm:p-3">
            <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400">Score</p>
            <p className="mt-1 text-lg font-black text-cyan-300 sm:text-xl">{score}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-2.5 backdrop-blur-sm sm:p-3">
            <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400">Streak</p>
            <p className="mt-1 text-lg font-black text-fuchsia-300 sm:text-xl">{streak}x</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-2.5 backdrop-blur-sm sm:p-3">
            <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400">Correct</p>
            <p className="mt-1 text-lg font-black text-orange-300 sm:text-xl">{correctAnswers}</p>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 items-center justify-center py-3 sm:py-4">
          <div className="w-full max-w-3xl">
            <motion.div
              key={question.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full rounded-[1.75rem] border border-cyan-400/20 bg-slate-950/80 p-4 shadow-[0_0_40px_rgba(14,165,233,0.16)] backdrop-blur-xl sm:p-5 md:p-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-400 sm:text-xs">
                <span className="flex min-w-0 items-center gap-2">
                  <Target className="h-4 w-4 text-cyan-300" />
                  <span className="truncate">{cardEyebrow}</span>
                </span>
                <span className="hidden truncate md:block">{cardTitle}</span>
              </div>

              <h2 className="mt-3 text-[1.8rem] font-black leading-[1.02] text-white sm:text-[2.05rem] md:text-[2.4rem]">{question.text}</h2>
              <p className="mt-2 text-sm leading-5 text-slate-300 sm:text-[15px] sm:leading-6">{questionHint}</p>

              <div className="mt-4 grid gap-2.5 md:grid-cols-2">
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
                        'w-full rounded-2xl border px-4 py-3 text-left text-[15px] font-semibold transition-all sm:py-3.5 sm:text-base md:px-5',
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
                    'pointer-events-none fixed bottom-3 left-1/2 z-20 flex w-[min(92vw,42rem)] -translate-x-1/2 items-start gap-3 rounded-2xl border px-4 py-3 backdrop-blur-sm sm:bottom-4',
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
      </div>
    </div>
  )
}
