import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { createElement, useMemo } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

/**
 * Character/word-by-word reveal. For long strings (>24 words) we animate
 * per-line rather than per-word to cap layout thrash on low-end devices.
 * Respects prefers-reduced-motion by rendering plain text.
 */
export function TextGenerate({
  words,
  className,
  as: Tag = "span",
  delay = 0,
}: {
  words: string;
  className?: string;
  as?: any;
  delay?: number;
}) {
  const reduced = useReducedMotion();
  const tokens = useMemo(() => words.split(" "), [words]);
  const heavy = tokens.length > 24;

  if (reduced) {
    return createElement(Tag, { className: cn(className) }, words);
  }

  const MotionTag = motion(Tag as any);

  // Heavy content → single fade-up per whole string; keeps GPU cost bounded.
  if (heavy) {
    return (
      <MotionTag
        initial={{ opacity: 0, y: 8, filter: "blur(6px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.6, delay, ease: [0.2, 0.8, 0.2, 1] }}
        className={cn(className)}
      >
        {words}
      </MotionTag>
    );
  }

  return (
    <MotionTag
      initial="hidden"
      animate="show"
      transition={{ staggerChildren: 0.06, delayChildren: delay }}
      className={cn(className)}
    >
      {tokens.map((w, i) => (
        <motion.span
          key={`${w}-${i}`}
          variants={{
            hidden: { opacity: 0, y: 8, filter: "blur(8px)" },
            show: { opacity: 1, y: 0, filter: "blur(0px)" },
          }}
          transition={{ duration: 0.55, ease: [0.2, 0.8, 0.2, 1] }}
          className="inline-block mr-[0.25em]"
        >
          {w}
        </motion.span>
      ))}
    </MotionTag>
  );
}
