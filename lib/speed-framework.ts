import type { SkillUpdateContext, SpeedPracticeMode, SpeedStageKey, UserSkillProfile } from './types'

export const SPEED_SIGNAL_WEIGHT = 0.55
export const SPEED_CHECK_THRESHOLD = 80

export const SPEED_STAGE_KEYS: SpeedStageKey[] = [
  'start_right',
  'plan_to_probe',
  'explain_value',
  'eliminate_objection',
  'drive_closure',
]

export function clampSpeedScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

export function resolveSpeedPracticeMode(mode?: SkillUpdateContext['practiceMode']): SpeedPracticeMode | undefined {
  if (mode === 'pitch' || mode === 'roleplay' || mode === 'guided_ai') return mode
  return undefined
}

export function getDefaultSpeedSignals(
  mode: SpeedPracticeMode | undefined,
  score: number,
): Partial<Record<SpeedStageKey, number>> {
  switch (mode) {
    case 'pitch':
      return {
        start_right: clampSpeedScore(score + 4),
        plan_to_probe: clampSpeedScore(score - 2),
        explain_value: clampSpeedScore(score + 3),
        eliminate_objection: clampSpeedScore(score - 1),
        drive_closure: clampSpeedScore(score + 1),
      }
    case 'roleplay':
      return {
        start_right: clampSpeedScore(score + 1),
        plan_to_probe: clampSpeedScore(score + 4),
        explain_value: clampSpeedScore(score),
        eliminate_objection: clampSpeedScore(score + 5),
        drive_closure: clampSpeedScore(score + 2),
      }
    case 'guided_ai':
      return {
        start_right: clampSpeedScore(score + 2),
        plan_to_probe: clampSpeedScore(score + 2),
        explain_value: clampSpeedScore(score + 2),
        eliminate_objection: clampSpeedScore(score + 2),
        drive_closure: clampSpeedScore(score + 1),
      }
    default:
      return {}
  }
}

export function projectSpeedFrameworkStages(
  currentStages: UserSkillProfile['speedFramework']['stages'],
  score: number,
  context?: SkillUpdateContext,
): UserSkillProfile['speedFramework']['stages'] {
  const practiceMode = resolveSpeedPracticeMode(context?.practiceMode)
  const incomingSignals = context?.speedSignals ?? getDefaultSpeedSignals(practiceMode, score)
  const nextStages = { ...currentStages }
  let hasUpdates = false

  SPEED_STAGE_KEYS.forEach(stageKey => {
    const stageScore = incomingSignals[stageKey]
    if (typeof stageScore !== 'number') return

    const currentStage = nextStages[stageKey]
    const currentScore = currentStage?.score ?? 0

    nextStages[stageKey] = {
      ...currentStage,
      score: clampSpeedScore((currentScore * (1 - SPEED_SIGNAL_WEIGHT)) + (stageScore * SPEED_SIGNAL_WEIGHT)),
      updatedAt: new Date().toISOString(),
      sourceTitle: context?.sourceTitle ?? currentStage?.sourceTitle,
      practiceMode: practiceMode ?? currentStage?.practiceMode,
    }
    hasUpdates = true
  })

  return hasUpdates ? nextStages : currentStages
}

export function applySpeedSignalsToProfile(
  profile: UserSkillProfile,
  score: number,
  context?: SkillUpdateContext,
): UserSkillProfile {
  const nextStages = projectSpeedFrameworkStages(profile.speedFramework.stages, score, context)

  if (nextStages === profile.speedFramework.stages) return profile

  return {
    ...profile,
    speedFramework: {
      stages: nextStages,
    },
  }
}
