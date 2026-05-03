type GlyphProps = { size?: number; className?: string; color?: string };

const baseProps = (size: number, color?: string) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: color ?? "currentColor",
  strokeWidth: 1.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export function GlyphEye({ size = 18, className, color }: GlyphProps) {
  return (
    <svg {...baseProps(size, color)} className={className}>
      <path d="M2 12 Q 12 4 22 12 Q 12 20 2 12 Z" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 16 L 11 21 M 22 12 Q 23 15 21 18" />
    </svg>
  );
}

export function GlyphAnkh({ size = 18, className, color }: GlyphProps) {
  return (
    <svg {...baseProps(size, color)} className={className}>
      <ellipse cx="12" cy="7" rx="4" ry="4.5" />
      <path d="M12 11.5 V 22 M 7 15 H 17" />
    </svg>
  );
}

export function GlyphSunDisk({ size = 18, className, color }: GlyphProps) {
  return (
    <svg {...baseProps(size, color)} className={className}>
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 3 V 5 M 12 19 V 21 M 3 12 H 5 M 19 12 H 21 M 5.5 5.5 L 7 7 M 17 17 L 18.5 18.5 M 5.5 18.5 L 7 17 M 17 7 L 18.5 5.5" />
    </svg>
  );
}

export function GlyphScarab({ size = 18, className, color }: GlyphProps) {
  return (
    <svg {...baseProps(size, color)} className={className}>
      <ellipse cx="12" cy="13" rx="5" ry="6.5" />
      <path d="M12 6.5 V 4 M 9 6 L 6 4 M 15 6 L 18 4 M 7 11 L 4 10 M 17 11 L 20 10 M 7 16 L 4 17 M 17 16 L 20 17 M 12 13 V 19 M 9 12 H 15" />
    </svg>
  );
}

export function GlyphTriangle({ size = 18, className, color }: GlyphProps) {
  return (
    <svg {...baseProps(size, color)} className={className}>
      <polygon points="12,4 20,20 4,20" />
      <circle cx="12" cy="14" r="2" />
    </svg>
  );
}
