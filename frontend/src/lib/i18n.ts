import { useEffect, useState, useCallback } from "react";

export type Lang = "pt" | "en";

const STORAGE_KEY = "horus-lang";

type Dict = {
  // Brand
  systemTagline: string;
  // Landing
  identifySummoner: string;
  riotIdHint: string;
  summonVision: string;
  invalidRiotId: string;
  // Invocation log
  logLocating: string;
  logAccessing: string;
  logProcessing: (n: number) => string;
  logPatterns: string;
  logGranted: string;
  logLost: string;
  retry: string;
  // Dossier
  back: string;
  powerGrade: string;
  patternAnalysis: string;
  battlesRecorded: string;
  avgPlacement: string;
  top4Domain: string;
  ascensions: string;
  battleRecords: string;
  powerTrajectory: string;
  matchLabel: string;
  placementLabel: string;
  patternsIdentified: string;
  mostSummonedUnits: string;
  dominantTraits: string;
  appearancesShort: string;
  activeTraits: string;
  summonedUnits: string;
  duration: string;
  damageDealt: string;
  finalRound: string;
  level: string;
  noRecords: string;
  // Verdicts
  verdictAscended: string;
  verdictHonor: string;
  verdictDomain: string;
  verdictDefeat: string;
  verdictCollapse: string;
  // Analytical verdict templates
  vInstability: (avg: string) => string;
  vInconsistency: (rate: string) => string;
  vPressure: string;
  vDominance: (rate: string) => string;
  vNeutral: string;
  vRankedLow: string;
  vRankedHigh: string;
  // Rank
  unranked: string;
  freshBlood: string;
  hotStreak: string;
  veteran: string;
  winsShort: string;
  lossesShort: string;
  // Time
  ago: (s: string) => string;
  // Oracle insights
  oracleRevelations: string;
  noWeaknesses: string;
  priorityHigh: string;
  priorityMedium: string;
  priorityLow: string;
  // Patterns toggle
  sortFrequency: string;
  sortPerformance: string;
  avgShort: string;
  // Nav
  metaNav: string;
  // Meta page
  metaTitle: string;
  metaSubtitle: string;
  tabCarries: string;
  tabComps: string;
  tabTierList: string;
  carriesItems: string;
  dominantComps: string;
  tierList: string;
  topBuilds: string;
  invokeRecommend: string;
  recommendHint: string;
  consultOracle: string;
  bestCarriesFor: string;
  totalGamesShort: string;
  top4Short: string;
  winShort: string;
  unitsLabel: string;
  traitsLabel: string;
  noResults: string;
};

const dictionaries: Record<Lang, Dict> = {
  pt: {
    systemTagline: "OMNISCIENT TACTICAL ANALYSIS SYSTEM v1.0",
    identifySummoner: "IDENTIFICAR INVOCADOR",
    riotIdHint: "Insira seu Riot ID no formato NickName#TAG",
    summonVision: "INVOCAR VISÃO",
    invalidRiotId: "Formato inválido. Use NickName#TAG",
    logLocating: "> LOCALIZANDO INVOCADOR...",
    logAccessing: "> ACESSANDO REGISTROS DE BATALHA...",
    logProcessing: (n) => `> PROCESSANDO ${n} PARTIDAS...`,
    logPatterns: "> PADRÕES IDENTIFICADOS.",
    logGranted: "> VISÃO CONCEDIDA.",
    logLost: "> SINAL PERDIDO.",
    retry: "TENTAR NOVAMENTE",
    back: "VOLTAR AO ORÁCULO",
    powerGrade: "GRAU DE PODER",
    patternAnalysis: "ANÁLISE DE PADRÕES",
    battlesRecorded: "BATALHAS REGISTRADAS",
    avgPlacement: "PLACEMENT MÉDIO",
    top4Domain: "DOMÍNIO TOP 4",
    ascensions: "ASCENSÕES",
    battleRecords: "REGISTROS DE BATALHA",
    powerTrajectory: "TRAJETÓRIA DE PODER",
    matchLabel: "PARTIDA",
    placementLabel: "PLACEMENT",
    patternsIdentified: "PADRÕES IDENTIFICADOS",
    mostSummonedUnits: "UNIDADES MAIS CONVOCADAS",
    dominantTraits: "TRAITS DOMINANTES",
    appearancesShort: "APARIÇÕES",
    activeTraits: "TRAÇOS ATIVOS",
    summonedUnits: "UNIDADES CONVOCADAS",
    duration: "DURAÇÃO",
    damageDealt: "DMG INFLIGIDO",
    finalRound: "ROUND FINAL",
    level: "NÍVEL",
    noRecords: "O OLHO NÃO ENCONTRA REGISTROS",
    verdictAscended: "ASCENDEU",
    verdictHonor: "HONRA",
    verdictDomain: "DOMÍNIO",
    verdictDefeat: "DERROTA",
    verdictCollapse: "COLAPSO",
    vInstability: (avg) => `Placement médio de #${avg} indica posicionamento instável.`,
    vInconsistency: (rate) => `Taxa top4 de ${rate}% — potencial identificado, execução inconsistente.`,
    vPressure: "0 vitórias nos últimos registros — pressão na fase final detectada.",
    vDominance: (rate) => `Taxa de vitória de ${rate}% — domínio sobre o tabuleiro confirmado.`,
    vNeutral: "Padrões em formação. O Olho continua observando.",
    vRankedLow: "Winrate ranked abaixo de 45% — consistência em desenvolvimento.",
    vRankedHigh: "Winrate ranked acima de 55% — domínio consistente identificado.",
    unranked: "SEM CLASSIFICAÇÃO",
    freshBlood: "SANGUE NOVO",
    hotStreak: "EM CHAMAS",
    veteran: "VETERANO",
    winsShort: "V",
    lossesShort: "D",
    ago: (s) => `${s} atrás`,
    oracleRevelations: "REVELAÇÕES DO ORÁCULO",
    noWeaknesses: "O OLHO NÃO DETECTA FRAQUEZAS APARENTES. CONTINUE OBSERVANDO.",
    priorityHigh: "CRÍTICO",
    priorityMedium: "ATENÇÃO",
    priorityLow: "INFO",
    sortFrequency: "FREQUÊNCIA",
    sortPerformance: "PERFORMANCE",
    avgShort: "MÉDIA",
    metaNav: "META",
    metaTitle: "O ORÁCULO DO META",
    metaSubtitle: "> DADOS DE MESTRE+ · NA & EUW · SET 17",
    tabCarries: "CARRIES & ITENS",
    tabComps: "COMPS DOMINANTES",
    tabTierList: "TIER LIST",
    carriesItems: "CARRIES & ITENS",
    dominantComps: "COMPS DOMINANTES",
    tierList: "TIER LIST",
    topBuilds: "MELHORES BUILDS",
    invokeRecommend: "INVOCAR RECOMENDAÇÃO",
    recommendHint: "Insira itens separados por vírgula. Ex: InfinityEdge, GuinsoosRageblade",
    consultOracle: "CONSULTAR O ORÁCULO",
    bestCarriesFor: "MELHORES CARRIES PARA",
    totalGamesShort: "JOGOS",
    top4Short: "TOP4",
    winShort: "WIN",
    unitsLabel: "UNIDADES",
    traitsLabel: "TRAITS",
    noResults: "SEM RESULTADOS",
  },
  en: {
    systemTagline: "OMNISCIENT TACTICAL ANALYSIS SYSTEM v1.0",
    identifySummoner: "IDENTIFY SUMMONER",
    riotIdHint: "Enter your Riot ID in NickName#TAG format",
    summonVision: "SUMMON VISION",
    invalidRiotId: "Invalid format. Use NickName#TAG",
    logLocating: "> LOCATING SUMMONER...",
    logAccessing: "> ACCESSING BATTLE RECORDS...",
    logProcessing: (n) => `> PROCESSING ${n} MATCHES...`,
    logPatterns: "> PATTERNS IDENTIFIED.",
    logGranted: "> VISION GRANTED.",
    logLost: "> SIGNAL LOST.",
    retry: "RETRY",
    back: "RETURN TO ORACLE",
    powerGrade: "POWER GRADE",
    patternAnalysis: "PATTERN ANALYSIS",
    battlesRecorded: "BATTLES RECORDED",
    avgPlacement: "AVG PLACEMENT",
    top4Domain: "TOP 4 DOMAIN",
    ascensions: "ASCENSIONS",
    battleRecords: "BATTLE RECORDS",
    powerTrajectory: "POWER TRAJECTORY",
    matchLabel: "MATCH",
    placementLabel: "PLACEMENT",
    patternsIdentified: "PATTERNS IDENTIFIED",
    mostSummonedUnits: "MOST SUMMONED UNITS",
    dominantTraits: "DOMINANT TRAITS",
    appearancesShort: "APPEARANCES",
    activeTraits: "ACTIVE TRAITS",
    summonedUnits: "SUMMONED UNITS",
    duration: "DURATION",
    damageDealt: "DMG DEALT",
    finalRound: "FINAL ROUND",
    level: "LEVEL",
    noRecords: "THE EYE FINDS NO RECORDS",
    verdictAscended: "ASCENDED",
    verdictHonor: "HONOR",
    verdictDomain: "DOMAIN",
    verdictDefeat: "DEFEAT",
    verdictCollapse: "COLLAPSE",
    vInstability: (avg) => `Average placement of #${avg} reveals unstable positioning.`,
    vInconsistency: (rate) => `Top4 rate of ${rate}% — potential present, execution inconsistent.`,
    vPressure: "Zero wins across recent records — late-game pressure detected.",
    vDominance: (rate) => `Win rate of ${rate}% — board dominance confirmed.`,
    vNeutral: "Patterns still forming. The Eye keeps watching.",
    vRankedLow: "Ranked winrate below 45% — consistency still developing.",
    vRankedHigh: "Ranked winrate above 55% — consistent dominance identified.",
    unranked: "UNRANKED",
    freshBlood: "FRESH BLOOD",
    hotStreak: "HOT STREAK",
    veteran: "VETERAN",
    winsShort: "W",
    lossesShort: "L",
    ago: (s) => `${s} ago`,
    oracleRevelations: "ORACLE REVELATIONS",
    noWeaknesses: "THE EYE DETECTS NO APPARENT WEAKNESSES. KEEP WATCHING.",
    priorityHigh: "CRITICAL",
    priorityMedium: "ATTENTION",
    priorityLow: "INFO",
    sortFrequency: "FREQUENCY",
    sortPerformance: "PERFORMANCE",
    avgShort: "AVG",
    metaNav: "META",
    metaTitle: "THE META ORACLE",
    metaSubtitle: "> MASTER+ DATA · NA & EUW · SET 17",
    tabCarries: "CARRIES & ITEMS",
    tabComps: "DOMINANT COMPS",
    tabTierList: "TIER LIST",
    carriesItems: "CARRIES & ITEMS",
    dominantComps: "DOMINANT COMPS",
    tierList: "TIER LIST",
    topBuilds: "TOP BUILDS",
    invokeRecommend: "INVOKE RECOMMENDATION",
    recommendHint: "Enter items separated by commas. e.g. InfinityEdge, GuinsoosRageblade",
    consultOracle: "CONSULT THE ORACLE",
    bestCarriesFor: "BEST CARRIES FOR",
    totalGamesShort: "GAMES",
    top4Short: "TOP4",
    winShort: "WIN",
    unitsLabel: "UNITS",
    traitsLabel: "TRAITS",
    noResults: "NO RESULTS",
  },
};

let listeners = new Set<() => void>();
let currentLang: Lang =
  (typeof window !== "undefined" && (localStorage.getItem(STORAGE_KEY) as Lang)) || "pt";

export function getLang(): Lang {
  return currentLang;
}

export function setLang(l: Lang) {
  currentLang = l;
  if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, l);
  listeners.forEach((fn) => fn());
}

export function useLang() {
  const [, force] = useState(0);
  useEffect(() => {
    const fn = () => force((x) => x + 1);
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);
  const t = dictionaries[currentLang];
  const toggle = useCallback(() => setLang(currentLang === "pt" ? "en" : "pt"), []);
  return { lang: currentLang, t, setLang, toggle };
}
