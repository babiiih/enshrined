import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Dot = {
  top: number;
  left: number;
  delay: number;
  duration: number;
  size: number;
};

export function Sparkles({
  className,
  count = 14,
}: {
  className?: string;
  count?: number;
}) {
  // Generate on the client only — Math.random() at render time would produce
  // different values on SSR vs hydration and blow up the tree with a mismatch.
  const [dots, setDots] = useState<Dot[]>([]);
  useEffect(() => {
    setDots(
      Array.from({ length: count }, () => ({
        top: Math.random() * 100,
        left: Math.random() * 100,
        delay: Math.random() * 3,
        duration: 2 + Math.random() * 3,
        size: 1 + Math.random() * 2,
      })),
    );
  }, [count]);

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 motion-reduce:hidden",
        className,
      )}
    >
      {dots.map((d, i) => (
        <span
          key={i}
          className="sparkle-dot"
          style={{
            top: `${d.top}%`,
            left: `${d.left}%`,
            animationDelay: `${d.delay}s`,
            animationDuration: `${d.duration}s`,
            width: `${d.size}px`,
            height: `${d.size}px`,
          }}
        />
      ))}
    </div>
  );
}
