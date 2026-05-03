import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { Match } from "@/lib/horus-api";
import { cleanName } from "@/lib/horus-format";
import { useLang } from "@/lib/i18n";

type Props = { matches: Match[] };
type Mode = "frequency" | "performance";

type Row = {
  key: string;
  label: string;
  count: number;
  avgPlacement: number;
  highlight: boolean;
};

function placementColor(p: number): string {
  if (p <= 4) return "#10b981";
  if (p <= 5.5) return "#00b4cc";
  return "#ef4444";
}

export function PatternsPanel({ matches }: Props) {
  const { t } = useLang();
  const [mode, setMode] = useState<Mode>("frequency");

  const { units, traits } = useMemo(() => {
    const unitMap = new Map<
      string,
      { count: number; threeStar: boolean; placementSum: number }
    >();
    const traitMap = new Map<
      string,
      { count: number; maxed: boolean; tierTotal: number; placementSum: number }
    >();

    for (const m of matches) {
      const seenUnit = new Set<string>();
      for (const u of m.units ?? []) {
        const id = u.characterId;
        if (!id) continue;
        const cur =
          unitMap.get(id) ?? { count: 0, threeStar: false, placementSum: 0 };
        if (!seenUnit.has(id)) {
          cur.count += 1;
          cur.placementSum += m.placement;
          seenUnit.add(id);
        }
        if (u.tier >= 3) cur.threeStar = true;
        unitMap.set(id, cur);
      }

      const seenTrait = new Set<string>();
      for (const tr of m.traits ?? []) {
        if (tr.tierCurrent <= 0) continue;
        const id = tr.name;
        if (!id) continue;
        const cur = traitMap.get(id) ?? {
          count: 0,
          maxed: false,
          tierTotal: tr.tierTotal,
          placementSum: 0,
        };
        if (!seenTrait.has(id)) {
          cur.count += 1;
          cur.placementSum += m.placement;
          seenTrait.add(id);
        }
        if (tr.tierTotal > 0 && tr.tierCurrent === tr.tierTotal) cur.maxed = true;
        cur.tierTotal = tr.tierTotal || cur.tierTotal;
        traitMap.set(id, cur);
      }
    }

    const sortRows = (rows: Row[]) =>
      rows
        .sort((a, b) => {
          if (mode === "performance") {
            // need ≥2 appearances to rank by performance
            const aMin = a.count >= 2 ? 0 : 1;
            const bMin = b.count >= 2 ? 0 : 1;
            if (aMin !== bMin) return aMin - bMin;
            return a.avgPlacement - b.avgPlacement || b.count - a.count;
          }
          return b.count - a.count || a.label.localeCompare(b.label);
        })
        .slice(0, 8);

    const unitRows: Row[] = sortRows(
      [...unitMap.entries()].map(([k, v]) => ({
        key: k,
        label: cleanName(k),
        count: v.count,
        avgPlacement: v.placementSum / Math.max(1, v.count),
        highlight: v.threeStar,
      })),
    );

    const traitRows: Row[] = sortRows(
      [...traitMap.entries()].map(([k, v]) => ({
        key: k,
        label: cleanName(k),
        count: v.count,
        avgPlacement: v.placementSum / Math.max(1, v.count),
        highlight: v.maxed,
      })),
    );

    return { units: unitRows, traits: traitRows };
  }, [matches, mode]);

  if (units.length === 0 && traits.length === 0) return null;

  return (
    <section className="mt-10">
      <div className="text-center font-mono text-[10px] uppercase tracking-[0.4em] text-gold/80">
        ◆ ─── {t.patternsIdentified} ─── ◆
      </div>

      <div className="mt-4 flex justify-center gap-1 font-mono text-[10px]">
        {(["frequency", "performance"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={
              "border px-3 py-1 uppercase tracking-[0.3em] transition-colors clip-tablet-sm " +
              (mode === m
                ? "border-gold bg-gold/10 text-gold text-glow-gold"
                : "border-border/60 text-muted-foreground hover:text-parchment")
            }
          >
            {m === "frequency" ? t.sortFrequency : t.sortPerformance}
          </button>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Panel title={t.mostSummonedUnits} rows={units} accent="cyan" />
        <Panel title={t.dominantTraits} rows={traits} accent="violet" />
      </div>
    </section>
  );
}

function Panel({
  title,
  rows,
  accent,
}: {
  title: string;
  rows: Row[];
  accent: "cyan" | "violet";
}) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  const barColor = accent === "cyan" ? "#00b4cc" : "oklch(0.7 0.18 290)";
  const borderClass =
    accent === "cyan" ? "border-[#00b4cc]/30" : "border-[oklch(0.7_0.18_290)]/30";

  return (
    <div className="relative clip-tablet bg-surface/70 noise">
      <div
        className={`clip-tablet border ${borderClass} bg-gradient-to-br from-surface-2/40 to-surface/20 p-5 md:p-6`}
      >
        <div className="font-mono text-[10px] uppercase tracking-[0.4em] text-parchment/80">
          ◆ {title}
        </div>

        <ul className="mt-5 space-y-2.5">
          {rows.map((r, i) => {
            const pct = Math.max(6, Math.round((r.count / max) * 100));
            return (
              <motion.li
                key={r.key}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.04 * i }}
                className={`relative flex items-center gap-3 border bg-surface-2/40 px-3 py-2 ${
                  r.highlight
                    ? "border-gold/70 shadow-[0_0_12px_-4px_oklch(0.7_0.15_85_/_0.6)]"
                    : "border-border/40"
                }`}
              >
                <span
                  className={`min-w-0 flex-1 truncate font-mono text-[11px] uppercase tracking-widest ${
                    r.highlight ? "text-gold" : "text-parchment/90"
                  }`}
                  title={r.label}
                >
                  {r.highlight && <span className="mr-1 text-gold">★</span>}
                  {r.label}
                </span>

                <div className="relative h-1.5 w-20 overflow-hidden bg-background/60 sm:w-28">
                  <motion.span
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ delay: 0.05 * i + 0.1, duration: 0.6, ease: "easeOut" }}
                    className="absolute inset-y-0 left-0"
                    style={{
                      background: `linear-gradient(90deg, ${barColor}33, ${barColor})`,
                      boxShadow: `0 0 10px ${barColor}80`,
                    }}
                  />
                </div>

                <span
                  className={`w-7 text-right font-mono text-[11px] tabular-nums ${
                    r.highlight ? "text-gold" : "text-parchment"
                  }`}
                >
                  {r.count}
                </span>

                <span
                  className="w-12 text-right font-mono text-[11px] tabular-nums"
                  style={{ color: placementColor(r.avgPlacement) }}
                  title="avg placement"
                >
                  #{r.avgPlacement.toFixed(1)}
                </span>
              </motion.li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
