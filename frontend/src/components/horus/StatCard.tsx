import { animate, useMotionValue, useTransform, motion } from "framer-motion";
import { useEffect, type ReactNode } from "react";

type Props = {
  label: string;
  value: number;
  suffix?: string;
  decimals?: number;
  /** 0-100 percentage for the bottom progress bar; pass null to hide. */
  progress?: number | null;
  /** Color the value text + bar based on context. */
  tone?: "gold" | "cyan" | "violet" | "victory" | "defeat";
  glyph?: ReactNode;
  delay?: number;
};

const toneColor: Record<NonNullable<Props["tone"]>, string> = {
  gold: "text-gold text-glow-gold",
  cyan: "text-cyan text-glow-cyan",
  violet: "text-[oklch(0.7_0.18_290)] text-glow-violet",
  victory: "text-victory",
  defeat: "text-defeat",
};

const toneBar: Record<NonNullable<Props["tone"]>, string> = {
  gold: "bg-gold",
  cyan: "bg-cyan",
  violet: "bg-[oklch(0.6_0.22_290)]",
  victory: "bg-victory",
  defeat: "bg-defeat",
};

export function StatCard({
  label,
  value,
  suffix,
  decimals = 0,
  progress = null,
  tone = "gold",
  glyph,
  delay = 0,
}: Props) {
  const mv = useMotionValue(0);
  const display = useTransform(mv, (v) => v.toFixed(decimals));

  useEffect(() => {
    const controls = animate(mv, value, { duration: 1.4, delay, ease: "easeOut" });
    return controls.stop;
  }, [mv, value, delay]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="relative clip-tablet bg-surface/80 noise"
    >
      <div className="relative border border-gold/30 clip-tablet bg-gradient-to-b from-surface-2/80 to-surface/40 p-5">
        {glyph && (
          <div className="absolute right-3 top-3 text-gold/60">{glyph}</div>
        )}
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          {label}
        </div>
        <div className={"mt-3 font-mono text-4xl md:text-5xl " + toneColor[tone]}>
          <motion.span>{display}</motion.span>
          {suffix && <span className="ml-1 text-2xl opacity-80">{suffix}</span>}
        </div>
        {progress !== null && (
          <div className="mt-5 h-[3px] w-full overflow-hidden bg-surface-2">
            <motion.div
              className={"h-full " + toneBar[tone]}
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
              transition={{ duration: 1.2, delay: delay + 0.2, ease: "easeOut" }}
            />
          </div>
        )}
        {/* Corner ticks */}
        <span className="pointer-events-none absolute left-0 top-0 h-3 w-3 border-l border-t border-gold/60" />
        <span className="pointer-events-none absolute right-0 bottom-0 h-3 w-3 border-r border-b border-gold/60" />
      </div>
    </motion.div>
  );
}
