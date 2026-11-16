export const shade = (hex: string, amount: number): string => {
  const c = hex.replace("#", "");
  if (c.length !== 6) return hex;
  const channel = (i: number) => {
    const v = parseInt(c.slice(i, i + 2), 16);
    const out = amount < 0 ? v * (1 + amount) : v + (255 - v) * amount;
    return Math.round(Math.max(0, Math.min(255, out)))
      .toString(16)
      .padStart(2, "0");
  };
  return `#${channel(0)}${channel(2)}${channel(4)}`;
};
