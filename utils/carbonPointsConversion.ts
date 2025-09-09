/**
 * Carbon Points Conversion Utilities
 */

export const RUPEES_PER_CARBON_POINT = parseFloat(process.env.NEXT_PUBLIC_RUPEES_PER_CARBON_POINT || "18");

/**
 * Get the carbonpoint conversion rate
 */
export function getConversionRate(): number {
  return RUPEES_PER_CARBON_POINT;
}

/**
 * Convert rupees to carbon points with precise decimal calculation
 * @param rupees Amount in rupees
 * @returns Number of carbon points with up to 6 decimal places precision
 */
export function rupeesToCarbonPoints(rupees: number): number {
  const result = rupees / RUPEES_PER_CARBON_POINT;
  // Round to 6 decimal places to match database precision
  return Math.round(result * 1000000) / 1000000;
}

/**
 * Convert carbon points to rupees
 * @param carbonPoints Number of carbon points
 * @returns Equivalent amount in rupees
 */
export function carbonPointsToRupees(carbonPoints: number): number {
  return carbonPoints * RUPEES_PER_CARBON_POINT;
}

/**
 * Format carbon points for UI display (2 decimal places)
 * @param carbonPoints Number of carbon points
 * @returns Formatted string with 2 decimal places
 */
export function formatCarbonPointsForUI(carbonPoints: number): string {
  return carbonPoints.toFixed(2);
}