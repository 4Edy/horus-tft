import { motion } from "framer-motion";
import type { Match } from "@/lib/horus-api";
import { Chip } from "./Chip";
import {
  cleanName,
  formatDuration,
  formatRelativeTime,
  placementVerdict,
} from "@/lib/horus-format";
import { useLang } from "@/lib/i18n";

type Props = { match: Match; index: number };

const verdictTextColor: Record<string, string> = {
  gold: "text-gold text-glow-gold",
  silver: "text-[oklch(0.85_0.02_240)]",
  bronze: "text-[oklch(0.65_0.12_50)]",
  cyan: "text-cyan text-glow-cyan",
  red: "text-defeat",
  deepRed: "text-[oklch(0.55_0.22_25)]",
};

const verdictBorder: Record<string, string> = {
  gold: "before:bg-gold",
  silver: "before:bg-[oklch(0.85_0.02_240)]",
  bronze: "before:bg-[oklch(0.65_0.12_50)]",
  cyan: "before:bg-cyan",
  red: "before:bg-defeat",
  deepRed: "before:bg-[oklch(0.55_0.22_25)]",
};

export function MatchCard({ match, index }: Props) {
  const { lang, t } = useLang();
  const v = placementVerdict(match.placement);
  const verdictLabel =
    v.key === "ASCENDED"
      ? t.verdictAscended
      : v.key === "HONOR"
        ? t.verdictHonor
        : v.key === "DOMAIN"
          ? t.verdictDomain
          : v.key === "DEFEAT"
            ? t.verdictDefeat
            : t.verdictCollapse;

  // Sort traits: highest tierCurrent first, then by numUnits
  const traits = [...match.traits].sort(
    (a, b) => b.tierCurrent - a.tierCurrent || b.numUnits - a.numUnits,
  );

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: "easeOut" }}
      className={
        "relative bg-surface/80 noise before:absolute before:left-0 before:top-0 before:h-full before:w-1 " +
        verdictBorder[v.color]
      }
    >
      <div className="border border-border/70 clip-tablet bg-gradient-to-br from-surface-2/60 to-surface/30">
        <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-[170px_1fr_180px] md:gap-6">
          {/* Verdict column */}
          <div className="flex flex-col items-center justify-center md:border-r md:border-border/40 md:pr-4">
            <div
              className={
                "font-display text-[72px] leading-none md:text-[96px] " +
                verdictTextColor[v.color]
              }
              style={{ fontWeight: 700 }}
            >
              {match.placement}
              <sup className="ml-1 align-super text-2xl opacity-70">°</sup>
            </div>
            <div
              className={
                "mt-2 font-mono text-xs uppercase tracking-[0.35em] " +
                verdictTextColor[v.color]
              }
            >
              {verdictLabel}
            </div>
          </div>

          {/* Composition column */}
          <div className="space-y-4">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                {t.activeTraits}:
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {traits.map((tr) => {
                  const high = tr.tierCurrent >= 3 || tr.tierCurrent === tr.tierTotal;
                  return (
                    <Chip
                      key={tr.name}
                      variant={tr.tierCurrent === 0 ? "muted" : high ? "gold" : "neutral"}
                      suffix={`× ${tr.numUnits}`}
                    >
                      {cleanName(tr.name)}
                    </Chip>
                  );
                })}
                {traits.length === 0 && (
                  <span className="font-mono text-xs text-muted-foreground">—</span>
                )}
              </div>
            </div>

            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                {t.summonedUnits}:
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {match.units.map((u, i) => {
                  const variant: "gold" | "cyan" | "neutral" =
                    u.tier >= 3 ? "gold" : u.tier === 2 ? "cyan" : "neutral";
                  return (
                    <Chip
                      key={`${u.characterId}-${i}`}
                      variant={variant}
                      prefix={u.tier >= 3 ? "★" : null}
                    >
                      {cleanName(u.characterId)}
                    </Chip>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Cold data column */}
          <div className="space-y-2 font-mono text-[11px] uppercase tracking-wider md:border-l md:border-border/40 md:pl-4">
            <div className="text-gold/80">
              {formatRelativeTime(match.gameDatetime, lang)}
            </div>
            <DataRow label={t.duration} value={formatDuration(match.gameLength)} />
            <DataRow
              label={t.damageDealt}
              value={String(match.totalDamageToPlayers)}
            />
            <DataRow label={t.finalRound} value={String(match.lastRound)} />
            <DataRow label={t.level} value={String(match.level)} />
          </div>
        </div>
      </div>
    </motion.article>
  );
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-muted-foreground">{label}:</span>
      <span className="text-parchment">{value}</span>
    </div>
  );
}
