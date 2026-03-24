'use client'

import { motion } from 'framer-motion'
import type { Course, Module, Episode, MiniGame, Assessment } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  Award,
  BookOpen,
  Check,
  Gamepad2,
  Lock,
  Play,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from 'lucide-react'
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

type JourneyNode =
  | { type: 'episode'; episode: Episode; moduleIndex: number; epIndex: number }
  | { type: 'game'; game: MiniGame; moduleIndex: number }
  | { type: 'assessment'; assessment: Assessment; moduleIndex: number }
  | { type: 'ai-roleplay'; id: string; scenario: string; title: string; xpReward: number; moduleIndex: number }
  | { type: 'module-header'; module: Module; moduleIndex: number }
  | { type: 'module-complete'; module: Module; moduleIndex: number }
  | { type: 'certificate' }

type PositionedNode = {
  node: Exclude<JourneyNode, { type: 'module-header' }>
  x: number
  y: number
  layoutIndex: number
}

type PositionedHeader = {
  node: Extract<JourneyNode, { type: 'module-header' }>
  y: number
}

interface JourneyPathProps {
  course: Course
  completedEpisodes: Set<string>
  completedGames: Set<string>
  completedAssessments: Set<string>
  completedRoleplays?: Set<string>
  onPlayEpisode: (episode: Episode) => void
  onPlayGame: (game: MiniGame) => void
  onPlayAssessment: (assessment: Assessment) => void
  onPracticeWithAI?: (scenario: string, id: string) => void
}

const ACTIONABLE_X_PATTERN = [50, 28, 66, 38, 60, 44]
const SVG_WIDTH = 1000
const MODULE_HEADER_TOP_GAP = 108
const MODULE_HEADER_HEIGHT = 148
const ASSESSMENT_GAP = 208
const ASSESSMENT_TO_REWARD_GAP = 236
const MODULE_COMPLETE_GAP = 132
const MODULE_COMPLETE_TO_CERTIFICATE_GAP = 210

function buildJourneyNodes(course: Course): JourneyNode[] {
  const modules = course.modules
  if (!modules?.length) return []

  const nodes: JourneyNode[] = []

  for (let moduleIndex = 0; moduleIndex < modules.length; moduleIndex++) {
    const module = modules[moduleIndex]
    nodes.push({ type: 'module-header', module, moduleIndex })

    for (let episodeIndex = 0; episodeIndex < module.episodes.length; episodeIndex++) {
      nodes.push({
        type: 'episode',
        episode: module.episodes[episodeIndex],
        moduleIndex,
        epIndex: episodeIndex,
      })

      const gameSlot = module.miniGames.find(miniGame => miniGame.afterEpisodeIndex === episodeIndex)
      if (gameSlot) {
        nodes.push({ type: 'game', game: gameSlot.game, moduleIndex })
      }
    }

    nodes.push({ type: 'assessment', assessment: module.finalAssessment, moduleIndex })
    
    if (module.aiRoleplay) {
      nodes.push({
        type: 'ai-roleplay',
        id: module.aiRoleplay.id,
        scenario: module.aiRoleplay.scenario,
        title: module.aiRoleplay.title,
        xpReward: module.aiRoleplay.xpReward,
        moduleIndex,
      })
    }

    nodes.push({ type: 'module-complete', module, moduleIndex })
  }

  nodes.push({ type: 'certificate' })
  return nodes
}

function isNodeUnlocked(
  node: JourneyNode,
  allNodes: JourneyNode[],
  completedEpisodes: Set<string>,
  completedGames: Set<string>,
  completedAssessments: Set<string>,
  completedRoleplays: Set<string>,
) {
  if (node.type === 'module-header' || node.type === 'module-complete' || node.type === 'certificate') return true

  const actionables = allNodes.filter(
    item => item.type === 'episode' || item.type === 'game' || item.type === 'assessment',
  )

  if (actionables[0] === node) return true

    for (const item of allNodes) {
      if (item === node) break

      if (item.type === 'episode' && !item.episode.completed && !completedEpisodes.has(item.episode.id)) return false
      if (item.type === 'game' && !completedGames.has(item.game.id)) return false
      if (item.type === 'assessment' && !completedAssessments.has(item.assessment.id)) return false
      if (item.type === 'ai-roleplay' && !completedRoleplays.has(item.id)) return false
    }

  return true
}

function isNodeCompleted(
  node: JourneyNode,
  completedEpisodes: Set<string>,
  completedGames: Set<string>,
  completedAssessments: Set<string>,
  completedRoleplays?: Set<string>,
) {
  if (node.type === 'episode') return node.episode.completed || completedEpisodes.has(node.episode.id)
  if (node.type === 'game') return completedGames.has(node.game.id)
  if (node.type === 'assessment') return completedAssessments.has(node.assessment.id)
  if (node.type === 'ai-roleplay') return completedRoleplays?.has(node.id) ?? false
  return false
}

function isModuleCompleted(
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

function isCourseCompleted(
  course: Course,
  completedEpisodes: Set<string>,
  completedGames: Set<string>,
  completedAssessments: Set<string>,
  completedRoleplays: Set<string>,
) {
  if (!course.modules?.length) return course.status === 'completed'

  return course.modules.every(module =>
    isModuleCompleted(module, completedEpisodes, completedGames, completedAssessments, completedRoleplays),
  )
}

function layoutJourney(nodes: JourneyNode[]) {
  const headers: PositionedHeader[] = []
  const positionedNodes: PositionedNode[] = []

  let actionIndex = 0
  let moduleActionIndex = 0
  let currentY = 24

  nodes.forEach((node, index) => {
    if (node.type === 'module-header') {
      moduleActionIndex = 0
      currentY += positionedNodes.length === 0 ? 8 : MODULE_HEADER_TOP_GAP
      headers.push({
        node,
        y: currentY,
      })
      currentY += MODULE_HEADER_HEIGHT
      return
    }

    let x = ACTIONABLE_X_PATTERN[moduleActionIndex % ACTIONABLE_X_PATTERN.length]

    if (node.type === 'module-complete' || node.type === 'certificate') {
      x = 50
    }

    positionedNodes.push({
      node,
      x,
      y: currentY,
      layoutIndex: actionIndex,
    })

    if (node.type === 'module-complete') {
      const nextNode = nodes[index + 1]
      currentY += nextNode?.type === 'certificate'
        ? MODULE_COMPLETE_TO_CERTIFICATE_GAP
        : MODULE_COMPLETE_GAP
    } else if (node.type === 'certificate') {
      currentY += 248
    } else if (node.type === 'assessment') {
      const nextNode = nodes[index + 1]
      currentY += nextNode?.type === 'module-complete'
        ? ASSESSMENT_TO_REWARD_GAP
        : ASSESSMENT_GAP
    } else if (node.type === 'ai-roleplay') {
      currentY += ASSESSMENT_TO_REWARD_GAP
    } else {
      currentY += 156
    }

    actionIndex += 1
    moduleActionIndex += 1
  })

  return {
    headers,
    positionedNodes,
    totalHeight: currentY + 56,
  }
}

function toSvgX(xPercent: number) {
  return (xPercent / 100) * SVG_WIDTH
}

function buildSegmentPath(from: PositionedNode, to: PositionedNode) {
  const startX = toSvgX(from.x)
  const endX = toSvgX(to.x)
  const midY = (from.y + to.y) / 2

  return `M ${startX} ${from.y} C ${startX} ${midY - 28}, ${endX} ${midY + 28}, ${endX} ${to.y}`
}

function getNodeLabel(node: PositionedNode['node'], course: Course) {
  if (node.type === 'episode') return node.episode.title
  if (node.type === 'game') return node.game.title
  if (node.type === 'assessment') return 'Module checkpoint'
  if (node.type === 'ai-roleplay') return node.title
  if (node.type === 'module-complete') return `Level ${node.module.level} reward`
  return course.certificateTitle || 'Course certificate'
}

function getNodeReward(node: PositionedNode['node']) {
  if (node.type === 'episode') return `+${node.episode.xp} XP`
  if (node.type === 'game') return `+${node.game.xpReward} XP`
  if (node.type === 'assessment') return `+${node.assessment.xpReward} XP`
  if (node.type === 'ai-roleplay') return `+${node.xpReward} XP`
  return null
}

function getNodeCue(node: PositionedNode['node']) {
  if (node.type === 'episode') return { label: 'Lesson', Icon: BookOpen }
  if (node.type === 'game') return { label: 'Mini-game', Icon: Gamepad2 }
  if (node.type === 'assessment') return { label: 'Checkpoint', Icon: Target }
  if (node.type === 'ai-roleplay') return { label: 'AI Roleplay', Icon: Sparkles }
  if (node.type === 'module-complete') return { label: 'Reward chest', Icon: Trophy }
  return { label: 'Certificate', Icon: Award }
}

export function JourneyPath({
  course,
  completedEpisodes,
  completedGames,
  completedAssessments,
  completedRoleplays = new Set<string>(),
  onPlayEpisode,
  onPlayGame,
  onPlayAssessment,
  onPracticeWithAI,
}: JourneyPathProps) {
  const nodes = buildJourneyNodes(course)
  const { headers, positionedNodes, totalHeight } = layoutJourney(nodes)
  const [selectedRoleplay, setSelectedRoleplay] = useState<Extract<JourneyNode, { type: 'ai-roleplay' }> | null>(null)
  const courseCompleted = isCourseCompleted(course, completedEpisodes, completedGames, completedAssessments, completedRoleplays)

  const reachedIndex = positionedNodes.reduce((furthestIndex, { node }, index) => {
    if (node.type === 'module-complete') {
      return isModuleCompleted(node.module, completedEpisodes, completedGames, completedAssessments, completedRoleplays)
        ? index
        : furthestIndex
    }

    if (node.type === 'certificate') {
      return courseCompleted ? index : furthestIndex
    }

    const isUnlocked = isNodeUnlocked(node, nodes, completedEpisodes, completedGames, completedAssessments, completedRoleplays)
    return isNodeCompleted(node, completedEpisodes, completedGames, completedAssessments, completedRoleplays) && isUnlocked
      ? index
      : furthestIndex
  }, -1)

  const currentPlayableIndex = positionedNodes.findIndex(({ node }, index) =>
    index >= reachedIndex &&
    (node.type === 'episode' || node.type === 'game' || node.type === 'assessment' || node.type === 'ai-roleplay') &&
    !isNodeCompleted(node, completedEpisodes, completedGames, completedAssessments, completedRoleplays) &&
    isNodeUnlocked(node, nodes, completedEpisodes, completedGames, completedAssessments, completedRoleplays),
  )

  const progressIndex = currentPlayableIndex === -1
    ? Math.max(reachedIndex, positionedNodes.length - 1)
    : Math.max(currentPlayableIndex, reachedIndex + 1)

  return (
    <div className="relative overflow-hidden rounded-[34px] border border-emerald-200/60 bg-[linear-gradient(180deg,#f7fff2_0%,#f5fbff_55%,#ffffff_100%)] p-5 shadow-[0_30px_80px_rgba(20,83,45,0.08)] dark:border-cyan-950/50 dark:bg-[linear-gradient(180deg,#0b1930_0%,#10213c_52%,#132743_100%)] dark:shadow-[0_30px_90px_rgba(2,6,23,0.45)]">
      <div className="absolute -left-10 top-12 h-32 w-32 rounded-full bg-emerald-200/35 blur-3xl dark:bg-emerald-500/12" />
      <div className="absolute -right-8 top-4 h-32 w-32 rounded-full bg-cyan-200/35 blur-3xl dark:bg-cyan-400/12" />

      <div className="relative overflow-hidden rounded-[30px] border border-white/80 bg-white/70 px-3 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-sm dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(17,34,64,0.92)_0%,rgba(14,28,53,0.88)_100%)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
        <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_1px_1px,rgba(148,163,184,0.18)_1px,transparent_0)] [background-size:28px_28px] dark:opacity-20 dark:[background-image:radial-gradient(circle_at_1px_1px,rgba(148,163,184,0.12)_1px,transparent_0)]" />
        <div className="relative" style={{ height: totalHeight }}>
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full text-slate-300 dark:text-slate-700/60"
            viewBox={`0 0 ${SVG_WIDTH} ${totalHeight}`}
            preserveAspectRatio="none"
          >
            {positionedNodes.slice(0, -1).map((node, index) => {
              const segmentPath = buildSegmentPath(node, positionedNodes[index + 1])
              const isCompleteSegment = index < progressIndex

              return (
                <g key={`${index}-${segmentPath}`}>
                  <path
                    d={segmentPath}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="30"
                    strokeLinecap="round"
                  />
                  <path
                    d={segmentPath}
                    fill="none"
                    stroke={isCompleteSegment ? '#58cc02' : 'rgba(255,255,255,0)'}
                    strokeWidth="20"
                    strokeLinecap="round"
                  />
                </g>
              )
            })}
          </svg>

          {headers.map(({ node, y }) => {
            const moduleCompleted = isModuleCompleted(
              node.module,
              completedEpisodes,
              completedGames,
              completedAssessments,
              completedRoleplays,
            )

            return (
              <motion.div
                key={node.module.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute left-1/2 w-[min(88%,360px)] -translate-x-1/2"
                style={{ top: y }}
              >
                <div
                  className={cn(
                    'rounded-[28px] px-5 py-4 text-white shadow-[0_8px_0_rgba(0,0,0,0.12)]',
                    moduleCompleted ? 'bg-[linear-gradient(180deg,#58cc02_0%,#4fb800_100%)]' : 'bg-[linear-gradient(180deg,#4cc9f0_0%,#3b82f6_100%)]',
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/75">
                        Module {node.module.level}
                      </p>
                      <h3 className="mt-1 text-2xl font-black">{node.module.title}</h3>
                    </div>
                    <div className="rounded-2xl bg-white/16 px-3 py-2 text-center">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-white/70">Level</p>
                      <p className="text-lg font-black">{node.module.level}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}

          {positionedNodes.map((positionedNode, index) => {
            const { node, x, y } = positionedNode
            const unlocked = isNodeUnlocked(
              node,
              nodes,
              completedEpisodes,
              completedGames,
              completedAssessments,
              completedRoleplays,
            )
            const completed = isNodeCompleted(
              node,
              completedEpisodes,
              completedGames,
              completedAssessments,
              completedRoleplays,
            )
            const moduleRewardUnlocked =
              node.type === 'module-complete' &&
              isModuleCompleted(node.module, completedEpisodes, completedGames, completedAssessments, completedRoleplays)
            const isCurrent = index === currentPlayableIndex
            const label = getNodeLabel(node, course)
            const reward = getNodeReward(node)
            const cue = getNodeCue(node)

            let nodeSize = 84
            let shellClassName = 'bg-[linear-gradient(180deg,#7ed321_0%,#58cc02_100%)] text-white shadow-[0_10px_0_#46a302]'
            let innerIcon = <Play className="h-7 w-7 translate-x-0.5" />
            let clickHandler: (() => void) | undefined

            if (node.type === 'episode') {
              nodeSize = 94
              innerIcon = (
                <div className="relative h-[70%] w-[70%] overflow-hidden rounded-full border-2 border-white/70">
                  <img
                    src={node.episode.thumbnail || '/placeholder.svg'}
                    alt={node.episode.title}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/30" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    {completed ? (
                      <Check className="h-7 w-7 text-white" />
                    ) : unlocked ? (
                      <Play className="h-6 w-6 translate-x-0.5 text-white" />
                    ) : (
                      <Lock className="h-6 w-6 text-white" />
                    )}
                  </div>
                </div>
              )
              clickHandler = () => onPlayEpisode(node.episode)
            }

            if (node.type === 'game') {
              nodeSize = 92
              shellClassName =
                node.game.gameType === 'speed-mcq'
                  ? 'bg-[linear-gradient(180deg,#ff9f1c_0%,#ff6b00_100%)] text-white shadow-[0_10px_0_#db5a00]'
                  : node.game.gameType === 'card-flip'
                    ? 'bg-[linear-gradient(180deg,#8b5cf6_0%,#6d28d9_100%)] text-white shadow-[0_10px_0_#581c87]'
                    : 'bg-[linear-gradient(180deg,#22c55e_0%,#16a34a_100%)] text-white shadow-[0_10px_0_#15803d]'
              innerIcon = completed ? <Check className="h-8 w-8" /> : <Sparkles className="h-7 w-7" />
              clickHandler = () => onPlayGame(node.game)
            }

            if (node.type === 'assessment') {
              nodeSize = 96
              shellClassName = 'bg-[linear-gradient(180deg,#38bdf8_0%,#2563eb_100%)] text-white shadow-[0_10px_0_#1d4ed8]'
              innerIcon = completed ? <Check className="h-8 w-8" /> : <Target className="h-8 w-8" />
              clickHandler = () => onPlayAssessment(node.assessment)
            }

            if (node.type === 'ai-roleplay') {
              nodeSize = 96
              shellClassName = 'bg-[linear-gradient(180deg,#c084fc_0%,#9333ea_100%)] text-white shadow-[0_10px_0_#7e22ce] dark:bg-[linear-gradient(180deg,#a855f7_0%,#7e22ce_100%)]'
              innerIcon = <Sparkles className="h-8 w-8" />
              clickHandler = () => setSelectedRoleplay(node)
            }

	            if (node.type === 'module-complete') {
	              const moduleComplete = isModuleCompleted(
	                node.module,
	                completedEpisodes,
	                completedGames,
	                completedAssessments,
	                completedRoleplays,
	              )
              nodeSize = 92
              shellClassName = moduleComplete
                ? 'bg-[linear-gradient(180deg,#facc15_0%,#f59e0b_100%)] text-white shadow-[0_10px_0_#d97706]'
                : 'bg-[linear-gradient(180deg,#cbd5e1_0%,#94a3b8_100%)] text-white shadow-[0_10px_0_#94a3b8]'
              innerIcon = moduleComplete ? <Trophy className="h-8 w-8" /> : <Lock className="h-8 w-8" />
            }

            if (node.type === 'certificate') {
              nodeSize = 104
              shellClassName = courseCompleted
                ? 'bg-[linear-gradient(180deg,#fcd34d_0%,#f59e0b_100%)] text-white shadow-[0_12px_0_#d97706]'
                : 'bg-[linear-gradient(180deg,#dbeafe_0%,#bfdbfe_100%)] text-slate-500 shadow-[0_12px_0_#bfdbfe] dark:bg-[linear-gradient(180deg,#4b638f_0%,#30496f_100%)] dark:text-slate-100 dark:shadow-[0_12px_0_#213350]'
              innerIcon = <Award className="h-9 w-9" />
            }

            const isInteractive =
              (node.type === 'episode' || node.type === 'game' || node.type === 'assessment' || node.type === 'ai-roleplay') && unlocked
            const labelWidth = node.type === 'certificate' ? 220 : 188

            return (
              <motion.div
                key={`${node.type}-${index}`}
                initial={{ opacity: 0, scale: 0.94, y: 14 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: index * 0.035 }}
                className="absolute -translate-x-1/2"
                style={{ left: `${x}%`, top: y }}
              >
                <div className="flex flex-col items-center">
                  <motion.button
                    whileTap={isInteractive ? { scale: 0.97 } : undefined}
                    onClick={clickHandler}
                    disabled={!isInteractive}
                    className={cn(
                      'relative flex items-center justify-center rounded-full transition-transform',
                      !isInteractive && node.type !== 'module-complete' && node.type !== 'certificate' && 'cursor-default',
                      isCurrent && 'scale-105',
                    )}
                    style={{ width: nodeSize, height: nodeSize }}
                  >
                    <div
                      className={cn(
                        'absolute inset-0 rounded-full bg-black/8 blur-sm',
                        isCurrent && 'scale-125 bg-emerald-300/35 blur-xl',
                      )}
                    />
                    <div
                      className={cn(
                        'relative flex h-full w-full items-center justify-center rounded-full border-[6px] border-white',
                        shellClassName,
                        !unlocked && node.type !== 'module-complete' && node.type !== 'certificate' && 'bg-[linear-gradient(180deg,#cbd5e1_0%,#94a3b8_100%)] text-white shadow-[0_10px_0_#94a3b8] dark:bg-[linear-gradient(180deg,#587090_0%,#425673_100%)] dark:text-slate-100 dark:shadow-[0_10px_0_#24364e]',
                      )}
                    >
                      {innerIcon}
                    </div>
                    {isCurrent && (
                      <div className="absolute -inset-3 rounded-full border-2 border-emerald-300/70" />
                    )}
                  </motion.button>

                  <div
                    className={cn(
                      'mt-4 rounded-[22px] border px-3 py-2.5 text-center shadow-sm backdrop-blur-sm',
                      completed
                        ? 'border-emerald-200 bg-white/90 dark:border-emerald-400/30 dark:bg-emerald-950/35'
                        : isCurrent
                          ? 'border-emerald-300 bg-emerald-50/95 dark:border-emerald-400/35 dark:bg-emerald-950/28'
                          : 'border-white/80 bg-white/88 dark:border-white/10 dark:bg-slate-900/45',
                      node.type === 'module-complete' && 'border-amber-200 bg-amber-50/95 dark:border-amber-300/35 dark:bg-amber-950/28',
                      node.type === 'certificate' && courseCompleted && 'border-amber-200 bg-amber-50/95 dark:border-amber-300/35 dark:bg-amber-950/28',
                    )}
                    style={{ width: labelWidth }}
                  >
                    <div className="mb-1.5 inline-flex items-center gap-1 rounded-full bg-slate-100/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:bg-slate-800/70 dark:text-slate-200">
                      <cue.Icon className="h-3 w-3" />
                      <span>{cue.label}</span>
                    </div>
                    <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">{label}</p>
                    {reward && <p className="mt-1 text-xs font-bold text-primary">{reward}</p>}
                    {node.type === 'assessment' && (
                      <p className="mt-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        {node.assessment.questions.length} questions
                      </p>
                    )}
                    {/* Removed old AI practice button */}
                    {node.type === 'certificate' && course.completionBadge && (
                      <p className="mt-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        Unlocks {course.completionBadge.name}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
      <Dialog open={!!selectedRoleplay} onOpenChange={(open) => !open && setSelectedRoleplay(null)}>
        <DialogContent className="sm:max-w-md rounded-[28px] border-slate-800 bg-slate-950 text-white p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-400" />
              AI Coach Roleplay
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Practice your skills in a guided simulation.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="rounded-2xl bg-white/5 p-4 border border-white/10">
              <p className="text-xs font-semibold uppercase tracking-wider text-purple-400">Scenario</p>
              <p className="mt-2 text-sm text-slate-200 leading-relaxed font-medium">
                {selectedRoleplay?.scenario}
              </p>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-purple-500/10 px-4 py-3 border border-purple-500/20">
              <span className="text-sm font-semibold text-purple-300">Reward</span>
              <span className="text-sm font-bold text-purple-300">+{selectedRoleplay?.xpReward} XP</span>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1 rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10"
                onClick={() => setSelectedRoleplay(null)}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 font-bold text-white shadow-lg hover:opacity-95"
                onClick={() => {
                  if (selectedRoleplay && onPracticeWithAI) {
                    onPracticeWithAI(selectedRoleplay.scenario, selectedRoleplay.id)
                  }
                  setSelectedRoleplay(null)
                }}
              >
                Start Roleplay
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
