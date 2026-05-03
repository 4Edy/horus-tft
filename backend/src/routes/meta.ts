// backend/src/routes/meta.ts
import { Router, Request, Response } from 'express'
import { pool } from '../database'
import { runCollector, getCollectionStats } from '../services/collector'

const router = Router()

// Status da coleta
router.get('/status', async (req: Request, res: Response) => {
  try {
    res.json(await getCollectionStats())
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// Dispara coleta em background
router.post('/collect', async (req: Request, res: Response) => {
  res.json({ message: 'Coleta iniciada. Acompanhe em GET /meta/status' })
  runCollector(10).catch(console.error)
})

// Tier list de unidades
router.get('/units', async (req: Request, res: Response) => {
  try {
    const minSamples = parseInt(req.query.min as string) || 50
    const region = req.query.region as string
    const regionFilter = region ? `AND c.region = '${region}'` : ''

    const result = await pool.query(`
      SELECT
        cu.character_id,
        COUNT(*) as total_games,
        ROUND(AVG(c.placement)::numeric, 2) as avg_placement,
        ROUND(SUM(CASE WHEN c.top4 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) as top4_rate,
        ROUND(SUM(CASE WHEN c.win THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) as win_rate,
        ROUND(AVG(cu.tier)::numeric, 2) as avg_tier
      FROM comp_units cu
      JOIN compositions c ON cu.comp_id = c.id
      WHERE 1=1 ${regionFilter}
      GROUP BY cu.character_id
      HAVING COUNT(*) >= ${minSamples}
      ORDER BY avg_placement ASC
    `)

    res.json(result.rows.map((u: any) => ({
      ...u,
      name: u.character_id.replace(/TFT\d+_/, ''),
    })))
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// Tier list de traits
router.get('/traits', async (req: Request, res: Response) => {
  try {
    const minSamples = parseInt(req.query.min as string) || 30
    const region = req.query.region as string
    const regionFilter = region ? `AND c.region = '${region}'` : ''

    const result = await pool.query(`
      SELECT
        ct.trait_name,
        ct.tier_current,
        COUNT(*) as total_games,
        ROUND(AVG(c.placement)::numeric, 2) as avg_placement,
        ROUND(SUM(CASE WHEN c.top4 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) as top4_rate,
        ROUND(SUM(CASE WHEN c.win THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) as win_rate
      FROM comp_traits ct
      JOIN compositions c ON ct.comp_id = c.id
      WHERE ct.tier_current > 0 ${regionFilter}
      GROUP BY ct.trait_name, ct.tier_current
      HAVING COUNT(*) >= ${minSamples}
      ORDER BY avg_placement ASC
    `)

    res.json(result.rows.map((t: any) => ({
      ...t,
      name: t.trait_name.replace(/TFT\d+_/, '').replace(/([A-Z])/g, ' $1').trim(),
    })))
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// Melhores itens por carry (top carries com seus melhores item combos)
router.get('/items', async (req: Request, res: Response) => {
  try {
    const minSamples = parseInt(req.query.min as string) || 20
    const region = req.query.region as string
    const regionFilter = region ? `AND c.region = '${region}'` : ''

    // Busca carries com itens e seus resultados
    const result = await pool.query(`
      SELECT
        cu.character_id,
        cu.items::text as items,
        COUNT(*) as total_games,
        ROUND(AVG(c.placement)::numeric, 2) as avg_placement,
        ROUND(SUM(CASE WHEN c.top4 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) as top4_rate,
        ROUND(SUM(CASE WHEN c.win THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) as win_rate
      FROM comp_units cu
      JOIN compositions c ON cu.comp_id = c.id
      WHERE cu.items::text != '[]'
        AND jsonb_array_length(cu.items) >= 2
        ${regionFilter}
      GROUP BY cu.character_id, cu.items::text
      HAVING COUNT(*) >= ${minSamples}
      ORDER BY cu.character_id, avg_placement ASC
    `)

    // Agrupa por campeão
    const byChampion: Record<string, any[]> = {}
    for (const row of result.rows) {
      const name = row.character_id.replace(/TFT\d+_/, '')
      if (!byChampion[name]) byChampion[name] = []
      
      let items: string[] = []
      try {
        items = JSON.parse(row.items)
          .map((i: string) => i.replace('TFT_Item_', '').replace('TFT17_Item_', '').replace('TFT4_Item_', ''))
          .filter((i: string) => !i.includes('EmptyBag'))
      } catch { items = [] }

      byChampion[name].push({
        items,
        totalGames: parseInt(row.total_games),
        avgPlacement: parseFloat(row.avg_placement),
        top4Rate: parseFloat(row.top4_rate),
        winRate: parseFloat(row.win_rate),
      })
    }

    // Retorna top 3 builds por campeão, só carries relevantes (avg placement < 4.5)
    const carries = Object.entries(byChampion)
      .map(([name, builds]) => ({
        name,
        bestBuilds: builds.slice(0, 3),
        bestPlacement: builds[0]?.avgPlacement ?? 9,
      }))
      .filter(c => c.bestPlacement < 4.5)
      .sort((a, b) => a.bestPlacement - b.bestPlacement)

    res.json(carries)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// Comps mais fortes (agrupadas por combinação de traits dominantes)
router.get('/comps', async (req: Request, res: Response) => {
  try {
    const minSamples = parseInt(req.query.min as string) || 15
    const region = req.query.region as string
    const regionFilter = region ? `AND c.region = '${region}'` : ''

    // Busca composições top4 com suas traits e units principais
    const result = await pool.query(`
      SELECT
        c.id as comp_id,
        c.placement,
        c.top4,
        c.win,
        c.level,
        c.region,
        array_agg(DISTINCT ct.trait_name ORDER BY ct.trait_name) FILTER (WHERE ct.tier_current >= 2) as active_traits,
        array_agg(DISTINCT cu.character_id ORDER BY cu.character_id) as units
      FROM compositions c
      LEFT JOIN comp_traits ct ON ct.comp_id = c.id AND ct.tier_current >= 2
      LEFT JOIN comp_units cu ON cu.comp_id = c.id AND cu.tier >= 2
      WHERE 1=1 ${regionFilter}
      GROUP BY c.id, c.placement, c.top4, c.win, c.level, c.region
      HAVING array_length(array_agg(DISTINCT ct.trait_name) FILTER (WHERE ct.tier_current >= 2), 1) >= 1
    `)

    // Agrupa comps similares por traits ativas
    const compGroups: Record<string, any> = {}
    
    for (const row of result.rows) {
      if (!row.active_traits || row.active_traits.length === 0) continue
      
      // Cria chave baseada nas traits ativas principais (top 3)
      const key = (row.active_traits || [])
        .slice(0, 3)
        .sort()
        .join('|')

      if (!compGroups[key]) {
        compGroups[key] = {
          traits: (row.active_traits || []).map((t: string) => 
            t.replace(/TFT\d+_/, '').replace(/([A-Z])/g, ' $1').trim()
          ),
          placements: [],
          wins: 0,
          top4s: 0,
          total: 0,
          sampleUnits: row.units || [],
        }
      }

      compGroups[key].placements.push(row.placement)
      compGroups[key].total++
      if (row.top4) compGroups[key].top4s++
      if (row.win) compGroups[key].wins++
    }

    // Calcula stats e filtra por amostra mínima
    const comps = Object.values(compGroups)
      .filter((g: any) => g.total >= minSamples)
      .map((g: any) => ({
        traits: g.traits,
        totalGames: g.total,
        avgPlacement: parseFloat((g.placements.reduce((a: number, b: number) => a + b, 0) / g.placements.length).toFixed(2)),
        top4Rate: parseFloat((g.top4s * 100 / g.total).toFixed(1)),
        winRate: parseFloat((g.wins * 100 / g.total).toFixed(1)),
        sampleUnits: g.sampleUnits
          .slice(0, 8)
          .map((u: string) => u.replace(/TFT\d+_/, '')),
      }))
      .sort((a: any, b: any) => a.avgPlacement - b.avgPlacement)
      .slice(0, 20)

    res.json(comps)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// Motor de recomendação: dado itens, sugere comps e carries
router.post('/recommend', async (req: Request, res: Response) => {
  try {
    const { items = [] } = req.body

    if (items.length === 0) {
      return res.status(400).json({ error: 'Informe ao menos um item' })
    }

    const recommendations = []

    for (const item of items) {
      const result = await pool.query(`
        SELECT
          cu.character_id,
          ROUND(AVG(c.placement)::numeric, 2) as avg_placement,
          COUNT(*) as count,
          ROUND(SUM(CASE WHEN c.top4 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) as top4_rate,
          ROUND(SUM(CASE WHEN c.win THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) as win_rate
        FROM comp_units cu
        JOIN compositions c ON cu.comp_id = c.id
        WHERE cu.items::text ILIKE $1
        GROUP BY cu.character_id
        HAVING COUNT(*) >= 10
        ORDER BY avg_placement ASC
        LIMIT 5
      `, [`%${item}%`])

      recommendations.push({
        item: item.replace('TFT_Item_', '').replace('TFT17_Item_', ''),
        bestCarries: result.rows.map((r: any) => ({
          name: r.character_id.replace(/TFT\d+_/, ''),
          avgPlacement: parseFloat(r.avg_placement),
          top4Rate: parseFloat(r.top4_rate),
          winRate: parseFloat(r.win_rate),
          count: parseInt(r.count),
        }))
      })
    }

    res.json({ recommendations })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router