import { cn } from "@/lib/utils";

export function Spotlight({
  className,
  fill = "gold",
}: {
  className?: string;
  fill?: "gold" | "signal";
}) {
  const color =
    fill === "gold"
      ? "color-mix(in oklab, var(--gold) 22%, transparent)"
      : "color-mix(in oklab, var(--signal) 22%, transparent)";
  return (
    <svg
      aria-hidden
      className={cn(
        "pointer-events-none absolute -top-40 left-0 -z-10 h-[80%] w-[60%] opacity-70 motion-reduce:hidden animate-spotlight",
        className,
      )}
      viewBox="0 0 3787 2842"
      fill="none"
    >
      <g filter="url(#spotlight-blur)">
        <ellipse
          cx="1924.71"
          cy="273.501"
          rx="1924.71"
          ry="273.501"
          transform="matrix(-0.822 -0.569 -0.569 0.822 3631.88 2291.09)"
          fill={color}
        />
      </g>
      <defs>
        <filter
          id="spotlight-blur"
          x="0"
          y="0"
          width="3787"
          height="2842"
          filterUnits="userSpaceOnUse"
        >
          <feGaussianBlur stdDeviation="151" />
        </filter>
      </defs>
    </svg>
  );
}
