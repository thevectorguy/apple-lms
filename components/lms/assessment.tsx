'use client'

import { useState, useEffect } from 'react'
import type { Assessment, Question } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { X, Clock, CheckCircle2, XCircle, Sparkles, Trophy, ArrowRight, RotateCcw } from 'lucide-react'

interface AssessmentProps {
  assessment: Assessment
  onComplete: (passed: boolean, score: number) => void
  onClose: () => void
}

type AssessmentState = 'intro' | 'quiz' | 'result'

export function AssessmentComponent({ assessment, onComplete, onClose }: AssessmentProps) {
  const [state, setState] = useState<AssessmentState>('intro')
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [answers, setAnswers] = useState<number[]>([])
  const [showExplanation, setShowExplanation] = useState(false)
  const [timeLeft, setTimeLeft] = useState(assessment.timeLimit)
  const [score, setScore] = useState(0)

  useEffect(() => {
    if (state !== 'quiz') return
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          finishQuiz()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [state])

  const startQuiz = () => {
    setState('quiz')
    setTimeLeft(assessment.timeLimit)
  }

  const selectAnswer = (index: number) => {
    if (showExplanation) return
    setSelectedAnswer(index)
  }

  const confirmAnswer = () => {
    if (selectedAnswer === null) return
    setShowExplanation(true)
    const newAnswers = [...answers, selectedAnswer]
    setAnswers(newAnswers)
  }

  const nextQuestion = () => {
    if (currentQuestion < assessment.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setSelectedAnswer(null)
      setShowExplanation(false)
    } else {
      finishQuiz()
    }
  }

  const finishQuiz = () => {
    const correctAnswers = answers.filter(
      (answer, index) => answer === assessment.questions[index].correctAnswer
    ).length
    const finalScore = Math.round((correctAnswers / assessment.questions.length) * 100)
    setScore(finalScore)
    setState('result')
    onComplete(finalScore >= assessment.passingScore, finalScore)
  }

  const question = assessment.questions[currentQuestion]
  const isCorrect = selectedAnswer === question?.correctAnswer
  const passed = score >= assessment.passingScore

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="fixed inset-0 z-[60] bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-4">
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="w-6 h-6" />
        </button>
        <h2 className="font-bold">{assessment.title}</h2>
        {state === 'quiz' && (
          <div className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium',
            timeLeft < 60 ? 'bg-destructive/20 text-destructive' : 'bg-muted text-foreground'
          )}>
            <Clock className="w-4 h-4" />
            {formatTime(timeLeft)}
          </div>
        )}
        {state !== 'quiz' && <div className="w-6" />}
      </div>

      {/* Intro State */}
      {state === 'intro' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-24 h-24 mb-6 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
            <span className="text-5xl">{assessment.badgeReward?.icon || '🎯'}</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">{assessment.title}</h2>
          <p className="text-muted-foreground mb-6">{assessment.description}</p>
          
          <div className="grid grid-cols-2 gap-4 w-full max-w-xs mb-8">
            <div className="glass-card rounded-xl p-4 text-center">
              <p className="text-2xl font-bold">{assessment.questions.length}</p>
              <p className="text-xs text-muted-foreground">Questions</p>
            </div>
            <div className="glass-card rounded-xl p-4 text-center">
              <p className="text-2xl font-bold">{Math.floor(assessment.timeLimit / 60)}m</p>
              <p className="text-xs text-muted-foreground">Time Limit</p>
            </div>
            <div className="glass-card rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-xp">+{assessment.xpReward}</p>
              <p className="text-xs text-muted-foreground">XP Reward</p>
            </div>
            <div className="glass-card rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-primary">{assessment.passingScore}%</p>
              <p className="text-xs text-muted-foreground">To Pass</p>
            </div>
          </div>

          <Button
            onClick={startQuiz}
            className="w-full max-w-xs bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-semibold"
          >
            Start Assessment
          </Button>
        </div>
      )}

      {/* Quiz State */}
      {state === 'quiz' && question && (
        <div className="flex-1 flex flex-col p-4">
          {/* Progress */}
          <div className="flex gap-1 mb-6">
            {assessment.questions.map((_, idx) => (
              <div
                key={idx}
                className={cn(
                  'h-1.5 flex-1 rounded-full transition-all',
                  idx < currentQuestion
                    ? 'bg-xp'
                    : idx === currentQuestion
                    ? 'bg-primary'
                    : 'bg-muted'
                )}
              />
            ))}
          </div>

          <p className="text-sm text-muted-foreground mb-2">
            Question {currentQuestion + 1} of {assessment.questions.length}
          </p>
          <h3 className="text-xl font-bold mb-6">{question.text}</h3>

          <div className="space-y-3 flex-1">
            {question.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => selectAnswer(idx)}
                disabled={showExplanation}
                className={cn(
                  'w-full p-4 rounded-xl border text-left transition-all',
                  selectedAnswer === idx
                    ? showExplanation
                      ? isCorrect
                        ? 'border-xp bg-xp/20'
                        : 'border-destructive bg-destructive/20'
                      : 'border-primary bg-primary/20'
                    : showExplanation && idx === question.correctAnswer
                    ? 'border-xp bg-xp/20'
                    : 'border-border bg-card hover:border-muted-foreground',
                  showExplanation && 'cursor-default'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                    selectedAnswer === idx
                      ? showExplanation
                        ? isCorrect
                          ? 'bg-xp text-white'
                          : 'bg-destructive text-white'
                        : 'bg-primary text-primary-foreground'
                      : showExplanation && idx === question.correctAnswer
                      ? 'bg-xp text-white'
                      : 'bg-muted text-muted-foreground'
                  )}>
                    {showExplanation && idx === question.correctAnswer ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : showExplanation && selectedAnswer === idx && !isCorrect ? (
                      <XCircle className="w-5 h-5" />
                    ) : (
                      String.fromCharCode(65 + idx)
                    )}
                  </div>
                  <span className="font-medium">{option}</span>
                </div>
              </button>
            ))}
          </div>

          {showExplanation && (
            <div className={cn(
              'p-4 rounded-xl mb-4',
              isCorrect ? 'bg-xp/20' : 'bg-muted'
            )}>
              <p className={cn(
                'font-bold mb-1',
                isCorrect ? 'text-xp' : 'text-destructive'
              )}>
                {isCorrect ? 'Correct!' : 'Not quite!'}
              </p>
              <p className="text-sm text-muted-foreground">{question.explanation}</p>
            </div>
          )}

          <div className="pt-4">
            {!showExplanation ? (
              <Button
                onClick={confirmAnswer}
                disabled={selectedAnswer === null}
                className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-semibold disabled:opacity-50"
              >
                Confirm Answer
              </Button>
            ) : (
              <Button
                onClick={nextQuestion}
                className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-semibold"
              >
                {currentQuestion < assessment.questions.length - 1 ? (
                  <>
                    Next Question
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                ) : (
                  'See Results'
                )}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Result State */}
      {state === 'result' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className={cn(
            'w-32 h-32 mb-6 rounded-full flex items-center justify-center',
            passed
              ? 'bg-gradient-to-br from-xp/30 to-primary/30'
              : 'bg-muted'
          )}>
            {passed ? (
              <Trophy className="w-16 h-16 text-xp" />
            ) : (
              <RotateCcw className="w-16 h-16 text-muted-foreground" />
            )}
          </div>

          <h2 className="text-3xl font-bold mb-2">
            {passed ? 'Congratulations!' : 'Keep Learning!'}
          </h2>
          <p className="text-muted-foreground mb-6">
            {passed
              ? 'You passed the assessment!'
              : `You need ${assessment.passingScore}% to pass. Try again!`}
          </p>

          <div className="text-6xl font-bold mb-2">
            <span className={passed ? 'text-xp' : 'text-muted-foreground'}>{score}%</span>
          </div>
          <p className="text-muted-foreground mb-8">
            {answers.filter((a, i) => a === assessment.questions[i].correctAnswer).length} of{' '}
            {assessment.questions.length} correct
          </p>

          {passed && (
            <div className="flex flex-col items-center gap-4 mb-8">
              <div className="flex items-center gap-2 bg-xp/20 text-xp px-4 py-2 rounded-full">
                <Sparkles className="w-5 h-5" />
                <span className="font-bold">+{assessment.xpReward} XP earned!</span>
              </div>
              {assessment.badgeReward && (
                <div className="flex items-center gap-2 bg-primary/20 text-primary px-4 py-2 rounded-full">
                  <span className="text-xl">{assessment.badgeReward.icon}</span>
                  <span className="font-bold">{assessment.badgeReward.name} Badge Unlocked!</span>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 w-full max-w-xs">
            {!passed && (
              <Button
                onClick={() => {
                  setState('intro')
                  setCurrentQuestion(0)
                  setAnswers([])
                  setSelectedAnswer(null)
                  setShowExplanation(false)
                }}
                variant="outline"
                className="flex-1"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            )}
            <Button
              onClick={onClose}
              className={cn(
                'flex-1 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-semibold',
                !passed && 'flex-1'
              )}
            >
              {passed ? 'Continue Learning' : 'Back to Lessons'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
