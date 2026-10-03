import { duration, easing, prefersReducedMotion } from "../../theme/motion";

/** Marks the element an added product flies into (the cart icon or bar). */
export const CART_TARGET = "data-cart-target";

/** Replay the little bump on the cart, even if it is mid-bump already. */
export const bumpCart = () => {
  document.querySelectorAll<HTMLElement>(`[${CART_TARGET}]`).forEach((el) => {
    el.classList.remove("pos-bump");
    void el.offsetWidth; // restart the CSS animation
    el.classList.add("pos-bump");
  });
};

/**
 * A token with the product's initials arcs from the tapped card into the
 * cart, so the cashier sees where the item went without looking away.
 * Uses the Web Animations API: no library, and it runs off the main thread.
 */
export function flyToCart(from: HTMLElement, label: string, background: string) {
  const target = Array.from(document.querySelectorAll<HTMLElement>(`[${CART_TARGET}]`)).find(
    (el) => el.offsetParent !== null
  );

  if (!target || prefersReducedMotion() || typeof document.body.animate !== "function") {
    bumpCart();
    return;
  }

  const a = from.getBoundingClientRect();
  const b = target.getBoundingClientRect();
  const size = 44;
  const startX = a.left + a.width / 2 - size / 2;
  const startY = a.top + a.height / 2 - size / 2;
  const dx = b.left + b.width / 2 - size / 2 - startX;
  const dy = b.top + b.height / 2 - size / 2 - startY;

  const token = document.createElement("div");
  token.textContent = label;
  token.setAttribute("aria-hidden", "true");
  Object.assign(token.style, {
    position: "fixed",
    left: `${startX}px`,
    top: `${startY}px`,
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: "14px",
    display: "grid",
    placeItems: "center",
    color: "#fff",
    font: '700 14px "Rubik Variable", system-ui, sans-serif',
    background,
    boxShadow: "0 10px 24px rgba(0,0,0,.25)",
    zIndex: "2000",
    pointerEvents: "none",
  });
  document.body.appendChild(token);

  // Up and over: lift first, then drop into the cart.
  const lift = Math.min(120, Math.abs(dx) * 0.35 + 40);
  const animation = token.animate(
    [
      { transform: "translate(0, 0) scale(1)", opacity: 1 },
      { transform: `translate(${dx * 0.45}px, ${dy * 0.45 - lift}px) scale(1.1)`, opacity: 1, offset: 0.45 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.35)`, opacity: 0.4 },
    ],
    { duration: duration.celebrate - 120, easing: easing.standard }
  );

  animation.onfinish = () => {
    token.remove();
    bumpCart();
  };
  animation.oncancel = () => token.remove();
}
