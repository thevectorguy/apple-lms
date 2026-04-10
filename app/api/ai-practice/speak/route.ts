import { NextResponse } from 'next/server'
import { synthesizeSpeech } from '@/lib/ai-practice-groq'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const text = typeof body?.text === 'string' ? body.text.trim() : ''
    const coachGender = body?.coachGender === 'male' || body?.coachGender === 'female' ? body.coachGender : undefined

    if (!text) {
      return NextResponse.json({ error: 'Text is required.' }, { status: 400 })
    }

    const speech = await synthesizeSpeech({
      text,
      coachGender,
    })

    return NextResponse.json({
      audioBase64: speech.buffer.toString('base64'),
      audioMimeType: speech.mimeType,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected Groq TTS error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
