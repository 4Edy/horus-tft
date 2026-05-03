import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  fetchHistory,
  fetchSummoner,
  profileIconUrl,
  type HistoryResponse,
  type SummonerResponse,
} from "@/lib/horus-api";
import { useLang } from "@/lib/i18n";
import { buildVerdict } from "@/lib/horus-format";
import { EyeOfHorus } from "@/components/horus/EyeOfHorus";
import { InvocationLog } from "@/components/horus/InvocationLog";
import { Divider } from "@/components/horus/Divider";
import { StatCard } from "@/components/horus/StatCard";
import { MatchCard } from "@/components/horus/MatchCard";
import { RankBlock } from "@/components/horus/RankBlock";
import { PlacementChart } from "@/components/horus/PlacementChart";
import { PatternsPanel } from "@/components/horus/PatternsPanel";
import { InsightsPanel } from "@/components/horus/InsightsPanel";
import {
  GlyphAnkh,
  GlyphEye,
  GlyphScarab,
  GlyphSunDisk,
} from "@/components/horus/Glyphs";

export const Route = createFileRoute("/summoner/$gameName/$tagLine")({
  head: ({ params }) => ({
    meta: [
      {
        title: `HORUS · ${params.gameName}#${params.tagLine}`,
      },
      {
        name: "description",
        content: `Análise oracular de ${params.gameName}#${params.tagLine} pelo HORUS — padrões, batalhas e veredito.`,
      },
      { property: "og:title", content: `HORUS · ${params.gameName}#${params.tagLine}` },
      {
        property: "og:description",
        content: `Dossiê analítico de ${params.gameName}#${params.tagLine}.`,
      },
    ],
  }),
  component: Dossier,
});

function Dossier() {
  const { gameName, tagLine } = useParams({ from: "/summoner/$gameName/$tagLine" });
  const { t, lang } = useLang();
  const [summoner, setSummoner] = useState<SummonerResponse | null>(null);
  const [history, setHistory] = useState<HistoryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [iconError, setIconError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setReady(false);
    setSummoner(null);
    setHistory(null);

    (async () => {
      try {
        const [s, h] = await Promise.all([
          fetchSummoner(gameName, tagLine),
          fetchHistory(gameName, tagLine),
        ]);
        if (cancelled) return;
        setSummoner(s);
        setHistory({ ...h, history: h.history.slice(0, 20) });
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [gameName, tagLine]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-5 pt-24 pb-20">
        <EyeOfHorus size={180} state="idle" className="opacity-60" />
        <div className="mt-8 max-w-md text-center">
          <div className="font-mono text-sm text-defeat animate-glitch">
            &gt; {t.logLost}
          </div>
          <div className="mt-2 break-words font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {error}
          </div>
          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={() => {
                setError(null);
                setReady(false);
                // re-trigger effect
                setSummoner(null);
                setHistory(null);
                // Easiest: reload current location
                if (typeof window !== "undefined") window.location.reload();
              }}
              className="border border-defeat px-5 py-2 font-mono text-xs uppercase tracking-[0.3em] text-defeat hover:bg-defeat/10"
            >
              {t.retry}
            </button>
            <Link
              to="/"
              className="border border-gold px-5 py-2 font-mono text-xs uppercase tracking-[0.3em] text-gold hover:bg-gold/10"
            >
              ◆ {t.back}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!ready || !summoner || !history) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-5 pt-24 pb-20">
        <EyeOfHorus size={220} state="opening" />
        <div className="mt-10 w-full max-w-md">
          <InvocationLog
            lines={[
              { text: t.logLocating, ready: !!summoner },
              { text: t.logAccessing, ready: !!history },
              { text: t.logProcessing(history?.history.length ?? 20), ready: !!history },
              { text: t.logPatterns, ready: !!history },
              { text: t.logGranted, ready: !!history },
            ]}
            onComplete={() => setReady(true)}
          />
        </div>
      </div>
    );
  }

  const { stats, history: matches } = history;
  const verdict = buildVerdict(stats, t, summoner.rank);

  const placementTone: "gold" | "cyan" | "defeat" =
    stats.avgPlacement <= 4 ? "gold" : stats.avgPlacement <= 5 ? "cyan" : "defeat";

  return (
    <div className="mx-auto max-w-6xl px-4 pt-28 pb-16 md:px-8">
      {/* Profile header */}
      <header className="flex flex-col items-center gap-6 md:flex-row md:items-end md:gap-8">
        <div className="relative">
          <div className="relative h-32 w-32 overflow-hidden clip-octagon md:h-40 md:w-40">
            <div className="absolute inset-0 bg-gradient-to-br from-gold/30 to-violet/20" />
            {!iconError ? (
              <img
                src={profileIconUrl(summoner.summoner.profileIconId)}
                alt=""
                onError={() => setIconError(true)}
                className="relative z-10 h-full w-full object-cover"
              />
            ) : (
              <div className="relative z-10 flex h-full w-full items-center justify-center">
                <span className="font-display text-5xl text-gold">𓂀</span>
              </div>
            )}
            {/* gold scan-line sweep, plays once */}
            <span className="scan-line animate-scan-sweep z-20" />
          </div>
          {/* Double border via overlay */}
          <div className="pointer-events-none absolute inset-0 clip-octagon border-2 border-gold/80" />
          <div className="pointer-events-none absolute inset-1 clip-octagon border border-gold/40" />
        </div>

        <div className="text-center md:text-left">
          <div className="flex flex-wrap items-baseline justify-center gap-2 md:justify-start">
            <h1 className="font-display text-4xl text-gold text-glow-gold md:text-5xl">
              {summoner.account.gameName}
            </h1>
            <span className="font-mono text-sm uppercase tracking-widest text-muted-foreground">
              #{summoner.account.tagLine}
            </span>
          </div>
          <div className="mt-3 inline-flex items-center gap-2 border border-gold/40 bg-surface-2/60 px-3 py-1.5 clip-tablet-sm">
            <GlyphEye size={14} className="text-gold" />
            <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-parchment">
              {t.powerGrade}: <span className="text-gold">{summoner.summoner.summonerLevel}</span>
            </span>
          </div>
        </div>
      </header>

      {/* Rank block */}
      <section className="mt-8">
        <RankBlock rank={summoner.rank} />
      </section>

      <div className="mt-8">
        <Divider />
      </div>

      {/* Veredito Analítico */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="relative mt-10 clip-tablet bg-surface/70 noise"
      >
        <div className="border border-violet/50 clip-tablet bg-gradient-to-br from-violet/10 to-surface-2/30 p-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.4em] text-[oklch(0.7_0.18_290)]">
            ◆ {t.patternAnalysis} ◆
          </div>
          <div className="mt-4 space-y-2">
            {verdict.map((line, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.15 }}
                className="font-display italic text-parchment leading-relaxed md:text-lg"
              >
                {line}
              </motion.p>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Stats grid */}
      <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t.battlesRecorded}
          value={stats.totalGames}
          tone="gold"
          progress={null}
          glyph={<GlyphEye size={18} />}
          delay={0}
        />
        <StatCard
          label={t.avgPlacement}
          value={stats.avgPlacement}
          decimals={1}
          tone={placementTone}
          progress={null}
          glyph={<GlyphSunDisk size={18} />}
          delay={0.1}
        />
        <StatCard
          label={t.top4Domain}
          value={stats.top4Rate}
          decimals={0}
          suffix="%"
          tone="cyan"
          progress={stats.top4Rate}
          glyph={<GlyphScarab size={18} />}
          delay={0.2}
        />
        <StatCard
          label={t.ascensions}
          value={stats.winRate}
          decimals={0}
          suffix="%"
          tone={stats.winRate > 0 ? "victory" : "defeat"}
          progress={stats.winRate}
          glyph={<GlyphAnkh size={18} />}
          delay={0.3}
        />
      </section>

      {/* Power trajectory */}
      {matches.length > 1 && (
        <section className="mt-10">
          <PlacementChart matches={matches} />
        </section>
      )}

      {/* Oracle Insights */}
      <InsightsPanel gameName={gameName} tagLine={tagLine} />

      {/* Patterns identified */}
      {matches.length > 0 && <PatternsPanel matches={matches} />}
      {/* Battle records */}
      <div className="mt-14">
        <Divider label={t.battleRecords} />
      </div>

      <section className="mt-8 space-y-4">
        {matches.length === 0 ? (
          <div className="border border-border/60 bg-surface-2/40 p-12 text-center clip-tablet">
            <span className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
              ◆ {t.noRecords} ◆
            </span>
          </div>
        ) : (
          matches.map((m, i) => <MatchCard key={m.matchId} match={m} index={i} />)
        )}
      </section>

      {/* Foot nav */}
      <div className="mt-16 flex justify-center">
        <Link
          to="/"
          className="border border-gold/60 px-5 py-2 font-mono text-xs uppercase tracking-[0.3em] text-gold/90 transition-all hover:bg-gold/10 hover:shadow-gold-glow"
        >
          ◆ {t.back} ◆
        </Link>
      </div>
    </div>
  );
}
