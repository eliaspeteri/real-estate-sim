/**
 * Format a date to a readable string
 */
export const formatDate = (date: Date): string => {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
};

/**
 * Format a currency value
 */
export const formatCurrency = (amount: number): string => {
  return `$${amount.toLocaleString()}`;
};

/**
 * Format a percentage value
 */
export const formatPercent = (value: number): string => {
  return `${value.toFixed(2)}%`;
};
