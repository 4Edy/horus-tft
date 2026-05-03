// backend/src/routes/summoner.ts
import { Router, Request, Response } from 'express'
import { getAccountByRiotId, getSummonerByPuuid, getRankByPuuid } from '../services/riotService'

const router = Router()

router.get('/:gameName/:tagLine', async (req: Request, res: Response) => {
  try {
    const gameName = req.params.gameName as string
    const tagLine = req.params.tagLine as string

    const account = await getAccountByRiotId(gameName, tagLine)
    const [summoner, rank] = await Promise.all([
      getSummonerByPuuid(account.puuid),
      getRankByPuuid(account.puuid),
    ])

    console.log('ACCOUNT:', JSON.stringify(account))
    console.log('SUMMONER:', JSON.stringify(summoner))
    console.log('RANK:', JSON.stringify(rank))

    res.json({
      account,
      summoner,
      rank,
    })
  } catch (error: any) {
    console.error('ERRO summoner:', error?.response?.data || error.message)
    res.status(500).json({ error: 'Erro ao buscar dados do jogador' })
  }
})

export default router