'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence, useMotionValue, type PanInfo } from 'framer-motion'
import type { Episode, Assessment, Course, MiniGame, Module } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  Heart, MessageCircle, Bookmark, Share2, Play, Pause,
  CheckCircle2, X, Zap, Flame, ChevronLeft, Target, Clock,
  BookOpen, Star, Award, BrainCircuit, Gamepad2, Layers3, Trophy, Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AssessmentComponent } from './assessment'
import { FruitNinjaGame } from './games/fruit-ninja-game'
import { CardFlipGame } from './games/card-flip-game'
import { SpeedMcqGame } from './games/speed-mcq-game'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type FeedItem =
  | { type: 'episode'; episode: Episode; index: number; episodeNumber: number; moduleEpisodeNumber: number; module?: Module }
  | { type: 'assessment'; assessment: Assessment; afterEpisode: Episode }
  | { type: 'game'; game: MiniGame; afterEpisode: Episode; module: Module }
  | { type: 'roleplay'; roleplay: NonNullable<Module['aiRoleplay']>; afterAssessment: Assessment; module: Module }
  | { type: 'reward'; module: Module; nextEpisodeId?: string }

interface EpisodeFeedProps {
  course: Course
  onClose: () => void
  onEpisodeComplete: (episode: Episode) => void
  onAssessmentComplete: (passed: boolean, score: number, assessment?: Assessment) => void
  onGameComplete?: (game: MiniGame, score: number, xpEarned: number) => void
  onGameShare?: (game: MiniGame, score: number, xpEarned: number) => void
  onAssessmentShare?: (assessment: Assessment, score: number) => void
  onModuleRewardShare?: (module: Module) => void
  onPracticeWithAI?: (scenario: string, id: string) => void
  completedEpisodes: Set<string>
  completedGames?: Set<string>
  completedAssessments?: Set<string>
  completedRoleplays?: Set<string>
  userStreak?: number
  userXP?: number
  initialEpisodeId?: string
  initialAssessmentId?: string
  initialRewardModuleId?: string
  disableAssessments?: boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// Build interleaved feed: episodes + assessments after every 2 episodes
// ─────────────────────────────────────────────────────────────────────────────
function getCourseEpisodes(course: Course) {
  return course.modules?.length ? course.modules.flatMap(module => module.episodes) : course.episodes
}

function buildJourneyFeedItems(course: Course): FeedItem[] {
  const items: FeedItem[] = []
  const modules = course.modules ?? []
  let episodeNumber = 0

  for (let moduleIndex = 0; moduleIndex < modules.length; moduleIndex++) {
    const module = modules[moduleIndex]

    for (let episodeIndex = 0; episodeIndex < module.episodes.length; episodeIndex++) {
      const episode = module.episodes[episodeIndex]
      episodeNumber += 1

      items.push({
        type: 'episode',
        episode,
        index: items.length,
        episodeNumber,
        moduleEpisodeNumber: episodeIndex + 1,
        module,
      })

      const gameSlot = module.miniGames.find(miniGame => miniGame.afterEpisodeIndex === episodeIndex)
      if (gameSlot) {
        items.push({
          type: 'game',
          game: gameSlot.game,
          afterEpisode: episode,
          module,
        })
      }
    }

    items.push({
      type: 'assessment',
      assessment: module.finalAssessment,
      afterEpisode: module.episodes[module.episodes.length - 1],
    })

    if (module.aiRoleplay) {
      items.push({
        type: 'roleplay',
        roleplay: module.aiRoleplay,
        afterAssessment: module.finalAssessment,
        module,
      })
    }

    items.push({
      type: 'reward',
      module,
      nextEpisodeId: modules[moduleIndex + 1]?.episodes[0]?.id,
    })
  }

  return items
}

function buildFeedItems(course: Course, disableAssessments = false): FeedItem[] {
  if (course.modules?.length) return buildJourneyFeedItems(course)

  const items: FeedItem[] = []
  const playable = course.episodes.filter(e => !e.locked)
  let episodesSinceAssessment = 0

  for (let i = 0; i < playable.length; i++) {
    const ep = playable[i]
    items.push({ type: 'episode', episode: ep, index: i, episodeNumber: i + 1, moduleEpisodeNumber: i + 1 })
    episodesSinceAssessment++

    if (disableAssessments) continue

    // Insert assessment after every 2 episodes if the episode has one,
    // or if we've gone 2 episodes and ANY of the past 2 had an assessment
    if (episodesSinceAssessment >= 2) {
      const assess = ep.assessment || playable[i - 1]?.assessment
      if (assess) {
        items.push({ type: 'assessment', assessment: assess, afterEpisode: ep })
        episodesSinceAssessment = 0
      }
    }
  }

  // If the last episode has an assessment but we haven't shown it
  const lastEp = playable[playable.length - 1]
  if (!disableAssessments && lastEp?.assessment && !items.find(it => it.type === 'assessment' && it.assessment.id === lastEp.assessment!.id)) {
    items.push({ type: 'assessment', assessment: lastEp.assessment, afterEpisode: lastEp })
  }

  return items
}

function isModuleComplete(
  module: Module,
  completedEpisodes: Set<string>,
  completedGames: Set<string>,
  completedAssessments: Set<string>,
  completedRoleplays: Set<string>,
) {
  const episodesDone = module.episodes.every(episode => episode.completed || completedEpisodes.has(episode.id))
  const gamesDone = module.miniGames.every(({ game }) => completedGames.has(game.id))
  const assessmentDone = completedAssessments.has(module.finalAssessment.id)
  const roleplayDone = !module.aiRoleplay || completedRoleplays.has(module.aiRoleplay.id)
  return episodesDone && gamesDone && assessmentDone && roleplayDone
}

function getGameTheme(game: MiniGame) {
  if (game.gameType === 'fruit-ninja') {
    return {
      bgClass: 'bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.42),_transparent_28%),linear-gradient(180deg,#022c22_0%,#03150f_55%,#000000_100%)]',
      buttonClass: 'from-emerald-400 to-lime-400 text-slate-950',
      pillClass: 'border-emerald-300/20 bg-emerald-400/15 text-emerald-100',
      title: 'Fruit Ninja Challenge',
      subtitle: 'Answers fly in like fruit. Slice the right one fast.',
      Icon: Sparkles,
    }
  }

  if (game.gameType === 'card-flip') {
    return {
      bgClass: 'bg-[radial-gradient(circle_at_top,_rgba(168,85,247,0.36),_transparent_30%),linear-gradient(180deg,#2e1065_0%,#0f0124_60%,#05010d_100%)]',
      buttonClass: 'from-fuchsia-400 to-violet-500 text-white',
      pillClass: 'border-fuchsia-300/20 bg-fuchsia-400/15 text-fuchsia-100',
      title: 'Card Flip Challenge',
      subtitle: 'Reveal cards, beat the timer, and keep your streak alive.',
      Icon: Layers3,
    }
  }

  return {
    bgClass: 'bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.3),_transparent_30%),radial-gradient(circle_at_bottom,_rgba(249,115,22,0.24),_transparent_34%),linear-gradient(180deg,#020617_0%,#09090b_45%,#0f172a_100%)]',
    buttonClass: 'from-orange-400 via-amber-300 to-cyan-300 text-slate-950',
    pillClass: 'border-cyan-300/20 bg-cyan-400/15 text-cyan-100',
    title: 'Speed Blitz',
    subtitle: 'Rapid-fire questions. Faster answers bank more XP.',
    Icon: Zap,
  }
}

function getRoleplayTheme() {
  return {
    bgClass: 'bg-[radial-gradient(circle_at_top,_rgba(244,114,182,0.26),_transparent_30%),radial-gradient(circle_at_bottom,_rgba(59,130,246,0.28),_transparent_36%),linear-gradient(180deg,#1e1b4b_0%,#0f172a_48%,#020617_100%)]',
    buttonClass: 'from-pink-400 via-fuchsia-500 to-indigo-500 text-white',
    pillClass: 'border-pink-300/25 bg-pink-400/15 text-pink-100',
  }
}

function getInitialFeedIndex(feedItems: FeedItem[], initialEpisodeId?: string, initialAssessmentId?: string) {
  if (initialAssessmentId) {
    const assessmentIndex = feedItems.findIndex(
      item => item.type === 'assessment' && item.assessment.id === initialAssessmentId,
    )

    if (assessmentIndex >= 0) return assessmentIndex
  }

  if (!initialEpisodeId) return 0

  const episodeIndex = feedItems.findIndex(
    item => item.type === 'episode' && item.episode.id === initialEpisodeId,
  )

  return episodeIndex >= 0 ? episodeIndex : 0
}

function getInitialRewardFeedIndex(feedItems: FeedItem[], initialRewardModuleId?: string) {
  if (!initialRewardModuleId) return -1

  return feedItems.findIndex(
    item => item.type === 'reward' && item.module.id === initialRewardModuleId,
  )
}

function getStartingFeedIndex(
  feedItems: FeedItem[],
  initialEpisodeId?: string,
  initialAssessmentId?: string,
  initialRewardModuleId?: string,
) {
  if (initialEpisodeId || initialAssessmentId) {
    return getInitialFeedIndex(feedItems, initialEpisodeId, initialAssessmentId)
  }

  const rewardIndex = getInitialRewardFeedIndex(feedItems, initialRewardModuleId)
  return rewardIndex >= 0 ? rewardIndex : getInitialFeedIndex(feedItems, initialEpisodeId, initialAssessmentId)
}

function getPreviousFeedIndex(feedItems: FeedItem[], currentIndex: number, currentItem?: FeedItem) {
  let nextIndex = currentIndex - 1

  while (nextIndex >= 0 && feedItems[nextIndex]?.type === 'reward' && currentItem?.type !== 'reward') {
    nextIndex -= 1
  }

  return Math.max(nextIndex, 0)
}

function getFeedLabel(item: FeedItem | undefined, totalEpisodes: number) {
  if (!item) return `Episode 1 / ${totalEpisodes}`
  if (item.type === 'episode') {
    if (item.module) {
      return `Episode ${item.moduleEpisodeNumber} / ${item.module.episodes.length}`
    }
  return `Episode ${item.episodeNumber} / ${totalEpisodes}`
  }
  if (item.type === 'game') return 'Challenge'
  if (item.type === 'assessment') return 'Checkpoint'
  if (item.type === 'roleplay') return 'AI Roleplay'
  return `Level ${item.module.level} Reward`
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Feed Component
// ─────────────────────────────────────────────────────────────────────────────
export function EpisodeFeed({
  course,
  onClose,
  onEpisodeComplete,
  onAssessmentComplete,
  onGameComplete,
  onGameShare,
  onAssessmentShare,
  onModuleRewardShare,
  onPracticeWithAI,
  completedEpisodes,
  completedGames,
  completedAssessments,
  completedRoleplays,
  userStreak = 7,
  userXP = 2450,
  initialEpisodeId,
  initialAssessmentId,
  initialRewardModuleId,
  disableAssessments = false,
}: EpisodeFeedProps) {
  const feedItems = useMemo(() => buildFeedItems(course, disableAssessments), [course, disableAssessments])
  const courseEpisodes = useMemo(() => getCourseEpisodes(course), [course])
  const completedGameSet = completedGames ?? new Set<string>()
  const completedAssessmentSet = completedAssessments ?? new Set<string>()
  const completedRoleplaySet = completedRoleplays ?? new Set<string>()
  const [currentIndex, setCurrentIndex] = useState(() => {
    return getStartingFeedIndex(feedItems, initialEpisodeId, initialAssessmentId, initialRewardModuleId)
  })
  const [isPlaying, setIsPlaying] = useState(true)
  const [likedEps, setLikedEps] = useState<Set<string>>(new Set())
  const [savedEps, setSavedEps] = useState<Set<string>>(new Set())
  const [showHeartAnim, setShowHeartAnim] = useState(false)
  const [progress, setProgress] = useState(0)
  const [showAssessmentModal, setShowAssessmentModal] = useState(false)
  const [activeGame, setActiveGame] = useState<MiniGame | null>(null)
  const [playbackFeedback, setPlaybackFeedback] = useState<'play' | 'pause' | null>(null)
  const completedEpisodeRef = useRef<Set<string>>(new Set())
  const assessmentOutcomeRef = useRef<{ passed: boolean; score: number; assessmentId: string } | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const y = useMotionValue(0)
  const wheelAccum = useRef(0)
  const wheelLock = useRef(0)

  const currentItem = feedItems[currentIndex]

  useEffect(() => {
    setCurrentIndex(getStartingFeedIndex(feedItems, initialEpisodeId, initialAssessmentId, initialRewardModuleId))
  }, [initialAssessmentId, initialEpisodeId, initialRewardModuleId, feedItems])

  useEffect(() => {
    completedEpisodeRef.current = new Set(completedEpisodes)
  }, [completedEpisodes])

  const isFeedItemCompleted = useCallback((item: FeedItem | undefined) => {
    if (!item) return false

    if (item.type === 'episode') {
      return item.episode.completed || completedEpisodes.has(item.episode.id) || progress >= 100
    }

    if (item.type === 'game') {
      return completedGameSet.has(item.game.id)
    }

    if (item.type === 'assessment') {
      return completedAssessmentSet.has(item.assessment.id)
    }

    if (item.type === 'roleplay') {
      return completedRoleplaySet.has(item.roleplay.id)
    }

    return true
  }, [completedAssessmentSet, completedEpisodes, completedGameSet, completedRoleplaySet, progress])

  // ── Navigation ────────────
  const goNext = useCallback(() => {
    if (!currentItem) return

    if (currentItem.type === 'episode' && !isFeedItemCompleted(currentItem)) {
      setIsPlaying(true)
      return
    }

    if (currentItem.type === 'game' && !completedGameSet.has(currentItem.game.id)) {
      setActiveGame(currentItem.game)
      return
    }

    if (currentItem.type === 'assessment' && !completedAssessmentSet.has(currentItem.assessment.id)) {
      setShowAssessmentModal(true)
      return
    }

    if (currentItem.type === 'roleplay' && !completedRoleplaySet.has(currentItem.roleplay.id)) {
      return
    }

    setCurrentIndex(prev => Math.min(prev + 1, feedItems.length - 1))
    y.set(0)
  }, [completedAssessmentSet, completedGameSet, completedRoleplaySet, currentItem, feedItems.length, isFeedItemCompleted, y])

  const goPrev = useCallback(() => {
    setCurrentIndex(prev => getPreviousFeedIndex(feedItems, prev, feedItems[prev]))
    y.set(0)
  }, [feedItems, y])

  // Wheel handler (trackpad/scroll)
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (showAssessmentModal || activeGame) return
    const now = Date.now()
    if (now < wheelLock.current) return
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return
    wheelAccum.current += e.deltaY
    if (Math.abs(wheelAccum.current) < 42) return
    e.preventDefault()
    const dy = wheelAccum.current
    wheelAccum.current = 0
    wheelLock.current = now + 420
    if (dy > 0) goNext()
    else goPrev()
  }, [activeGame, goNext, goPrev, showAssessmentModal])

  // Key handler
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (showAssessmentModal || activeGame) return
    if (e.key === 'ArrowDown' || e.key === 'PageDown') { e.preventDefault(); goNext() }
    if (e.key === 'ArrowUp' || e.key === 'PageUp') { e.preventDefault(); goPrev() }
    if (e.key === 'Escape') onClose()
  }, [activeGame, goNext, goPrev, onClose, showAssessmentModal])

  // Drag end (touch swipe)
  const handleDragEnd = useCallback((_: any, info: PanInfo) => {
    if (showAssessmentModal || activeGame) return
    const wantsNext = info.offset.y < -88 || (info.offset.y < 0 && info.velocity.y < -0.45)
    const wantsPrev = info.offset.y > 88 || (info.offset.y > 0 && info.velocity.y > 0.45)

    if (wantsNext && currentIndex < feedItems.length - 1) goNext()
    else if (wantsPrev && currentIndex > 0) goPrev()
    else y.set(0)
  }, [activeGame, currentIndex, feedItems.length, goNext, goPrev, y, showAssessmentModal])

  // Focus on mount
  useEffect(() => { containerRef.current?.focus() }, [])

  // Reset progress when item changes
  useEffect(() => {
    assessmentOutcomeRef.current = null

    if (currentItem?.type === 'episode' && (currentItem.episode.completed || completedEpisodes.has(currentItem.episode.id))) {
      setProgress(100)
      setIsPlaying(false)
      return
    }

    setProgress(0)
    setIsPlaying(true)
  }, [completedEpisodes, currentItem, currentIndex])

  // Progress timer for episodes
  useEffect(() => {
    if (currentItem?.type !== 'episode' || !isPlaying) return
    const interval = setInterval(() => setProgress(p => p >= 100 ? (clearInterval(interval), 100) : p + 0.8), 100)
    return () => clearInterval(interval)
  }, [isPlaying, currentIndex, currentItem?.type])

  // Auto-complete episode when progress hits 100
  useEffect(() => {
    if (progress >= 100 && currentItem?.type === 'episode' && !completedEpisodeRef.current.has(currentItem.episode.id)) {
      completedEpisodeRef.current.add(currentItem.episode.id)
      onEpisodeComplete(currentItem.episode)
      const timeout = window.setTimeout(() => goNext(), 650)
      return () => window.clearTimeout(timeout)
    }
  }, [goNext, progress, currentItem, onEpisodeComplete])

  // When reaching an assessment card, show modal
  useEffect(() => {
    if (currentItem?.type === 'assessment') {
      setShowAssessmentModal(true)
    } else {
      setShowAssessmentModal(false)
    }
  }, [currentItem])

  const handleDoubleTap = useCallback(() => {
    if (currentItem?.type !== 'episode') return
    const id = currentItem.episode.id
    if (!likedEps.has(id)) {
      setLikedEps(prev => new Set(prev).add(id))
      setShowHeartAnim(true)
      setTimeout(() => setShowHeartAnim(false), 800)
    }
  }, [currentItem, likedEps])

  const toggleLike = useCallback(() => {
    if (currentItem?.type !== 'episode') return
    const id = currentItem.episode.id
    setLikedEps(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })
  }, [currentItem])

  const toggleSave = useCallback(() => {
    if (currentItem?.type !== 'episode') return
    const id = currentItem.episode.id
    setSavedEps(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })
  }, [currentItem])

  const togglePlayback = useCallback(() => {
    if (currentItem?.type !== 'episode') return

    setIsPlaying(prev => {
      const next = !prev
      setPlaybackFeedback(next ? 'play' : 'pause')
      window.setTimeout(() => setPlaybackFeedback(null), 650)
      return next
    })
  }, [currentItem])

  const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : n.toString()

  const handleGameFinish = useCallback((score: number, xpEarned: number) => {
    if (!activeGame) return
    onGameComplete?.(activeGame, score, xpEarned)
    setActiveGame(null)
    window.setTimeout(() => goNext(), 200)
  }, [activeGame, goNext, onGameComplete])

  const renderGame = () => {
    if (!activeGame) return null

    const sharedProps = {
      game: activeGame,
      onClose: () => setActiveGame(null),
      onComplete: handleGameFinish,
      onShareScore: (score: number, xpEarned: number) => onGameShare?.(activeGame, score, xpEarned),
    }

    if (activeGame.gameType === 'fruit-ninja') return <FruitNinjaGame {...sharedProps} />
    if (activeGame.gameType === 'card-flip') return <CardFlipGame {...sharedProps} />
    return <SpeedMcqGame {...sharedProps} />
  }

  // ── Assessment card intercept ──
  if (showAssessmentModal && currentItem?.type === 'assessment') {
    return (
      <div className="fixed inset-0 z-[70] bg-black">
        <AssessmentComponent
          assessment={currentItem.assessment}
          onComplete={(passed, score) => {
            assessmentOutcomeRef.current = { passed, score, assessmentId: currentItem.assessment.id }
            onAssessmentComplete(passed, score, currentItem.assessment)
          }}
          onShareResult={({ score }) => onAssessmentShare?.(currentItem.assessment, score)}
          onClose={() => {
            setShowAssessmentModal(false)
            if (
              assessmentOutcomeRef.current?.assessmentId === currentItem.assessment.id &&
              assessmentOutcomeRef.current.passed
            ) {
              goNext()
              return
            }

            goPrev()
          }}
        />
      </div>
    )
  }

  // ── Main Reels View ──
  const ep = currentItem?.type === 'episode' ? currentItem.episode : null
  const gameItem = currentItem?.type === 'game' ? currentItem : null
  const roleplayItem = currentItem?.type === 'roleplay' ? currentItem : null
  const rewardItem = currentItem?.type === 'reward' ? currentItem : null
  const isCompleted = ep ? completedEpisodes.has(ep.id) || progress >= 100 : false
  const totalEpisodeCount = courseEpisodes.length
  const isGameCompleted = gameItem ? completedGameSet.has(gameItem.game.id) : false
  const isRoleplayCompleted = roleplayItem ? completedRoleplaySet.has(roleplayItem.roleplay.id) : false
  const moduleRewardUnlocked = rewardItem
    ? isModuleComplete(rewardItem.module, completedEpisodes, completedGameSet, completedAssessmentSet, completedRoleplaySet)
    : false

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onWheelCapture={handleWheel}
      className="fixed inset-0 z-[60] bg-black overflow-hidden overscroll-none outline-none"
    >
      {renderGame()}

      {/* Video / Background */}
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        style={{ y }}
        className="absolute inset-0"
        onDoubleClick={handleDoubleTap}
        onPointerDown={() => containerRef.current?.focus()}
        onClick={(event) => {
          const target = event.target as HTMLElement
          if (!ep || target.closest('button')) return
          togglePlayback()
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0"
          >
            {ep && (
              <>
                <img
                  src={ep.thumbnail || course.thumbnail || '/placeholder.svg'}
                  alt={ep.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />
              </>
            )}
            {gameItem && (
              <div className={cn('absolute inset-0', getGameTheme(gameItem.game).bgClass)}>
                <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.12)_1px,transparent_0)] [background-size:26px_26px]" />
              </div>
            )}
            {roleplayItem && (
              <div className={cn('absolute inset-0', getRoleplayTheme().bgClass)}>
                <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.14)_1px,transparent_0)] [background-size:28px_28px]" />
                <div className="absolute -left-12 top-24 h-44 w-44 rounded-full bg-pink-400/20 blur-3xl" />
                <div className="absolute -right-10 bottom-14 h-48 w-48 rounded-full bg-sky-400/18 blur-3xl" />
              </div>
            )}
	            {rewardItem && (
	              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.28),_transparent_30%),radial-gradient(circle_at_bottom,_rgba(249,115,22,0.18),_transparent_36%),linear-gradient(180deg,#eff6ff_0%,#f8fafc_35%,#fefce8_100%)] dark:bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.22),_transparent_26%),radial-gradient(circle_at_bottom,_rgba(245,158,11,0.14),_transparent_34%),linear-gradient(180deg,#030712_0%,#0f172a_52%,#111827_100%)]">
	                <div className="absolute -left-14 top-16 h-48 w-48 rounded-full bg-cyan-200/40 blur-3xl dark:bg-cyan-400/10" />
	                <div className="absolute -right-10 bottom-10 h-52 w-52 rounded-full bg-amber-200/40 blur-3xl dark:bg-amber-400/10" />
	              </div>
	            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Double-tap Heart */}
      <AnimatePresence>
        {showHeartAnim && (
          <motion.div
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 1.5, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
          >
            <Heart className="w-24 h-24 text-red-500 fill-red-500" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <div className="absolute top-0 inset-x-0 z-20 pt-12 px-4">
		        <div className="flex items-center justify-between">
		          <div className="flex items-center gap-3">
		            <button
		              onClick={onClose}
		              className={cn(
		                'p-2 rounded-full bg-black/40 backdrop-blur-sm',
		                rewardItem && 'border border-white/14 bg-white/10 shadow-[0_16px_36px_rgba(15,23,42,0.18)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.08] dark:shadow-[0_18px_40px_rgba(0,0,0,0.32)]',
		              )}
		            >
		              <ChevronLeft className="w-5 h-5 text-white" />
		            </button>
		            <div className={cn(
		              rewardItem && 'rounded-[1.35rem] border border-white/18 bg-white/10 px-4 py-2.5 shadow-[0_18px_40px_rgba(15,23,42,0.14)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/45 dark:shadow-[0_18px_40px_rgba(0,0,0,0.34)]',
		            )}>
		              <span className="text-sm font-semibold text-white">{course.title}</span>
		              <p className="text-[10px] text-white/70">{course.instructor.name}</p>
		            </div>
		          </div>
	          <div className="flex items-center gap-2">
	            <div className={cn(
	              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-black/40 backdrop-blur-sm',
	              rewardItem && 'rounded-[1.2rem] border border-white/16 bg-white/10 px-3.5 py-2 shadow-[0_16px_36px_rgba(15,23,42,0.14)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.08] dark:shadow-[0_18px_36px_rgba(0,0,0,0.3)]',
	            )}>
	              <Flame className="w-4 h-4 text-orange-500" />
	              <span className="text-sm font-semibold text-white">{userStreak}</span>
	            </div>
	            <div className={cn(
	              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-black/40 backdrop-blur-sm',
	              rewardItem && 'rounded-[1.2rem] border border-white/16 bg-white/10 px-3.5 py-2 shadow-[0_16px_36px_rgba(15,23,42,0.14)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.08] dark:shadow-[0_18px_36px_rgba(0,0,0,0.3)]',
	            )}>
	              <Zap className="w-3.5 h-3.5 text-primary" />
	              <span className="text-sm font-semibold text-white">{userXP.toLocaleString()} XP</span>
	            </div>
	          </div>
	        </div>

        {/* Episode Counter Pill */}
        <div className="mt-3 flex justify-center">
          <div className="px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-sm font-medium text-white">
            {getFeedLabel(currentItem, totalEpisodeCount)}
          </div>
        </div>
      </div>

      {/* ── Right Sidebar Actions ── */}
      {ep && (
        <div className="absolute right-3 bottom-44 z-30 flex flex-col items-center gap-5">
          <motion.button whileTap={{ scale: 0.9 }} onClick={toggleLike} className="flex flex-col items-center gap-1">
            <Heart className={cn('w-7 h-7 drop-shadow-lg', likedEps.has(ep.id) ? 'text-red-500 fill-red-500' : 'text-white')} />
            <span className="text-xs font-semibold text-white drop-shadow-lg">{fmt(ep.xp)}</span>
          </motion.button>

          <motion.button whileTap={{ scale: 0.9 }} className="flex flex-col items-center gap-1">
            <MessageCircle className="w-7 h-7 text-white drop-shadow-lg" />
            <span className="text-xs font-semibold text-white drop-shadow-lg">Chat</span>
          </motion.button>

          <motion.button whileTap={{ scale: 0.9 }} onClick={toggleSave} className="flex flex-col items-center gap-1">
            <Bookmark className={cn('w-7 h-7 drop-shadow-lg', savedEps.has(ep.id) ? 'text-primary fill-primary' : 'text-white')} />
          </motion.button>

          <motion.button whileTap={{ scale: 0.9 }} className="flex flex-col items-center gap-1">
            <Share2 className="w-7 h-7 text-white drop-shadow-lg" />
          </motion.button>

          {isCompleted && (
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center"
            >
              <CheckCircle2 className="w-5 h-5 text-white" />
            </motion.div>
          )}
        </div>
      )}

      {/* ── Reel Indicators (right edge) ── */}
      <div className="absolute right-1.5 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-1.5">
        {feedItems.map((item, idx) => (
          <div
            key={idx}
            className={cn(
              'w-1 rounded-full transition-all duration-300',
              idx === currentIndex ? 'h-6 bg-white' : 'h-2',
              item.type === 'assessment' ? 'bg-accent/60' : 'bg-white/40',
            )}
          />
        ))}
      </div>

      {/* ── Bottom Content Info ── */}
      {ep && (
        <div className="absolute bottom-20 inset-x-0 z-20 px-4">
          <div className="flex items-center gap-2 mb-1">
            <img
              src={course.instructor.avatar || '/placeholder.svg'}
              alt={course.instructor.name}
              className="w-8 h-8 rounded-full border border-white/30"
            />
            <span className="text-sm font-semibold text-white drop-shadow-lg">{course.instructor.name}</span>
            {course.instructor.verified && (
              <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                <span className="text-[10px] text-white">✓</span>
              </div>
            )}
          </div>

          <h2 className="text-xl font-bold text-white mb-1 drop-shadow-lg">{ep.title}</h2>
          <p className="text-sm text-white/80 mb-3 line-clamp-2 drop-shadow-lg">{ep.description}</p>

          <div className="flex gap-2 mb-3 flex-wrap">
            {currentItem?.type === 'episode' && currentItem.module && (
              <span className="px-2.5 py-1 text-xs font-medium text-white/90 bg-white/10 rounded-full backdrop-blur-sm">
                Module {currentItem.module.level}
              </span>
            )}
            <span className="px-2.5 py-1 text-xs font-medium text-white/90 bg-white/10 rounded-full backdrop-blur-sm">
              #{course.category}
            </span>
            <span className="px-2.5 py-1 text-xs font-medium text-white/90 bg-white/10 rounded-full backdrop-blur-sm flex items-center gap-1">
              <Clock className="w-3 h-3" />{ep.duration}
            </span>
            <span className="px-2.5 py-1 text-xs font-medium bg-primary/30 text-primary rounded-full backdrop-blur-sm flex items-center gap-1">
              <Zap className="w-3 h-3" />+{ep.xp} XP
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>

        </div>
      )}

	      {gameItem && (() => {
        const theme = getGameTheme(gameItem.game)
        const ThemeIcon = theme.Icon

        return (
          <div className="absolute inset-x-0 bottom-16 z-20 px-4">
            <div className="mx-auto max-w-md rounded-[2rem] border border-white/10 bg-white/8 p-6 text-white shadow-[0_30px_100px_rgba(0,0,0,0.35)] backdrop-blur-xl">
              <div className={cn('inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]', theme.pillClass)}>
                <Gamepad2 className="w-3.5 h-3.5" />
                Challenge Ahead
              </div>

              <div className="mt-4 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-black leading-tight">{theme.title}</h2>
                  <p className="mt-2 text-sm text-white/75">{theme.subtitle}</p>
                </div>
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/10">
                  <ThemeIcon className="w-8 h-8" />
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-[10px] uppercase tracking-[0.25em] text-white/45">Questions</p>
                  <p className="mt-2 text-3xl font-black">{gameItem.game.questions.length}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-[10px] uppercase tracking-[0.25em] text-white/45">Reward</p>
                  <p className="mt-2 text-3xl font-black text-lime-300">+{gameItem.game.xpReward}</p>
                </div>
              </div>

              <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-black/20 p-4 flex items-center gap-3">
                <div className="relative h-14 w-14 overflow-hidden rounded-2xl">
                  <img
                    src={gameItem.afterEpisode.thumbnail || course.thumbnail || '/placeholder.svg'}
                    alt={gameItem.afterEpisode.title}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/25" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">After {gameItem.afterEpisode.title}</p>
                  <p className="mt-1 truncate text-sm text-white/75">Warm-up is done. Turn the lesson into action.</p>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <Button
                  className={cn('flex-1 rounded-full bg-gradient-to-r font-bold shadow-lg hover:opacity-95', theme.buttonClass)}
                  onClick={() => setActiveGame(gameItem.game)}
                >
                  {isGameCompleted ? 'Replay Challenge' : 'Start Game'}
                </Button>
	                <Button
	                  size="sm"
	                  variant="outline"
	                  className="rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10"
	                  onClick={goNext}
	                >
	                  {isGameCompleted ? 'Continue' : 'Play to Continue'}
	                </Button>
	              </div>
	            </div>
	          </div>
        )
	      })()}

		      {roleplayItem && (() => {
		        const theme = getRoleplayTheme()

		        return (
		          <div className="absolute inset-x-0 bottom-10 z-20 px-4">
		            <div className="mx-auto max-w-md rounded-[2rem] border border-white/10 bg-white/8 p-6 text-white shadow-[0_30px_100px_rgba(0,0,0,0.35)] backdrop-blur-xl">
	              <div className={cn('inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]', theme.pillClass)}>
	                <BrainCircuit className="w-3.5 h-3.5" />
	                AI Roleplay Ahead
	              </div>

	              <div className="mt-4 flex items-start justify-between gap-4">
	                <div>
	                  <h2 className="text-3xl font-black leading-tight">{roleplayItem.roleplay.title}</h2>
	                  <p className="mt-2 text-sm text-white/75">Step into a guided simulation so the learner knows the exact conversation they are about to practice.</p>
	                </div>
		                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/10">
		                  <Sparkles className="w-8 h-8" />
		                </div>
		              </div>

		              <div className="mt-5 grid grid-cols-2 gap-3">
		                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
		                  <p className="text-[10px] uppercase tracking-[0.25em] text-white/45">Scenario</p>
		                  <p className="mt-2 line-clamp-4 text-sm font-semibold leading-7 text-white/95">{roleplayItem.roleplay.scenario}</p>
		                </div>
		                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
		                  <p className="text-[10px] uppercase tracking-[0.25em] text-white/45">Reward</p>
		                  <p className="mt-2 text-3xl font-black text-pink-200">+{roleplayItem.roleplay.xpReward}</p>
		                </div>
		              </div>

		              <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
		                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">What to expect</p>
		                <p className="mt-2 text-sm leading-6 text-white/80">
		                  You will roleplay this exact scenario with AI Coach, get real-time conversational practice, and then return to the journey ready for the next unlock.
		                </p>
		              </div>

		              <div className="mt-5 flex gap-3">
		                <Button
		                  className={cn('flex-1 rounded-full bg-gradient-to-r font-bold shadow-lg hover:opacity-95', theme.buttonClass)}
		                  onClick={() => onPracticeWithAI?.(roleplayItem.roleplay.scenario, roleplayItem.roleplay.id)}
		                >
		                  {isRoleplayCompleted ? 'Open Roleplay Again' : 'Start Roleplay'}
		                </Button>
		                <Button
		                  size="sm"
		                  variant="outline"
		                  className="rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10"
		                  onClick={onClose}
		                >
		                  Go Back
		                </Button>
		              </div>
		            </div>
		          </div>
	        )
	      })()}

	      {rewardItem && (
	        <div className="absolute inset-x-0 bottom-14 z-20 px-4">
	          <div className="mx-auto max-w-lg rounded-[2.2rem] border border-white/80 bg-white/82 p-6 shadow-[0_30px_100px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(2,6,23,0.94)_0%,rgba(15,23,42,0.92)_55%,rgba(17,24,39,0.94)_100%)] dark:shadow-[0_30px_100px_rgba(0,0,0,0.42)]">
	            <div className="flex items-start justify-between gap-4">
	              <div>
	                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:border dark:border-emerald-300/15 dark:bg-emerald-400/12 dark:text-emerald-200">
	                  <Award className="w-3.5 h-3.5" />
	                  Module Reward
	                </div>
	                <h2 className="mt-4 text-3xl font-black text-slate-950 dark:text-white">
	                  {moduleRewardUnlocked
	                    ? `Module ${rewardItem.module.level} complete`
	                    : `Module ${rewardItem.module.level} checkpoint`}
	                </h2>
	                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
	                  {moduleRewardUnlocked
	                    ? `You cleared ${rewardItem.module.title} and unlocked a badge for this level.`
	                    : `You reached the end of ${rewardItem.module.title}. Complete the challenge to fully lock this level in.`}
	                </p>
	              </div>
	
	              <div className="relative flex h-20 w-20 items-center justify-center rounded-[2rem] bg-gradient-to-br from-amber-300 to-orange-400 text-white shadow-[0_16px_30px_rgba(249,115,22,0.28)] dark:shadow-[0_18px_32px_rgba(249,115,22,0.22)]">
	                <Trophy className="w-10 h-10" />
	                <div className="absolute -bottom-2 rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-700 shadow-sm dark:border dark:border-white/10 dark:bg-slate-950 dark:text-slate-100">
	                  Badge
	                </div>
	              </div>
	            </div>
	
	            <div className="mt-8 rounded-[1.75rem] border border-slate-200 bg-slate-950 px-5 py-5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] dark:border-cyan-300/10 dark:bg-[linear-gradient(180deg,rgba(2,6,23,0.98)_0%,rgba(3,7,18,0.98)_100%)]">
	              <div className="flex items-center justify-between gap-4">
	                <div>
	                  <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-cyan-300/80">Unlocked Badge</p>
	                  <p className="mt-2 text-2xl font-black">{rewardItem.module.title} Finisher</p>
	                  <p className="mt-1 text-sm text-slate-300 dark:text-slate-400">Level {rewardItem.module.level} progress stamped to your profile.</p>
	                </div>
	                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/10 dark:bg-cyan-400/10">
	                  <Sparkles className="w-8 h-8 text-cyan-300" />
	                </div>
	              </div>
	            </div>
	
		            <div className="mt-6 space-y-3">
		              <Button
		                className="w-full rounded-full bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-600 font-bold text-white shadow-[0_14px_30px_rgba(37,99,235,0.28)] hover:opacity-95 dark:from-cyan-400 dark:via-sky-500 dark:to-blue-700"
		                onClick={goNext}
		              >
		                {rewardItem.nextEpisodeId ? 'Continue to Next Module' : 'Finish Course Journey'}
		              </Button>

		              <div className="grid gap-3 sm:grid-cols-2">
		                {moduleRewardUnlocked && onModuleRewardShare && (
		                  <Button
		                    className="rounded-full border border-white/14 bg-[linear-gradient(180deg,rgba(255,255,255,0.2)_0%,rgba(255,255,255,0.08)_100%)] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_10px_24px_rgba(15,23,42,0.16)] backdrop-blur-xl transition hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.24)_0%,rgba(255,255,255,0.1)_100%)] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.04)_100%)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_10px_24px_rgba(0,0,0,0.22)] dark:hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.1)_0%,rgba(255,255,255,0.05)_100%)]"
		                    onClick={() => onModuleRewardShare(rewardItem.module)}
		                  >
		                    <Share2 className="mr-2 w-4 h-4" />
		                    Share Reward
		                  </Button>
		                )}
		                {onPracticeWithAI && rewardItem.module.aiRoleplay && (
		                  <Button
		                    className="rounded-full border border-cyan-300/18 bg-[linear-gradient(180deg,rgba(34,211,238,0.22)_0%,rgba(59,130,246,0.16)_100%)] font-medium text-cyan-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_10px_24px_rgba(8,47,73,0.16)] backdrop-blur-xl transition hover:bg-[linear-gradient(180deg,rgba(34,211,238,0.26)_0%,rgba(59,130,246,0.18)_100%)] dark:border-cyan-300/16 dark:bg-[linear-gradient(180deg,rgba(8,47,73,0.5)_0%,rgba(12,74,110,0.34)_100%)] dark:text-cyan-50 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_10px_24px_rgba(0,0,0,0.22)] dark:hover:bg-[linear-gradient(180deg,rgba(8,47,73,0.58)_0%,rgba(12,74,110,0.4)_100%)]"
		                    onClick={() => {
		                      if (rewardItem?.module.aiRoleplay) {
		                        onPracticeWithAI(rewardItem.module.aiRoleplay.scenario, rewardItem.module.aiRoleplay.id)
		                      }
		                    }}
		                  >
		                    <BrainCircuit className="mr-2 w-4 h-4" />
		                    Practice with AI Coach
		                  </Button>
		                )}
		              </div>
		            </div>
          </div>
        </div>
      )}

      {/* Playback indicator */}
      <AnimatePresence>
        {playbackFeedback && ep && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
          >
            <div className="p-6 rounded-full bg-black/40 backdrop-blur-sm">
              {playbackFeedback === 'play'
                ? <Play className="w-12 h-12 text-white fill-white" />
                : <Pause className="w-12 h-12 text-white" />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Swipe Hint */}
      {currentIndex === 0 && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}
          className="absolute bottom-8 inset-x-0 z-20 flex justify-center"
        >
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-xs text-white/60 flex flex-col items-center gap-1"
          >
            <span>Swipe up for next</span>
            <div className="w-4 h-1 bg-white/30 rounded-full" />
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
