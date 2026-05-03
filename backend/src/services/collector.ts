// backend/src/services/collector.ts
import axios from 'axios'
import { pool } from '../database'
import dotenv from 'dotenv'

dotenv.config()

console.log('API KEY:', process.env.RIOT_API_KEY?.substring(0, 15) + '...')

const RIOT_KEY = process.env.RIOT_API_KEY

const riotApi = axios.create({
  headers: { 'X-Riot-Token': RIOT_KEY },
})

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

const rateLimitedGet = async (url: string, retries = 3): Promise<any> => {
  for (let i = 0; i < retries; i++) {
    try {
      await sleep(1200)
      const res = await riotApi.get(url)
      return res.data
    } catch (err: any) {
      if (err?.response?.status === 429) {
        const retryAfter = parseInt(err.response.headers['retry-after'] || '10') * 1000
        console.log(`⏳ Rate limit. Aguardando ${retryAfter / 1000}s...`)
        await sleep(retryAfter)
      } else if (i === retries - 1) {
        throw err
      }
    }
  }
}

// Todas as 4 regiões em sequência: BR → KR → NA → EUW
const ALL_REGIONS = [
  {
    name: 'BR',
    platform: 'br1',
    matchRegion: 'americas',
    challengerUrl: 'https://br1.api.riotgames.com/tft/league/v1/challenger?queue=RANKED_TFT',
    grandmasterUrl: 'https://br1.api.riotgames.com/tft/league/v1/grandmaster?queue=RANKED_TFT',
    masterUrl: 'https://br1.api.riotgames.com/tft/league/v1/master?queue=RANKED_TFT',
  },
  {
    name: 'KR',
    platform: 'kr',
    matchRegion: 'asia',
    challengerUrl: 'https://kr.api.riotgames.com/tft/league/v1/challenger?queue=RANKED_TFT',
    grandmasterUrl: 'https://kr.api.riotgames.com/tft/league/v1/grandmaster?queue=RANKED_TFT',
    masterUrl: 'https://kr.api.riotgames.com/tft/league/v1/master?queue=RANKED_TFT',
  },
  {
    name: 'NA',
    platform: 'na1',
    matchRegion: 'americas',
    challengerUrl: 'https://na1.api.riotgames.com/tft/league/v1/challenger?queue=RANKED_TFT',
    grandmasterUrl: 'https://na1.api.riotgames.com/tft/league/v1/grandmaster?queue=RANKED_TFT',
    masterUrl: 'https://na1.api.riotgames.com/tft/league/v1/master?queue=RANKED_TFT',
  },
  {
    name: 'EUW',
    platform: 'euw1',
    matchRegion: 'europe',
    challengerUrl: 'https://euw1.api.riotgames.com/tft/league/v1/challenger?queue=RANKED_TFT',
    grandmasterUrl: 'https://euw1.api.riotgames.com/tft/league/v1/grandmaster?queue=RANKED_TFT',
    masterUrl: 'https://euw1.api.riotgames.com/tft/league/v1/master?queue=RANKED_TFT',
  },
]

// Quais regiões já foram coletadas nessa sessão (evita reprocessar)
const collectedThisSession = new Set<string>()

async function getTopPlayerPuuids(region: typeof ALL_REGIONS[0]): Promise<string[]> {
  console.log(`\n🔍 Buscando Mestre+ em ${region.name}...`)

  const [challenger, grandmaster, master] = await Promise.all([
    rateLimitedGet(region.challengerUrl),
    rateLimitedGet(region.grandmasterUrl),
    rateLimitedGet(region.masterUrl),
  ])

  const allEntries = [
    ...(challenger?.entries || []),
    ...(grandmaster?.entries || []),
    ...(master?.entries || []),
  ].sort((a: any, b: any) => b.leaguePoints - a.leaguePoints).slice(0, 50)

  console.log(`✅ ${allEntries.length} jogadores encontrados em ${region.name}`)

  const puuids: string[] = []
  for (const entry of allEntries) {
    try {
      if (entry.puuid) {
        puuids.push(entry.puuid)
        continue
      }
      if (entry.summonerId) {
        const summoner = await rateLimitedGet(
          `https://${region.platform}.api.riotgames.com/tft/summoner/v1/summoners/${entry.summonerId}`
        )
        if (summoner?.puuid) puuids.push(summoner.puuid)
      }
    } catch (e: any) {
      console.log('Erro ao buscar PUUID:', e?.response?.status, e?.message)
    }
  }

  console.log(`✅ ${puuids.length} PUUIDs coletados em ${region.name}`)
  return puuids
}

async function saveMatch(matchData: any, region: string): Promise<boolean> {
  const matchId = matchData.metadata.match_id
  const client = await pool.connect()

  try {
    const exists = await client.query(
      'SELECT match_id FROM collected_matches WHERE match_id = $1', [matchId]
    )
    if (exists.rows.length > 0) return false

    await client.query('BEGIN')

    await client.query(
      'INSERT INTO collected_matches (match_id, region, game_datetime, game_version) VALUES ($1, $2, $3, $4)',
      [matchId, region, matchData.info.game_datetime, matchData.info.game_version]
    )

    for (const player of matchData.info.participants) {
      const compRes = await client.query(
        `INSERT INTO compositions (match_id, region, placement, level, last_round, gold_left, damage, top4, win, game_datetime)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
        [
          matchId, region,
          player.placement, player.level, player.last_round,
          player.gold_left, player.total_damage_to_players,
          player.placement <= 4, player.placement === 1,
          matchData.info.game_datetime,
        ]
      )

      const compId = compRes.rows[0].id

      for (const unit of player.units) {
        await client.query(
          'INSERT INTO comp_units (comp_id, character_id, tier, items) VALUES ($1, $2, $3, $4)',
          [compId, unit.character_id, unit.tier, JSON.stringify(unit.itemNames || [])]
        )
      }

      for (const trait of player.traits.filter((t: any) => t.tier_current > 0)) {
        await client.query(
          'INSERT INTO comp_traits (comp_id, trait_name, num_units, tier_current, tier_total) VALUES ($1, $2, $3, $4, $5)',
          [compId, trait.name, trait.num_units, trait.tier_current, trait.tier_total]
        )
      }

      for (const aug of (player.augments || [])) {
        await client.query(
          'INSERT INTO comp_augments (comp_id, augment_name) VALUES ($1, $2)',
          [compId, aug]
        )
      }
    }

    await client.query('COMMIT')
    return true
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

async function collectPlayerMatches(puuid: string, region: typeof ALL_REGIONS[0], count = 10): Promise<number> {
  try {
    const matchIds = await rateLimitedGet(
      `https://${region.matchRegion}.api.riotgames.com/tft/match/v1/matches/by-puuid/${puuid}/ids?count=${count}`
    )

    let saved = 0
    for (const matchId of matchIds) {
      const exists = await pool.query(
        'SELECT match_id FROM collected_matches WHERE match_id = $1', [matchId]
      )
      if (exists.rows.length > 0) continue

      const matchData = await rateLimitedGet(
        `https://${region.matchRegion}.api.riotgames.com/tft/match/v1/matches/${matchId}`
      )

      if (matchData && await saveMatch(matchData, region.name)) saved++
    }
    return saved
  } catch (e) {
    return 0
  }
}

async function collectRegion(region: typeof ALL_REGIONS[0], matchesPerPlayer = 10) {
  // Pula regiões já coletadas nessa sessão
  if (collectedThisSession.has(region.name)) {
    console.log(`⏭️  ${region.name} já coletado nessa sessão, pulando...`)
    return 0
  }

  const logRes = await pool.query(
    "INSERT INTO collection_log (region, status) VALUES ($1, 'running') RETURNING id",
    [region.name]
  )
  const logId = logRes.rows[0].id

  try {
    const puuids = await getTopPlayerPuuids(region)

    if (puuids.length === 0) {
      console.log(`⚠️ Nenhum PUUID coletado em ${region.name}, pulando...`)
      await pool.query("UPDATE collection_log SET status = 'skipped' WHERE id = $1", [logId])
      return 0
    }

    let regionMatches = 0
    for (let i = 0; i < puuids.length; i++) {
      const saved = await collectPlayerMatches(puuids[i], region, matchesPerPlayer)
      regionMatches += saved
      process.stdout.write(`\r${region.name}: ${i + 1}/${puuids.length} jogadores | ${regionMatches} partidas novas`)
    }

    console.log(`\n✅ ${region.name}: ${regionMatches} partidas coletadas`)
    collectedThisSession.add(region.name)

    await pool.query(
      "UPDATE collection_log SET status = 'done', matches_collected = $1, finished_at = EXTRACT(EPOCH FROM NOW()) WHERE id = $2",
      [regionMatches, logId]
    )

    return regionMatches
  } catch (err: any) {
    console.error(`\n❌ Erro em ${region.name}:`, err.message)
    await pool.query("UPDATE collection_log SET status = 'error' WHERE id = $1", [logId])
    return 0
  }
}

// Roda todas as 4 regiões em sequência: BR → KR → NA → EUW
export async function runCollector(matchesPerPlayer = 10) {
  console.log('\n👁️  HORUS COLLECTOR iniciado — 4 regiões: BR → KR → NA → EUW')

  let totalNew = 0
  for (const region of ALL_REGIONS) {
    totalNew += await collectRegion(region, matchesPerPlayer)
  }

  const total = await pool.query('SELECT COUNT(*) as count FROM collected_matches')
  console.log(`\n✅ Coleta finalizada! Total no banco: ${total.rows[0].count} partidas (${totalNew} novas)`)
}

export async function getCollectionStats() {
  const [total, comps, byRegion, logs] = await Promise.all([
    pool.query('SELECT COUNT(*) as count FROM collected_matches'),
    pool.query('SELECT COUNT(*) as count FROM compositions'),
    pool.query('SELECT region, COUNT(*) as count FROM collected_matches GROUP BY region'),
    pool.query('SELECT * FROM collection_log ORDER BY id DESC LIMIT 10'),
  ])

  return {
    totalMatches: parseInt(total.rows[0].count),
    totalComps: parseInt(comps.rows[0].count),
    byRegion: byRegion.rows,
    lastCollections: logs.rows,
  }
}