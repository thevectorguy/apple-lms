import 'server-only'
import '@/lib/network-tls'

const GROQ_BASE_URL = 'https://api.groq.com/openai/v1'
const MAX_TTS_INPUT_CHARS = 200
const TRANSCRIPTION_PROMPT =
  'Conversation practice for a coaching app in India. Speech may mix English with Hindi or other regional language. Keep names, products, and spoken phrasing accurate.'

export type AIPracticeHistoryMessage = {
  role: 'ai' | 'user' | 'system'
  content: string
}

type CoachVoiceProfile = {
  coachName?: string
  coachGender?: 'male' | 'female'
}

function getGroqApiKey() {
  const apiKey = process.env.GROQ_API_KEY?.trim()
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not set')
  }

  return apiKey
}

function getTranscriptionModel() {
  return process.env.GROQ_TRANSCRIPTION_MODEL || 'whisper-large-v3-turbo'
}

function getChatModel() {
  return process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'
}

function getTtsModel() {
  return process.env.GROQ_TTS_MODEL || 'canopylabs/orpheus-v1-english'
}

function getTtsVoice({ coachGender }: CoachVoiceProfile) {
  if (coachGender === 'male') {
    return process.env.GROQ_TTS_VOICE_MALE || process.env.GROQ_TTS_VOICE || 'austin'
  }

  return process.env.GROQ_TTS_VOICE_FEMALE || process.env.GROQ_TTS_VOICE || 'hannah'
}

async function groqFetch(path: string, init: RequestInit = {}) {
  const response = await fetch(`${GROQ_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getGroqApiKey()}`,
      ...(init.headers || {}),
    },
  })

  if (!response.ok) {
    const text = await response.text()
    const normalizedText = text.toLowerCase()

    if (normalizedText.includes('model_terms_required')) {
      throw new Error(
        'Groq TTS is blocked until model terms are accepted for the Orpheus voice model. Open https://console.groq.com/playground?model=canopylabs%2Forpheus-v1-english with the same Groq account, accept the terms once, then retry.',
      )
    }

    throw new Error(`Groq request failed (${response.status}): ${text}`)
  }

  return response
}

export async function transcribeAudioBuffer({
  fileBuffer,
  fileName,
  mimeType,
}: {
  fileBuffer: Buffer
  fileName: string
  mimeType: string
}) {
  const form = new FormData()
  form.append('model', getTranscriptionModel())
  form.append('prompt', TRANSCRIPTION_PROMPT)
  form.append('response_format', 'verbose_json')
  form.append('file', new Blob([fileBuffer], { type: mimeType }), fileName)

  const response = await groqFetch('/audio/transcriptions', {
    method: 'POST',
    body: form,
  })

  const payload = await response.json()
  return {
    text: String(payload.text || '').trim(),
    raw: payload,
  }
}

export async function generateCoachReply({
  coachName,
  scenario,
  focusSkill,
  history,
  transcript,
}: {
  coachName?: string
  scenario: string
  focusSkill: string
  history: AIPracticeHistoryMessage[]
  transcript: string
}) {
  const trimmedHistory = history
    .filter((message) => (message.role === 'ai' || message.role === 'user') && message.content.trim())
    .slice(-10)
    .map((message) => ({
      role: message.role === 'user' ? 'user' : 'assistant',
      content: message.content.trim(),
    }))

  const systemPrompt = [
    `You are ${coachName?.trim() || 'Ava'}, an AI practice coach inside a voice-first learning app.`,
    `Scenario: ${scenario.trim()}.`,
    `Focus skill: ${focusSkill.trim()}.`,
    'Respond like you are speaking out loud in a real conversation.',
    'Keep replies short, natural, and useful.',
    'Use at most 2 short paragraphs or 2 sentences.',
    'Ask at most one follow-up question.',
    'No markdown, bullet points, labels, or stage directions.',
  ].join(' ')

  const response = await groqFetch('/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: getChatModel(),
      temperature: 0.6,
      max_tokens: 180,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        ...trimmedHistory,
        {
          role: 'user',
          content: transcript.trim(),
        },
      ],
    }),
  })

  const payload = await response.json()
  const content = payload.choices?.[0]?.message?.content

  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('Groq returned an empty coach reply')
  }

  return content.trim()
}

export async function synthesizeSpeech({
  coachGender,
  text,
}: {
  coachGender?: 'male' | 'female'
  text: string
}) {
  const normalizedText = text.replace(/\s+/g, ' ').trim()
  if (!normalizedText) {
    throw new Error('Cannot synthesize empty text')
  }

  const chunks = chunkText(normalizedText, MAX_TTS_INPUT_CHARS)
  const renderedChunks: Array<{ fmtChunk: Buffer; dataChunk: Buffer }> = []

  for (const input of chunks) {
    const response = await groqFetch('/audio/speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: getTtsModel(),
        voice: getTtsVoice({ coachGender }),
        input,
        response_format: 'wav',
      }),
    })

    const wavBuffer = Buffer.from(await response.arrayBuffer())
    renderedChunks.push(parseWav(wavBuffer))
  }

  const [firstChunk, ...restChunks] = renderedChunks
  for (const chunk of restChunks) {
    if (!chunk.fmtChunk.equals(firstChunk.fmtChunk)) {
      throw new Error('Groq TTS returned mismatched WAV formats')
    }
  }

  return {
    buffer: createWavBuffer({
      fmtChunk: firstChunk.fmtChunk,
      dataChunks: renderedChunks.map((chunk) => chunk.dataChunk),
    }),
    mimeType: 'audio/wav',
  }
}

function chunkText(text: string, maxChars: number) {
  const sentences = text.match(/[^.!?]+[.!?]?/g)?.map((sentence) => sentence.trim()).filter(Boolean) ?? [text]
  const chunks: string[] = []
  let current = ''

  for (const sentence of sentences) {
    const nextValue = current ? `${current} ${sentence}` : sentence
    if (nextValue.length <= maxChars) {
      current = nextValue
      continue
    }

    if (current) {
      chunks.push(current)
    }

    if (sentence.length <= maxChars) {
      current = sentence
      continue
    }

    const words = sentence.split(/\s+/)
    let rolling = ''

    for (const word of words) {
      const nextWordValue = rolling ? `${rolling} ${word}` : word
      if (nextWordValue.length <= maxChars) {
        rolling = nextWordValue
        continue
      }

      if (rolling) {
        chunks.push(rolling)
      }

      rolling = word
    }

    current = rolling
  }

  if (current) {
    chunks.push(current)
  }

  return chunks
}

function readAscii(buffer: Buffer, start: number, end: number) {
  return buffer.toString('ascii', start, end)
}

function parseWav(buffer: Buffer) {
  if (readAscii(buffer, 0, 4) !== 'RIFF' || readAscii(buffer, 8, 12) !== 'WAVE') {
    throw new Error('Received invalid WAV data from Groq TTS')
  }

  let offset = 12
  let fmtChunk: Buffer | null = null
  let dataChunk: Buffer | null = null

  while (offset + 8 <= buffer.length) {
    const chunkId = readAscii(buffer, offset, offset + 4)
    const chunkSize = buffer.readUInt32LE(offset + 4)
    const dataStart = offset + 8
    const dataEnd = dataStart + chunkSize

    if (chunkId === 'fmt ') {
      fmtChunk = buffer.subarray(dataStart, dataEnd)
    } else if (chunkId === 'data') {
      dataChunk = buffer.subarray(dataStart, dataEnd)
    }

    offset = dataEnd + (chunkSize % 2)
  }

  if (!fmtChunk || !dataChunk) {
    throw new Error('Groq TTS WAV response was missing required chunks')
  }

  return { fmtChunk, dataChunk }
}

function createWavBuffer({
  fmtChunk,
  dataChunks,
}: {
  fmtChunk: Buffer
  dataChunks: Buffer[]
}) {
  const totalDataSize = dataChunks.reduce((sum, chunk) => sum + chunk.length, 0)
  const fmtSectionSize = 8 + fmtChunk.length + (fmtChunk.length % 2)
  const dataSectionSize = 8 + totalDataSize + (totalDataSize % 2)
  const riffSize = 4 + fmtSectionSize + dataSectionSize
  const output = Buffer.alloc(8 + riffSize)

  let offset = 0
  output.write('RIFF', offset)
  offset += 4
  output.writeUInt32LE(riffSize, offset)
  offset += 4
  output.write('WAVE', offset)
  offset += 4

  output.write('fmt ', offset)
  offset += 4
  output.writeUInt32LE(fmtChunk.length, offset)
  offset += 4
  fmtChunk.copy(output, offset)
  offset += fmtChunk.length

  if (fmtChunk.length % 2) {
    output.writeUInt8(0, offset)
    offset += 1
  }

  output.write('data', offset)
  offset += 4
  output.writeUInt32LE(totalDataSize, offset)
  offset += 4

  for (const chunk of dataChunks) {
    chunk.copy(output, offset)
    offset += chunk.length
  }

  if (totalDataSize % 2) {
    output.writeUInt8(0, offset)
  }

  return output
}
