import axios from "axios";

const baseURL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:3001";

export const horusApi = axios.create({
  baseURL,
  timeout: 20000,
});

export type RankInfo = {
  queueType: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  veteran: boolean;
  freshBlood: boolean;
  hotStreak: boolean;
};

export type SummonerResponse = {
  account: { puuid: string; gameName: string; tagLine: string };
  summoner: { summonerLevel: number; profileIconId: number };
  rank?: RankInfo | null;
};

export type Trait = {
  name: string;
  numUnits: number;
  tierCurrent: number;
  tierTotal: number;
};

export type Unit = {
  characterId: string;
  tier: number;
  items?: Array<string | number>;
};

export type Match = {
  matchId: string;
  gameDatetime: number;
  gameLength: number;
  placement: number;
  level: number;
  lastRound: number;
  totalDamageToPlayers: number;
  traits: Trait[];
  units: Unit[];
  top4: boolean;
  win: boolean;
};

export type HistoryResponse = {
  stats: {
    totalGames: number;
    avgPlacement: number;
    top4Rate: number;
    winRate: number;
  };
  history: Match[];
};

export async function fetchSummoner(gameName: string, tagLine: string) {
  const { data } = await horusApi.get<SummonerResponse>(
    `/summoner/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`,
  );
  return data;
}

export async function fetchHistory(gameName: string, tagLine: string) {
  const { data } = await horusApi.get<HistoryResponse>(
    `/matches/history/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`,
  );
  return data;
}

export type InsightUnit = { name: string; count: number; avgPlacement: number };
export type InsightTrait = { name: string; count: number; avgPlacement: number };
export type Insight = {
  type: "danger" | "warning" | "success" | "info";
  category: string;
  title: string;
  detail: string;
  units?: InsightUnit[];
  traits?: InsightTrait[];
  metric?: string;
  metricLabel?: string;
  priority: "high" | "medium" | "low";
};
export type InsightsResponse = {
  totalAnalyzed: number;
  insights: Insight[];
  summary?: {
    avgPlacement: number;
    avgLevel: number;
    avgGoldLeft: number;
    avgDamage: number;
    top4Rate: number;
    winRate: number;
  };
};

export async function fetchInsights(gameName: string, tagLine: string) {
  const { data } = await horusApi.get<InsightsResponse>(
    `/insights/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`,
  );
  return data;
}

// ── META TYPES ──────────────────────────────────────────────
// Backend retorna arrays diretamente, sem wrapper

export type MetaItemBuild = {
  items: string[];
  totalGames: number;
  avgPlacement: number;
  top4Rate: number;
  winRate: number;
};

export type MetaCarry = {
  name: string;
  bestPlacement: number;
  avgPlacement: number;
  bestBuilds: MetaItemBuild[];
};

export type MetaComp = {
  traits: string[];
  sampleUnits: string[];
  totalGames: number;
  avgPlacement: number;
  top4Rate: number;
  winRate: number;
};

export type MetaUnit = {
  name: string;
  character_id?: string;
  total_games: number | string;
  avg_placement: number | string;
  top4_rate: number | string;
  win_rate?: number | string;
  // aliases usados no TierPanel
  avgPlacement: number;
  top4Rate: number;
};

export type MetaTrait = MetaUnit;

// Backend retorna array direto: MetaCarry[]
export async function fetchMetaItems(min = 10): Promise<MetaCarry[]> {
  const { data } = await horusApi.get<MetaCarry[]>(`/meta/items`, {
    params: { min },
  });
  return Array.isArray(data) ? data : [];
}

// Backend retorna array direto: MetaComp[]
export async function fetchMetaComps(min = 5): Promise<MetaComp[]> {
  const { data } = await horusApi.get<MetaComp[]>(`/meta/comps`, {
    params: { min },
  });
  return Array.isArray(data) ? data : [];
}

// Backend retorna array direto com campos snake_case
export async function fetchMetaUnits(min = 50): Promise<MetaUnit[]> {
  const { data } = await horusApi.get<any[]>(`/meta/units`, {
    params: { min },
  });
  if (!Array.isArray(data)) return [];
  return data.map((u) => ({
    ...u,
    avgPlacement: parseFloat(u.avg_placement),
    top4Rate: parseFloat(u.top4_rate),
  }));
}

// Backend retorna array direto com campos snake_case
export async function fetchMetaTraits(min = 10): Promise<MetaTrait[]> {
  const { data } = await horusApi.get<any[]>(`/meta/traits`, {
    params: { min },
  });
  if (!Array.isArray(data)) return [];
  return data.map((t) => ({
    ...t,
    avgPlacement: parseFloat(t.avg_placement),
    top4Rate: parseFloat(t.top4_rate),
  }));
}

export type RecommendResponse = {
  recommendations: {
    item: string;
    bestCarries: {
      name: string;
      avgPlacement: number;
      top4Rate: number;
      winRate: number;
      count: number;
    }[];
  }[];
};

export async function postMetaRecommend(items: string[]) {
  const { data } = await horusApi.post<RecommendResponse>(`/meta/recommend`, { items });
  return data;
}

export function profileIconUrl(iconId: number) {
  return `https://ddragon.leagueoflegends.com/cdn/15.8.1/img/profileicon/${iconId}.png`;
}