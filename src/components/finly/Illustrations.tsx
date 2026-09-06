/**
 * Lightweight inline SVG illustrations (no image files, no extra libraries).
 * Colors come from the existing theme tokens so light/dark both work.
 */

export function HeroFinanceArt({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 320 200"
      className={className}
      role="img"
      aria-label="Illustration of coins, a savings jar and a rising growth chart"
    >
      <defs>
        <linearGradient id="finly-bar" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.25" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.85" />
        </linearGradient>
      </defs>

      {/* growth bars */}
      <g className="text-primary" fill="url(#finly-bar)">
        <rect x="150" y="120" width="26" height="60" rx="8" />
        <rect x="186" y="96" width="26" height="84" rx="8" />
        <rect x="222" y="64" width="26" height="116" rx="8" />
        <rect x="258" y="34" width="26" height="146" rx="8" />
      </g>

      {/* rising line */}
      <polyline
        points="150,124 190,100 226,68 268,38"
        fill="none"
        className="text-accent"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="268" cy="38" r="6" className="text-accent" fill="currentColor" />

      {/* savings jar */}
      <g className="text-primary">
        <rect x="34" y="86" width="86" height="86" rx="18" fill="currentColor" fillOpacity="0.18" />
        <rect x="34" y="86" width="86" height="86" rx="18" fill="none" stroke="currentColor" strokeWidth="4" />
        <rect x="60" y="76" width="34" height="12" rx="6" fill="currentColor" />
      </g>

      {/* coins */}
      <g className="text-accent" fill="currentColor">
        <circle cx="60" cy="146" r="14" fillOpacity="0.9" />
        <circle cx="90" cy="152" r="11" fillOpacity="0.75" />
        <circle cx="77" cy="122" r="12" fillOpacity="0.6" />
      </g>

      {/* card */}
      <g className="text-primary">
        <rect x="26" y="26" width="88" height="52" rx="12" fill="currentColor" fillOpacity="0.9" />
        <rect x="26" y="42" width="88" height="9" className="text-background" fill="currentColor" />
        <rect x="36" y="60" width="30" height="7" rx="3.5" className="text-background" fill="currentColor" />
      </g>
    </svg>
  );
}

/** Soft decorative blobs/coins, purely ornamental. */
export function DecorShapes({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 60" className={className} aria-hidden="true" focusable="false">
      <g className="text-primary" fill="currentColor" fillOpacity="0.16">
        <circle cx="40" cy="30" r="16" />
        <circle cx="96" cy="22" r="8" />
        <rect x="140" y="16" width="60" height="28" rx="14" />
      </g>
      <g className="text-accent" fill="currentColor" fillOpacity="0.22">
        <circle cx="250" cy="34" r="12" />
        <rect x="290" y="20" width="80" height="20" rx="10" />
      </g>
    </svg>
  );
}

/** Tiny sparkline used inside feature cards. */
export function MiniSpark({ points, className = "" }: { points: string; className?: string }) {
  return (
    <svg viewBox="0 0 80 28" className={className} aria-hidden="true" focusable="false">
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
