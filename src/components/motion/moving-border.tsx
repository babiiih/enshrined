import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function MovingBorder({
  as: Comp = "div",
  className,
  containerClassName,
  duration = 4,
  children,
  ...rest
}: {
  as?: any;
  className?: string;
  containerClassName?: string;
  duration?: number;
  children: ReactNode;
  [k: string]: unknown;
}) {
  return (
    <Comp
      className={cn(
        "relative inline-flex overflow-hidden rounded-md p-[1px] moving-border-wrap",
        containerClassName,
      )}
      style={{ "--mb-duration": `${duration}s` } as React.CSSProperties}
      {...rest}
    >
      <span aria-hidden className="moving-border-glow" />
      <span
        className={cn(
          "relative inline-flex w-full items-center justify-center rounded-[calc(0.375rem-1px)] bg-background px-3 py-1.5",
          className,
        )}
      >
        {children}
      </span>
    </Comp>
  );
}
