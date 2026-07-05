import { cn } from "@/lib/utils";
import { useRef, type ReactNode, type MouseEvent } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

export function CardSpotlight({
  className,
  children,
  radius = 260,
}: {
  className?: string;
  children: ReactNode;
  radius?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const pending = useRef<{ x: number; y: number } | null>(null);
  const reduced = useReducedMotion();

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    pending.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const p = pending.current;
      const node = ref.current;
      if (!p || !node) return;
      node.style.setProperty("--cs-x", `${p.x}px`);
      node.style.setProperty("--cs-y", `${p.y}px`);
    });
  };

  return (
    <div
      ref={ref}
      onMouseMove={reduced ? undefined : onMove}
      className={cn("relative overflow-hidden group card-spotlight", className)}
      style={{ "--cs-radius": `${radius}px` } as React.CSSProperties}
    >
      {!reduced && <span aria-hidden className="card-spotlight-layer" />}
      {children}
    </div>
  );
}
