// backend/src/index.ts
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import summonerRouter from './routes/summoner'
import matchesRouter from './routes/matches'
import insightsRouter from './routes/insights'
import metaRouter from './routes/meta'
import translationsRouter from './routes/translations'
import { initDatabase } from './database'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'TFT App backend rodando!' })
})

app.use('/summoner', summonerRouter)
app.use('/matches', matchesRouter)
app.use('/insights', insightsRouter)
app.use('/meta', metaRouter)
app.use('/translations', translationsRouter)

initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Backend rodando em http://localhost:${PORT}`)
  })
}).catch((err: any) => {
  console.error('❌ Erro ao conectar no banco:', err.message)
  process.exit(1)
})