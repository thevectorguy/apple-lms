export interface User {
  id: string
  name: string
  avatar: string
  level: number
  xp: number
  xpToNextLevel: number
  streak: number
  dailyGoalsStreakClaimed?: boolean
  totalLessonsCompleted: number
  badges: Badge[]
  dailyGoals: DailyGoals
  rank: number
}

export interface DailyGoals {
  timeSpent: number
  timeGoal: number
  lessonsCompleted: number
  lessonsGoal: number
  xpEarned: number
  xpGoal: number
}

export interface Badge {
  id: string
  name: string
  icon: string
  description: string
  earnedAt?: string
  locked: boolean
}

export interface Lesson {
  id: string
  title: string
  description: string
  thumbnail: string
  duration: string
  xp: number
  instructor: Instructor
  phase: 'discover' | 'learn' | 'practice' | 'master'
  category: string
  likes: number
  comments: number
  progress: number
  completed: boolean
  locked: boolean
}

export interface Instructor {
  id: string
  name: string
  avatar: string
  role: string
  verified: boolean
}

export interface Story {
  id: string
  instructor: Instructor
  title: string
  thumbnail: string
  viewed: boolean
  isNew: boolean
}

export interface LeaderboardEntry {
  rank: number
  user: {
    id: string
    name: string
    avatar: string
    level: number
  }
  xp: number
  streak: number
}

export interface Assessment {
  id: string
  title: string
  description: string
  questions: Question[]
  passingScore: number
  xpReward: number
  badgeReward?: Badge
  timeLimit: number
}

export interface Question {
  id: string
  text: string
  options: string[]
  correctAnswer: number
  explanation: string
}

export interface LearningPath {
  id: string
  title: string
  description: string
  phases: Phase[]
  totalXP: number
  estimatedTime: string
  progress: number
}

export interface Phase {
  id: string
  name: string
  icon: string
  lessons: Lesson[]
  assessment?: Assessment
  completed: boolean
  locked: boolean
}

export interface Trainer {
  id: string
  name: string
  avatar: string
  role: string
  verified: boolean
  followers: number
  lessonsCount: number
  rating: number
  specialties: string[]
  isFollowing: boolean
}

export interface Discussion {
  id: string
  author: {
    id: string
    name: string
    avatar: string
    level: number
  }
  content: string
  topic: string
  likes: number
  replies: number
  timestamp: string
  isLiked: boolean
}

export interface PeerChallenge {
  id: string
  title: string
  description: string
  challenger: {
    id: string
    name: string
    avatar: string
    level: number
  }
  xpReward: number
  deadline: string
  participants: number
  category: string
  difficulty: 'easy' | 'medium' | 'hard'
  status: 'active' | 'completed' | 'expired'
}

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  xp: number
  sharedBy: {
    id: string
    name: string
    avatar: string
  }
  timestamp: string
  likes: number
  comments: number
}

export type GameType = 'fruit-ninja' | 'card-flip' | 'speed-mcq'

export type League = 'bronze' | 'silver' | 'gold' | 'diamond' | 'champion'

export interface MiniGame {
  id: string
  title: string
  gameType: GameType
  questions: Question[]
  xpReward: number
}

export interface Module {
  id: string
  title: string
  level: number
  episodes: Episode[]
  miniGames: { afterEpisodeIndex: number; game: MiniGame }[]
  finalAssessment: Assessment
  aiRoleplay?: { id: string; scenario: string; title: string; xpReward: number }
  completed: boolean
  locked: boolean
}

export interface Course {
  id: string
  title: string
  description: string
  thumbnail: string
  instructor: Instructor
  category: string
  level: 'Beginner' | 'Intermediate' | 'Advanced'
  totalDuration: string
  episodes: Episode[]
  modules?: Module[]
  xpReward: number
  progress: number
  status: 'not_started' | 'in_progress' | 'completed'
  skillCategory: SkillCategory
  certificateTitle?: string
  completionBadge?: Badge
}

export interface Episode {
  id: string
  title: string
  description: string
  duration: string
  videoUrl?: string
  thumbnail: string
  xp: number
  completed: boolean
  locked: boolean
  assessment?: Assessment
}

export const LEAGUE_THRESHOLDS: Record<League, number> = {
  bronze: 0,
  silver: 1000,
  gold: 3000,
  diamond: 6000,
  champion: 10000,
}

export function getLeague(xp: number): League {
  if (xp >= 10000) return 'champion'
  if (xp >= 6000) return 'diamond'
  if (xp >= 3000) return 'gold'
  if (xp >= 1000) return 'silver'
  return 'bronze'
}

export const LEAGUE_INFO: Record<League, { name: string; icon: string; color: string }> = {
  bronze: { name: 'Bronze', icon: '🥉', color: '#CD7F32' },
  silver: { name: 'Silver', icon: '🥈', color: '#C0C0C0' },
  gold: { name: 'Gold', icon: '🥇', color: '#FFD700' },
  diamond: { name: 'Diamond', icon: '💎', color: '#B9F2FF' },
  champion: { name: 'Champion', icon: '👑', color: '#FF6B6B' },
}

export type SkillCategory = 'communication' | 'technical' | 'leadership' | 'compliance'

export interface SkillRadarData {
  communication: number
  technical: number
  leadership: number
  compliance: number
}

export type CompetencyEventType = 'assessment' | 'mini_game' | 'module_completion' | 'ai_practice'

export interface CompetencyEvent {
  id: string
  type: CompetencyEventType
  skillCategory: SkillCategory
  score: number
  impactWeight: number
  sourceId: string
  sourceTitle: string
  timestamp: string
}

export type NextStepPlanType = 'next_module' | 'ai_practice' | 'recommended_course'
export type NextStepPlanStatus = 'selected' | 'completed'

export interface NextStepPlan {
  type: NextStepPlanType
  skillCategory: SkillCategory
  title: string
  status: NextStepPlanStatus
  courseId?: string
  moduleId?: string
  roleplayId?: string
  scenario?: string
}

export interface UserSkillProfile {
  radarData: SkillRadarData
  readinessScore: number
  weakAreas: SkillCategory[]
  strongAreas: SkillCategory[]
  skillGapByCategory: Record<SkillCategory, number>
  competencyHistory: CompetencyEvent[]
  nextStepPlan: NextStepPlan | null
  recommendations: string[]
}
