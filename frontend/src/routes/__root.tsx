import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import appCss from "../styles.css?url";
import { SacredGeometry } from "@/components/horus/SacredGeometry";
import { RadialScan } from "@/components/horus/RadialScan";
import { LangToggle } from "@/components/horus/LangToggle";

function NotFoundComponent() {
  return (
    <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="font-display text-7xl text-gold text-glow-gold">404</div>
        <p className="mt-4 font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
          {"> O OLHO NÃO VÊ ESTA SALA"}
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center border border-gold px-5 py-2 font-mono text-xs uppercase tracking-[0.3em] text-gold transition-all hover:bg-gold/10 hover:shadow-gold-glow"
          >
            ◆ RETORNAR AO ORÁCULO ◆
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "HORUS · Sistema de Visão Tática" },
      {
        name: "description",
        content:
          "HORUS — oráculo analítico para Teamfight Tactics. Insira seu Riot ID e receba uma análise oracular dos seus padrões de jogo.",
      },
      { name: "author", content: "HORUS" },
      { property: "og:title", content: "HORUS · Sistema de Visão Tática" },
      {
        property: "og:description",
        content: "Oráculo analítico para TFT. O Olho de Hórus revela seus padrões.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700;900&family=Outfit:wght@300;400;500;600&family=Share+Tech+Mono&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="dark">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <div className="relative min-h-screen text-parchment">
      <SacredGeometry />
      <RadialScan />

      {/* Top brand strip */}
      <header className="pointer-events-none fixed left-0 right-0 top-0 z-30 flex items-center justify-between px-5 py-4 md:px-8">
        <Link
          to="/"
          className="pointer-events-auto flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.4em] text-muted-foreground hover:text-gold"
        >
          <span className="text-gold text-glow-gold text-base leading-none">𓂀</span>
          <span className="hidden sm:inline">HORUS · OTAS v1.0</span>
        </Link>
        <div className="pointer-events-auto flex items-center gap-4">
          <Link
            to="/meta"
            className="font-mono text-[10px] uppercase tracking-[0.4em] text-muted-foreground hover:text-gold"
            activeProps={{ className: "font-mono text-[10px] uppercase tracking-[0.4em] text-gold text-glow-gold" }}
          >
            ◆ META
          </Link>
          <LangToggle />
        </div>
      </header>

      <main className="relative z-10">
        <Outlet />
      </main>

      <footer className="relative z-10 mt-24 border-t border-border/40 py-6 text-center font-mono text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
        ◆ ─── OMNISCIENT TACTICAL ANALYSIS SYSTEM v1.0 ─── ◆
      </footer>
    </div>
  );
}
