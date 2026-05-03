import { motion } from "framer-motion";

type Props = {
  size?: number;
  state?: "idle" | "opening" | "open";
  className?: string;
};

/**
 * Eye of Horus — geometric SVG built from paths.
 * idle: gentle pulse. opening: rotation + iris dilate. open: still & glowing.
 */
export function EyeOfHorus({ size = 220, state = "idle", className }: Props) {
  return (
    <motion.div
      className={className}
      style={{
        width: size,
        height: size,
        filter: "drop-shadow(0 0 24px oklch(0.72 0.14 80 / 0.55))",
      }}
      animate={
        state === "idle"
          ? { scale: [1, 1.03, 1], opacity: [0.92, 1, 0.92] }
          : state === "opening"
            ? { scale: [1, 1.15, 1.05], rotate: [0, 4, -2, 0] }
            : { scale: 1.05 }
      }
      transition={
        state === "idle"
          ? { duration: 3.5, repeat: Infinity, ease: "easeInOut" }
          : { duration: 1.4, ease: "easeOut" }
      }
    >
      <svg viewBox="0 0 200 200" width={size} height={size} fill="none">
        <defs>
          <radialGradient id="iris" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="oklch(0.85 0.16 80)" />
            <stop offset="60%" stopColor="oklch(0.55 0.18 80)" />
            <stop offset="100%" stopColor="oklch(0.25 0.06 80)" />
          </radialGradient>
          <linearGradient id="goldStroke" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="oklch(0.82 0.13 80)" />
            <stop offset="100%" stopColor="oklch(0.55 0.12 70)" />
          </linearGradient>
        </defs>

        {/* Outer concentric circles — sacred ring */}
        <circle cx="100" cy="100" r="92" stroke="url(#goldStroke)" strokeWidth="0.6" opacity="0.5" />
        <circle cx="100" cy="100" r="84" stroke="url(#goldStroke)" strokeWidth="0.4" opacity="0.35" />

        {/* Eye almond shape */}
        <path
          d="M20 100 Q 100 30 180 100 Q 100 170 20 100 Z"
          stroke="url(#goldStroke)"
          strokeWidth="2"
          fill="oklch(0.15 0.03 260)"
        />
        <path
          d="M30 100 Q 100 45 170 100 Q 100 155 30 100 Z"
          stroke="url(#goldStroke)"
          strokeWidth="0.8"
          opacity="0.6"
        />

        {/* Iris */}
        <motion.circle
          cx="100"
          cy="100"
          r="32"
          fill="url(#iris)"
          animate={
            state === "opening"
              ? { r: [32, 18, 36, 30] }
              : state === "idle"
                ? { r: [30, 33, 30] }
                : { r: 30 }
          }
          transition={
            state === "opening"
              ? { duration: 1.4 }
              : { duration: 3.5, repeat: Infinity, ease: "easeInOut" }
          }
        />
        {/* Pupil */}
        <circle cx="100" cy="100" r="10" fill="oklch(0.05 0.02 260)" />
        {/* Highlight */}
        <circle cx="92" cy="92" r="3" fill="oklch(0.95 0.02 80)" opacity="0.8" />

        {/* Horus markings — teardrop (ramses cheek mark) */}
        <path
          d="M100 132 Q 96 145 90 158 Q 92 168 100 168 Q 108 168 110 158 Q 104 145 100 132 Z"
          stroke="url(#goldStroke)"
          strokeWidth="1.4"
          fill="none"
        />
        {/* Horus markings — eyebrow */}
        <path
          d="M30 78 Q 70 50 130 60 Q 165 66 175 70"
          stroke="url(#goldStroke)"
          strokeWidth="2"
          fill="none"
        />
        {/* Horus markings — long curl tail */}
        <path
          d="M180 102 Q 196 110 190 130 Q 188 145 174 150"
          stroke="url(#goldStroke)"
          strokeWidth="2"
          fill="none"
        />

        {/* Inner geometry */}
        <polygon
          points="100,72 124,108 76,108"
          stroke="url(#goldStroke)"
          strokeWidth="0.6"
          fill="none"
          opacity="0.45"
        />
      </svg>
    </motion.div>
  );
}
