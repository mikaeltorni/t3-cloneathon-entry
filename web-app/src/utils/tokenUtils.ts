/**
 * tokenUtils.ts
 * 
 * Utility functions for token metrics formatting and calculations
 * 
 * Functions:
 *   formatDuration - Formats duration in milliseconds
 *   formatCost - Formats cost with appropriate precision
 *   getTokensPerSecondColor - Gets color class for TPS value
 * 
 * Usage: import { formatDuration, formatCost } from './utils/tokenUtils'
 */

/**
 * Format duration in milliseconds for display
 * 
 * @param ms - Duration in milliseconds
 * @returns Formatted duration string (e.g., "1.5s" or "500ms")
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

/**
 * Format cost with appropriate precision
 * 
 * @param cost - Cost value to format
 * @returns Formatted cost string with $ prefix
 */
export function formatCost(cost: number): string {
  if (cost < 0.001) return `$${(cost * 1000).toFixed(2)}‰`; // Show in per-mille for very small costs
  return `$${cost.toFixed(6)}`;
}

/**
 * Get appropriate color class for tokens per second value
 * 
 * @param tokensPerSecond - TPS value
 * @returns Tailwind color class
 */
export function getTokensPerSecondColor(tokensPerSecond: number): string {
  if (tokensPerSecond > 50) return 'text-green-600';
  if (tokensPerSecond > 20) return 'text-yellow-600';
  return 'text-gray-600';
} 