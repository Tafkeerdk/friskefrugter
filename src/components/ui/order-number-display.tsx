import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { parseOrderNumber, getOrderNumberStyles } from '@/utils/orderNumber';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface OrderNumberDisplayProps {
  orderNumber: string;
  showFullOnExpand?: boolean;
  className?: string;
  variant?: 'default' | 'compact' | 'large';
}

export function OrderNumberDisplay({ 
  orderNumber, 
  showFullOnExpand = true, 
  className,
  variant = 'default'
}: OrderNumberDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isMobile = useIsMobile();
  const parsed = parseOrderNumber(orderNumber);
  const styles = getOrderNumberStyles(isMobile);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'compact':
        return {
          sequence: isMobile ? "text-base font-bold text-brand-primary" : "text-lg font-bold text-brand-primary",
          date: isMobile ? "text-xs text-gray-600" : "text-sm text-gray-600",
          full: isMobile ? "text-xs text-gray-500 font-mono" : "text-xs text-gray-500 font-mono"
        };
      
      case 'large':
        return {
          sequence: isMobile ? "text-xl font-bold text-brand-primary" : "text-3xl font-bold text-brand-primary",
          date: isMobile ? "text-base text-gray-600" : "text-lg text-gray-600",
          full: isMobile ? "text-sm text-gray-500 font-mono" : "text-base text-gray-500 font-mono"
        };
      
      default:
        return {
          sequence: styles.sequence,
          date: styles.date,
          full: styles.full
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <div className={cn(styles.container, className)}>
      {/* Main display */}
      <div className="flex items-center gap-2">
        <span className={variantStyles.sequence}>
          {parsed.sequenceNumber}
        </span>
        <span className={variantStyles.date}>
          ({parsed.date})
        </span>
        
        {/* Expand/Collapse button */}
        {showFullOnExpand && (
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleExpanded}
            className="h-6 w-6 p-0 hover:bg-brand-gray-100"
            aria-label={isExpanded ? "Skjul fuldt ordrenummer" : "Vis fuldt ordrenummer"}
          >
            {isExpanded ? (
              <EyeOff className="h-3 w-3 text-gray-500" />
            ) : (
              <Eye className="h-3 w-3 text-gray-500" />
            )}
          </Button>
        )}
      </div>

      {/* Time display */}
      {!isMobile && (
        <span className="text-sm text-gray-500">
          kl. {parsed.time}
        </span>
      )}

      {/* Expanded full order number */}
      {isExpanded && showFullOnExpand && (
        <div className={cn(variantStyles.full, "select-all")}>
          <div className="flex flex-col gap-1">
            <div className="text-xs text-gray-400 uppercase tracking-wide">
              Fuldt ordrenummer:
            </div>
            <div className="bg-gray-50 p-2 rounded border text-center">
              {parsed.fullOrderNumber}
            </div>
            {isMobile && (
              <div className="text-xs text-gray-500 mt-1">
                Afgivet: {parsed.date} kl. {parsed.time}
              </div>
            )}
          </div>
        </div>
      )}
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
    <div className={cn("flex flex-col", className)}>
      <span className="font-bold text-brand-primary text-sm">
        {parsed.sequenceNumber}
      </span>
      <span className="text-xs text-gray-500">
        {parsed.date}
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
      "inline-flex items-center gap-1 px-2 py-1 bg-brand-primary/10 text-brand-primary-dark rounded-full text-sm font-medium",
      className
    )}>
      <span className="font-bold">{parsed.sequenceNumber}</span>
      <span className="text-xs">({parsed.date})</span>
    </span>
  );
} 