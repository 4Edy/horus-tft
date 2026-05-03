import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EyeOfHorus } from "@/components/horus/EyeOfHorus";
import { InvocationLog } from "@/components/horus/InvocationLog";
import { useLang } from "@/lib/i18n";
import { parseRiotId } from "@/lib/horus-format";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { t } = useLang();
  const navigate = useNavigate();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<"idle" | "summoning">("idle");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = parseRiotId(value);
    if (!parsed) {
      setError(t.invalidRiotId);
      return;
    }
    setPhase("summoning");
  };

  const navigateNow = () => {
    const parsed = parseRiotId(value);
    if (!parsed) return;
    navigate({
      to: "/summoner/$gameName/$tagLine",
      params: parsed,
    });
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-5 pt-24 pb-20">
      <AnimatePresence mode="wait">
        {phase === "idle" ? (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="flex w-full max-w-xl flex-col items-center"
          >
            <EyeOfHorus size={240} state="idle" />

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="mt-10 text-center"
            >
              <div className="font-mono text-sm text-gold/80">𓂀</div>
              <h1 className="mt-2 font-display text-5xl tracking-[0.45em] text-gold text-glow-gold md:text-6xl">
                HORUS
              </h1>
              <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                &gt; {t.systemTagline}
              </p>
            </motion.div>

            <motion.form
              onSubmit={handleSubmit}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.7 }}
              className="mt-12 w-full"
            >
              <div className="text-center font-mono text-[10px] uppercase tracking-[0.4em] text-gold/80">
                ◆ {t.identifySummoner} ◆
              </div>

              <div className="relative mx-auto mt-4 max-w-md">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-gold/60">
                  [
                </span>
                <input
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="NickName#TAG"
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full border-b-2 border-gold/40 bg-transparent px-7 py-3 text-center font-mono text-base text-parchment outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold focus:text-gold"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-gold/60">
                  ]
                </span>
              </div>

              <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                {t.riotIdHint}
              </p>

              {error && (
                <p className="mt-3 text-center font-mono text-xs text-defeat animate-glitch">
                  &gt; {error}
                </p>
              )}

              <div className="mt-7 flex justify-center">
                <button
                  type="submit"
                  className="group relative border border-gold bg-gold/5 px-8 py-3 font-display text-sm tracking-[0.4em] text-gold transition-all hover:bg-gold/15 hover:shadow-gold-glow"
                >
                  <span className="relative z-10">{t.summonVision}</span>
                  <span className="pointer-events-none absolute -inset-0.5 border border-gold/20 transition-all group-hover:-inset-2 group-hover:border-gold/40" />
                </button>
              </div>
            </motion.form>
          </motion.div>
        ) : (
          <motion.div
            key="summoning"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex w-full max-w-xl flex-col items-center"
          >
            <EyeOfHorus size={260} state="opening" />
            <div className="mt-10 w-full">
              <InvocationLog
                lines={[
                  { text: t.logLocating },
                  { text: t.logAccessing },
                  { text: t.logProcessing(20) },
                  { text: t.logPatterns },
                  { text: t.logGranted },
                ]}
                onComplete={navigateNow}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
