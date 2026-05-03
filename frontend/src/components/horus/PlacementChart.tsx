import { useMemo } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Match } from "@/lib/horus-api";
import { cleanName } from "@/lib/horus-format";
import { useLang } from "@/lib/i18n";

type Props = { matches: Match[] };

type Point = {
  index: number;
  placement: number;
  matchId: string;
  traits: string[];
  fill: string;
};

const CYAN = "#00b4cc";
const GOLD = "#c8960c";
const RED = "#d93b3b";

function colorFor(placement: number) {
  if (placement === 1) return GOLD;
  if (placement <= 4) return CYAN;
  return RED;
}

export function PlacementChart({ matches }: Props) {
  const { t } = useLang();

  const data = useMemo<Point[]>(() => {
    // Reverse so oldest -> newest along X axis
    const ordered = [...matches].reverse();
    return ordered.map((m, i) => {
      const traits = [...m.traits]
        .filter((tr) => tr.tierCurrent > 0)
        .sort((a, b) => b.tierCurrent - a.tierCurrent || b.numUnits - a.numUnits)
        .slice(0, 3)
        .map((tr) => cleanName(tr.name));
      return {
        index: i + 1,
        placement: m.placement,
        matchId: m.matchId,
        traits,
        fill: colorFor(m.placement),
      };
    });
  }, [matches]);

  if (data.length === 0) return null;

  return (
    <div className="relative clip-tablet bg-surface/70 noise">
      <div className="border border-gold/30 clip-tablet bg-gradient-to-br from-surface-2/40 to-surface/20 p-5 md:p-7">
        <div className="text-center font-mono text-[10px] uppercase tracking-[0.4em] text-gold/80">
          ◆ ─── {t.powerTrajectory} ─── ◆
        </div>

        <div className="mt-6 h-64 w-full md:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={data}
              margin={{ top: 12, right: 16, left: 0, bottom: 8 }}
            >
              <defs>
                <linearGradient id="placementArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CYAN} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={CYAN} stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                stroke="oklch(0.7 0.05 200 / 0.08)"
                strokeDasharray="2 6"
                vertical={false}
              />

              <XAxis
                dataKey="index"
                stroke="oklch(0.6 0.02 80 / 0.5)"
                tick={{
                  fill: "oklch(0.7 0.02 80 / 0.6)",
                  fontSize: 10,
                  fontFamily: "var(--font-mono, monospace)",
                }}
                tickLine={false}
                axisLine={{ stroke: "oklch(0.7 0.05 80 / 0.2)" }}
              />
              <YAxis
                domain={[1, 8]}
                ticks={[1, 2, 3, 4, 5, 6, 7, 8]}
                reversed
                stroke="oklch(0.6 0.02 80 / 0.5)"
                tick={{
                  fill: "oklch(0.7 0.02 80 / 0.6)",
                  fontSize: 10,
                  fontFamily: "var(--font-mono, monospace)",
                }}
                tickLine={false}
                axisLine={{ stroke: "oklch(0.7 0.05 80 / 0.2)" }}
                width={28}
              />

              <Tooltip
                cursor={{ stroke: CYAN, strokeOpacity: 0.4, strokeDasharray: "3 4" }}
                content={<HorusTooltip matchLabel={t.matchLabel} placementLabel={t.placementLabel} traitsLabel={t.activeTraits} />}
              />

              <Area
                type="monotone"
                dataKey="placement"
                stroke="transparent"
                fill="url(#placementArea)"
                isAnimationActive
                animationDuration={900}
              />
              <Line
                type="monotone"
                dataKey="placement"
                stroke={CYAN}
                strokeWidth={1.25}
                dot={false}
                activeDot={false}
                isAnimationActive
                animationDuration={900}
              />
              <Scatter
                dataKey="placement"
                shape={(props: { cx?: number; cy?: number; payload?: Point }) => {
                  const { cx, cy, payload } = props;
                  if (cx == null || cy == null || !payload) return <g />;
                  const fill = payload.fill;
                  return (
                    <g>
                      <circle cx={cx} cy={cy} r={6} fill={fill} fillOpacity={0.18} />
                      <circle
                        cx={cx}
                        cy={cy}
                        r={3.2}
                        fill={fill}
                        stroke="oklch(0.06 0.02 240)"
                        strokeWidth={1}
                      />
                    </g>
                  );
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          <Legend color={GOLD} label="1°" />
          <Legend color={CYAN} label="TOP 4" />
          <Legend color={RED} label="BOT 4" />
        </div>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className="inline-block h-2 w-2 rounded-full"
        style={{ background: color, boxShadow: `0 0 8px ${color}` }}
      />
      {label}
    </span>
  );
}

function HorusTooltip({
  active,
  payload,
  matchLabel,
  placementLabel,
  traitsLabel,
}: {
  active?: boolean;
  payload?: Array<{ payload: Point }>;
  matchLabel: string;
  placementLabel: string;
  traitsLabel: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const p = payload[0].payload;
  return (
    <div className="border border-gold/50 bg-surface/95 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-parchment shadow-gold-glow">
      <div className="text-gold">
        ◆ {matchLabel} #{p.index}
      </div>
      <div className="mt-1">
        {placementLabel}:{" "}
        <span style={{ color: p.fill }} className="font-bold">
          #{p.placement}
        </span>
      </div>
      {p.traits.length > 0 && (
        <div className="mt-1 max-w-[180px] whitespace-normal text-[9px] text-muted-foreground">
          {traitsLabel}: <span className="text-parchment/90">{p.traits.join(" · ")}</span>
        </div>
      )}
    </div>
  );
}
