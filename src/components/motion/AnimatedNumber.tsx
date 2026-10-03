import { useEffect, useRef, useState } from "react";
import { duration as durations, prefersReducedMotion } from "../../theme/motion";

export interface AnimatedNumberProps {
  value: number;
  format?: (value: number) => string;
  /** How long the count takes, in ms. */
  duration?: number;
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * A figure that counts to its new value instead of jumping, so a total
 * changing is noticed. Lands immediately when motion is reduced.
 */
export default function AnimatedNumber({ value, format = String, duration = durations.emphasis }: AnimatedNumberProps) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);

  useEffect(() => {
    const start = from.current;
    if (start === value || prefersReducedMotion()) {
      from.current = value;
      setShown(value);
      return;
    }

    let frame = 0;
    const began = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - began) / duration);
      const next = start + (value - start) * easeOutCubic(t);
      from.current = next;
      setShown(t === 1 ? value : next);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  return <>{format(shown)}</>;
}
