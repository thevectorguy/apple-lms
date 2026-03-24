'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { MiniGame } from '@/lib/types'
import { cn } from '@/lib/utils'
import { X, Clock, Trophy, Zap, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CardFlipGameProps {
  game: MiniGame
  onComplete: (score: number, xpEarned: number) => void
  onShareScore?: (score: number, xpEarned: number) => void
  continueLabel?: string
  onClose: () => void
}

interface Card {
  id: number
  questionIndex: number
  flipped: boolean
  answered: boolean
  correct: boolean | null
}

const LOW_SCORE_THRESHOLD = 70
const HIGH_SCORE_THRESHOLD = 80

function createShuffledCards(game: MiniGame): Card[] {
  return game.questions
    .map((_, i) => ({
      id: i,
      questionIndex: i,
      flipped: false,
      answered: false,
      correct: null,
    }))
    .sort(() => Math.random() - 0.5)
}

export function CardFlipGame({ game, onComplete, onShareScore, continueLabel = 'Continue Journey', onClose }: CardFlipGameProps) {
  const [cards, setCards] = useState<Card[]>([])
  const [selectedCard, setSelectedCard] = useState<number | null>(null)
  const [timer, setTimer] = useState(15)
  const [score, setScore] = useState(0)
  const [phase, setPhase] = useState<'cards' | 'question' | 'feedback' | 'results'>('cards')
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [answeredCount, setAnsweredCount] = useState(0)
  const [shared, setShared] = useState(false)

  // Initialize cards (shuffled)
  useEffect(() => {
    setCards(createShuffledCards(game))
  }, [game])

  const resetGame = () => {
    setCards(createShuffledCards(game))
    setSelectedCard(null)
    setTimer(15)
    setScore(0)
    setPhase('cards')
    setSelectedAnswer(null)
    setAnsweredCount(0)
    setShared(false)
  }

  // Timer for question phase
  useEffect(() => {
    if (phase !== 'question') return
    const interval = setInterval(() => {
      setTimer(t => {
        if (t <= 1) {
          handleAnswer(-1) // time up
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [phase, selectedCard])

  const handleCardTap = (cardId: number) => {
    if (phase !== 'cards') return
    const card = cards.find(c => c.id === cardId)
    if (!card || card.answered) return

    setSelectedCard(cardId)
    setCards(cs => cs.map(c => c.id === cardId ? { ...c, flipped: true } : c))
    setTimer(15)
    setSelectedAnswer(null)
    setTimeout(() => setPhase('question'), 600)
  }

  const handleAnswer = (optIdx: number) => {
    if (phase !== 'question' || selectedCard === null) return
    const card = cards.find(c => c.id === selectedCard)!
    const q = game.questions[card.questionIndex]
    const isCorrect = optIdx === q.correctAnswer

    setSelectedAnswer(optIdx)
    if (isCorrect) setScore(s => s + 100)

    setCards(cs => cs.map(c => c.id === selectedCard ? { ...c, answered: true, correct: isCorrect } : c))
    setPhase('feedback')

    const newCount = answeredCount + 1
    setAnsweredCount(newCount)

    setTimeout(() => {
      if (newCount >= game.questions.length) {
        setPhase('results')
      } else {
        setPhase('cards')
        setSelectedCard(null)
      }
    }, 1500)
  }

  const currentQuestion = selectedCard !== null ? game.questions[cards.find(c => c.id === selectedCard)?.questionIndex || 0] : null

  if (phase === 'results') {
    const maxScore = game.questions.length * 100
    const percent = Math.round((score / maxScore) * 100)
    const xpEarned = Math.round((percent / 100) * game.xpReward)
    const shouldOfferRetry = percent < LOW_SCORE_THRESHOLD
    const shouldOfferShare = percent >= HIGH_SCORE_THRESHOLD

    return (
      <div className="fixed inset-0 z-[70] bg-black flex items-center justify-center p-4">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="glass-card rounded-3xl max-w-sm w-full p-6 space-y-4 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center mx-auto">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold">🃏 Cards Complete!</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="glass-card rounded-xl p-3"><p className="text-2xl font-bold text-primary">{score}</p><p className="text-xs text-muted-foreground">Score</p></div>
            <div className="glass-card rounded-xl p-3"><p className="text-2xl font-bold text-accent">+{xpEarned}</p><p className="text-xs text-muted-foreground">XP Earned</p></div>
          </div>

          {shouldOfferRetry && (
            <p className="text-sm text-muted-foreground">
              Flip through it once more and lock in the details before the next lesson.
            </p>
          )}

          {shouldOfferShare && (
            <p className="text-sm text-muted-foreground">
              Strong finish. Share this card run with the community if you want to flex it.
            </p>
          )}

          <div className={cn('gap-3', shouldOfferRetry !== shouldOfferShare ? 'flex justify-center' : 'grid sm:grid-cols-2')}>
            {shouldOfferRetry && (
              <Button variant="outline" className={cn('w-full', !shouldOfferShare && 'max-w-[220px]')} onClick={resetGame}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            )}
            {shouldOfferShare && (
              <Button
                className={cn(
                  'w-full border border-fuchsia-300/24 bg-[linear-gradient(180deg,rgba(168,85,247,0.24)_0%,rgba(91,33,182,0.34)_100%)] font-semibold text-fuchsia-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_10px_24px_rgba(91,33,182,0.22)] hover:bg-[linear-gradient(180deg,rgba(168,85,247,0.32)_0%,rgba(91,33,182,0.42)_100%)]',
                  !shouldOfferRetry && 'max-w-[240px]',
                )}
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

          <Button className="w-full bg-gradient-to-r from-purple-500 to-violet-600" onClick={() => onComplete(percent, xpEarned)}>
            {continueLabel}
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[70] bg-gradient-to-b from-purple-950 via-black to-violet-950">
      {/* Header */}
      <div className="absolute top-0 inset-x-0 z-20 pt-12 px-4 flex items-center justify-between">
        <button onClick={onClose} className="p-2 rounded-full bg-white/10"><X className="w-5 h-5 text-white" /></button>
        <div className="text-center">
          <p className="text-white font-bold text-sm">🃏 Card Flip</p>
          <p className="text-white/60 text-xs">{answeredCount}/{game.questions.length} answered</p>
        </div>
        <div className="px-3 py-1 rounded-full bg-white/10 text-white text-sm font-bold">
          <Zap className="w-3.5 h-3.5 inline mr-1 text-yellow-400" />{score}
        </div>
      </div>

      {/* Cards Layout or Question */}
      {phase === 'cards' && (
        <div className="absolute inset-0 pt-32 pb-20 px-4 flex items-center justify-center">
          <div className="grid grid-cols-2 gap-4 max-w-sm w-full">
            {cards.map(card => (
              <motion.button
                key={card.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleCardTap(card.id)}
                disabled={card.answered}
                className={cn(
                  'aspect-[3/4] rounded-2xl relative overflow-hidden transition-all',
                  card.answered && card.correct ? 'bg-green-500/20 border-2 border-green-500/40' :
                  card.answered && !card.correct ? 'bg-red-500/20 border-2 border-red-500/40' :
                  'bg-white/10 border-2 border-white/20 hover:border-purple-400/50 hover:bg-white/15',
                  card.answered && 'opacity-50',
                )}
              >
                {card.answered ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-4xl">{card.correct ? '✅' : '❌'}</span>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                    <span className="text-4xl">🃏</span>
                    <span className="text-white/60 text-xs font-medium">Tap to reveal</span>
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Question Phase */}
      {(phase === 'question' || phase === 'feedback') && currentQuestion && (
        <div className="absolute inset-0 pt-32 pb-20 px-4 flex flex-col items-center justify-center gap-6">
          {/* Timer */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm">
            <Clock className={cn('w-4 h-4', timer <= 5 ? 'text-red-400' : 'text-white')} />
            <span className={cn('font-bold text-lg', timer <= 5 ? 'text-red-400 animate-pulse' : 'text-white')}>{timer}s</span>
          </div>

          {/* Question */}
          <motion.div
            initial={{ rotateY: 90 }} animate={{ rotateY: 0 }}
            className="glass-card rounded-2xl p-6 max-w-sm w-full text-center"
          >
            <p className="text-white font-bold text-base">{currentQuestion.text}</p>
          </motion.div>

          {/* Options */}
          <div className="grid grid-cols-1 gap-3 max-w-sm w-full">
            {currentQuestion.options.map((opt, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                onClick={() => phase === 'question' && handleAnswer(i)}
                disabled={phase === 'feedback'}
                className={cn(
                  'px-4 py-3 rounded-xl text-sm font-medium text-left transition-all',
                  phase === 'feedback' && i === currentQuestion.correctAnswer
                    ? 'bg-green-500 text-white'
                    : phase === 'feedback' && i === selectedAnswer && i !== currentQuestion.correctAnswer
                      ? 'bg-red-500 text-white'
                      : 'bg-white/10 text-white hover:bg-white/20 active:scale-95',
                )}
              >
                {opt}
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
