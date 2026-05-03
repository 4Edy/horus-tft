import type { ReactNode } from "react";

type Variant = "neutral" | "gold" | "cyan" | "muted";

const variants: Record<Variant, string> = {
  neutral: "border-border bg-surface-2/60 text-parchment/85",
  gold: "border-gold/70 bg-gold/10 text-gold text-glow-gold",
  cyan: "border-cyan/60 bg-cyan/10 text-cyan",
  muted: "border-border/60 bg-surface/40 text-muted-foreground",
};

export function Chip({
  children,
  variant = "neutral",
  prefix,
  suffix,
}: {
  children: ReactNode;
  variant?: Variant;
  prefix?: ReactNode;
  suffix?: ReactNode;
}) {
  return (
    <span
      className={
        "inline-flex items-center gap-1.5 border px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider clip-tablet-sm " +
        variants[variant]
      }
    >
      {prefix && <span className="opacity-90">{prefix}</span>}
      <span>{children}</span>
      {suffix && <span className="opacity-70">{suffix}</span>}
    </span>
  );
}
