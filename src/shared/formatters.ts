/**
 * Pluralizes a unit string based on quantity.
 * Returns singular form for quantity of 1, plural form otherwise.
 */
export function pluralizeUnit(quantity: number, unit: string): string {
  if (quantity === 1) return unit;
  if (unit.endsWith('s')) return unit;
  return unit + 's';
}
