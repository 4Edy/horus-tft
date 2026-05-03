import { motion } from "framer-motion";

/**
 * Sacred geometry decorative background — concentric rings, hex grid,
 * and triangles. Rendered once at the root, fixed full-bleed, very low opacity.
 */
export function SacredGeometry() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      style={{ opacity: 0.18 }}
    >
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1600 1000"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <pattern id="hex" width="40" height="34.64" patternUnits="userSpaceOnUse">
            <polygon
              points="20,1 39,11 39,29 20,39 1,29 1,11"
              fill="none"
              stroke="oklch(0.72 0.14 80 / 0.35)"
              strokeWidth="0.3"
            />
          </pattern>
          <radialGradient id="centerFade" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="black" stopOpacity="0" />
            <stop offset="60%" stopColor="black" stopOpacity="0.4" />
            <stop offset="100%" stopColor="black" stopOpacity="1" />
          </radialGradient>
          <mask id="fadeMask">
            <rect width="1600" height="1000" fill="white" />
            <rect width="1600" height="1000" fill="url(#centerFade)" />
          </mask>
        </defs>

        <rect width="1600" height="1000" fill="url(#hex)" mask="url(#fadeMask)" />

        {/* Concentric rings around center */}
        {[120, 200, 320, 460, 620].map((r, i) => (
          <motion.circle
            key={r}
            cx="800"
            cy="500"
            r={r}
            fill="none"
            stroke="oklch(0.72 0.14 80 / 0.5)"
            strokeWidth="0.4"
            strokeDasharray="2 6"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.5 }}
            transition={{ duration: 4, delay: i * 0.3 }}
          />
        ))}

        {/* Down/up triangles */}
        <motion.polygon
          points="800,140 1080,640 520,640"
          fill="none"
          stroke="oklch(0.72 0.14 80 / 0.4)"
          strokeWidth="0.5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 6 }}
        />
        <motion.polygon
          points="800,860 520,360 1080,360"
          fill="none"
          stroke="oklch(0.55 0.22 290 / 0.4)"
          strokeWidth="0.5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 6, delay: 0.5 }}
        />

        {/* Cardinal axes */}
        <line x1="800" y1="50" x2="800" y2="950" stroke="oklch(0.72 0.14 80 / 0.15)" strokeWidth="0.3" />
        <line x1="120" y1="500" x2="1480" y2="500" stroke="oklch(0.72 0.14 80 / 0.15)" strokeWidth="0.3" />
      </svg>
    </div>
  );
}
