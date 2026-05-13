import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import fs from 'node:fs'
import path from 'node:path'
import { Readable } from 'node:stream'
import { fileURLToPath } from 'node:url'
import { convertToModelMessages, consumeStream, streamText } from 'ai'
import { google } from '@ai-sdk/google'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const frontendDistDir = path.resolve(__dirname, '..', 'frontend', 'dist')
const indexHtmlPath = path.join(frontendDistDir, 'index.html')

if (!fs.existsSync(indexHtmlPath)) {
  console.error('Missing frontend build artifact:', indexHtmlPath)
  process.exit(1)
}

const app = express()
const port = Number(process.env.PORT || 5000)

app.use(cors())
app.use(express.json({ limit: '2mb' }))

function sendWebResponse(res, response) {
  res.status(response.status)

  response.headers.forEach((value, key) => {
    res.setHeader(key, value)
  })

  if (!response.body) {
    res.end()
    return
  }

  Readable.fromWeb(response.body).pipe(res)
}

app.get('/api/status', (_req, res) => {
  res.json({ message: 'API is working fine' })
})

app.post('/api/chat', async (req, res, next) => {
  try {
    const { messages } = req.body ?? {}

    if (!Array.isArray(messages)) {
      res.status(400).json({ error: 'messages 배열이 필요합니다.' })
      return
    }

    const abortController = new AbortController()
    req.on('close', () => abortController.abort())

    const result = streamText({
      model: google('gemini-2.5-flash-preview-05-20'),
      system: `당신은 친절하고 따뜻한 남성 어시스턴트입니다. 
방문자들에게 도움을 주는 것을 좋아하며, 정중하고 예의 바른 말투를 사용합니다.
작가의 포트폴리오 사이트에서 작품에 대한 질문이나 일반적인 대화에 친절하게 응답해주세요.
항상 한국어로 대화하며, 상대방을 배려하는 따뜻한 태도를 유지합니다.`,
      messages: await convertToModelMessages(messages),
      abortSignal: abortController.signal,
    })

    const response = result.toUIMessageStreamResponse({
      originalMessages: messages,
      consumeSseStream: consumeStream,
    })

    sendWebResponse(res, response)
  } catch (error) {
    next(error)
  }
})

app.use(express.static(frontendDistDir))

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    next()
    return
  }

  res.sendFile(indexHtmlPath)
})

app.use((error, _req, res, _next) => {
  console.error(error)

  if (res.headersSent) {
    return
  }

  res.status(500).json({ error: 'Internal server error' })
})

app.listen(port, '0.0.0.0', () => {
  console.log(`Server listening on port ${port}`)
})
