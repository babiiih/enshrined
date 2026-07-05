import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function BentoCard({
  children,
  className,
  span,
  delay = 0,
  tag,
  title,
  action,
}: {
  children?: ReactNode;
  className?: string;
  span?: "col-2" | "row-2" | "col-2-row-2" | "col-3";
  delay?: number;
  tag?: string;
  title?: string;
  action?: ReactNode;
}) {
  const spanCls =
    span === "col-2"
      ? "md:col-span-2"
      : span === "row-2"
        ? "md:row-span-2"
        : span === "col-2-row-2"
          ? "md:col-span-2 md:row-span-2"
          : span === "col-3"
            ? "md:col-span-3"
            : "";
  return (
    <div
      className={cn(
        "terminal-card terminal-card-hover bento-in relative p-5 flex flex-col min-h-[140px]",
        spanCls,
        className,
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {(tag || title || action) && (
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-baseline gap-2">
            {tag && <span className="mono-tag text-signal">{tag}</span>}
            {title && <span className="text-sm font-semibold tracking-tight">{title}</span>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
