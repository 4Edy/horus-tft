// backend/src/routes/translations.ts
import { Router, Request, Response } from 'express'
import axios from 'axios'

const router = Router()

let cache: {
  champions: Record<string, string>
  items: Record<string, string>
  traits: Record<string, string>
  cachedAt: number
} | null = null

const CACHE_TTL = 1000 * 60 * 60 * 6 // 6 horas

async function getLatestVersion(): Promise<string> {
  const { data } = await axios.get('https://ddragon.leagueoflegends.com/api/versions.json')
  return data[0]
}

async function buildTranslations() {
  if (cache && Date.now() - cache.cachedAt < CACHE_TTL) return cache

  const version = await getLatestVersion()
  const base = `https://ddragon.leagueoflegends.com/cdn/${version}/data`

  const [champEN, champPT, itemEN, itemPT, traitEN, traitPT] = await Promise.all([
    axios.get(`${base}/en_US/tft-champion.json`).then(r => r.data),
    axios.get(`${base}/pt_BR/tft-champion.json`).then(r => r.data),
    axios.get(`${base}/en_US/tft-item.json`).then(r => r.data),
    axios.get(`${base}/pt_BR/tft-item.json`).then(r => r.data),
    axios.get(`${base}/en_US/tft-trait.json`).then(r => r.data),
    axios.get(`${base}/pt_BR/tft-trait.json`).then(r => r.data),
  ])

  const champions: Record<string, string> = {}
  const items: Record<string, string> = {}
  const traits: Record<string, string> = {}

  // Campeões: extrai nome simples do path como chave
  // ex: "Maps/.../TFTSet17/Shop/Bard" -> chave "Bard" -> valor "Bardo"
  for (const [id, champData] of Object.entries(champEN.data as Record<string, any>)) {
    const ptData = (champPT.data as Record<string, any>)[id]
    if (!ptData) continue

    const enName: string = champData.name ?? ''
    const ptName: string = ptData.name ?? ''

    // Só mapeia se os nomes forem diferentes
    if (enName && ptName && enName !== ptName) {
      // Chave pelo nome EN completo
      champions[enName] = ptName
      // Chave pelo nome EN sem espaços
      champions[enName.replace(/\s+/g, '')] = ptName
    }

    // Extrai o ID simples do path (ex: "Bard" de ".../Shop/Bard")
    const simpleId = id.split('/').pop() ?? id
    if (simpleId && ptName) {
      champions[simpleId] = ptName
      // Também sem prefixo TFT (ex: TFT17_Bard -> Bardo)
      const cleanId = simpleId.replace(/^TFT\d+_/i, '')
      if (cleanId !== simpleId) champions[cleanId] = ptName
    }
  }

  // Itens: mapeia nome EN → nome PT
  for (const [id, itemData] of Object.entries(itemEN.data as Record<string, any>)) {
    const ptData = (itemPT.data as Record<string, any>)[id]
    if (!ptData) continue

    const enName: string = itemData.name ?? ''
    const ptName: string = ptData.name ?? ''

    if (enName && ptName && enName !== ptName) {
      items[enName] = ptName
      // Sem espaços (como vem do cleanName)
      items[enName.replace(/\s+/g, '')] = ptName
      // Sem apóstrofos e espaços
      items[enName.replace(/['\s]/g, '')] = ptName
    }
  }

  // Traits: mapeia nome EN → nome PT
  for (const [id, traitData] of Object.entries(traitEN.data as Record<string, any>)) {
    const ptData = (traitPT.data as Record<string, any>)[id]
    if (!ptData) continue

    const enName: string = traitData.name ?? ''
    const ptName: string = ptData.name ?? ''

    if (enName && ptName && enName !== ptName) {
      traits[enName] = ptName
      traits[enName.replace(/\s+/g, '')] = ptName
    }
  }

  cache = { champions, items, traits, cachedAt: Date.now() }
  return cache
}

router.get('/', async (req: Request, res: Response) => {
  try {
    const translations = await buildTranslations()
    res.json({
      champions: translations.champions,
      items: translations.items,
      traits: translations.traits,
      version: new Date(translations.cachedAt).toISOString(),
    })
  } catch (err: any) {
    console.error('Erro ao buscar traduções:', err.message)
    res.json({ champions: {}, items: {}, traits: {} })
  }
})

router.post('/refresh', async (req: Request, res: Response) => {
  cache = null
  try {
    await buildTranslations()
    res.json({ message: 'Cache atualizado' })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router