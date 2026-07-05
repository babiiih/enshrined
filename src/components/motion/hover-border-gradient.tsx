import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function HoverBorderGradient({
  children,
  className,
  containerClassName,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  containerClassName?: string;
  as?: any;
}) {
  return (
    <Tag
      className={cn(
        "relative inline-flex overflow-hidden rounded-md p-[1px] hover-border-gradient",
        containerClassName,
      )}
    >
      <span aria-hidden className="hbg-spin" />
      <span
        className={cn(
          "relative z-10 inline-flex items-center justify-center rounded-[calc(0.375rem-1px)] bg-background",
          className,
        )}
      >
        {children}
      </span>
    </Tag>
  );
}
