import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { FormControl, FormDescription, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Banknote, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CurrencyInputProps {
  value?: number;
  onChange: (value: number) => void;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  label?: string;
  description?: string;
  min?: number;
  max?: number;
}

// Format number as Danish currency (DKK)
const formatDanishCurrency = (value: number): string => {
  return new Intl.NumberFormat('da-DK', {
    style: 'currency',
    currency: 'DKK',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

// Format number for display in input (without currency symbol)
const formatNumberForInput = (value: number): string => {
  return new Intl.NumberFormat('da-DK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

// Parse Danish formatted number string to number
const parseDanishNumber = (value: string): number | null => {
  // Remove any non-digit, non-comma, non-period characters
  const cleaned = value.replace(/[^\d,.-]/g, '');
  
  // Handle Danish decimal separator (comma)
  const normalized = cleaned.replace(',', '.');
  
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? null : parsed;
};

// Validate decimal places (max 2 for currency)
const hasValidDecimals = (value: string): boolean => {
  const parts = value.split(/[,.]/)
  if (parts.length <= 1) return true;
  return parts[parts.length - 1].length <= 2;
};

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  error,
  disabled = false,
  placeholder = '0,00',
  className,
  label = 'Basispris ekskl. moms',
  description = 'Pris i danske kroner (DKK) uden moms. Brug komma (,) som decimal separator.',
  min = 0.01,
  max = 999999.99
}) => {
  const [displayValue, setDisplayValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Update display value when prop value changes
  useEffect(() => {
    if (value !== undefined && value !== null) {
      setDisplayValue(formatNumberForInput(value));
    } else {
      setDisplayValue('');
    }
  }, [value]);

  const validateValue = useCallback((numValue: number): string | null => {
    if (numValue < min) {
      return `Prisen skal være mindst ${formatDanishCurrency(min)}`;
    }
    if (numValue > max) {
      return `Prisen må ikke overstige ${formatDanishCurrency(max)}`;
    }
    
    // Check decimal places
    const decimalPlaces = (numValue.toString().split('.')[1] || '').length;
    if (decimalPlaces > 2) {
      return 'Prisen må kun have op til 2 decimaler';
    }
    
    return null;
  }, [min, max]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Allow empty input
    if (inputValue === '') {
      setDisplayValue('');
      setLocalError(null);
      return;
    }

    // Check if input has valid decimal format
    if (!hasValidDecimals(inputValue)) {
      return; // Don't update if too many decimal places
    }

    setDisplayValue(inputValue);

    // Parse and validate the number
    const parsedValue = parseDanishNumber(inputValue);
    
    if (parsedValue === null) {
      setLocalError('Ugyldig nummer format');
      return;
    }

    // Validate the parsed value
    const validationError = validateValue(parsedValue);
    setLocalError(validationError);

    // Only call onChange if value is valid
    if (!validationError) {
      onChange(parsedValue);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    
    // Format the display value on blur if it's a valid number
    const parsedValue = parseDanishNumber(displayValue);
    if (parsedValue !== null && !localError) {
      setDisplayValue(formatNumberForInput(parsedValue));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow: backspace, delete, tab, escape, enter, period, comma
    if ([8, 9, 27, 13, 46, 110, 188, 190].indexOf(e.keyCode) !== -1 ||
        // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
        (e.keyCode === 65 && e.ctrlKey === true) ||
        (e.keyCode === 67 && e.ctrlKey === true) ||
        (e.keyCode === 86 && e.ctrlKey === true) ||
        (e.keyCode === 88 && e.ctrlKey === true) ||
        // Allow: home, end, left, right, down, up
        (e.keyCode >= 35 && e.keyCode <= 40)) {
      return;
    }
    
    // Ensure that it is a number and stop the keypress
    if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
      e.preventDefault();
    }
  };

  const displayError = error || localError;
  const hasError = Boolean(displayError);

  // Preview formatted currency
  const previewValue = value ? formatDanishCurrency(value) : null;

  return (
    <FormItem className={className}>
      <FormLabel className="flex items-center gap-2">
        <Banknote className="h-4 w-4" />
        {label}
        <span className="text-red-500">*</span>
      </FormLabel>
      <FormControl>
        <div className="space-y-2">
          <div className="relative">
            <Input
              type="text"
              value={displayValue}
              onChange={handleInputChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              className={cn(
                'pr-12 text-right font-mono',
                hasError && 'border-red-500 focus:border-red-500'
              )}
              aria-describedby="currency-description"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
              DKK
            </div>
            {hasError && (
              <div className="absolute right-10 top-1/2 -translate-y-1/2">
                <AlertCircle className="h-4 w-4 text-red-500" />
              </div>
            )}
          </div>
          
          {/* Preview formatted currency */}
          {previewValue && !hasError && !isFocused && (
            <div className="text-sm text-muted-foreground text-right">
              Formateret: <span className="font-medium">{previewValue}</span>
            </div>
          )}
        </div>
      </FormControl>
      
      <FormDescription id="currency-description">
        {description}
      </FormDescription>
      
      {displayError && (
        <FormMessage className="text-red-600">
          {displayError}
        </FormMessage>
      )}
    </FormItem>
  );
};

// Hook for currency formatting utilities
export const useCurrencyFormatter = () => {
  const formatCurrency = useCallback((value: number): string => {
    return formatDanishCurrency(value);
  }, []);

  const formatForInput = useCallback((value: number): string => {
    return formatNumberForInput(value);
  }, []);

  const parseCurrency = useCallback((value: string): number | null => {
    return parseDanishNumber(value);
  }, []);

  return {
    formatCurrency,
    formatForInput,
    parseCurrency
  };
}; 