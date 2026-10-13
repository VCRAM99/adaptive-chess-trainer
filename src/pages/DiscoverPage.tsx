import { useEffect, useRef, type RefObject } from "react";

import { publicAssetUrl } from "../lib/basePath";
import { ACCENT_THEMES } from "../lib/preferences/accentThemes";
import { BOARD_THEMES } from "../lib/preferences/boardThemes";
import { TRAINING_MODE_LABELS } from "../lib/trainingDifficulty";

import "./discover.css";

const GITHUB_URL = "https://github.com/VCRAM99/adaptive-chess-trainer";
const MASCOT_SRC = publicAssetUrl("images/chess-trainer-logo.png");

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#why", label: "Why" },
  { href: "#system", label: "System" },
  { href: "#destrier", label: "Destrier" },
] as const;

const SYSTEM_STEPS = [
  {
    title: "Player move",
    detail: "You play a move on the board.",
  },
  {
    title: "Engine analysis",
    detail: "Stockfish.js evaluates the position and that move.",
  },
  {
    title: "Skill estimation",
    detail: "The estimate shifts from the decision and the ground the move gave up.",
  },
  {
    title: "Adaptive opponent",
    detail: "Casual, Echo, or Train sets the next target from that estimate.",
  },
  {
    title: "Next move",
    detail: "The opponent searches and plays.",
  },
] as const;

const TECH_GROUPS = [
  {
    label: "Frontend",
    items: [
      { name: "React", icon: "discover/icons/react.svg" },
      { name: "TypeScript", icon: "discover/icons/typescript.svg" },
      { name: "Vite", icon: "discover/icons/vite.svg" },
    ],
  },
  {
    label: "Chess",
    items: [{ name: "chess.js" }, { name: "react-chessboard" }, { name: "Stockfish.js 19 Lite" }],
  },
  {
    label: "Accounts",
    items: [{ name: "Supabase", icon: "discover/icons/supabase.svg" }],
  },
  {
    label: "Testing",
    items: [
      { name: "Vitest", icon: "discover/icons/vitest.svg" },
      { name: "Testing Library" },
      { name: "ESLint", icon: "discover/icons/eslint.svg" },
    ],
  },
  {
    label: "Deployment",
    items: [{ name: "Vercel", icon: "discover/icons/vercel.svg" }],
  },
] as const;

const PIECE_SETS = ["Classic", "Modern", "Minimal"] as const;

function prefersReducedMotion(): boolean {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

function useDiscoverMotion(
  pageRef: RefObject<HTMLDivElement | null>,
  systemRef: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    const page = pageRef.current;
    const system = systemRef.current;

    if (!page) return;

    const reveals = page.querySelectorAll(".discover-reveal");
    const reduced = prefersReducedMotion();

    if (reduced || typeof IntersectionObserver === "undefined") {
      reveals.forEach((node) => node.classList.add("is-visible"));
      system?.classList.add("is-static");
      return;
    }

    const revealObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;

          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      },
      { threshold: 0.18, rootMargin: "0px 0px -6% 0px" },
    );

    reveals.forEach((node) => revealObserver.observe(node));

    let systemObserver: IntersectionObserver | undefined;

    if (system) {
      systemObserver = new IntersectionObserver(
        ([entry]) => {
          system.classList.toggle("is-playing", entry.isIntersecting);
        },
        { threshold: 0.35 },
      );
      systemObserver.observe(system);
    }

    return () => {
      revealObserver.disconnect();
      systemObserver?.disconnect();
    };
  }, [pageRef, systemRef]);
}

export default function DiscoverPage() {
  const pageRef = useRef<HTMLDivElement>(null);
  const systemRef = useRef<HTMLElement>(null);

  useDiscoverMotion(pageRef, systemRef);

  return (
    <div className="discover" ref={pageRef} data-marketing-theme="dark">
      <a className="discover-skip" href="#features">
        Skip to content
      </a>

      <header className="discover-nav">
        <a className="discover-brand" href="#top">
          <img src={MASCOT_SRC} alt="" width={1230} height={1278} />
          <span>Adaptive Chess Trainer</span>
        </a>

        <nav className="discover-nav__links" aria-label="Page sections">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>

        <a className="discover-button discover-button--primary" href="/">
          Play Now
        </a>
      </header>

      <main id="top">
        <Hero />
        <Features />
        <Why />
        <System sectionRef={systemRef} />
        <Engine />
        <Stack />
        <Destrier />
      </main>

      <footer className="discover-footer">
        <p>
          © 2026{" "}
          <a href="https://varunsr.com" target="_blank" rel="noopener noreferrer">
            Varun Ramanathan
          </a>
          . Adaptive Chess Trainer.
        </p>
        <nav aria-label="Footer">
          <a href="/">Open the trainer</a>
          <a href={GITHUB_URL} rel="noreferrer">
            GitHub
          </a>
        </nav>
      </footer>
    </div>
  );
}

function Hero() {
  return (
    <section className="discover-hero" aria-labelledby="hero-heading">
      <div className="discover-hero__copy">
        <p className="discover-kicker">Adaptive Chess Trainer</p>
        <h1 id="hero-heading">Train smarter. Play stronger.</h1>
        <p className="discover-lede">
          A browser trainer whose opponent follows an estimate of your play, so the challenge can
          change as that estimate changes.
        </p>
        <div className="discover-hero__actions">
          <a className="discover-button discover-button--primary" href="/">
            Play Now
          </a>
          <a className="discover-button" href={GITHUB_URL} rel="noreferrer">
            GitHub
          </a>
        </div>
      </div>

      <div className="discover-hero__stage" aria-hidden="true">
        <img
          className="discover-mascot discover-mascot--hero"
          src={MASCOT_SRC}
          alt=""
          width={1230}
          height={1278}
        />
        <BoardStill />
      </div>
    </section>
  );
}

function BoardStill() {
  const squares = ["wK", "bQ", "wN", "bB", "wR", "bP", "wB", "bN"];

  return (
    <div className="discover-board">
      {squares.map((piece, index) => {
        const dark = (Math.floor(index / 4) + (index % 4)) % 2 === 1;

        return (
          <span key={piece} className={dark ? "discover-square is-dark" : "discover-square"}>
            <img src={publicAssetUrl(`pieces/modern/${piece}.svg`)} alt="" width={80} height={80} />
          </span>
        );
      })}
    </div>
  );
}

function Features() {
  return (
    <section
      className="discover-section discover-reveal"
      id="features"
      aria-labelledby="features-heading"
    >
      <p className="discover-kicker">Features</p>
      <h2 id="features-heading">Built to adapt to you.</h2>

      <div className="discover-features">
        <article className="discover-panel discover-panel--ai">
          <h3>Adaptive AI</h3>
          <p>
            Opponent strength is tied to an estimated rating. Accurate moves in meaningful positions
            can raise that estimate. Costly moves can lower it. The opponent’s next target follows.
          </p>
          <div className="discover-meter" aria-hidden="true">
            <span>Estimated play</span>
            <strong>Target strength</strong>
          </div>
        </article>

        <article className="discover-panel">
          <h3>Difficulty modes</h3>
          <ul className="discover-modes">
            <li>
              <strong>{TRAINING_MODE_LABELS.easy}</strong>
              <span>Below your estimated level.</span>
            </li>
            <li>
              <strong>{TRAINING_MODE_LABELS.medium}</strong>
              <span>A close match, set slightly below your estimated level.</span>
            </li>
            <li>
              <strong>{TRAINING_MODE_LABELS.hard}</strong>
              <span>Above your estimated level.</span>
            </li>
          </ul>
        </article>

        <article className="discover-panel discover-panel--profile">
          <h3>Profile dashboard</h3>
          <p>
            Career stats track rating, peak rating, results, win rate, accuracy, and average
            centipawn loss. Progress charts and recent games can be filtered by mode. Move quality
            is counted from Diamond through Wood.
          </p>
          <ul className="discover-stats" aria-hidden="true">
            <li>
              <span>Rating</span>
              <strong>Estimate</strong>
            </li>
            <li>
              <span>Record</span>
              <strong>W · D · L</strong>
            </li>
            <li>
              <span>Quality</span>
              <strong>7 tiers</strong>
            </li>
          </ul>
        </article>

        <article className="discover-panel discover-panel--custom">
          <h3>Customization</h3>
          <p>
            The trainer keeps its own appearance settings: interface theme, accent, board theme, and
            piece set. Guests keep them on this device. Signed-in players sync them with their
            account.
          </p>
          <div className="discover-swatches">
            <div>
              <span>Accents</span>
              <div>
                {Object.values(ACCENT_THEMES).map((theme) => (
                  <i
                    key={theme.id}
                    title={theme.label}
                    style={{ backgroundColor: `rgb(${theme.rgb})` }}
                  />
                ))}
              </div>
            </div>
            <div>
              <span>Boards</span>
              <div>
                {Object.entries(BOARD_THEMES).map(([id, colors]) => (
                  <i
                    key={id}
                    title={id}
                    style={{
                      background: `linear-gradient(135deg, ${colors.light} 50%, ${colors.dark} 50%)`,
                    }}
                  />
                ))}
              </div>
            </div>
            <div>
              <span>Pieces</span>
              <div className="discover-piecesets">
                {PIECE_SETS.map((name) => (
                  <b key={name}>{name}</b>
                ))}
              </div>
            </div>
            <div>
              <span>Interface</span>
              <div className="discover-piecesets">
                <b>System</b>
                <b>Light</b>
                <b>Dark</b>
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}

function Why() {
  return (
    <section className="discover-section discover-reveal" id="why" aria-labelledby="why-heading">
      <p className="discover-kicker">Why</p>
      <h2 id="why-heading">Static opponents don&apos;t grow with you.</h2>
      <p className="discover-lede">
        The idea comes from adaptive resistance machines: the load changes with the person training.
        A fixed-Elo opponent stays on one setting. Adaptive Chess Trainer retargets from an estimate
        of your play. The aim is a challenge that can evolve with that estimate, not a guarantee
        that you will improve.
      </p>

      <div className="discover-compare">
        <article>
          <h3>Fixed Elo</h3>
          <p>One opponent strength for the whole session.</p>
          <div className="discover-track" aria-hidden="true">
            <span className="discover-track__mark is-fixed" />
          </div>
        </article>
        <article>
          <h3>Adaptive target</h3>
          <p>The target moves when the estimate of your play moves.</p>
          <div className="discover-track" aria-hidden="true">
            <span className="discover-track__mark is-adaptive" />
          </div>
        </article>
      </div>
    </section>
  );
}

function System({ sectionRef }: { sectionRef: RefObject<HTMLElement | null> }) {
  return (
    <section
      className="discover-section discover-system discover-reveal"
      id="system"
      ref={sectionRef}
      aria-labelledby="system-heading"
    >
      <p className="discover-kicker">System</p>
      <h2 id="system-heading">Every move informs the next.</h2>
      <ol className="discover-flow">
        {SYSTEM_STEPS.map((step, index) => (
          <li key={step.title} style={{ animationDelay: `${index * 1.15}s` }}>
            <span>{index + 1}</span>
            <h3>{step.title}</h3>
            <p>{step.detail}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Engine() {
  return (
    <section
      className="discover-section discover-reveal"
      id="engine"
      aria-labelledby="engine-heading"
    >
      <div className="discover-engine">
        <div>
          <p className="discover-kicker">Engine</p>
          <h2 id="engine-heading">Powered by Stockfish</h2>
          <p>
            Opponent play and move analysis run on Stockfish.js 19 Lite in the browser. It evaluates
            positions and candidate moves, and that evaluation feeds both the live opponent and the
            custom move-quality review.
          </p>
          <p className="discover-note">
            Stockfish does not endorse or partner with Adaptive Chess Trainer. Stockfish.js is based
            on Stockfish and is used under the GNU GPLv3.
          </p>
        </div>
        <div className="discover-engine__visual" aria-hidden="true">
          <span>UCI</span>
          <strong>Stockfish.js 19 Lite</strong>
          <em>Search · Evaluate · Respond</em>
        </div>
      </div>
    </section>
  );
}

function Stack() {
  return (
    <section
      className="discover-section discover-reveal"
      id="stack"
      aria-labelledby="stack-heading"
    >
      <p className="discover-kicker">Stack</p>
      <h2 id="stack-heading">Built with the tools in the repository.</h2>
      <div className="discover-stack">
        {TECH_GROUPS.map((group) => (
          <section
            key={group.label}
            aria-labelledby={`stack-${group.label.toLowerCase().replaceAll(" ", "-")}`}
          >
            <h3 id={`stack-${group.label.toLowerCase().replaceAll(" ", "-")}`}>{group.label}</h3>
            <ul>
              {group.items.map((item) => (
                <li key={item.name}>
                  {"icon" in item && item.icon ? (
                    <img
                      src={publicAssetUrl(item.icon)}
                      alt=""
                      width={24}
                      height={24}
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <span aria-hidden="true">{item.name.slice(0, 1)}</span>
                  )}
                  {item.name}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </section>
  );
}

function Destrier() {
  return (
    <section
      className="discover-destrier discover-reveal"
      id="destrier"
      aria-labelledby="destrier-heading"
    >
      <p className="discover-soon">Coming Soon</p>
      <img
        className="discover-mascot discover-mascot--reveal"
        src={MASCOT_SRC}
        alt="Destrier, a chess knight lifting a barbell"
        width={1230}
        height={1278}
        loading="lazy"
        decoding="async"
      />
      <h2 id="destrier-heading">Meet Destrier.</h2>
      <p>
        Destrier is the planned conversational training agent, represented by this knight. The aim
        is chess guidance you can talk through: help understanding your games, and coaching-oriented
        conversation. None of that is available yet.
      </p>
    </section>
  );
}
