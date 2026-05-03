// backend/src/routes/matches.ts
import { Router, Request, Response } from 'express'
import { getAccountByRiotId, getMatchIds, getMatchDetail } from '../services/riotService'

const router = Router()

// Rota principal: busca histórico pelo gameName/tagLine
router.get('/history/:gameName/:tagLine', async (req: Request, res: Response) => {
  try {
    const gameName = req.params.gameName as string
    const tagLine = req.params.tagLine as string
    const count = parseInt(req.query.count as string) || 10

    const account = await getAccountByRiotId(gameName, tagLine)
    const puuid = account.puuid

    const matchIds = await getMatchIds(puuid, count)
    const matchDetails = await Promise.all(
      matchIds.map((id: string) => getMatchDetail(id))
    )

    const history = matchDetails.map((match: any) => {
      const participantIndex = match.metadata.participants.indexOf(puuid)
      const player = match.info.participants[participantIndex]

      return {
        matchId: match.metadata.match_id,
        gameDatetime: match.info.game_datetime,
        gameLength: match.info.game_length,
        gameVariation: match.info.game_variation ?? 'Standard',
        placement: player.placement,
        level: player.level,
        lastRound: player.last_round,
        goldLeft: player.gold_left,
        playersEliminated: player.players_eliminated,
        totalDamageToPlayers: player.total_damage_to_players,
        augments: player.augments ?? [],
        traits: player.traits
          .filter((t: any) => t.tier_current > 0)
          .map((t: any) => ({
            name: t.name,
            numUnits: t.num_units,
            tierCurrent: t.tier_current,
            tierTotal: t.tier_total,
          })),
        units: player.units.map((u: any) => ({
          characterId: u.character_id,
          tier: u.tier,
          items: u.itemNames ?? [],
        })),
        top4: player.placement <= 4,
        win: player.placement === 1,
      }
    })

    const stats = {
      totalGames: history.length,
      avgPlacement: parseFloat(
        (history.reduce((acc: number, m: any) => acc + m.placement, 0) / history.length).toFixed(2)
      ),
      top4Rate: parseFloat(
        ((history.filter((m: any) => m.top4).length / history.length) * 100).toFixed(1)
      ),
      winRate: parseFloat(
        ((history.filter((m: any) => m.win).length / history.length) * 100).toFixed(1)
      ),
    }

    res.json({ stats, history })
  } catch (error: any) {
    console.error('ERRO matches:', error?.response?.data || error.message)
    res.status(500).json({ error: 'Erro ao buscar histórico de partidas' })
  }
})

// Detalhe de uma partida específica
router.get('/detail/:matchId', async (req: Request, res: Response) => {
  try {
    const matchId = req.params.matchId as string
    const match = await getMatchDetail(matchId)
    res.json(match)
  } catch (error: any) {
    console.error('ERRO match detail:', error?.response?.data || error.message)
    res.status(500).json({ error: 'Erro ao buscar partida' })
  }
})

export default router