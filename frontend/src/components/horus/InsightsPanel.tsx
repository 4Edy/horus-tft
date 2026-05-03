import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { fetchInsights, type Insight, type InsightsResponse } from "@/lib/horus-api";
import { cleanName } from "@/lib/horus-format";
import { useLang } from "@/lib/i18n";

type Props = { gameName: string; tagLine: string };

const TYPE_STYLES: Record<
  Insight["type"],
  { border: string; icon: string; iconColor: string }
> = {
  danger: { border: "#ef4444", icon: "✕", iconColor: "text-defeat" },
  warning: { border: "#c8960c", icon: "⚠", iconColor: "text-gold" },
  success: { border: "#10b981", icon: "✓", iconColor: "text-victory" },
  info: { border: "#00b4cc", icon: "◆", iconColor: "text-cyan" },
};

function placementColor(p: number): string {
  if (p <= 4) return "#10b981";
  if (p <= 5.5) return "#00b4cc";
  return "#ef4444";
}

export function InsightsPanel({ gameName, tagLine }: Props) {
  const { t } = useLang();
  const [data, setData] = useState<InsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchInsights(gameName, tagLine)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [gameName, tagLine]);

  return (
    <section className="mt-10">
      <div className="text-center font-mono text-[10px] uppercase tracking-[0.4em] text-gold/80">
        ◆ ─── {t.oracleRevelations} ─── ◆
      </div>

      <div className="mt-6 space-y-3">
        {loading && (
          <>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-24 animate-pulse border border-border/40 bg-surface-2/40 clip-tablet"
              />
            ))}
          </>
        )}

        {!loading && error && (
          <div className="border border-defeat/40 bg-defeat/5 p-4 font-mono text-xs text-defeat clip-tablet">
            &gt; {error}
          </div>
        )}

        {!loading && !error && data && data.insights.length === 0 && (
          <div className="border border-border/40 bg-surface-2/40 p-8 text-center clip-tablet">
            <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
              {t.noWeaknesses}
            </span>
          </div>
        )}

        {!loading &&
          !error &&
          data?.insights.map((ins, i) => (
            <InsightCard key={i} insight={ins} index={i} />
          ))}
      </div>
    </section>
  );
}

function InsightCard({ insight, index }: { insight: Insight; index: number }) {
  const { t } = useLang();
  const style = TYPE_STYLES[insight.type] ?? TYPE_STYLES.info;

  const priorityLabel =
    insight.priority === "high"
      ? t.priorityHigh
      : insight.priority === "medium"
      ? t.priorityMedium
      : t.priorityLow;
  const priorityClass =
    insight.priority === "high"
      ? "border-defeat/70 text-defeat"
      : insight.priority === "medium"
      ? "border-gold/70 text-gold"
      : "border-cyan/70 text-cyan";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="relative bg-surface/70 noise clip-tablet"
      style={{ borderLeft: `3px solid ${style.border}` }}
    >
      <div className="border border-border/40 border-l-0 clip-tablet bg-gradient-to-br from-surface-2/40 to-surface/20 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className={`text-xl leading-none ${style.iconColor}`}>{style.icon}</span>
            <div>
              <h3 className="font-display text-lg text-gold text-glow-gold">
                {insight.title}
              </h3>
            </div>
          </div>
          <span
            className={`shrink-0 border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.3em] clip-tablet-sm ${priorityClass}`}
          >
            {priorityLabel}
          </span>
        </div>

        <p className="mt-3 font-sans text-sm leading-relaxed text-parchment/90">
          {insight.detail}
        </p>

        {insight.metric && (
          <div className="mt-3 flex items-baseline gap-2">
            <span
              className="font-display text-3xl text-gold text-glow-gold"
              style={{ color: style.border }}
            >
              {insight.metric}
            </span>
            {insight.metricLabel && (
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                {insight.metricLabel}
              </span>
            )}
          </div>
        )}

        {(insight.units?.length || insight.traits?.length) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {[...(insight.units ?? []), ...(insight.traits ?? [])].map((u, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 border border-border/60 bg-surface-2/60 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider clip-tablet-sm"
              >
                <span className="text-parchment/90">{cleanName(u.name)}</span>
                <span className="text-muted-foreground">×{u.count}</span>
                <span style={{ color: placementColor(u.avgPlacement) }}>
                  #{u.avgPlacement.toFixed(1)}
                </span>
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
