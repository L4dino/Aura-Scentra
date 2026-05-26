export function formatMZN(value: number): string {
  const n = new Intl.NumberFormat("pt-MZ", { maximumFractionDigits: 0 }).format(Math.round(value));
  return `${n} MZN`;
}