/**
 * Format price to Vietnamese Dong (VND) format
 * @param {number|string} price - The price to format
 * @param {boolean} showCurrency - Whether to show currency symbol (₫)
 * @returns {string} Formatted price string
 *
 * Examples:
 * formatPrice(41240000) => "41.240.000 ₫"
 * formatPrice(41240000, false) => "41.240.000"
 * formatPrice("41240000") => "41.240.000 ₫"
 */
export const formatPrice = (price, showCurrency = true) => {
  if (!price && price !== 0) return showCurrency ? '0 ₫' : '0';

  const numericPrice = typeof price === 'string' ? parseFloat(price) : price;

  if (isNaN(numericPrice)) return showCurrency ? '0 ₫' : '0';

  const formatted = Math.round(numericPrice).toLocaleString('vi-VN');

  return showCurrency ? `${formatted} ₫` : formatted;
};

/**
 * Parse formatted Vietnamese price string to number
 * @param {string} formattedPrice - Formatted price string (e.g., "41.240.000" or "41.240.000 ₫")
 * @returns {number} Numeric price
 *
 * Examples:
 * parsePrice("41.240.000 ₫") => 41240000
 * parsePrice("41.240.000") => 41240000
 */
export const parsePrice = (formattedPrice) => {
  if (!formattedPrice) return 0;

  // Remove all non-digit characters
  const numericString = formattedPrice.toString().replace(/\D/g, '');

  return parseInt(numericString) || 0;
};

/**
 * Format price input for form fields
 * Converts user input to formatted display value
 * @param {string} value - Input value
 * @returns {string} Formatted value for display
 *
 * Example:
 * formatPriceInput("41240000") => "41.240.000"
 */
export const formatPriceInput = (value) => {
  if (!value) return '';

  const numericValue = value.replace(/\D/g, '');
  if (!numericValue) return '';

  return parseInt(numericValue).toLocaleString('vi-VN');
};

/**
 * Calculate discount percentage
 * @param {number} originalPrice - Original price
 * @param {number} salePrice - Sale price
 * @returns {number} Discount percentage (rounded)
 *
 * Example:
 * calculateDiscount(41240000, 35000000) => 15
 */
export const calculateDiscount = (originalPrice, salePrice) => {
  if (!originalPrice || !salePrice || salePrice >= originalPrice) return 0;

  return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
};

export default {
  formatPrice,
  parsePrice,
  formatPriceInput,
  calculateDiscount,
};
