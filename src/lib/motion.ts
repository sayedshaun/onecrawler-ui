import type { Transition } from "framer-motion";

/** Shared smooth deceleration curve (easeOutQuint). Mirrors the `ease-out`
 *  token in tailwind.config.ts so CSS- and framer-driven motion feel identical. */
export const easeSmooth: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Small, high-frequency UI feedback: hover lifts, nav pills, button press.
 *  Critically damped — responsive but with no overshoot jitter. */
export const springUI: Transition = { type: "spring", stiffness: 400, damping: 40, mass: 1 };

/** Larger movements: panels entering/leaving. Gentle settle, no bounce. */
export const springPage: Transition = { type: "spring", stiffness: 300, damping: 34, mass: 1 };

/** Page/route content transition — a fast, crisp eased fade. Kept short and
 *  scale-free so pages reveal cleanly instead of "popping" into place. */
export const transitionPage: Transition = { duration: 0.3, ease: easeSmooth };
