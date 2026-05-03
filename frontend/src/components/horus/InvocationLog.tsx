import { motion } from "framer-motion";
import { useEffect, useState } from "react";

type LineState = "pending" | "active" | "done";

export type LogLine = {
  text: string;
  /** Reach this line only when this gate is true (default: always) */
  ready?: boolean;
};

type Props = {
  lines: LogLine[];
  error?: string | null;
  /** Called once all lines reached "done". */
  onComplete?: () => void;
  className?: string;
};

const TYPE_SPEED = 22; // ms per char
const PAUSE_AFTER = 220; // ms before next line

/**
 * Console-style typed log. Each line waits for its `ready` gate before typing.
 * Surfaces an error line in red if `error` is provided.
 */
export function InvocationLog({ lines, error, onComplete, className }: Props) {
  const [idx, setIdx] = useState(0);
  const [typed, setTyped] = useState("");
  const [states, setStates] = useState<LineState[]>(() => lines.map(() => "pending"));

  // Reset when lines length changes
  useEffect(() => {
    setIdx(0);
    setTyped("");
    setStates(lines.map(() => "pending"));
  }, [lines.length]);

  // Drive typing forward
  useEffect(() => {
    if (error) return;
    if (idx >= lines.length) return;

    const current = lines[idx];
    if (current.ready === false) {
      // Wait — poll for readiness via small interval
      const id = setInterval(() => {
        if (lines[idx].ready !== false) {
          clearInterval(id);
          setStates((s) => {
            const n = [...s];
            n[idx] = "active";
            return n;
          });
        }
      }, 80);
      return () => clearInterval(id);
    }

    // Mark active
    setStates((s) => {
      if (s[idx] === "pending") {
        const n = [...s];
        n[idx] = "active";
        return n;
      }
      return s;
    });

    let i = 0;
    setTyped("");
    const interval = setInterval(() => {
      i++;
      setTyped(current.text.slice(0, i));
      if (i >= current.text.length) {
        clearInterval(interval);
        setStates((s) => {
          const n = [...s];
          n[idx] = "done";
          return n;
        });
        setTimeout(() => {
          if (idx + 1 >= lines.length) {
            onComplete?.();
          } else {
            setIdx(idx + 1);
          }
        }, PAUSE_AFTER);
      }
    }, TYPE_SPEED);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, lines, error]);

  return (
    <div className={"font-mono text-sm leading-relaxed " + (className ?? "")}>
      {lines.map((l, i) => {
        const st = states[i];
        if (st === "pending") return null;
        const text = i === idx && st === "active" ? typed : l.text;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            className={st === "done" ? "text-cyan/90" : "text-gold"}
          >
            {text}
            {i === idx && st === "active" && (
              <span className="ml-0.5 inline-block h-4 w-2 translate-y-0.5 animate-pulse bg-gold" />
            )}
          </motion.div>
        );
      })}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-2 animate-glitch text-defeat"
        >
          {error}
        </motion.div>
      )}
    </div>
  );
}
