import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormControl, FormDescription, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { CheckCircle, XCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EANInputProps {
  value?: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

// EAN-13 checksum validation
const validateEAN13 = (ean: string): boolean => {
  if (!/^\d{13}$/.test(ean)) return false;
  
  const digits = ean.split('').map(Number);
  const checksum = digits.slice(0, 12).reduce((sum, digit, index) => {
    return sum + digit * (index % 2 === 0 ? 1 : 3);
  }, 0);
  
  const calculatedCheck = (10 - (checksum % 10)) % 10;
  return calculatedCheck === digits[12];
};

// Format EAN with spaces for readability: 1234567890123 -> 1 234567 890123
const formatEANDisplay = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 1) return digits;
  if (digits.length <= 7) return `${digits[0]} ${digits.slice(1)}`;
  return `${digits[0]} ${digits.slice(1, 7)} ${digits.slice(7)}`;
};

// Remove formatting to get clean digits
const cleanEAN = (value: string): string => {
  return value.replace(/\D/g, '');
};

export const EANInput: React.FC<EANInputProps> = ({
  value = '',
  onChange,
  error,
  disabled = false,
  placeholder = 'f.eks. 1234567890123',
  className
}) => {
  const [displayValue, setDisplayValue] = useState('');
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Update display value when prop value changes
  useEffect(() => {
    const cleanValue = cleanEAN(value);
    setDisplayValue(formatEANDisplay(cleanValue));
    
    // Validate if we have 13 digits
    if (cleanValue.length === 13) {
      setIsValid(validateEAN13(cleanValue));
    } else if (cleanValue.length === 0) {
      setIsValid(null);
    } else {
      setIsValid(false);
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const cleanValue = cleanEAN(inputValue);
    
    // Limit to 13 digits
    if (cleanValue.length <= 13) {
      const formattedValue = formatEANDisplay(cleanValue);
      setDisplayValue(formattedValue);
      onChange(cleanValue);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const getValidationIcon = () => {
    if (isValid === true) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else if (isValid === false && value.length > 0) {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    return null;
  };

  const getValidationMessage = () => {
    if (error) return error;
    if (isValid === false && value.length > 0) {
      if (value.length < 13) {
        return `Mangler ${13 - value.length} cifre`;
      }
      return 'Ugyldigt EAN-nummer (checksum fejl)';
    }
    if (isValid === true) {
      return 'Gyldigt EAN-nummer';
    }
    return null;
  };

  const validationMessage = getValidationMessage();

  return (
    <FormItem className={className}>
      <FormLabel className="flex items-center gap-2">
        EAN-nummer
        <span className="text-xs text-muted-foreground">(valgfrit)</span>
      </FormLabel>
      <FormControl>
        <div className="relative">
          <Input
            type="text"
            value={displayValue}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              'pr-10 font-mono tracking-wider',
              isValid === true && 'border-green-500 focus:border-green-500',
              isValid === false && value.length > 0 && 'border-red-500 focus:border-red-500',
              error && 'border-red-500 focus:border-red-500'
            )}
            aria-describedby="ean-description"
            maxLength={17} // Account for spaces in formatted display
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {getValidationIcon()}
          </div>
        </div>
      </FormControl>
      <FormDescription id="ean-description" className="flex items-start gap-2">
        <Info className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
        <span className="text-xs">
          13-cifret EAN kode for produktet. Efterlades tom hvis ikke tilgængelig.
        </span>
      </FormDescription>
      {validationMessage && (
        <FormMessage
          className={cn(
            'text-xs',
            isValid === true && !error && 'text-green-600',
            (isValid === false || error) && 'text-red-600'
          )}
        >
          {validationMessage}
        </FormMessage>
      )}
    </FormItem>
  );
};

// Hook for EAN validation
export const useEANValidation = (value: string) => {
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!value) {
      setIsValid(null);
      setError(null);
      return;
    }

    const cleanValue = cleanEAN(value);
    
    if (cleanValue.length < 13) {
      setIsValid(false);
      setError(`EAN-nummer skal være 13 cifre (mangler ${13 - cleanValue.length})`);
    } else if (cleanValue.length === 13) {
      const valid = validateEAN13(cleanValue);
      setIsValid(valid);
      setError(valid ? null : 'Ugyldigt EAN-nummer (checksum fejl)');
    } else {
      setIsValid(false);
      setError('EAN-nummer må kun være 13 cifre');
    }
  }, [value]);

  return { isValid, error };
}; 