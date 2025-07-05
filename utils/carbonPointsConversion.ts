/**
 * Carbon Points Conversion Utilities
 * Conversion Rate: 1 Carbon Point = ₹18
 */

export const RUPEES_PER_CARBON_POINT = 18;

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

/**
 * Format carbon points for database storage (6 decimal places precision)
 * @param carbonPoints Number of carbon points
 * @returns Number rounded to 6 decimal places
 */
export function formatCarbonPointsForDB(carbonPoints: number): number {
  return Math.round(carbonPoints * 1000000) / 1000000;
}

/**
 * Calculate how much money is "lost" due to rounding down (deprecated for decimal system)
 * @param _rupees Amount in rupees (unused in decimal system)
 * @returns Always returns 0 since we now use precise decimals
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getRoundingLoss(_rupees: number): number {
  // With decimal conversion, there's no rounding loss
  return 0;
} 