import type { Course, League, User, UserSkillProfile } from './types'

export interface CourseProgressSnapshot {
  completedEpisodes: Set<string>
  completedGames: Set<string>
  completedAssessments: Set<string>
  completedModules: Set<string>
  completedRoleplays: Set<string>
}

export type LeagueMetricKey =
  | 'xp'
  | 'readiness'
  | 'videos'
  | 'assessments'
  | 'miniGames'
  | 'focusMinutes'
  | 'speedChecks'

export interface LeagueMetricValue {
  key: LeagueMetricKey
  label: string
  shortLabel: string
  description: string
  value: number
  displayValue: string
}

export interface LeagueRequirementProgress {
  key: LeagueMetricKey
  label: string
  shortLabel: string
  description: string
  value: number
  target: number
  displayValue: string
  targetDisplayValue: string
  progressValueDisplay: string
  progressTargetDisplay: string
  progress: number
  met: boolean
}

export interface LeagueTheme {
  accent: string
  accentSoft: string
  highlight: string
  text: string
  sceneName: string
  sceneLabel: string
  ambience: string
  texture: string
  haze: string
  panel: string
  landscape: string
}

export interface LeagueTierState {
  league: League
  rank: number
  name: string
  headline: string
  description: string
  environment: string
  theme: LeagueTheme
  requirements: LeagueRequirementProgress[]
  progress: number
  metCount: number
  totalCount: number
  unlocked: boolean
  current: boolean
  completed: boolean
}

export interface LeagueJourneyState {
  currentLeague: League
  currentTier: LeagueTierState
  nextTier: LeagueTierState | null
  tiers: LeagueTierState[]
  metrics: LeagueMetricValue[]
  masteryScore: number
  securedCount: number
}

type LeagueRequirementConfig = {
  key: LeagueMetricKey
  target: number
}

type LeagueTierConfig = {
  league: League
  rank: number
  name: string
  headline: string
  description: string
  environment: string
  theme: LeagueTheme
  requirements: LeagueRequirementConfig[]
}

const LEAGUE_ORDER: League[] = ['bronze', 'silver', 'gold', 'diamond', 'champion']

const METRIC_META: Record<
  LeagueMetricKey,
  {
    label: string
    shortLabel: string
    description: string
    formatMetric: (value: number) => string
    formatProgressValue?: (value: number) => string
    formatProgressTarget?: (value: number) => string
  }
> = {
  xp: {
    label: 'Career XP',
    shortLabel: 'XP',
    description: 'Total experience collected from lessons, games, and practice.',
    formatMetric: value => value.toLocaleString(),
  },
  readiness: {
    label: 'Readiness Score',
    shortLabel: 'Readiness',
    description: 'Overall performance signal across the full competency model.',
    formatMetric: value => `${Math.round(value)} / 100`,
    formatProgressValue: value => `${Math.round(value)}`,
    formatProgressTarget: value => `${Math.round(value)}`,
  },
  videos: {
    label: 'Videos Closed',
    shortLabel: 'Videos',
    description: 'How many learning videos or lessons were actually finished.',
    formatMetric: value => value.toLocaleString(),
  },
  assessments: {
    label: 'Assessments Cleared',
    shortLabel: 'Assessments',
    description: 'Checkpoint quizzes and assessments passed in the app.',
    formatMetric: value => value.toLocaleString(),
  },
  miniGames: {
    label: 'Mini-games Cleared',
    shortLabel: 'Mini-games',
    description: 'Game rounds finished to prove speed and recall under pressure.',
    formatMetric: value => value.toLocaleString(),
  },
  focusMinutes: {
    label: 'Focus Minutes',
    shortLabel: 'Minutes',
    description: 'Estimated time spent inside meaningful learning and practice.',
    formatMetric: value => `${value}m`,
    formatProgressValue: value => `${value}m`,
    formatProgressTarget: value => `${value}m`,
  },
  speedChecks: {
    label: 'SPEED Checks Earned',
    shortLabel: 'SPEED',
    description: 'Live-practice stages that crossed the benchmark line.',
    formatMetric: value => `${value} / 5`,
    formatProgressValue: value => value.toLocaleString(),
    formatProgressTarget: value => value.toLocaleString(),
  },
}

const LEAGUE_TIERS: LeagueTierConfig[] = [
  {
    league: 'bronze',
    rank: 1,
    name: 'Bronze',
    headline: 'Forge Floor',
    description: 'The entry division where momentum starts, reps stack, and the basics stop feeling random.',
    environment: 'Copper forge arena',
    theme: {
      accent: '#f59e0b',
      accentSoft: 'rgba(245,158,11,0.24)',
      highlight: '#fb923c',
      text: '#fff7ed',
      sceneName: 'Forge Floor',
      sceneLabel: 'molten bronze and ember haze',
      ambience: 'radial-gradient(circle at 20% 18%, rgba(251,191,36,0.26), transparent 24%), radial-gradient(circle at 82% 10%, rgba(249,115,22,0.22), transparent 22%), linear-gradient(180deg, #3a2219 0%, #1b100d 42%, #060405 100%)',
      texture: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.035) 0 2px, transparent 2px 18px), repeating-linear-gradient(45deg, rgba(120,53,15,0.18) 0 1px, transparent 1px 14px)',
      haze: 'radial-gradient(circle at 30% 72%, rgba(249,115,22,0.25), transparent 24%), radial-gradient(circle at 72% 60%, rgba(245,158,11,0.18), transparent 26%)',
      panel: 'linear-gradient(180deg, rgba(255,244,230,0.1) 0%, rgba(120,53,15,0.16) 100%)',
      landscape: 'linear-gradient(180deg, rgba(20,10,8,0) 0%, rgba(20,10,8,0.24) 34%, rgba(20,10,8,0.96) 100%)',
    },
    requirements: [],
  },
  {
    league: 'silver',
    rank: 2,
    name: 'Silver',
    headline: 'Moon Circuit',
    description: 'A cleaner, faster division for learners who now have rhythm, signal, and reliable execution.',
    environment: 'Moonlit alloy arena',
    theme: {
      accent: '#cbd5f5',
      accentSoft: 'rgba(203,213,245,0.22)',
      highlight: '#93c5fd',
      text: '#eff6ff',
      sceneName: 'Moon Circuit',
      sceneLabel: 'brushed metal under cool light',
      ambience: 'radial-gradient(circle at 18% 16%, rgba(226,232,240,0.22), transparent 24%), radial-gradient(circle at 80% 12%, rgba(147,197,253,0.22), transparent 24%), linear-gradient(180deg, #1c2438 0%, #111827 44%, #050816 100%)',
      texture: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0 1px, transparent 1px 24px), repeating-linear-gradient(135deg, rgba(148,163,184,0.12) 0 1px, transparent 1px 16px)',
      haze: 'radial-gradient(circle at 26% 74%, rgba(203,213,225,0.16), transparent 24%), radial-gradient(circle at 70% 62%, rgba(59,130,246,0.18), transparent 28%)',
      panel: 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(148,163,184,0.12) 100%)',
      landscape: 'linear-gradient(180deg, rgba(6,12,24,0) 0%, rgba(6,12,24,0.2) 36%, rgba(6,12,24,0.96) 100%)',
    },
    requirements: [
      { key: 'xp', target: 1000 },
      { key: 'readiness', target: 55 },
      { key: 'videos', target: 12 },
      { key: 'assessments', target: 1 },
      { key: 'miniGames', target: 1 },
      { key: 'focusMinutes', target: 90 },
      { key: 'speedChecks', target: 1 },
    ],
  },
  {
    league: 'gold',
    rank: 3,
    name: 'Gold',
    headline: 'Sunline Court',
    description: 'A high-glow division for consistent closers who can translate learning into visible performance.',
    environment: 'Auric sun court',
    theme: {
      accent: '#facc15',
      accentSoft: 'rgba(250,204,21,0.22)',
      highlight: '#fb7185',
      text: '#fffbea',
      sceneName: 'Sunline Court',
      sceneLabel: 'golden surfaces with heat shimmer',
      ambience: 'radial-gradient(circle at 22% 18%, rgba(250,204,21,0.28), transparent 24%), radial-gradient(circle at 78% 14%, rgba(251,113,133,0.16), transparent 20%), linear-gradient(180deg, #3d2b0a 0%, #1c1206 38%, #090503 100%)',
      texture: 'repeating-linear-gradient(120deg, rgba(255,255,255,0.04) 0 2px, transparent 2px 20px), repeating-linear-gradient(0deg, rgba(250,204,21,0.1) 0 1px, transparent 1px 22px)',
      haze: 'radial-gradient(circle at 35% 76%, rgba(250,204,21,0.2), transparent 24%), radial-gradient(circle at 70% 66%, rgba(245,158,11,0.2), transparent 28%)',
      panel: 'linear-gradient(180deg, rgba(255,250,214,0.12) 0%, rgba(161,98,7,0.14) 100%)',
      landscape: 'linear-gradient(180deg, rgba(18,12,5,0) 0%, rgba(18,12,5,0.2) 32%, rgba(18,12,5,0.96) 100%)',
    },
    requirements: [
      { key: 'xp', target: 3000 },
      { key: 'readiness', target: 70 },
      { key: 'videos', target: 28 },
      { key: 'assessments', target: 4 },
      { key: 'miniGames', target: 2 },
      { key: 'focusMinutes', target: 180 },
      { key: 'speedChecks', target: 2 },
    ],
  },
  {
    league: 'diamond',
    rank: 4,
    name: 'Diamond',
    headline: 'Crystal Citadel',
    description: 'An elite division where precision, practice quality, and confidence all have to show up together.',
    environment: 'Crystal citadel skyline',
    theme: {
      accent: '#67e8f9',
      accentSoft: 'rgba(103,232,249,0.22)',
      highlight: '#a78bfa',
      text: '#ecfeff',
      sceneName: 'Crystal Citadel',
      sceneLabel: 'glacial neon and suspended glass',
      ambience: 'radial-gradient(circle at 18% 18%, rgba(103,232,249,0.24), transparent 24%), radial-gradient(circle at 82% 10%, rgba(167,139,250,0.2), transparent 22%), linear-gradient(180deg, #0f1f38 0%, #071124 42%, #030712 100%)',
      texture: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.045) 0 1px, transparent 1px 16px), repeating-linear-gradient(45deg, rgba(103,232,249,0.1) 0 1px, transparent 1px 22px)',
      haze: 'radial-gradient(circle at 26% 74%, rgba(34,211,238,0.18), transparent 26%), radial-gradient(circle at 72% 62%, rgba(99,102,241,0.2), transparent 28%)',
      panel: 'linear-gradient(180deg, rgba(236,254,255,0.1) 0%, rgba(37,99,235,0.14) 100%)',
      landscape: 'linear-gradient(180deg, rgba(2,8,23,0) 0%, rgba(2,8,23,0.22) 34%, rgba(2,8,23,0.98) 100%)',
    },
    requirements: [
      { key: 'xp', target: 6000 },
      { key: 'readiness', target: 82 },
      { key: 'videos', target: 42 },
      { key: 'assessments', target: 8 },
      { key: 'miniGames', target: 3 },
      { key: 'focusMinutes', target: 300 },
      { key: 'speedChecks', target: 4 },
    ],
  },
  {
    league: 'champion',
    rank: 5,
    name: 'Champion',
    headline: 'Crown Orbit',
    description: 'The final division. High reps, high readiness, and live-practice proof all have to be locked in.',
    environment: 'Celestial crown arena',
    theme: {
      accent: '#f43f5e',
      accentSoft: 'rgba(244,63,94,0.2)',
      highlight: '#f59e0b',
      text: '#fff1f2',
      sceneName: 'Crown Orbit',
      sceneLabel: 'royal crimson with orbital light',
      ambience: 'radial-gradient(circle at 18% 16%, rgba(244,63,94,0.22), transparent 24%), radial-gradient(circle at 82% 12%, rgba(245,158,11,0.18), transparent 20%), linear-gradient(180deg, #240711 0%, #12050d 40%, #040205 100%)',
      texture: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.035) 0 1px, transparent 1px 20px), repeating-linear-gradient(135deg, rgba(244,63,94,0.1) 0 1px, transparent 1px 18px)',
      haze: 'radial-gradient(circle at 28% 72%, rgba(244,63,94,0.18), transparent 22%), radial-gradient(circle at 74% 60%, rgba(250,204,21,0.16), transparent 24%)',
      panel: 'linear-gradient(180deg, rgba(255,241,242,0.1) 0%, rgba(127,29,29,0.18) 100%)',
      landscape: 'linear-gradient(180deg, rgba(12,2,8,0) 0%, rgba(12,2,8,0.22) 34%, rgba(12,2,8,0.98) 100%)',
    },
    requirements: [
      { key: 'xp', target: 10000 },
      { key: 'readiness', target: 92 },
      { key: 'videos', target: 60 },
      { key: 'assessments', target: 12 },
      { key: 'miniGames', target: 4 },
      { key: 'focusMinutes', target: 420 },
      { key: 'speedChecks', target: 5 },
    ],
  },
]

function parseDurationToMinutes(duration: string) {
  const timestampMatch = duration.match(/^(\d+):(\d+)$/)
  if (timestampMatch) {
    const minutes = Number(timestampMatch[1])
    const seconds = Number(timestampMatch[2])
    return Math.max(1, Math.ceil(((minutes * 60) + seconds) / 60))
  }

  const numericMinutes = Number.parseInt(duration, 10)
  return Number.isFinite(numericMinutes) ? Math.max(1, numericMinutes) : 4
}

function getUniqueEpisodeMinutes(courses: Course[], completedEpisodeIds: Set<string>) {
  const uniqueEpisodes = new Map<string, number>()

  courses.forEach(course => {
    const courseEpisodes = course.modules?.length
      ? course.modules.flatMap(module => module.episodes)
      : course.episodes

    courseEpisodes.forEach(episode => {
      if (!completedEpisodeIds.has(episode.id) || uniqueEpisodes.has(episode.id)) return
      uniqueEpisodes.set(episode.id, parseDurationToMinutes(episode.duration))
    })
  })

  return Array.from(uniqueEpisodes.values()).reduce((sum, minutes) => sum + minutes, 0)
}

function buildMetricValues(
  user: User,
  profile: UserSkillProfile,
  progress: CourseProgressSnapshot,
  courses: Course[],
) {
  const watchedVideos = Math.max(user.totalLessonsCompleted, progress.completedEpisodes.size)
  const uniqueEpisodeMinutes = getUniqueEpisodeMinutes(courses, progress.completedEpisodes)
  const structuredMinutes = uniqueEpisodeMinutes
    + (progress.completedAssessments.size * 6)
    + (progress.completedGames.size * 5)
    + (progress.completedRoleplays.size * 10)
  const focusMinutes = Math.max(structuredMinutes, watchedVideos * 4)
  const speedChecks = Object.values(profile.speedFramework.stages).filter(stage => (stage?.score ?? 0) >= 80).length

  return {
    xp: user.xp,
    readiness: profile.readinessScore,
    videos: watchedVideos,
    assessments: progress.completedAssessments.size,
    miniGames: progress.completedGames.size,
    focusMinutes,
    speedChecks,
  } satisfies Record<LeagueMetricKey, number>
}

function buildRequirementProgress(
  config: LeagueRequirementConfig,
  metricValues: Record<LeagueMetricKey, number>,
): LeagueRequirementProgress {
  const meta = METRIC_META[config.key]
  const value = metricValues[config.key]
  const target = config.target
  const progress = target <= 0 ? 100 : Math.min((value / target) * 100, 100)
  const progressValueDisplay = meta.formatProgressValue?.(value) ?? meta.formatMetric(value)
  const progressTargetDisplay = meta.formatProgressTarget?.(target) ?? meta.formatMetric(target)

  return {
    key: config.key,
    label: meta.label,
    shortLabel: meta.shortLabel,
    description: meta.description,
    value,
    target,
    displayValue: meta.formatMetric(value),
    targetDisplayValue: meta.formatMetric(target),
    progressValueDisplay,
    progressTargetDisplay,
    progress,
    met: value >= target,
  }
}

function getCurrentLeagueFromTiers(tiers: LeagueTierState[]) {
  const highestUnlocked = [...tiers].reverse().find(tier => tier.unlocked)
  return highestUnlocked?.league ?? 'bronze'
}

export function buildLeagueJourneyState({
  user,
  profile,
  progress,
  courses,
}: {
  user: User
  profile: UserSkillProfile
  progress: CourseProgressSnapshot
  courses: Course[]
}): LeagueJourneyState {
  const metricValues = buildMetricValues(user, profile, progress, courses)

  const metrics = (Object.entries(METRIC_META) as Array<[LeagueMetricKey, typeof METRIC_META[LeagueMetricKey]]>)
    .map(([key, meta]) => ({
      key,
      label: meta.label,
      shortLabel: meta.shortLabel,
      description: meta.description,
      value: metricValues[key],
      displayValue: meta.formatMetric(metricValues[key]),
    }))

  const tiers = LEAGUE_TIERS.map(config => {
    const requirements = config.requirements.map(requirement => buildRequirementProgress(requirement, metricValues))
    const metCount = requirements.filter(requirement => requirement.met).length
    const totalCount = requirements.length
    const unlocked = totalCount === 0 || requirements.every(requirement => requirement.met)
    const progress = totalCount === 0
      ? 100
      : Math.round(requirements.reduce((sum, requirement) => sum + requirement.progress, 0) / totalCount)

    return {
      league: config.league,
      rank: config.rank,
      name: config.name,
      headline: config.headline,
      description: config.description,
      environment: config.environment,
      theme: config.theme,
      requirements,
      progress,
      metCount,
      totalCount,
      unlocked,
      current: false,
      completed: false,
    } satisfies LeagueTierState
  })

  const currentLeague = getCurrentLeagueFromTiers(tiers)
  const currentIndex = LEAGUE_ORDER.indexOf(currentLeague)
  const nextTier = tiers[currentIndex + 1] ?? null
  const securedCount = currentIndex + 1

  const championTier = tiers[tiers.length - 1]
  const masteryScore = Math.round(
    championTier.requirements.reduce((sum, requirement) => sum + requirement.progress, 0) / championTier.requirements.length,
  )

  const finalizedTiers = tiers.map((tier, index) => ({
    ...tier,
    current: tier.league === currentLeague,
    completed: index < currentIndex,
  }))

  return {
    currentLeague,
    currentTier: finalizedTiers[currentIndex],
    nextTier: nextTier ? finalizedTiers.find(tier => tier.league === nextTier.league) ?? nextTier : null,
    tiers: finalizedTiers,
    metrics,
    masteryScore,
    securedCount,
  }
}
