import React from 'react';
import { parseOrderNumber, getOrderNumberStyles } from '@/utils/orderNumber';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface OrderNumberDisplayProps {
  orderNumber: string;
  className?: string;
  variant?: 'default' | 'compact' | 'large';
  showFullOnExpand?: boolean; // Legacy prop - now ignored since we use simple format
}

export function OrderNumberDisplay({ 
  orderNumber, 
  className,
  variant = 'default',
  showFullOnExpand // Legacy prop - ignored in simple format
}: OrderNumberDisplayProps) {
  const isMobile = useIsMobile();
  const parsed = parseOrderNumber(orderNumber);
  const styles = getOrderNumberStyles(isMobile);

  const getVariantStyles = () => {
    switch (variant) {
      case 'compact':
        return styles.compact;
      
      case 'large':
        return styles.large;
      
      default:
        return styles.sequence;
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <div className={cn(styles.container, className)}>
      <span className={cn(variantStyles)}>
          {parsed.sequenceNumber}
        </span>
    </div>
  );
}

// Simplified version for use in tables or tight spaces
interface OrderNumberCompactProps {
  orderNumber: string;
  className?: string;
}

export function OrderNumberCompact({ orderNumber, className }: OrderNumberCompactProps) {
  const parsed = parseOrderNumber(orderNumber);
  
  return (
    <div className={cn("flex items-center", className)}>
      <span className="font-bold text-brand-primary text-sm">
        {parsed.sequenceNumber}
      </span>
    </div>
  );
}

// Badge version for use in notifications or status displays
interface OrderNumberBadgeProps {
  orderNumber: string;
  className?: string;
}

export function OrderNumberBadge({ orderNumber, className }: OrderNumberBadgeProps) {
  const parsed = parseOrderNumber(orderNumber);
  
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-1 bg-brand-primary/10 text-brand-primary-dark rounded-full text-sm font-medium",
      className
    )}>
      <span className="font-bold">{parsed.sequenceNumber}</span>
    </span>
  );
} 