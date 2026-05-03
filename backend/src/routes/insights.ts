// backend/src/routes/insights.ts
import { Router, Request, Response } from 'express'
import { getAccountByRiotId, getMatchIds, getMatchDetail } from '../services/riotService'

const router = Router()

router.get('/:gameName/:tagLine', async (req: Request, res: Response) => {
  try {
    const gameName = req.params.gameName as string
    const tagLine = req.params.tagLine as string
    const count = parseInt(req.query.count as string) || 20

    const account = await getAccountByRiotId(gameName, tagLine)
    const puuid = account.puuid

    const matchIds = await getMatchIds(puuid, count)
    const matchDetails = await Promise.all(
      matchIds.map((id: string) => getMatchDetail(id))
    )

    // Extrai dados do jogador em cada partida
    const matches = matchDetails.map((match: any) => {
      const idx = match.metadata.participants.indexOf(puuid)
      const player = match.info.participants[idx]
      return {
        placement: player.placement,
        level: player.level,
        lastRound: player.last_round,
        goldLeft: player.gold_left,
        playersEliminated: player.players_eliminated,
        totalDamageToPlayers: player.total_damage_to_players,
        traits: player.traits.filter((t: any) => t.tier_current > 0),
        units: player.units,
        top4: player.placement <= 4,
        win: player.placement === 1,
      }
    })

    const insights: any[] = []

    // ── 1. NÍVEL MÁXIMO ──
    const avgLevel = matches.reduce((a, m) => a + m.level, 0) / matches.length
    if (avgLevel < 7.5) {
      insights.push({
        type: 'warning',
        category: 'econ',
        title: 'Você está levando pouco',
        detail: `Nível médio de ${avgLevel.toFixed(1)} nas últimas ${count} partidas. Jogadores de Platina+ chegam ao nível 8 consistentemente antes do round 4-1. Priorize economizar ouro nos rounds 2-1 a 3-2 para levar mais cedo.`,
        metric: avgLevel.toFixed(1),
        metricLabel: 'nível médio',
        priority: 'high',
      })
    }

    // ── 2. OURO SOBRANDO ──
    const avgGoldLeft = matches.reduce((a, m) => a + m.goldLeft, 0) / matches.length
    if (avgGoldLeft > 10) {
      insights.push({
        type: 'warning',
        category: 'econ',
        title: 'Ouro desperdiçado no final',
        detail: `Você termina as partidas com ${avgGoldLeft.toFixed(0)} de ouro sobrando em média. Isso indica que você não está gastando eficientemente — compre XP para levar ou role a loja antes de morrer.`,
        metric: avgGoldLeft.toFixed(0),
        metricLabel: 'ouro médio ao morrer',
        priority: 'high',
      })
    }

    // ── 3. DANO BAIXO ──
    const avgDmg = matches.reduce((a, m) => a + m.totalDamageToPlayers, 0) / matches.length
    if (avgDmg < 60) {
      insights.push({
        type: 'warning',
        category: 'combat',
        title: 'Dano causado muito baixo',
        detail: `Média de ${avgDmg.toFixed(0)} de dano por partida. Isso indica que sua composição está fraca nos rounds iniciais ou que você está perdendo streak de vitórias. Foque em fortalecer o board no mid-game mesmo sem os carries principais.`,
        metric: avgDmg.toFixed(0),
        metricLabel: 'dano médio por partida',
        priority: 'medium',
      })
    }

    // ── 4. UNIDADES MAIS JOGADAS COM MAU RESULTADO ──
    const unitStats: Record<string, { count: number; placements: number[] }> = {}
    matches.forEach(m => {
      m.units.forEach((u: any) => {
        const name = u.character_id.replace(/TFT\d+_/, '')
        if (!unitStats[name]) unitStats[name] = { count: 0, placements: [] }
        unitStats[name].count++
        unitStats[name].placements.push(m.placement)
      })
    })

    const badUnits = Object.entries(unitStats)
      .filter(([, s]) => s.count >= 3)
      .map(([name, s]) => ({
        name,
        count: s.count,
        avgPlacement: s.placements.reduce((a, b) => a + b, 0) / s.placements.length,
      }))
      .filter(u => u.avgPlacement > 5.5)
      .sort((a, b) => b.avgPlacement - a.avgPlacement)
      .slice(0, 3)

    if (badUnits.length > 0) {
      insights.push({
        type: 'danger',
        category: 'composition',
        title: 'Unidades que te afundam',
        detail: `Você joga ${badUnits.map(u => `${u.name} (avg #${u.avgPlacement.toFixed(1)})`).join(', ')} com frequência mas obtém resultados ruins. Considere evitar essas unidades ou mudar como as equipa.`,
        units: badUnits,
        priority: 'high',
      })
    }

    // ── 5. TRAITS MAIS JOGADOS COM MAU RESULTADO ──
    const traitStats: Record<string, { count: number; placements: number[] }> = {}
    matches.forEach(m => {
      m.traits.forEach((t: any) => {
        const name = t.name.replace(/TFT\d+_/, '').replace(/([A-Z])/g, ' $1').trim()
        if (!traitStats[name]) traitStats[name] = { count: 0, placements: [] }
        traitStats[name].count++
        traitStats[name].placements.push(m.placement)
      })
    })

    const badTraits = Object.entries(traitStats)
      .filter(([, s]) => s.count >= 3)
      .map(([name, s]) => ({
        name,
        count: s.count,
        avgPlacement: s.placements.reduce((a, b) => a + b, 0) / s.placements.length,
      }))
      .filter(t => t.avgPlacement > 5.5)
      .sort((a, b) => b.avgPlacement - a.avgPlacement)
      .slice(0, 3)

    if (badTraits.length > 0) {
      insights.push({
        type: 'danger',
        category: 'composition',
        title: 'Traits que te afundam',
        detail: `Você ativa ${badTraits.map(t => `${t.name} (avg #${t.avgPlacement.toFixed(1)})`).join(', ')} com frequência mas com resultados ruins. Esses traits podem não ser fortes no meta atual ou você está forçando-os sem as peças certas.`,
        traits: badTraits,
        priority: 'high',
      })
    }

    // ── 6. BOA ECON ──
    if (avgGoldLeft <= 5 && avgLevel >= 8) {
      insights.push({
        type: 'success',
        category: 'econ',
        title: 'Gestão de ouro eficiente',
        detail: `Você gasta bem o ouro e chega ao nível ${avgLevel.toFixed(1)} consistentemente. Continue priorizando econ nos rounds de streak e gastando antes de morrer.`,
        priority: 'low',
      })
    }

    // ── 7. LATE GAME FRACO ──
    const top4Matches = matches.filter(m => m.top4)
    const bot4Matches = matches.filter(m => !m.top4)
    const avgRoundTop4 = top4Matches.length > 0
      ? top4Matches.reduce((a, m) => a + m.lastRound, 0) / top4Matches.length
      : 0
    const avgRoundBot4 = bot4Matches.length > 0
      ? bot4Matches.reduce((a, m) => a + m.lastRound, 0) / bot4Matches.length
      : 0

    if (avgRoundBot4 > 25 && bot4Matches.length >= 3) {
      insights.push({
        type: 'warning',
        category: 'late_game',
        title: 'Você sobrevive mas não converte',
        detail: `Nas suas derrotas, você chega ao round ${avgRoundBot4.toFixed(0)} em média — ou seja, não é eliminado cedo, mas não consegue converter para top4. Isso indica problema de transição de mid para late game: composição final fraca ou falta de 3 estrelas nos carries.`,
        metric: avgRoundBot4.toFixed(0),
        metricLabel: 'round médio nas derrotas',
        priority: 'medium',
      })
    }

    // Ordena por prioridade
    const order: Record<string, number> = { high: 0, medium: 1, low: 2 }
    insights.sort((a, b) => order[a.priority] - order[b.priority])

    res.json({
      totalAnalyzed: matches.length,
      insights,
      summary: {
        avgPlacement: parseFloat((matches.reduce((a, m) => a + m.placement, 0) / matches.length).toFixed(2)),
        avgLevel: parseFloat(avgLevel.toFixed(2)),
        avgGoldLeft: parseFloat(avgGoldLeft.toFixed(2)),
        avgDamage: parseFloat(avgDmg.toFixed(2)),
        top4Rate: parseFloat(((matches.filter(m => m.top4).length / matches.length) * 100).toFixed(1)),
        winRate: parseFloat(((matches.filter(m => m.win).length / matches.length) * 100).toFixed(1)),
      }
    })

  } catch (error: any) {
    console.error('ERRO insights:', error?.response?.data || error.message)
    res.status(500).json({ error: 'Erro ao gerar insights' })
  }
})

export default router
