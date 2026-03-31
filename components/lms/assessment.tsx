'use client'

import { useEffect, useState } from 'react'
import type { Assessment } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  X,
  Clock,
  CheckCircle2,
  XCircle,
  Sparkles,
  Trophy,
  ArrowRight,
  RotateCcw,
  Share2,
  Target,
} from 'lucide-react'

interface AssessmentProps {
  assessment: Assessment
  onComplete: (passed: boolean, score: number) => void
  onShareResult?: (payload: { score: number; xpEarned: number; assessment: Assessment }) => void
  onClose: () => void
}

type AssessmentState = 'intro' | 'quiz' | 'result'

export function AssessmentComponent({ assessment, onComplete, onShareResult, onClose }: AssessmentProps) {
  const [state, setState] = useState<AssessmentState>('intro')
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [answers, setAnswers] = useState<number[]>([])
  const [showExplanation, setShowExplanation] = useState(false)
  const [timeLeft, setTimeLeft] = useState(assessment.timeLimit)
  const [score, setScore] = useState(0)
  const [shared, setShared] = useState(false)

  const resetAssessment = () => {
    setState('intro')
    setCurrentQuestion(0)
    setSelectedAnswer(null)
    setAnswers([])
    setShowExplanation(false)
    setTimeLeft(assessment.timeLimit)
    setScore(0)
    setShared(false)
  }

  useEffect(() => {
    resetAssessment()
  }, [assessment.id, assessment.timeLimit])

  useEffect(() => {
    if (state !== 'quiz') return

    const timer = window.setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          window.clearInterval(timer)
          finishQuiz()
          return 0
        }

        return prev - 1
      })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [state, answers, assessment.questions])

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
    setAnswers(prev => [...prev, selectedAnswer])
  }

  const nextQuestion = () => {
    if (currentQuestion < assessment.questions.length - 1) {
      setCurrentQuestion(prev => prev + 1)
      setSelectedAnswer(null)
      setShowExplanation(false)
      return
    }

    finishQuiz()
  }

  const finishQuiz = () => {
    const correctAnswers = answers.filter(
      (answer, index) => answer === assessment.questions[index].correctAnswer,
    ).length
    const finalScore = Math.round((correctAnswers / assessment.questions.length) * 100)
    setScore(finalScore)
    setState('result')
    onComplete(finalScore >= assessment.passingScore, finalScore)
  }

  const question = assessment.questions[currentQuestion]
  const isCorrect = selectedAnswer === question?.correctAnswer
  const passed = score >= assessment.passingScore
  const correctAnswersCount = answers.filter(
    (answer, index) => answer === assessment.questions[index].correctAnswer,
  ).length
  const progressPercent = ((currentQuestion + (showExplanation ? 1 : 0)) / assessment.questions.length) * 100

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto overflow-x-hidden bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.22),_transparent_30%),radial-gradient(circle_at_bottom,_rgba(249,115,22,0.2),_transparent_35%),linear-gradient(180deg,#020617_0%,#09090b_45%,#0f172a_100%)] text-white">
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:28px_28px]" />

      <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-5xl flex-col px-3 pb-4 pt-4 sm:px-4 sm:pb-5 sm:pt-5">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="rounded-full border border-white/10 bg-white/5 p-2 backdrop-blur-sm transition-colors hover:bg-white/10"
          >
            <X className="h-5 w-5 text-white" />
          </button>

          <div className="min-w-0 flex-1 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-300/80">Final Assessment</p>
            <p className="mt-1 truncate text-sm text-slate-300">{assessment.title}</p>
          </div>

          {state === 'quiz' ? (
            <div
              className={cn(
                'rounded-full border px-3 py-2 text-sm font-semibold backdrop-blur-sm',
                timeLeft < 60
                  ? 'border-rose-400/30 bg-rose-400/10 text-rose-100'
                  : 'border-white/10 bg-white/5 text-white',
              )}
            >
              <Clock className={cn('mr-1 inline h-4 w-4', timeLeft < 60 ? 'text-rose-200' : 'text-orange-300')} />
              {formatTime(timeLeft)}
            </div>
          ) : (
            <div className="w-11" />
          )}
        </div>

        {state === 'intro' && (
          <div className="flex flex-1 items-center justify-center py-3 sm:py-4">
            <div className="w-full max-w-2xl rounded-[2rem] border border-cyan-400/20 bg-slate-950/80 p-3 shadow-[0_0_40px_rgba(14,165,233,0.16)] backdrop-blur-xl sm:p-5">
              <div className="rounded-[1.75rem] border border-white/10 bg-[linear-gradient(135deg,rgba(15,23,42,0.96)_0%,rgba(8,47,73,0.82)_100%)] p-5 text-center sm:p-6">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400/25 to-fuchsia-400/20 shadow-[0_0_36px_rgba(56,189,248,0.22)] sm:h-20 sm:w-20">
                  <span className="text-5xl">{assessment.badgeReward?.icon || '🎯'}</span>
                </div>

                <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.28em] text-cyan-300/80 sm:text-[11px] sm:tracking-[0.32em]">
                  Assessment Unlocked
                </p>
                <h2 className="mt-3 text-[1.9rem] font-black leading-[1.02] text-white sm:text-[2.6rem]">{assessment.title}</h2>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
                  {assessment.description}
                </p>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 sm:mt-4 sm:gap-3">
                <div className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-slate-400">Questions</p>
                  <p className="mt-2 text-3xl font-black text-cyan-300">{assessment.questions.length}</p>
                </div>
                <div className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-slate-400">Reward</p>
                  <p className="mt-2 text-3xl font-black text-fuchsia-300">+{assessment.xpReward}</p>
                </div>
                <div className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-slate-400">Pass Mark</p>
                  <p className="mt-2 text-3xl font-black text-emerald-300">{assessment.passingScore}%</p>
                </div>
              </div>

              <Button
                onClick={startQuiz}
                className="mt-4 w-full rounded-full bg-gradient-to-r from-orange-500 via-amber-400 to-cyan-400 font-bold text-slate-950 hover:opacity-90 sm:mt-5"
              >
                Start Assessment
              </Button>
            </div>
          </div>
        )}

        {state === 'quiz' && question && (
          <div className="flex min-h-0 flex-1 flex-col py-3 sm:py-4">
            <div className="mb-2 rounded-[1.6rem] border border-white/10 bg-white/5 p-3 backdrop-blur-sm sm:mb-3 sm:p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-300/80">
                    Assessment Progress
                  </p>
                  <p className="mt-1 text-sm text-slate-300">
                    Question {currentQuestion + 1} of {assessment.questions.length}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-semibold">
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-slate-200">
                    Pass at {assessment.passingScore}%
                  </span>
                  <span className="rounded-full border border-fuchsia-400/20 bg-fuchsia-400/10 px-3 py-1.5 text-fuchsia-100">
                    +{assessment.xpReward} XP
                  </span>
                </div>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-emerald-400 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <div className="flex min-h-0 flex-1 items-start justify-center">
              <div className="w-full max-w-3xl">
                <div className="rounded-[1.75rem] border border-cyan-400/20 bg-slate-950/80 p-4 shadow-[0_0_40px_rgba(14,165,233,0.16)] backdrop-blur-xl sm:p-5 md:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3 text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-400 sm:text-xs">
                    <span className="flex min-w-0 items-center gap-2">
                      <Target className="h-4 w-4 text-cyan-300" />
                      <span className="truncate">Final Assessment</span>
                    </span>
                    <span className="truncate">{assessment.title}</span>
                  </div>

                  <h3 className="mt-3 text-[1.65rem] font-black leading-[1.02] text-white sm:text-[2.05rem] md:text-[2.35rem]">
                    {question.text}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Choose your answer, confirm it, then review the explanation before moving ahead.
                  </p>

                  <div className="mt-4 space-y-2.5 sm:mt-5 sm:space-y-3">
                    {question.options.map((option, idx) => (
                      <button
                        key={idx}
                        onClick={() => selectAnswer(idx)}
                        disabled={showExplanation}
                        className={cn(
                          'w-full rounded-2xl border px-4 py-3.5 text-left text-[15px] font-semibold transition-all md:px-5 md:py-4',
                          !showExplanation && 'border-white/10 bg-white/5 hover:border-cyan-300/40 hover:bg-cyan-400/10',
                          selectedAnswer === idx && !showExplanation && 'border-cyan-300/50 bg-cyan-400/12 text-white',
                          showExplanation && idx === question.correctAnswer && 'border-emerald-400/50 bg-emerald-400/20 text-emerald-50',
                          showExplanation && selectedAnswer === idx && idx !== question.correctAnswer && 'border-rose-400/50 bg-rose-400/20 text-rose-50',
                          showExplanation && idx !== question.correctAnswer && selectedAnswer !== idx && 'border-white/10 bg-white/5 text-slate-300 opacity-75',
                        )}
                      >
                        <span className="flex items-center gap-3">
                          <span
                            className={cn(
                              'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                              !showExplanation && selectedAnswer === idx && 'bg-cyan-400 text-slate-950',
                              !showExplanation && selectedAnswer !== idx && 'bg-white/10 text-slate-300',
                              showExplanation && idx === question.correctAnswer && 'bg-emerald-400/20 text-emerald-100',
                              showExplanation && selectedAnswer === idx && idx !== question.correctAnswer && 'bg-rose-400/20 text-rose-100',
                              showExplanation && idx !== question.correctAnswer && selectedAnswer !== idx && 'bg-white/10 text-slate-400',
                            )}
                          >
                            {showExplanation && idx === question.correctAnswer ? (
                              <CheckCircle2 className="h-5 w-5" />
                            ) : showExplanation && selectedAnswer === idx && idx !== question.correctAnswer ? (
                              <XCircle className="h-5 w-5" />
                            ) : (
                              String.fromCharCode(65 + idx)
                            )}
                          </span>
                          <span>{option}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 mt-3 pb-1">
              <div className="rounded-[1.4rem] border border-white/10 bg-slate-950/92 p-3 shadow-[0_-10px_40px_rgba(2,6,23,0.38)] backdrop-blur-xl">
                {showExplanation && (
                  <div
                    className={cn(
                      'mb-3 rounded-[1.2rem] border px-4 py-3',
                      isCorrect ? 'border-emerald-400/30 bg-emerald-400/15 text-emerald-50' : 'border-rose-400/30 bg-rose-400/15 text-rose-50',
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                          isCorrect ? 'bg-emerald-400/25' : 'bg-rose-400/25',
                        )}
                      >
                        {isCorrect ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="font-bold">{isCorrect ? 'Correct choice' : 'Review this one'}</p>
                        <p className="mt-1 text-sm opacity-90">{question.explanation}</p>
                      </div>
                    </div>
                  </div>
                )}

                {!showExplanation ? (
                  <Button
                    onClick={confirmAnswer}
                    disabled={selectedAnswer === null}
                    className="w-full rounded-full bg-gradient-to-r from-orange-500 via-amber-400 to-cyan-400 font-bold text-slate-950 hover:opacity-90 disabled:opacity-50"
                  >
                    Confirm Answer
                  </Button>
                ) : (
                  <Button
                    onClick={nextQuestion}
                    className="w-full rounded-full bg-gradient-to-r from-orange-500 via-amber-400 to-cyan-400 font-bold text-slate-950 hover:opacity-90"
                  >
                    {currentQuestion < assessment.questions.length - 1 ? (
                      <>
                        Next Question
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    ) : (
                      'See Results'
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {state === 'result' && (
          <div className="flex flex-1 items-center justify-center py-4">
            <div className="w-full max-w-xl rounded-[2rem] border border-cyan-400/20 bg-slate-950 p-5 text-white shadow-[0_0_60px_rgba(34,211,238,0.12)] sm:p-6">
              <div
                className={cn(
                  'mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full shadow-[0_0_30px_rgba(56,189,248,0.22)]',
                  passed
                    ? 'bg-gradient-to-br from-orange-500 to-cyan-400'
                    : 'bg-gradient-to-br from-slate-700 to-slate-600',
                )}
              >
                {passed ? <Trophy className="h-10 w-10 text-white" /> : <RotateCcw className="h-10 w-10 text-white" />}
              </div>

              <div className="text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300/80">Assessment Results</p>
                <h2 className="mt-2 text-3xl font-black">{passed ? 'Assessment Cleared' : 'Almost There'}</h2>
                <p className="mt-2 text-sm text-slate-300">
                  {passed
                    ? 'You cleared the assessment and locked in the next step of the journey.'
                    : `You need ${assessment.passingScore}% to pass. Review the concepts and take another run.`}
                </p>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Score</p>
                  <p className="mt-2 text-3xl font-bold text-cyan-300">{score}%</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Correct</p>
                  <p className="mt-2 text-3xl font-bold text-white">
                    {correctAnswersCount}/{assessment.questions.length}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">XP Earned</p>
                  <p className="mt-2 text-3xl font-bold text-orange-300">{passed ? `+${assessment.xpReward}` : '+0'}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Pass Mark</p>
                  <p className="mt-2 text-3xl font-bold text-emerald-300">{assessment.passingScore}%</p>
                </div>
              </div>

              {passed && (
                <div className="mt-4 space-y-3">
                  <div className="rounded-2xl border border-orange-400/20 bg-orange-400/10 p-4 text-sm text-orange-100">
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 font-semibold">
                        <Sparkles className="h-4 w-4" />
                        XP reward unlocked
                      </span>
                      <span className="font-bold">+{assessment.xpReward}</span>
                    </div>
                  </div>

                  {assessment.badgeReward && (
                    <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm text-cyan-50">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{assessment.badgeReward.icon}</span>
                        <div>
                          <p className="font-bold">{assessment.badgeReward.name} unlocked</p>
                          <p className="mt-1 text-cyan-50/80">This badge is now part of your achievement stack.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!passed && (
                <p className="mt-4 text-sm text-slate-300">
                  Retry is available right away, and the same progression lock stays active until you pass.
                </p>
              )}

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                {!passed && (
                  <Button
                    onClick={resetAssessment}
                    variant="outline"
                    className="flex-1 rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Retry
                  </Button>
                )}

                {passed && onShareResult && (
                  <Button
                    variant="outline"
                    className="flex-1 rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10"
                    disabled={shared}
                    onClick={() => {
                      onShareResult({ score, xpEarned: assessment.xpReward, assessment })
                      setShared(true)
                    }}
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    {shared ? 'Draft Ready' : 'Share Result'}
                  </Button>
                )}

                <Button
                  onClick={onClose}
                  className="flex-1 rounded-full bg-gradient-to-r from-orange-500 via-amber-400 to-cyan-400 font-bold text-slate-950 hover:opacity-90"
                >
                  {passed ? 'Continue Learning' : 'Back to Lessons'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
