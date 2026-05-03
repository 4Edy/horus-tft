// backend/src/services/riotService.ts
import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()

const RIOT_KEY = process.env.RIOT_API_KEY

const riotApi = axios.create({
  headers: {
    'X-Riot-Token': RIOT_KEY,
  },
})

export async function getAccountByRiotId(gameName: string, tagLine: string) {
  const res = await riotApi.get(
    `https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`
  )
  return res.data
}

export async function getSummonerByPuuid(puuid: string) {
  const res = await riotApi.get(
    `https://br1.api.riotgames.com/tft/summoner/v1/summoners/by-puuid/${puuid}`
  )
  return res.data
}

export async function getRankByPuuid(puuid: string) {
  try {
    const res = await riotApi.get(
      `https://br1.api.riotgames.com/tft/league/v1/by-puuid/${puuid}`
    )

    if (!Array.isArray(res.data) || res.data.length === 0) return null

    const ranked = res.data.find((e: any) => e.queueType === 'RANKED_TFT')
    return ranked ?? null
  } catch (err: any) {
    console.error('Erro ao buscar rank:', err?.response?.data || err.message)
    return null
  }
}

export async function getMatchIds(puuid: string, count = 20) {
  const res = await riotApi.get(
    `https://americas.api.riotgames.com/tft/match/v1/matches/by-puuid/${puuid}/ids?count=${count}`
  )
  return res.data
}

export async function getMatchDetail(matchId: string) {
  const res = await riotApi.get(
    `https://americas.api.riotgames.com/tft/match/v1/matches/${matchId}`
  )
  return res.data
}