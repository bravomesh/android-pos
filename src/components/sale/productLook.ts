/**
 * Products have no photos, so each gets a coloured tile with its initials.
 * The colour comes from the name, so a product looks the same on the grid,
 * in flight and in the cart, every time the till opens.
 */
const hash = (text: string) => {
  let h = 0;
  for (let i = 0; i < text.length; i += 1) h = (h * 31 + text.charCodeAt(i)) | 0;
  return Math.abs(h);
};

// Hues that stay vivid at the lightness white text needs; the muddy
// yellow-olive-brown band is left out.
const HUES = [160, 174, 190, 205, 220, 235, 255, 275, 295, 320, 340, 355];

export const tileHue = (seed: string) => HUES[hash(seed || "?") % HUES.length];

// Lightness 24-30% keeps white initials above 4.5:1 for every hue above.
export const tileGradient = (seed: string) => {
  const h = tileHue(seed);
  return `linear-gradient(135deg, hsl(${h} 65% 30%) 0%, hsl(${(h + 24) % 360} 62% 24%) 100%)`;
};

export const tileSolid = (seed: string) => `hsl(${tileHue(seed)} 65% 28%)`;

export const initials = (name: string) => {
  const words = name.trim().split(/\s+/).filter((w) => /[A-Za-z]/.test(w[0]));
  if (words.length === 0) return name.slice(0, 2).toUpperCase();
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
};
