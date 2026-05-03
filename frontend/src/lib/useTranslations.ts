// frontend/src/lib/useTranslations.ts
import { useEffect, useState } from 'react'
import { horusApi } from './horus-api'
import { getLang } from './i18n'

export type TranslationDict = {
  champions: Record<string, string>
  items: Record<string, string>
  traits: Record<string, string>
}

// Cache global para não rebuscar a cada componente
let globalCache: TranslationDict | null = null
let fetchPromise: Promise<TranslationDict> | null = null

async function fetchTranslations(): Promise<TranslationDict> {
  if (globalCache) return globalCache
  if (fetchPromise) return fetchPromise

  fetchPromise = horusApi
    .get<TranslationDict>('/translations')
    .then((r) => {
      globalCache = r.data
      return r.data
    })
    .catch(() => ({ champions: {}, items: {}, traits: {} }))

  return fetchPromise
}

// Hook para usar as traduções em componentes React
export function useTranslations() {
  const [dict, setDict] = useState<TranslationDict>(
    globalCache ?? { champions: {}, items: {}, traits: {} }
  )

  useEffect(() => {
    fetchTranslations().then(setDict)
  }, [])

  return dict
}

// Função pura para traduzir (usa cache global)
export function translateName(
  raw: string,
  type: 'champion' | 'item' | 'trait' | 'auto' = 'auto'
): string {
  if (!globalCache) return raw
  const lang = getLang()
  if (lang !== 'pt') return raw

  const { champions, items, traits } = globalCache

  if (type === 'champion') return champions[raw] ?? raw
  if (type === 'item') return items[raw] ?? raw
  if (type === 'trait') return traits[raw] ?? raw

  // auto: tenta em ordem
  return champions[raw] ?? items[raw] ?? traits[raw] ?? raw
}

// Pré-carrega as traduções (chamar no App root)
export function preloadTranslations() {
  fetchTranslations()
}
