import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { usePageVisible, useReducedMotion } from "@/hooks/use-reduced-motion";

export function InfiniteMarquee({
  items,
  className,
  speed = 40,
  direction = "left",
}: {
  items: ReactNode[];
  className?: string;
  speed?: number;
  direction?: "left" | "right";
}) {
  const reduced = useReducedMotion();
  const visible = usePageVisible();

  // Reduced-motion: static, single-copy row, no animation, no duplication.
  if (reduced) {
    return (
      <div className={cn("relative overflow-hidden", className)}>
        <div className="flex w-full flex-wrap gap-4">
          {items.map((it, i) => (
            <div key={i} className="shrink-0">
              {it}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      data-paused={visible ? "false" : "true"}
      className={cn(
        "relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)]",
        className,
      )}
    >
      <div
        className={cn(
          "flex w-max gap-4 will-change-transform",
          direction === "left" ? "animate-marquee" : "animate-marquee-rev",
        )}
        style={{ "--marquee-duration": `${speed}s` } as React.CSSProperties}
      >
        {[...items, ...items].map((it, i) => (
          <div key={i} className="shrink-0">
            {it}
          </div>
        ))}
      </div>
    </div>
  );
}
