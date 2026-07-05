import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function AuroraBackground({
  className,
  children,
  intensity = "normal",
}: {
  className?: string;
  children?: ReactNode;
  intensity?: "soft" | "normal" | "loud";
}) {
  const opacity = intensity === "soft" ? 0.35 : intensity === "loud" ? 0.75 : 0.55;
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 motion-reduce:hidden"
        style={{ opacity }}
      >
        <div className="aurora-blob aurora-blob--a" />
        <div className="aurora-blob aurora-blob--b" />
        <div className="aurora-blob aurora-blob--c" />
      </div>
      {children}
    </div>
  );
}
