/**
 * Radial scan — slow rotating conic sweep emanating from center.
 * Sits above SacredGeometry, below content.
 */
export function RadialScan() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-scan-rotate"
        style={{
          width: "180vmax",
          height: "180vmax",
          background:
            "conic-gradient(from 0deg, transparent 0deg, oklch(0.72 0.14 80 / 0.08) 18deg, transparent 36deg, transparent 360deg)",
          maskImage:
            "radial-gradient(circle at center, black 0%, black 30%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(circle at center, black 0%, black 30%, transparent 75%)",
        }}
      />
    </div>
  );
}
