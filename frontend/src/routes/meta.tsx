import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  fetchMetaItems,
  fetchMetaComps,
  fetchMetaUnits,
  fetchMetaTraits,
  postMetaRecommend,
  type MetaCarry,
  type MetaComp,
  type MetaUnit,
  type RecommendResponse,
} from "@/lib/horus-api";
import { cleanName } from "@/lib/horus-format";
import { useLang } from "@/lib/i18n";
import { Divider } from "@/components/horus/Divider";

export const Route = createFileRoute("/meta")({
  head: () => ({
    meta: [
      { title: "HORUS · META" },
      { name: "description", content: "O Oráculo do Meta — carries, comps e tier list de TFT." },
    ],
  }),
  component: MetaPage,
});

type Tab = "carries" | "comps" | "tier";

function placementColor(p: number): string {
  if (p <= 3.8) return "#c8960c";
  if (p <= 4.2) return "#00b4cc";
  if (p <= 4.6) return "#d4c5a9";
  return "#ef4444";
}

function carryBorder(p: number): string {
  if (p <= 3) return "#c8960c";
  if (p <= 4) return "#00b4cc";
  return "#ef4444";
}

function compBorder(p: number): string {
  if (p <= 3.5) return "#c8960c";
  if (p <= 4) return "#00b4cc";
  return "#ef4444";
}

function MetaPage() {
  const { t } = useLang();
  const [tab, setTab] = useState<Tab>("carries");

  return (
    <div className="mx-auto max-w-6xl px-4 pt-28 pb-16 md:px-8">
      <header className="text-center">
        <div className="font-mono text-[10px] uppercase tracking-[0.4em] text-gold/80">
          ◆ ─── {t.metaTitle} ─── ◆
        </div>
        <h1 className="mt-3 font-display text-4xl text-gold text-glow-gold md:text-5xl">
          {t.metaTitle}
        </h1>
        <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
          {t.metaSubtitle}
        </p>
      </header>

      {/* Tabs */}
      <div className="mt-10 flex justify-center gap-2 font-mono text-[10px]">
        {(
          [
            ["carries", t.tabCarries],
            ["comps", t.tabComps],
            ["tier", t.tabTierList],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={
              "border px-4 py-2 uppercase tracking-[0.3em] transition-colors clip-tablet-sm " +
              (tab === id
                ? "border-gold bg-gold/10 text-gold text-glow-gold"
                : "border-border/60 text-muted-foreground hover:text-parchment")
            }
          >
            ◆ {label}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {tab === "carries" && <CarriesTab />}
        {tab === "comps" && <CompsTab />}
        {tab === "tier" && <TierListTab />}
      </div>

      <div className="mt-16">
        <Divider />
      </div>
      <Recommender />
    </div>
  );
}

function Loading({ rows = 6 }: { rows?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-40 animate-pulse border border-border/40 bg-surface-2/40 clip-tablet"
        />
      ))}
    </div>
  );
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div className="border border-defeat/40 bg-defeat/5 p-4 font-mono text-xs text-defeat clip-tablet">
      &gt; {msg}
    </div>
  );
}

/* ---------- CARRIES TAB ---------- */
function CarriesTab() {
  const { t } = useLang();
  const [data, setData] = useState<MetaCarry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchMetaItems(10)
      .then((d) => {
        if (!cancelled) setData(d.slice().sort((a, b) => a.bestPlacement - b.bestPlacement));
      })
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : String(e)));
    return () => { cancelled = true; };
  }, []);

  if (error) return <ErrorBox msg={error} />;
  if (!data) return <Loading />;
  if (data.length === 0)
    return <div className="text-center font-mono text-xs text-muted-foreground">{t.noResults}</div>;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {data.map((c, i) => {
        const top = (c.bestBuilds ?? []).slice(0, 3);
        const best = top[0];
        return (
          <motion.div
            key={`${c.name}-${i}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="bg-surface/70 noise clip-tablet"
            style={{ borderLeft: `3px solid ${carryBorder(c.bestPlacement)}` }}
          >
            <div className="border border-border/40 border-l-0 clip-tablet bg-gradient-to-br from-surface-2/40 to-surface/20 p-4">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="font-display text-lg text-gold text-glow-gold">
                  {cleanName(c.name)}
                </h3>
                <span
                  className="font-mono text-sm tabular-nums"
                  style={{ color: carryBorder(c.bestPlacement) }}
                >
                  #{c.bestPlacement.toFixed(2)}
                </span>
              </div>

              <div className="mt-2 flex gap-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {best && (
                  <>
                    <span>{best.totalGames} {t.totalGamesShort}</span>
                    <span>· {t.top4Short} {best.top4Rate.toFixed(0)}%</span>
                    <span>· {t.winShort} {best.winRate.toFixed(0)}%</span>
                  </>
                )}
              </div>

              <div className="mt-3">
                <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-parchment/70">
                  ◆ {t.topBuilds}
                </div>
                <div className="mt-2 space-y-1.5">
                  {top.map((b, j) => (
                    <div key={j} className="flex flex-wrap gap-1">
                      {b.items.map((it, k) => (
                        <span
                          key={k}
                          className="border border-border/60 bg-surface-2/60 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-parchment/85 clip-tablet-sm"
                        >
                          {cleanName(it)}
                        </span>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ---------- COMPS TAB ---------- */
function CompsTab() {
  const { t } = useLang();
  const [data, setData] = useState<MetaComp[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchMetaComps(5)
      .then((d) => {
        if (!cancelled) setData(d.slice().sort((a, b) => a.avgPlacement - b.avgPlacement));
      })
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : String(e)));
    return () => { cancelled = true; };
  }, []);

  if (error) return <ErrorBox msg={error} />;
  if (!data) return <Loading />;
  if (data.length === 0)
    return <div className="text-center font-mono text-xs text-muted-foreground">{t.noResults}</div>;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {data.map((c, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.03 }}
          className="bg-surface/70 noise clip-tablet"
          style={{ borderLeft: `3px solid ${compBorder(c.avgPlacement)}` }}
        >
          <div className="border border-border/40 border-l-0 clip-tablet bg-gradient-to-br from-surface-2/40 to-surface/20 p-4">
            {/* Traits */}
            <div className="flex flex-wrap gap-1.5">
              {(c.traits ?? []).map((tr, j) => (
                <span
                  key={j}
                  className="border px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider clip-tablet-sm"
                  style={{
                    borderColor: j < 2 ? "#c8960c80" : "#00b4cc50",
                    color: j < 2 ? "#c8960c" : "#00b4cc",
                    background: j < 2 ? "#c8960c10" : "#00b4cc10",
                  }}
                >
                  {cleanName(tr)}
                </span>
              ))}
            </div>

            {/* Units */}
            <div className="mt-2 flex flex-wrap gap-1">
              {(c.sampleUnits ?? []).slice(0, 8).map((u, j) => (
                <span
                  key={j}
                  className="border border-border/40 bg-surface-2/50 px-1.5 py-0.5 font-mono text-[9px] text-parchment/70 clip-tablet-sm"
                >
                  {cleanName(u)}
                </span>
              ))}
            </div>

            {/* Stats */}
            <div className="mt-3 flex flex-wrap gap-3 font-mono text-[10px] uppercase tracking-widest">
              <span style={{ color: compBorder(c.avgPlacement) }}>
                #{c.avgPlacement.toFixed(2)}
              </span>
              <span className="text-muted-foreground">
                {t.top4Short} {c.top4Rate.toFixed(0)}%
              </span>
              <span className="text-muted-foreground">
                {t.winShort} {c.winRate.toFixed(0)}%
              </span>
              <span className="text-muted-foreground">
                {c.totalGames} {t.totalGamesShort}
              </span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/* ---------- TIER LIST TAB ---------- */
function TierListTab() {
  const { t } = useLang();
  const [units, setUnits] = useState<MetaUnit[] | null>(null);
  const [traits, setTraits] = useState<MetaUnit[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchMetaUnits(50), fetchMetaTraits(10)])
      .then(([u, tr]) => {
        if (cancelled) return;
        setUnits(u);
        // Dedupe traits por nome limpo, mantém o melhor (menor avgPlacement)
        const byName = new Map<string, MetaUnit>();
        for (const it of tr) {
          const key = cleanName(it.name);
          const prev = byName.get(key);
          if (!prev || it.avgPlacement < prev.avgPlacement) byName.set(key, it);
        }
        setTraits(Array.from(byName.values()));
      })
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : String(e)));
    return () => { cancelled = true; };
  }, []);

  if (error) return <ErrorBox msg={error} />;
  if (!units || !traits) return <Loading rows={4} />;

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <TierPanel title={t.unitsLabel} items={units} />
      <TierPanel title={t.traitsLabel} items={traits} />
    </div>
  );
}

type Tier = "S" | "A" | "B" | "C";
const TIER_STYLE: Record<Tier, { border: string; text: string }> = {
  S: { border: "border-gold/70", text: "text-gold" },
  A: { border: "border-cyan/70", text: "text-cyan" },
  B: { border: "border-border/60", text: "text-parchment" },
  C: { border: "border-defeat/60", text: "text-defeat" },
};

function tierOf(p: number): Tier {
  if (p <= 3.8) return "S";
  if (p <= 4.2) return "A";
  if (p <= 4.6) return "B";
  return "C";
}

function TierPanel({ title, items }: { title: string; items: MetaUnit[] }) {
  const groups: Record<Tier, MetaUnit[]> = { S: [], A: [], B: [], C: [] };
  for (const it of [...items].sort((a, b) => a.avgPlacement - b.avgPlacement)) {
    groups[tierOf(it.avgPlacement)].push(it);
  }

  return (
    <div className="bg-surface/70 noise clip-tablet">
      <div className="border border-border/40 clip-tablet bg-gradient-to-br from-surface-2/40 to-surface/20 p-5">
        <div className="font-mono text-[10px] uppercase tracking-[0.4em] text-parchment/80">
          ◆ {title}
        </div>

        <div className="mt-4 space-y-3">
          {(Object.keys(groups) as Tier[]).map((tier) => {
            const list = groups[tier];
            if (list.length === 0) return null;
            const s = TIER_STYLE[tier];
            return (
              <div key={tier} className={`border ${s.border} bg-surface-2/30 p-3`}>
                <div className={`mb-2 font-display text-2xl ${s.text}`}>{tier}</div>
                <div className="flex flex-wrap gap-1.5">
                  {list.map((u, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 border border-border/60 bg-surface/60 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider clip-tablet-sm"
                    >
                      <span className="text-parchment/90">{cleanName(u.name)}</span>
                      <span style={{ color: placementColor(u.avgPlacement) }}>
                        #{u.avgPlacement.toFixed(2)}
                      </span>
                      <span className="text-muted-foreground">
                        {u.top4Rate.toFixed(0)}%
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---------- RECOMMENDER ---------- */
function Recommender() {
  const { t } = useLang();
  const [value, setValue] = useState("");
  const [data, setData] = useState<RecommendResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const items = value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (items.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const res = await postMetaRecommend(items);
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mt-10">
      <div className="text-center font-mono text-[10px] uppercase tracking-[0.4em] text-gold/80">
        ◆ {t.invokeRecommend} ◆
      </div>

      <form onSubmit={submit} className="mt-5 mx-auto max-w-2xl">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-gold/60">[</span>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="InfinityEdge, GuinsoosRageblade"
            className="w-full border-b-2 border-gold/40 bg-transparent px-7 py-3 text-center font-mono text-base text-parchment outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold focus:text-gold"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-gold/60">]</span>
        </div>
        <p className="mt-2 text-center font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          {t.recommendHint}
        </p>
        <div className="mt-5 flex justify-center">
          <button
            type="submit"
            disabled={loading}
            className="border border-gold bg-gold/5 px-6 py-2 font-display text-xs tracking-[0.4em] text-gold transition-all hover:bg-gold/15 hover:shadow-gold-glow disabled:opacity-50"
          >
            {loading ? "..." : t.consultOracle}
          </button>
        </div>
      </form>

      {error && (
        <div className="mt-5">
          <ErrorBox msg={error} />
        </div>
      )}

      {data && (
        <div className="mt-8 space-y-5">
          {data.recommendations.map((rec, i) => (
            <div key={i} className="bg-surface/70 noise clip-tablet">
              <div className="border border-border/40 clip-tablet bg-gradient-to-br from-surface-2/40 to-surface/20 p-4">
                <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-parchment/80">
                  {t.bestCarriesFor}{" "}
                  <span className="text-gold">{cleanName(rec.item)}</span>
                </div>
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {rec.bestCarries.map((bc, j) => (
                    <div
                      key={j}
                      className="border border-border/40 bg-surface-2/50 p-2"
                      style={{ borderLeft: `3px solid ${carryBorder(bc.avgPlacement)}` }}
                    >
                      <div className="flex items-baseline justify-between">
                        <span className="font-display text-base text-gold">
                          {cleanName(bc.name)}
                        </span>
                        <span
                          className="font-mono text-sm tabular-nums"
                          style={{ color: carryBorder(bc.avgPlacement) }}
                        >
                          #{bc.avgPlacement.toFixed(2)}
                        </span>
                      </div>
                      <div className="mt-1 flex gap-2 font-mono text-[10px] uppercase text-muted-foreground">
                        <span>{t.top4Short} {bc.top4Rate.toFixed(0)}%</span>
                        <span>{t.winShort} {bc.winRate.toFixed(0)}%</span>
                        <span>{bc.count}g</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}