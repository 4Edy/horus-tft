type Props = { tier: string; size?: number; className?: string };

// Returns a tier-themed geometric SVG emblem. Color is applied via currentColor on the parent.
export function RankEmblem({ tier, size = 36, className }: Props) {
  const t = (tier || "").toUpperCase();
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 32 32",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.4,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
  };

  if (t === "IRON") {
    return (
      <svg {...common}>
        <rect x="6" y="6" width="20" height="20" />
        <rect x="10" y="10" width="12" height="12" fill="currentColor" fillOpacity="0.15" />
      </svg>
    );
  }
  if (t === "BRONZE") {
    return (
      <svg {...common}>
        <polygon points="16,4 28,26 4,26" />
        <polygon points="16,10 24,24 8,24" fill="currentColor" fillOpacity="0.15" />
      </svg>
    );
  }
  if (t === "SILVER") {
    return (
      <svg {...common}>
        <polygon points="16,3 28,16 16,29 4,16" />
        <polygon points="16,9 23,16 16,23 9,16" fill="currentColor" fillOpacity="0.15" />
      </svg>
    );
  }
  if (t === "GOLD") {
    return (
      <svg {...common}>
        <polygon points="16,3 19.5,12.5 29,13 21.5,19 24,28 16,22.5 8,28 10.5,19 3,13 12.5,12.5" />
      </svg>
    );
  }
  if (t === "PLATINUM") {
    return (
      <svg {...common}>
        <polygon points="9,4 23,4 30,16 23,28 9,28 2,16" />
        <polygon points="12,9 20,9 25,16 20,23 12,23 7,16" fill="currentColor" fillOpacity="0.15" />
        <line x1="9" y1="4" x2="23" y2="28" />
        <line x1="23" y1="4" x2="9" y2="28" />
      </svg>
    );
  }
  if (t === "EMERALD") {
    return (
      <svg {...common}>
        <polygon points="16,3 27,11 23,27 9,27 5,11" />
        <line x1="5" y1="11" x2="27" y2="11" />
        <line x1="9" y1="27" x2="11" y2="11" />
        <line x1="23" y1="27" x2="21" y2="11" />
      </svg>
    );
  }
  if (t === "DIAMOND") {
    return (
      <svg {...common}>
        <polygon points="16,3 26,16 16,29 6,16" />
        <polygon points="16,8 22,16 16,24 10,16" />
        <line x1="6" y1="16" x2="26" y2="16" />
      </svg>
    );
  }
  if (t === "MASTER" || t === "GRANDMASTER" || t === "CHALLENGER") {
    return (
      <svg {...common}>
        <path d="M4 22 L8 10 L13 18 L16 8 L19 18 L24 10 L28 22 Z" />
        <line x1="4" y1="26" x2="28" y2="26" />
        <circle cx="8" cy="9" r="1.2" fill="currentColor" />
        <circle cx="16" cy="6" r="1.4" fill="currentColor" />
        <circle cx="24" cy="9" r="1.2" fill="currentColor" />
      </svg>
    );
  }
  // Unranked / fallback
  return (
    <svg {...common}>
      <circle cx="16" cy="16" r="11" strokeDasharray="2 3" />
      <circle cx="16" cy="16" r="2" fill="currentColor" />
    </svg>
  );
}

type TierTheme = { color: string; glow: string };

export function tierTheme(tier: string): TierTheme {
  const t = (tier || "").toUpperCase();
  switch (t) {
    case "IRON":
      return { color: "oklch(0.55 0.02 30)", glow: "oklch(0.55 0.02 30 / 0.4)" };
    case "BRONZE":
      return { color: "oklch(0.6 0.12 50)", glow: "oklch(0.6 0.12 50 / 0.45)" };
    case "SILVER":
      return { color: "oklch(0.82 0.02 240)", glow: "oklch(0.82 0.02 240 / 0.45)" };
    case "GOLD":
      return { color: "oklch(0.72 0.14 80)", glow: "oklch(0.72 0.14 80 / 0.5)" };
    case "PLATINUM":
      return { color: "oklch(0.72 0.13 210)", glow: "oklch(0.72 0.13 210 / 0.5)" };
    case "EMERALD":
      return { color: "oklch(0.72 0.17 160)", glow: "oklch(0.72 0.17 160 / 0.5)" };
    case "DIAMOND":
      return { color: "oklch(0.72 0.18 290)", glow: "oklch(0.72 0.18 290 / 0.55)" };
    case "MASTER":
      return { color: "oklch(0.65 0.25 320)", glow: "oklch(0.65 0.25 320 / 0.55)" };
    case "GRANDMASTER":
      return { color: "oklch(0.66 0.24 25)", glow: "oklch(0.66 0.24 25 / 0.55)" };
    case "CHALLENGER":
      return { color: "oklch(0.85 0.15 200)", glow: "oklch(0.85 0.15 200 / 0.6)" };
    default:
      return { color: "oklch(0.55 0.02 250)", glow: "oklch(0.55 0.02 250 / 0.3)" };
  }
}
