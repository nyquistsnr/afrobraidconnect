import { useEffect, useState } from "react";

// Two thresholds (not one) so the boolean can't flap: once scrolled,
// scrollY has to fall all the way back under `exitThreshold` to flip back.
// A single threshold would toggle rapidly whenever momentum/trackpad
// scrolling settles right on that pixel, which visibly glitches anything
// that swaps shape based on this value (e.g. the header search bar).
export function useScrolled(enterThreshold = 40, exitThreshold = 4): boolean {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setScrolled((prev) => {
        const y = window.scrollY;
        return prev ? y > exitThreshold : y > enterThreshold;
      });
    }
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [enterThreshold, exitThreshold]);

  return scrolled;
}
