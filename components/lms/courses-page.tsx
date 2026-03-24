'use client'

import { useState, useEffect } from 'react'
import type { Course, Episode, Assessment, MiniGame, Module, SkillCategory, CompetencyEventType } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  Search, Filter, Clock, Play, ChevronRight, Lock, CheckCircle2, Star,
  ChevronLeft, Sparkles, RotateCcw, Lightbulb, Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EpisodeFeed } from './episode-feed'
import { AssessmentComponent } from './assessment'
import { JourneyPath } from './journey-path'
import { FruitNinjaGame } from './games/fruit-ninja-game'
import { CardFlipGame } from './games/card-flip-game'
import { SpeedMcqGame } from './games/speed-mcq-game'

interface CoursesPageProps {
  courses: Course[]
  progressState?: {
    completedEpisodes: Set<string>
    completedGames: Set<string>
    completedAssessments: Set<string>
    completedModules: Set<string>
    completedRoleplays: Set<string>
  }
  onProgressStateChange?: (progress: {
    completedEpisodes: Set<string>
    completedGames: Set<string>
    completedAssessments: Set<string>
    completedModules: Set<string>
    completedRoleplays: Set<string>
  }) => void
  onSkillUpdate?: (skillCategory: string, score: number) => void
  onCompetencyEvent?: (event: {
    type: CompetencyEventType
    skillCategory: SkillCategory
    score: number
    sourceId: string
    sourceTitle: string
  }) => void
  autoPlayCourseId?: string | null
  openCourseId?: string | null
  resumeRewardModuleId?: string | null
  onLessonComplete?: (episode: Episode) => void
  onXPGain?: (xp: number, label?: string) => void
  onPracticeWithAI?: (scenario: string, id: string, courseId?: string) => void
  onShareGameScore?: (payload: {
    gameTitle: string
    courseTitle: string
    score: number
    xpEarned: number
  }) => void
  onShareAssessmentResult?: (payload: {
    assessment: Assessment
    courseTitle: string
    score: number
  }) => void
  onShareModuleReward?: (payload: {
    module: Module
    courseTitle: string
  }) => void
}

interface AIRecommendation {
  shouldRevisit: boolean
  message: string
  tips: string[]
  suggestedEpisodeIndex?: number
}

function getCourseEpisodes(course: Course) {
  return course.modules?.length ? course.modules.flatMap(module => module.episodes) : course.episodes
}

function getNextAvailableEpisode(course: Course, completedEpisodes: Set<string>) {
  return getCourseEpisodes(course).find(episode => !episode.completed && !completedEpisodes.has(episode.id) && !episode.locked)
    ?? getCourseEpisodes(course).find(episode => !episode.locked)
    ?? null
}

function buildInitialCompletionState(courses: Course[]) {
  const completedEpisodes = new Set<string>()
  const completedGames = new Set<string>()
  const completedAssessments = new Set<string>()
  const completedModules = new Set<string>()
  const completedRoleplays = new Set<string>()

  courses.forEach(course => {
    getCourseEpisodes(course).forEach(episode => {
      if (episode.completed) completedEpisodes.add(episode.id)
    })

    course.modules?.forEach(courseModule => {
      if (courseModule.completed) {
        courseModule.episodes.forEach(episode => completedEpisodes.add(episode.id))
        courseModule.miniGames.forEach(({ game }) => completedGames.add(game.id))
        completedAssessments.add(courseModule.finalAssessment.id)
      }
    })
  })

  return {
    completedEpisodes,
    completedGames,
    completedAssessments,
    completedModules,
    completedRoleplays,
  }
}

function isModuleFullyComplete(
  courseModule: NonNullable<Course['modules']>[number],
  completedEpisodes: Set<string>,
  completedGames: Set<string>,
  completedAssessments: Set<string>,
  completedRoleplays: Set<string>,
) {
  const episodesDone = courseModule.episodes.every(episode => episode.completed || completedEpisodes.has(episode.id))
  const gamesDone = courseModule.miniGames.every(({ game }) => completedGames.has(game.id))
  const assessmentDone = completedAssessments.has(courseModule.finalAssessment.id)
  const roleplayDone = !courseModule.aiRoleplay || completedRoleplays.has(courseModule.aiRoleplay.id)
  return episodesDone && gamesDone && assessmentDone && roleplayDone
}

export function CoursesPage({
  courses,
  progressState,
  onProgressStateChange,
  onSkillUpdate,
  onCompetencyEvent,
  autoPlayCourseId,
  openCourseId,
  resumeRewardModuleId,
  onLessonComplete,
  onXPGain,
  onPracticeWithAI,
  onShareGameScore,
  onShareAssessmentResult,
  onShareModuleReward,
}: CoursesPageProps) {
  const initialCompletionState = progressState ?? buildInitialCompletionState(courses)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_progress' | 'completed'>('all')
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [completedEpisodes, setCompletedEpisodes] = useState<Set<string>>(() => new Set(initialCompletionState.completedEpisodes))
  const [completedGames, setCompletedGames] = useState<Set<string>>(() => new Set(initialCompletionState.completedGames))
  const [completedAssessments, setCompletedAssessments] = useState<Set<string>>(() => new Set(initialCompletionState.completedAssessments))
  const [completedModules, setCompletedModules] = useState<Set<string>>(() => new Set(initialCompletionState.completedModules))
  const [completedRoleplays, setCompletedRoleplays] = useState<Set<string>>(() => new Set(initialCompletionState.completedRoleplays))
  const [aiRecommendation, setAiRecommendation] = useState<AIRecommendation | null>(null)
  const [showFeed, setShowFeed] = useState(false)
  const [activeEpisodeId, setActiveEpisodeId] = useState<string | null>(null)
  const [activeAssessmentId, setActiveAssessmentId] = useState<string | null>(null)
  const [activeGame, setActiveGame] = useState<MiniGame | null>(null)
  const [activeAssessment, setActiveAssessment] = useState<Assessment | null>(null)

  const categories = ['All', 'iPhone', 'Mac', 'Sales', 'Leadership', 'Compliance']
  const inProgressCount = courses.filter(c => c.status === 'in_progress').length
  const completedCount = courses.filter(c => c.status === 'completed').length

  useEffect(() => {
    if (!autoPlayCourseId) return
    const course = courses.find(c => c.id === autoPlayCourseId)
    if (course) {
      setSelectedCourse(course)
      const nextEpisode = getNextAvailableEpisode(course, completedEpisodes)
      setActiveEpisodeId(nextEpisode?.id ?? null)
      setTimeout(() => setShowFeed(true), 100)
    }
  }, [autoPlayCourseId, courses])

  useEffect(() => {
    if (!openCourseId) return
    const course = courses.find(c => c.id === openCourseId)
    if (course) {
      setSelectedCourse(course)
      setShowFeed(Boolean(resumeRewardModuleId))
      setActiveEpisodeId(null)
      setActiveAssessmentId(null)
      setActiveGame(null)
      setActiveAssessment(null)
      setAiRecommendation(null)
    }
  }, [openCourseId, resumeRewardModuleId, courses])

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || course.category === selectedCategory
    const matchesStatus = statusFilter === 'all' || course.status === statusFilter
    return matchesSearch && matchesCategory && matchesStatus
  })

  const handleEpisodeComplete = (episode: Episode) => {
    setCompletedEpisodes(prev => {
      const next = new Set(prev).add(episode.id)
      onProgressStateChange?.({
        completedEpisodes: next,
        completedGames,
        completedAssessments,
        completedModules,
        completedRoleplays,
      })
      return next
    })
    onLessonComplete?.(episode)
  }

  const handleAssessmentComplete = (passed: boolean, score: number, assessment?: Assessment) => {
    if (selectedCourse && assessment && onCompetencyEvent) {
      onCompetencyEvent({
        type: 'assessment',
        skillCategory: selectedCourse.skillCategory,
        score,
        sourceId: assessment.id,
        sourceTitle: assessment.title,
      })
    } else if (selectedCourse && onSkillUpdate) {
      onSkillUpdate(selectedCourse.skillCategory, score)
    }
    if (passed && assessment) {
      setCompletedAssessments(prev => {
        const next = new Set(prev).add(assessment.id)
        onProgressStateChange?.({
          completedEpisodes,
          completedGames,
          completedAssessments: next,
          completedModules,
          completedRoleplays,
        })
        return next
      })
    }
    setAiRecommendation(null)
    setActiveAssessment(null)
  }

  const handleGameComplete = (game: MiniGame, score: number, xpEarned: number) => {
    setCompletedGames(prev => {
      const next = new Set(prev).add(game.id)
      onProgressStateChange?.({
        completedEpisodes,
        completedGames: next,
        completedAssessments,
        completedModules,
        completedRoleplays,
      })
      return next
    })
    if (selectedCourse && onCompetencyEvent) {
      onCompetencyEvent({
        type: 'mini_game',
        skillCategory: selectedCourse.skillCategory,
        score,
        sourceId: game.id,
        sourceTitle: game.title,
      })
    }
    setActiveGame(null)
    if (onXPGain && xpEarned > 0) {
      onXPGain(xpEarned, 'game cleared')
    }
  }

  const handlePracticeWithAI = (scenario: string, id: string) => {
    onPracticeWithAI?.(scenario, id, selectedCourse?.id)
  }

  useEffect(() => {
    if (!selectedCourse?.modules?.length || !onCompetencyEvent) return

    const newlyCompletedModules = selectedCourse.modules.filter(courseModule => (
      isModuleFullyComplete(courseModule, completedEpisodes, completedGames, completedAssessments, completedRoleplays)
      && !completedModules.has(courseModule.id)
    ))

    if (!newlyCompletedModules.length) return

    setCompletedModules(prev => {
      const next = new Set(prev)
      newlyCompletedModules.forEach(courseModule => next.add(courseModule.id))
      onProgressStateChange?.({
        completedEpisodes,
        completedGames,
        completedAssessments,
        completedModules: next,
        completedRoleplays,
      })
      return next
    })

    newlyCompletedModules.forEach(courseModule => {
      onCompetencyEvent({
        type: 'module_completion',
        skillCategory: selectedCourse.skillCategory,
        score: 100,
        sourceId: courseModule.id,
        sourceTitle: `${courseModule.title} complete`,
      })
    })
  }, [completedAssessments, completedEpisodes, completedGames, completedModules, completedRoleplays, onCompetencyEvent, selectedCourse])

  const generateRecommendation = (score: number): AIRecommendation => {
    if (score >= 80) {
      return {
        shouldRevisit: false,
        message: 'Excellent work! You have a strong grasp of this topic.',
        tips: ['Share your knowledge with peers', 'Move on to the next episode', 'Practice in real customer interactions'],
      }
    } else if (score >= 70) {
      return {
        shouldRevisit: false,
        message: 'Good job! You passed but there is room for improvement.',
        tips: ['Review explanations for missed questions', 'Consider rewatching key sections', 'Try community challenges'],
      }
    }
    return {
      shouldRevisit: true,
      message: 'I noticed you struggled with some concepts. Let me help!',
      tips: ['Rewatch the video focusing on key points', 'Take notes on difficult concepts', 'Try the assessment again after reviewing'],
    }
  }

  const handleCloseFeed = () => {
    setShowFeed(false)
    setActiveAssessmentId(null)
  }

  const handleCloseCourseDetail = () => {
    setSelectedCourse(null)
    setShowFeed(false)
    setActiveEpisodeId(null)
    setActiveAssessmentId(null)
    setActiveGame(null)
    setActiveAssessment(null)
  }

  const renderGame = () => {
    if (!activeGame) return null

	    const commonProps = {
	      game: activeGame,
	      onClose: () => setActiveGame(null),
	      onComplete: (score: number, xpEarned: number) => handleGameComplete(activeGame, score, xpEarned),
	      continueLabel: 'Back to Journey Path',
		      onShareScore: (score: number, xpEarned: number) => {
		          if (!selectedCourse) return
		          onShareGameScore?.({
	            gameTitle: activeGame.title,
	            courseTitle: selectedCourse.title,
	            score,
	            xpEarned,
	          })
	        },
    }

    if (activeGame.gameType === 'fruit-ninja') return <FruitNinjaGame {...commonProps} />
    if (activeGame.gameType === 'card-flip') return <CardFlipGame {...commonProps} />
    return <SpeedMcqGame {...commonProps} />
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Course Detail View
  // ──────────────────────────────────────────────────────────────────────────
	  if (selectedCourse) {
	    const courseEpisodes = getCourseEpisodes(selectedCourse)
	    const isJourneyCourse = Boolean(selectedCourse.modules?.length)
	    const completedInCourse = courseEpisodes.filter(e => e.completed || completedEpisodes.has(e.id)).length
	    const progressPercent = courseEpisodes.length ? (completedInCourse / courseEpisodes.length) * 100 : 0
	    const feedRewardModuleId = activeEpisodeId || activeAssessmentId
	      ? undefined
	      : resumeRewardModuleId ?? undefined
	
	    return (
	      <div className="space-y-4">
		        {showFeed && (
		            <EpisodeFeed
	            course={selectedCourse}
	            onClose={handleCloseFeed}
	            onEpisodeComplete={handleEpisodeComplete}
            onAssessmentComplete={(passed, score, assessment) => handleAssessmentComplete(passed, score, assessment)}
            onGameComplete={handleGameComplete}
	            onGameShare={(game, score, xpEarned) => {
	              onShareGameScore?.({
	                gameTitle: game.title,
	                courseTitle: selectedCourse.title,
	                score,
	                xpEarned,
	              })
	            }}
	            onAssessmentShare={(assessment, score) => {
	              onShareAssessmentResult?.({
	                assessment,
	                courseTitle: selectedCourse.title,
	                score,
	              })
	            }}
	            onModuleRewardShare={(module) => {
	              onShareModuleReward?.({
	                module,
	                courseTitle: selectedCourse.title,
	              })
	            }}
	            onPracticeWithAI={handlePracticeWithAI}
            completedEpisodes={completedEpisodes}
		            completedGames={completedGames}
		            completedAssessments={completedAssessments}
		            completedRoleplays={completedRoleplays}
		            initialEpisodeId={activeEpisodeId ?? undefined}
		            initialAssessmentId={activeAssessmentId ?? undefined}
		            initialRewardModuleId={feedRewardModuleId}
		          />
	        )}

        {activeAssessment && (
          <div className="fixed inset-0 z-[70] bg-black">
	            <AssessmentComponent
	              assessment={activeAssessment}
	              onComplete={(passed, score) => handleAssessmentComplete(passed, score, activeAssessment)}
	              onShareResult={({ score, assessment }) => {
	                if (!selectedCourse) return
	                onShareAssessmentResult?.({
	                  assessment,
	                  courseTitle: selectedCourse.title,
	                  score,
	                })
	              }}
	              onClose={() => setActiveAssessment(null)}
	            />
          </div>
        )}

        {renderGame()}

        {aiRecommendation && (
          <div className="fixed inset-0 z-[80] bg-black/80 flex items-center justify-center p-4">
            <div className="glass-card rounded-3xl max-w-sm w-full p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold">AI Coach</h3>
                  <p className="text-xs text-muted-foreground">Personalized Recommendation</p>
                </div>
              </div>
              <p className="text-sm">{aiRecommendation.message}</p>
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-yellow-500" />Tips for Improvement
                </h4>
                <ul className="space-y-1.5">
                  {aiRecommendation.tips.map((tip, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary">•</span>{tip}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex gap-3 pt-2">
                {aiRecommendation.shouldRevisit && (
                  <Button variant="outline" className="flex-1 bg-transparent" onClick={() => { setAiRecommendation(null); setShowFeed(true) }}>
                    <RotateCcw className="w-4 h-4 mr-2" />Revisit
                  </Button>
                )}
                <Button
                  className={cn('bg-gradient-to-r from-primary to-accent', !aiRecommendation.shouldRevisit && 'flex-1')}
                  onClick={() => setAiRecommendation(null)}
                >
                  Continue
                </Button>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleCloseCourseDetail}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-5 h-5" /><span>Back to Courses</span>
        </button>

        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="relative h-40">
            <img src={selectedCourse.thumbnail || '/placeholder.svg'} alt={selectedCourse.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <span className={cn(
                'text-xs px-2 py-0.5 rounded-full font-medium',
                selectedCourse.level === 'Beginner' && 'bg-green-500/20 text-green-400',
                selectedCourse.level === 'Intermediate' && 'bg-primary/20 text-primary',
                selectedCourse.level === 'Advanced' && 'bg-destructive/20 text-destructive',
              )}>{selectedCourse.level}</span>
              <h2 className="text-xl font-bold text-white mt-2">{selectedCourse.title}</h2>
            </div>
	            <button
	              onClick={() => {
	                const nextEpisode = getNextAvailableEpisode(selectedCourse, completedEpisodes)
	                setActiveEpisodeId(nextEpisode?.id ?? null)
	                setActiveAssessmentId(null)
	                setShowFeed(true)
	              }}
              className="absolute top-3 right-3 px-3 py-2 rounded-full bg-primary flex items-center gap-1.5 shadow-lg"
	            >
	              <Play className="w-4 h-4 text-white fill-white" />
	              <span className="text-white font-semibold text-xs">Continue</span>
	            </button>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <img src={selectedCourse.instructor.avatar || '/placeholder.svg'} alt={selectedCourse.instructor.name} className="w-8 h-8 rounded-full" />
              <span className="text-sm">{selectedCourse.instructor.name}</span>
              {selectedCourse.instructor.verified && (
                <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">Verified</span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-4">{selectedCourse.description}</p>
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
              <span>{completedInCourse}/{courseEpisodes.length} episodes</span>
              <span className="font-bold text-primary">+{selectedCourse.xpReward} pts</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
        </div>

        {isJourneyCourse ? (
          <JourneyPath
            course={selectedCourse}
            completedEpisodes={completedEpisodes}
            completedGames={completedGames}
            completedAssessments={completedAssessments}
            completedRoleplays={completedRoleplays}
            onPlayEpisode={(episode) => {
              setActiveEpisodeId(episode.id)
              setActiveAssessmentId(null)
              setShowFeed(true)
            }}
            onPlayGame={setActiveGame}
            onPlayAssessment={(assessment) => {
              setActiveEpisodeId(null)
              setActiveAssessmentId(assessment.id)
              setActiveAssessment(null)
              setShowFeed(true)
            }}
            onPracticeWithAI={handlePracticeWithAI}
          />
        ) : (
          <div className="space-y-3">
            <h3 className="font-semibold">Episodes</h3>
            {courseEpisodes.map((episode, index) => {
              const isCompleted = episode.completed || completedEpisodes.has(episode.id)
              const prevCompleted = index === 0 || courseEpisodes[index - 1].completed || completedEpisodes.has(courseEpisodes[index - 1]?.id)
              const isLocked = episode.locked && !prevCompleted
              const isNext = !isLocked && !isCompleted && index > 0

              return (
                <div
                  key={episode.id}
                  className={cn(
                    'glass-card rounded-xl p-3 flex items-center gap-3 transition-all',
                    isLocked ? 'opacity-50' : 'cursor-pointer hover:bg-secondary/50 active:scale-[0.99]',
                    isNext && 'ring-1 ring-primary/30',
                  )}
                  onClick={() => {
                    if (!isLocked) {
                      setActiveEpisodeId(episode.id)
                      setShowFeed(true)
                    }
                  }}
                >
                  <div className="relative w-20 h-14 rounded-lg overflow-hidden flex-shrink-0">
                    <img src={episode.thumbnail || '/placeholder.svg'} alt={episode.title} className="w-full h-full object-cover" />
                    {isLocked ? (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><Lock className="w-5 h-5 text-white" /></div>
                    ) : isCompleted ? (
                      <div className="absolute inset-0 bg-primary/60 flex items-center justify-center"><CheckCircle2 className="w-5 h-5 text-white" /></div>
                    ) : (
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center"><Play className="w-5 h-5 text-white" /></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm truncate">{episode.title}</h4>
                      {isNext && <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0">UP NEXT</span>}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{episode.description}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{episode.duration}</span>
                      <span className="text-primary font-semibold">+{episode.xp} XP</span>
                      {episode.assessment && <span className="text-accent">+ Quiz</span>}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Course List View
  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <div className="mb-2">
        <h1 className="text-2xl font-bold">Courses</h1>
        <p className="text-muted-foreground">Discover your next skill to master</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text" placeholder="Search courses..." value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-12 py-3 glass-card rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <button className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 bg-primary/10 rounded-lg">
          <Filter className="w-4 h-4 text-primary" />
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map(cat => (
          <button key={cat} onClick={() => setSelectedCategory(cat)}
            className={cn('px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all',
              selectedCategory === cat ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
            )}
          >{cat}</button>
        ))}
      </div>

      <div className="flex border-b border-border">
        {(['all', 'in_progress', 'completed'] as const).map(f => {
          const labels = { all: `All (${courses.length})`, in_progress: `In Progress (${inProgressCount})`, completed: `Completed (${completedCount})` }
          return (
            <button key={f} onClick={() => setStatusFilter(f)}
              className={cn('flex-1 py-2 text-sm font-medium transition-colors border-b-2',
                statusFilter === f ? 'text-foreground border-primary' : 'text-muted-foreground border-transparent'
              )}
            >{labels[f]}</button>
          )
        })}
      </div>

      <div className="space-y-3">
        {filteredCourses.map(course => {
          const courseEpisodes = getCourseEpisodes(course)
          const doneCount = courseEpisodes.filter(e => e.completed).length
          return (
            <div key={course.id} onClick={() => {
              setAiRecommendation(null)
              setShowFeed(false)
              setActiveEpisodeId(null)
              setActiveGame(null)
              setActiveAssessment(null)
              setSelectedCourse(course)
            }}
              className={cn(
                'glass-card rounded-2xl p-4 flex gap-4 cursor-pointer hover:bg-secondary/30 transition-all active:scale-[0.99]',
                course.status === 'in_progress' && 'border-l-4 border-l-primary'
              )}
            >
              <div className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0">
                <img src={course.thumbnail || '/placeholder.svg'} alt={course.title} className="w-full h-full object-cover" />
                {course.status === 'completed' && (
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <Star className="w-3 h-3 text-primary-foreground fill-primary-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-primary truncate">{course.title}</h3>
                <p className="text-sm text-muted-foreground">{course.instructor.name}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium',
                    course.level === 'Beginner' && 'bg-green-500/20 text-green-600 dark:text-green-400',
                    course.level === 'Intermediate' && 'bg-primary/20 text-primary',
                    course.level === 'Advanced' && 'bg-destructive/20 text-destructive',
                  )}>{course.level}</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{course.totalDuration}</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><Play className="w-3 h-3" />{doneCount}/{courseEpisodes.length} ep</span>
                </div>
                <div className="flex items-center gap-1 mt-2">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-sm font-bold text-primary">+{course.xpReward} pts</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
