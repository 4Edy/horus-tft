type Props = { label?: string; className?: string; variant?: "diamond" | "arrow" };

export function Divider({ label, className, variant = "diamond" }: Props) {
  const symbol = variant === "diamond" ? "◆" : "▸▸▸";
  return (
    <div
      className={
        "flex items-center justify-center gap-3 font-mono text-xs uppercase tracking-[0.4em] text-muted-foreground " +
        (className ?? "")
      }
    >
      <span className="text-gold/70">{symbol}</span>
      <span className="h-px flex-1 max-w-[120px] bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
      {label && <span className="text-parchment/80">{label}</span>}
      <span className="h-px flex-1 max-w-[120px] bg-gradient-to-l from-transparent via-gold/40 to-transparent" />
      <span className="text-gold/70">{symbol}</span>
    </div>
  );
}
