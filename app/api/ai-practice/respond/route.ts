import { NextResponse } from 'next/server'
import {
  generateCoachReply,
  transcribeAudioBuffer,
  synthesizeSpeech,
  type AIPracticeHistoryMessage,
} from '@/lib/ai-practice-groq'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const audio = formData.get('audio')
    const scenario = String(formData.get('scenario') || '').trim()
    const focusSkill = String(formData.get('focusSkill') || '').trim()
    const coachName = String(formData.get('coachName') || '').trim()
    const coachGender = parseCoachGender(formData.get('coachGender'))
    const history = parseHistory(formData.get('history'))

    if (!(audio instanceof File)) {
      return NextResponse.json({ error: 'Audio file is required.' }, { status: 400 })
    }

    if (!scenario) {
      return NextResponse.json({ error: 'Scenario is required.' }, { status: 400 })
    }

    if (!focusSkill) {
      return NextResponse.json({ error: 'Focus skill is required.' }, { status: 400 })
    }

    const fileBuffer = Buffer.from(await audio.arrayBuffer())
    const transcription = await transcribeAudioBuffer({
      fileBuffer,
      fileName: audio.name || 'practice-turn.webm',
      mimeType: audio.type || 'audio/webm',
    })

    if (!transcription.text) {
      return NextResponse.json({ error: 'No speech detected in the recording.' }, { status: 422 })
    }

    const reply = await generateCoachReply({
      coachName,
      scenario,
      focusSkill,
      history,
      transcript: transcription.text,
    })

    const speech = await synthesizeSpeech({
      text: reply,
      coachGender,
    })

    return NextResponse.json({
      transcript: transcription.text,
      reply,
      audioBase64: speech.buffer.toString('base64'),
      audioMimeType: speech.mimeType,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected Groq response error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

function parseCoachGender(value: FormDataEntryValue | null) {
  if (typeof value !== 'string') return undefined

  const normalizedValue = value.trim().toLowerCase()
  if (normalizedValue === 'male' || normalizedValue === 'female') {
    return normalizedValue
  }

  return undefined
}

function parseHistory(value: FormDataEntryValue | null): AIPracticeHistoryMessage[] {
  if (typeof value !== 'string' || !value.trim()) {
    return []
  }

  try {
    const parsed = JSON.parse(value)
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed
      .map((item) => {
        const role = item?.role
        const content = item?.content
        if (
          (role !== 'ai' && role !== 'user' && role !== 'system') ||
          typeof content !== 'string' ||
          !content.trim()
        ) {
          return null
        }

        return {
          role,
          content: content.trim(),
        }
      })
      .filter(Boolean) as AIPracticeHistoryMessage[]
  } catch {
    return []
  }
}
