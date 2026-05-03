import { motion } from "framer-motion";
import type { RankInfo } from "@/lib/horus-api";
import { useLang } from "@/lib/i18n";
import { RankEmblem, tierTheme } from "./RankEmblem";

export function RankBlock({ rank }: { rank?: RankInfo | null }) {
  const { t } = useLang();

  if (!rank) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex items-center justify-center border border-border/50 bg-surface-2/40 px-6 py-4 clip-tablet-sm"
      >
        <span className="font-mono text-[11px] uppercase tracking-[0.4em] text-muted-foreground">
          ◆ {t.unranked} ◆
        </span>
      </motion.div>
    );
  }

  const theme = tierTheme(rank.tier);
  const total = rank.wins + rank.losses;
  const winrate = total > 0 ? ((rank.wins / total) * 100).toFixed(1) : "0.0";
  const tierLabel = rank.tier
    ? rank.tier.charAt(0) + rank.tier.slice(1).toLowerCase()
    : "Unranked";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="relative border border-border/60 bg-surface-2/50 p-5 clip-tablet noise"
      style={{
        boxShadow: `inset 0 0 0 1px ${theme.glow}, 0 0 24px ${theme.glow}`,
      }}
    >
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center"
          style={{ color: theme.color, filter: `drop-shadow(0 0 8px ${theme.glow})` }}
        >
          <RankEmblem tier={rank.tier} size={56} />
        </div>

        <div className="flex flex-1 flex-col items-center sm:items-start">
          <div
            className="font-display text-2xl tracking-wider"
            style={{ color: theme.color, textShadow: `0 0 12px ${theme.glow}` }}
          >
            {tierLabel} {rank.rank}
          </div>
          <div className="mt-1 font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
            {rank.leaguePoints} LP
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs">
            <span style={{ color: "oklch(0.72 0.17 160)" }}>{rank.wins}{t.winsShort}</span>
            <span className="text-muted-foreground">·</span>
            <span style={{ color: "oklch(0.66 0.22 25)" }}>{rank.losses}{t.lossesShort}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-parchment/80">{winrate}% WR</span>
          </div>

          {(rank.freshBlood || rank.hotStreak || rank.veteran) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {rank.freshBlood && (
                <span className="border border-cyan/60 bg-cyan/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-cyan clip-tablet-sm">
                  ◆ {t.freshBlood}
                </span>
              )}
              {rank.hotStreak && (
                <span
                  className="border px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest clip-tablet-sm"
                  style={{
                    borderColor: "oklch(0.7 0.18 50 / 0.7)",
                    background: "oklch(0.7 0.18 50 / 0.1)",
                    color: "oklch(0.75 0.18 50)",
                  }}
                >
                  🔥 {t.hotStreak}
                </span>
              )}
              {rank.veteran && (
                <span className="border border-gold/70 bg-gold/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-gold clip-tablet-sm">
                  ⚔ {t.veteran}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
