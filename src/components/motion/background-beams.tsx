import { cn } from "@/lib/utils";

export function BackgroundBeams({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 -z-10 overflow-hidden motion-reduce:hidden",
        className,
      )}
    >
      <svg
        className="absolute inset-0 h-full w-full opacity-40"
        viewBox="0 0 800 600"
        preserveAspectRatio="none"
        fill="none"
      >
        <defs>
          <linearGradient id="beam-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="color-mix(in oklab, var(--gold) 60%, transparent)" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>
        {Array.from({ length: 10 }).map((_, i) => (
          <path
            key={i}
            d={`M ${-100 + i * 90} 600 Q ${100 + i * 70} 300 ${400 + i * 30} -50`}
            stroke="url(#beam-g)"
            strokeWidth="1"
            className="beam-path"
            style={{ animationDelay: `${i * 0.4}s` }}
          />
        ))}
      </svg>
    </div>
  );
}
