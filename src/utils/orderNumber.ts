/**
 * Order Number Utilities
 * 
 * Functions for parsing and formatting simple order numbers.
 * Order format: #0001, #0002, #0003, etc.
 */

export interface ParsedOrderNumber {
  sequenceNumber: string;
  fullOrderNumber: string;
  numericValue: number;
}

/**
 * Parse simple order number into components
 */
export function parseOrderNumber(orderNumber: string): ParsedOrderNumber {
  // Simple format: #0001, #0002, etc.
  const match = orderNumber.match(/^#(\d+)$/);
  
  if (match) {
    const numericValue = parseInt(match[1]);
    
    return {
      sequenceNumber: orderNumber,
      fullOrderNumber: orderNumber,
      numericValue
    };
  }
  
  // Fallback for unexpected format
  return {
    sequenceNumber: orderNumber,
    fullOrderNumber: orderNumber,
    numericValue: 0
  };
}

/**
 * Format order number for display in different contexts
 */
export function formatOrderNumber(orderNumber: string, variant: 'full' | 'compact' | 'sequence-only' = 'compact'): string {
  const parsed = parseOrderNumber(orderNumber);
  
  // For simple format, all variants return the same thing
  return parsed.sequenceNumber;
}

/**
 * Get order sequence number as integer
 */
export function getOrderSequence(orderNumber: string): number {
  const parsed = parseOrderNumber(orderNumber);
  return parsed.numericValue;
}

/**
 * Format order number for display in React components
 */
export interface OrderNumberDisplayProps {
  orderNumber: string;
  variant?: 'default' | 'compact' | 'large';
  className?: string;
}

/**
 * Get CSS classes for order number styling
 */
export function getOrderNumberStyles(isMobile: boolean = false) {
  return {
    container: "flex items-center",
    
    sequence: isMobile
      ? "text-lg font-bold text-brand-primary"
      : "text-xl font-bold text-brand-primary",
      
    compact: isMobile
      ? "text-base font-bold text-brand-primary"
      : "text-lg font-bold text-brand-primary",
      
    large: isMobile
      ? "text-xl font-bold text-brand-primary"
      : "text-3xl font-bold text-brand-primary"
  };
} 