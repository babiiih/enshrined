import { cn } from "@/lib/utils";
import { CatMascot } from "./cat-mascot";


/**
 * 3D Ritual cat mascot. Streams a compressed GLB (~270 KB) from CDN, renders
 * in a transparent <Canvas>. Falls back to the SVG CatMascot until the model
 * loads or when prefers-reduced-motion is set.
 *
 * three.js + react-three-fiber are lazy-loaded so the initial bundle stays lean.
 */
export function CatMascot3D({
  className,
  size = 180,
  orbit = true,
}: {
  className?: string;
  size?: number;
  orbit?: boolean;
}) {
  // 3D GLB mascot temporarily disabled until the asset is (re)published; the
  // SVG mascot below is a lightweight, always-available fallback so the app
  // never crashes on a missing model file.
  const showOrbit = orbit;
  return (
    <div
      className={cn("cat-mascot-wrap relative inline-grid place-items-center", className)}
      style={{ width: size, height: size }}
    >
      {showOrbit && (
        <>
          <span className="cat-orbit-ring" aria-hidden />
          <span className="cat-orbit-ring cat-orbit-ring--slow" aria-hidden />
          <span className="cat-orbit-glow" aria-hidden />
          <span className="cat-orbit-dot cat-orbit-dot--a" aria-hidden />
          <span className="cat-orbit-dot cat-orbit-dot--b" aria-hidden />
          <span className="cat-orbit-dot cat-orbit-dot--c" aria-hidden />
        </>
      )}
      <div className="relative z-[1]" style={{ width: size, height: size }}>
        <CatMascot size={size} orbit={false} />
      </div>
    </div>
  );
}
