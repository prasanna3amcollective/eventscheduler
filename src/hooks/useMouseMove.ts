"use client";

import { useEffect, useState } from "react";

/**
 * A lightweight hook that tracks the mouse position across the window.
 * It sets `--mouse-x` and `--mouse-y` CSS variables on the root document
 * which can be used by CSS for performant parallax and interactive effects.
 * Values are normalized from -1 (left/top) to 1 (right/bottom).
 */
export function useMouseMove() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Only run on the client
    if (typeof window === "undefined") return;

    // Use requestAnimationFrame to throttle the updates for better performance
    let ticking = false;

    const handleMouseMove = (e: MouseEvent) => {
      if (!ticking) {
        globalThis.requestAnimationFrame(() => {
          // Normalize coordinates between -1 and 1
          const x = (e.clientX / window.innerWidth) * 2 - 1;
          const y = (e.clientY / window.innerHeight) * 2 - 1;

          // Set CSS variables on the document root for pure CSS interactions
          document.documentElement.style.setProperty("--mouse-x", x.toString());
          document.documentElement.style.setProperty("--mouse-y", y.toString());

          setMousePosition({ x, y });
          ticking = false;
        });
        ticking = true;
      }
    };

    globalThis.addEventListener("mousemove", handleMouseMove, { passive: true });

    return () => {
      globalThis.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return mousePosition;
}
