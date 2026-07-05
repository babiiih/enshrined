import { cn } from "@/lib/utils";
import { useReducedMotion, useMinWidth } from "@/hooks/use-reduced-motion";
import { useMemo } from "react";

export function Meteors({ number = 18, className }: { number?: number; className?: string }) {
  const reduced = useReducedMotion();
  const isDesktop = useMinWidth(640);

  // Clamp count; drop entirely on tiny screens or reduced-motion.
  const count = Math.min(number, isDesktop ? 12 : 6);

  const seeds = useMemo(
    () =>
      Array.from({ length: count }).map(() => ({
        top: `${Math.random() * 40 - 10}%`,
        left: `${Math.random() * 100}%`,
        delay: `${Math.random() * 4}s`,
        duration: `${4 + Math.random() * 6}s`,
      })),
    [count],
  );

  if (reduced || !isDesktop) return null;

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden motion-reduce:hidden",
        className,
      )}
    >
      {seeds.map((s, i) => (
        <span
          key={i}
          className="meteor"
          style={{
            top: s.top,
            left: s.left,
            animationDelay: s.delay,
            animationDuration: s.duration,
          }}
        />
      ))}
    </div>
  );
}
