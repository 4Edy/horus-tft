import { useLang } from "@/lib/i18n";

export function LangToggle() {
  const { lang, setLang } = useLang();
  return (
    <div className="pointer-events-auto flex items-center gap-1 font-mono text-xs">
      {(["pt", "en"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={
            "px-2 py-1 uppercase tracking-widest transition-colors " +
            (lang === l
              ? "text-gold text-glow-gold"
              : "text-muted-foreground hover:text-parchment")
          }
          aria-pressed={lang === l}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
