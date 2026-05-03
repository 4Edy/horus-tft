// frontend/src/lib/horus-format.ts
import type { Lang } from "./i18n";

/**
 * Strip TFT##_ prefix and split CamelCase into spaced words.
 *  TFT17_Ezreal -> Ezreal
 *  TFT17_HPTank -> HP Tank
 *  TFT_Item_InfinityEdge -> Infinity Edge
 */
export function cleanName(raw: string): string {
  if (!raw) return "";
  let s = raw
    .replace(/^TFT\d+_/i, "")
    .replace(/^TFT_Item_/i, "")
    .replace(/^TFT\d+_Item_/i, "")
    .replace(/^TFT\d+_AnimaSquadItem_Tier\d+_/i, "")
    .replace(/^TFT_/i, "")
    .replace(/^Set\d+_/i, "");

  // Split CamelCase
  s = s.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
  s = s.replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2");
  return s.trim();
}

/**
 * Traduz um nome para PT-BR usando o dicionário do Data Dragon.
 * Se o idioma for EN ou não houver tradução, usa cleanName como fallback.
 */
export function localizedName(
  raw: string,
  dict: { champions: Record<string, string>; items: Record<string, string>; traits: Record<string, string> } | null,
  lang: Lang,
  type: "champion" | "item" | "trait" | "auto" = "auto"
): string {
  const clean = cleanName(raw);
  if (lang !== "pt" || !dict) return clean;

  if (type === "champion") return dict.champions[clean] ?? clean;
  if (type === "item") return dict.items[clean] ?? dict.items[raw] ?? clean;
  if (type === "trait") return dict.traits[clean] ?? clean;

  // auto: tenta champion primeiro, depois item, depois trait
  return dict.champions[clean] ?? dict.items[clean] ?? dict.items[raw] ?? dict.traits[clean] ?? clean;
}

export function formatRelativeTime(ts: number, lang: Lang): string {
  const diffMs = Date.now() - ts;
  const sec = Math.round(diffMs / 1000);
  const rtf = new Intl.RelativeTimeFormat(lang === "pt" ? "pt-BR" : "en", {
    numeric: "auto",
    style: "short",
  });
  const ranges: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 60 * 60 * 24 * 365],
    ["month", 60 * 60 * 24 * 30],
    ["week", 60 * 60 * 24 * 7],
    ["day", 60 * 60 * 24],
    ["hour", 60 * 60],
    ["minute", 60],
    ["second", 1],
  ];
  for (const [unit, secs] of ranges) {
    if (Math.abs(sec) >= secs || unit === "second") {
      const v = Math.round(sec / secs);
      return rtf.format(-v, unit);
    }
  }
  return "";
}

export function formatDuration(seconds: number): string {
  const m = Math.round(seconds / 60);
  return `${m} min`;
}

export type VerdictKey = "ASCENDED" | "HONOR" | "DOMAIN" | "DEFEAT" | "COLLAPSE";

export function placementVerdict(placement: number): {
  key: VerdictKey;
  color: "gold" | "silver" | "bronze" | "cyan" | "red" | "deepRed";
} {
  if (placement === 1) return { key: "ASCENDED", color: "gold" };
  if (placement === 2) return { key: "HONOR", color: "silver" };
  if (placement === 3) return { key: "HONOR", color: "bronze" };
  if (placement === 4) return { key: "DOMAIN", color: "cyan" };
  if (placement <= 6) return { key: "DEFEAT", color: "red" };
  return { key: "COLLAPSE", color: "deepRed" };
}

export function parseRiotId(input: string): { gameName: string; tagLine: string } | null {
  const trimmed = input.trim();
  const idx = trimmed.lastIndexOf("#");
  if (idx <= 0 || idx === trimmed.length - 1) return null;
  const gameName = trimmed.slice(0, idx).trim();
  const tagLine = trimmed.slice(idx + 1).trim();
  if (!gameName || !tagLine) return null;
  return { gameName, tagLine };
}

export function buildVerdict(
  stats: { avgPlacement: number; top4Rate: number; winRate: number },
  t: {
    vInstability: (avg: string) => string;
    vInconsistency: (rate: string) => string;
    vPressure: string;
    vDominance: (rate: string) => string;
    vNeutral: string;
    vRankedLow: string;
    vRankedHigh: string;
  },
  rank?: { wins: number; losses: number } | null,
): string[] {
  const lines: string[] = [];
  if (stats.avgPlacement > 5) lines.push(t.vInstability(stats.avgPlacement.toFixed(1)));
  if (stats.top4Rate < 50) lines.push(t.vInconsistency(stats.top4Rate.toFixed(0)));
  if (stats.winRate === 0) lines.push(t.vPressure);
  if (stats.winRate > 20) lines.push(t.vDominance(stats.winRate.toFixed(0)));
  if (rank && rank.wins + rank.losses > 0) {
    const wr = rank.wins / (rank.wins + rank.losses);
    if (wr < 0.45) lines.push(t.vRankedLow);
    else if (wr > 0.55) lines.push(t.vRankedHigh);
  }
  if (lines.length === 0) lines.push(t.vNeutral);
  return lines;
}