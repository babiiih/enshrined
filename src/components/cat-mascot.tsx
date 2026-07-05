import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

/**
 * Premium black cat mascot with orbit ring, breathing pulse, particles,
 * blink and tail-wag idle animations. Hover triggers a hop.
 * Orbit/particle decorations are suppressed under prefers-reduced-motion.
 */
export function CatMascot({
  className,
  size = 40,
  eyeColor = "#f0d78c",
  orbit = true,
}: {
  className?: string;
  size?: number;
  eyeColor?: string;
  orbit?: boolean;
}) {
  const reduced = useReducedMotion();
  const showOrbit = orbit && !reduced;
  return (
    <div
      className={cn("cat-mascot-wrap relative inline-grid place-items-center", className)}
      style={{ width: size, height: size }}
    >
      {showOrbit && (
        <>
          <span className="cat-orbit-ring" aria-hidden />
          <span className="cat-orbit-ring cat-orbit-ring--slow" aria-hidden />
          <span className="cat-orbit-glow" aria-hidden />
          <span className="cat-orbit-dot cat-orbit-dot--a" aria-hidden />
          <span className="cat-orbit-dot cat-orbit-dot--b" aria-hidden />
          <span className="cat-orbit-dot cat-orbit-dot--c" aria-hidden />
        </>
      )}
      <svg
        className="cat-mascot relative z-[1]"
        width={size}
        height={size}
        viewBox="0 0 64 64"
        role="img"
        aria-label="Ritual black cat mascot"
      >
        <defs>
          <radialGradient id="catFur" cx="50%" cy="40%" r="65%">
            <stop offset="0%" stopColor="#1c1c22" />
            <stop offset="100%" stopColor="#050506" />
          </radialGradient>
          <linearGradient id="catEye" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={eyeColor} />
            <stop offset="100%" stopColor="#c9a84c" />
          </linearGradient>
        </defs>

        <g className="cat-tail" style={{ transformOrigin: "48px 44px" }}>
          <path
            d="M46 44 C 56 40, 60 28, 54 20"
            stroke="url(#catFur)"
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
          />
        </g>

        <g className="cat-breathe" style={{ transformOrigin: "32px 42px" }}>
          <ellipse cx="30" cy="42" rx="20" ry="16" fill="url(#catFur)" />
          <circle cx="30" cy="26" r="15" fill="url(#catFur)" />
          <polygon points="18,16 22,4 26,14" fill="url(#catFur)" />
          <polygon points="42,16 38,4 34,14" fill="url(#catFur)" />
          <polygon points="20,12 22,7 24,12" fill="#c9a84c" opacity="0.55" />
          <polygon points="40,12 38,7 36,12" fill="#c9a84c" opacity="0.55" />

          <g className="cat-eyes">
            <ellipse cx="24" cy="26" rx="2.6" ry="3.3" fill="url(#catEye)" />
            <ellipse cx="36" cy="26" rx="2.6" ry="3.3" fill="url(#catEye)" />
            <ellipse cx="24" cy="26" rx="0.7" ry="2.8" fill="#050506" />
            <ellipse cx="36" cy="26" rx="0.7" ry="2.8" fill="#050506" />
            <circle cx="24.7" cy="25" r="0.55" fill="#fff8dc" />
            <circle cx="36.7" cy="25" r="0.55" fill="#fff8dc" />
          </g>

          <path d="M28.5 30 L31.5 30 L30 32 Z" fill="#c9a84c" />
          <g stroke="#8b7a4a" strokeWidth="0.6" strokeLinecap="round" opacity="0.7">
            <line x1="18" y1="30" x2="12" y2="29" />
            <line x1="18" y1="32" x2="12" y2="33" />
            <line x1="42" y1="30" x2="48" y2="29" />
            <line x1="42" y1="32" x2="48" y2="33" />
          </g>
          <ellipse cx="22" cy="55" rx="4" ry="2.5" fill="url(#catFur)" />
          <ellipse cx="38" cy="55" rx="4" ry="2.5" fill="url(#catFur)" />
        </g>
      </svg>
    </div>
  );
}
