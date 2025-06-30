/**
 * Order Number Utilities
 * 
 * Functions for parsing and formatting order numbers in a user-friendly way.
 * Order format: YYYYMMDD-HHMMSS-customerId-###
 */

export interface ParsedOrderNumber {
  sequenceNumber: string;
  date: string;
  time: string;
  fullOrderNumber: string;
  formattedDate: string;
  formattedTime: string;
  customerId: string;
}

/**
 * Parse order number into readable components
 */
export function parseOrderNumber(orderNumber: string): ParsedOrderNumber {
  // Format: YYYYMMDD-HHMMSS-customerId-###
  const parts = orderNumber.split('-');
  
  if (parts.length >= 4) {
    const datePart = parts[0]; // YYYYMMDD
    const timePart = parts[1]; // HHMMSS
    const customerId = parts[2]; // MongoDB ObjectId
    const sequencePart = parts[parts.length - 1]; // ###
    
    // Format date: YYYYMMDD -> DD/MM/YYYY
    const year = datePart.substring(0, 4);
    const month = datePart.substring(4, 6);
    const day = datePart.substring(6, 8);
    const formattedDate = `${day}/${month}/${year}`;
    
    // Format time: HHMMSS -> HH:MM:SS
    const hour = timePart.substring(0, 2);
    const minute = timePart.substring(2, 4);
    const second = timePart.substring(4, 6);
    const formattedTime = `${hour}:${minute}:${second}`;
    
    return {
      sequenceNumber: `#${sequencePart}`,
      date: formattedDate,
      time: formattedTime,
      fullOrderNumber: orderNumber,
      formattedDate,
      formattedTime,
      customerId
    };
  }
  
  // Fallback for unexpected format
  return {
    sequenceNumber: orderNumber,
    date: 'N/A',
    time: 'N/A',
    fullOrderNumber: orderNumber,
    formattedDate: 'N/A',
    formattedTime: 'N/A',
    customerId: 'N/A'
  };
}

/**
 * Format order number for display in different contexts
 */
export function formatOrderNumber(orderNumber: string, variant: 'full' | 'compact' | 'sequence-only' = 'compact'): string {
  const parsed = parseOrderNumber(orderNumber);
  
  switch (variant) {
    case 'sequence-only':
      return parsed.sequenceNumber;
    
    case 'full':
      return `${parsed.sequenceNumber} - ${parsed.date} ${parsed.time}`;
    
    case 'compact':
    default:
      return `${parsed.sequenceNumber} (${parsed.date})`;
  }
}

/**
 * Get order date from order number
 */
export function getOrderDate(orderNumber: string): Date | null {
  const parsed = parseOrderNumber(orderNumber);
  if (parsed.date === 'N/A') return null;
  
  const parts = orderNumber.split('-');
  if (parts.length >= 2) {
    const datePart = parts[0]; // YYYYMMDD
    const timePart = parts[1]; // HHMMSS
    
    const year = parseInt(datePart.substring(0, 4));
    const month = parseInt(datePart.substring(4, 6)) - 1; // JavaScript months are 0-indexed
    const day = parseInt(datePart.substring(6, 8));
    const hour = parseInt(timePart.substring(0, 2));
    const minute = parseInt(timePart.substring(2, 4));
    const second = parseInt(timePart.substring(4, 6));
    
    return new Date(year, month, day, hour, minute, second);
  }
  
  return null;
}

/**
 * Format order number for display in React components
 */
export interface OrderNumberDisplayProps {
  orderNumber: string;
  showFullOnExpand?: boolean;
  className?: string;
}

/**
 * Get CSS classes for order number styling
 */
export function getOrderNumberStyles(isMobile: boolean = false) {
  return {
    container: isMobile 
      ? "flex flex-col gap-1" 
      : "flex items-center gap-2",
    
    sequence: isMobile
      ? "text-lg font-bold text-brand-primary"
      : "text-xl font-bold text-brand-primary",
    
    date: isMobile
      ? "text-sm text-gray-600"
      : "text-base text-gray-600",
    
    full: isMobile
      ? "text-xs text-gray-500 font-mono mt-1"
      : "text-sm text-gray-500 font-mono",
    
    expandButton: "text-xs text-brand-primary hover:text-brand-primary-dark cursor-pointer underline"
  };
} 