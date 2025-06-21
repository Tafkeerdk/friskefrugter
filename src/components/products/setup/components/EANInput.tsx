import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormControl, FormDescription, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { CheckCircle, XCircle, Info, Search, AlertCircle, Database } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';

interface EANInputProps {
  value?: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

interface EANLookupResult {
  success: boolean;
  found: boolean;
  message: string;
  data?: {
    id: string;
    produktnavn: string;
    beskrivelse?: string;
    eanNummer: string;
    enhed: string;
    basispris: number;
    kategori: string;
    aktiv: boolean;
    createdAt: string;
  } | null;
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
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupResult, setLookupResult] = useState<EANLookupResult | null>(null);
  const { toast } = useToast();

  // Debounced EAN lookup
  const lookupEAN = useCallback(
    async (eanValue: string) => {
      if (!eanValue || eanValue.length !== 13) return;
      
      setIsLookingUp(true);
      try {
        const response = await api.lookupEAN(eanValue);
        
        // Handle the API client's response structure
        if (response.success && response.data) {
          // response.data contains the actual EAN lookup result
          const eanData = response.data as any;
          
          const lookupResult: EANLookupResult = {
            success: true,
            found: eanData.found || false,
            message: eanData.message || 'Søgning gennemført',
            data: eanData.data || null
          };
          
          setLookupResult(lookupResult);
          
          if (lookupResult.found && lookupResult.data) {
            toast({
              title: "Produkt fundet!",
              description: `${lookupResult.data.produktnavn} (${lookupResult.data.kategori})`,
              duration: 4000,
            });
          }
        } else {
          // Handle API error
          setLookupResult({
            success: false,
            found: false,
            message: response.error || 'Kunne ikke søge i database',
            data: null
          });
        }
      } catch (error) {
        console.error('EAN lookup error:', error);
        setLookupResult({
          success: false,
          found: false,
          message: 'Kunne ikke søge i database',
          data: null
        });
      }
      setIsLookingUp(false);
    },
    [toast]
  );

  // Debounce EAN lookup
  useEffect(() => {
    const cleanValue = cleanEAN(value);
    if (cleanValue.length === 13) {
      const timeoutId = setTimeout(() => {
        lookupEAN(cleanValue);
      }, 500); // 500ms debounce
      
      return () => clearTimeout(timeoutId);
    } else {
      setLookupResult(null);
    }
  }, [value, lookupEAN]);

  // Update display value when prop value changes
  useEffect(() => {
    const cleanValue = cleanEAN(value);
    setDisplayValue(formatEANDisplay(cleanValue));
    
    // Validate format (13 digits = valid for submission, checksum is just visual feedback)
    if (cleanValue.length === 13) {
      setIsValid(validateEAN13(cleanValue)); // For visual feedback only
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
    if (isLookingUp) {
      return <Search className="h-4 w-4 text-blue-500 animate-spin" />;
    }
    
    if (lookupResult?.found) {
      return <Database className="h-4 w-4 text-blue-500" />;
    }
    
    if (isValid === true) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else if (isValid === false && value.length > 0) {
      if (value.length === 13) {
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      }
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    return null;
  };

  const getValidationMessage = () => {
    if (error) return error;
    
    // Show lookup result
    if (lookupResult) {
      if (lookupResult.found && lookupResult.data) {
        return `Fundet: ${lookupResult.data.produktnavn} (${lookupResult.data.kategori})`;
      } else {
        return lookupResult.message;
      }
    }
    
    if (isLookingUp && value.length === 13) {
      return 'Søger i database...';
    }
    
    // Format validation (non-blocking)
    if (value.length > 0) {
      if (value.length < 13) {
        return `Mangler ${13 - value.length} cifre`;
      } else if (value.length === 13) {
        if (isValid === false) {
          return 'Gyldigt format, men checksum fejl (kan stadig gemmes)';
        } else {
          return 'Gyldigt EAN-nummer';
        }
      }
    }
    
    return null;
  };

  const getMessageColor = () => {
    if (error) return 'text-red-600';
    if (lookupResult?.found) return 'text-blue-600';
    if (lookupResult && !lookupResult.found) return 'text-amber-600';
    if (isValid === true) return 'text-green-600';
    if (isValid === false && value.length === 13) return 'text-amber-600'; // Warning, not error
    if (isValid === false) return 'text-red-600';
    return 'text-muted-foreground';
  };

  const validationMessage = getValidationMessage();

  return (
    <FormItem className={className}>
      <FormLabel className="flex items-center gap-2">
        EAN-nummer
        <span className="text-xs text-muted-foreground">(valgfrit)</span>
        {lookupResult?.found && (
          <Badge variant="secondary" className="text-xs">
            I database
          </Badge>
        )}
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
              lookupResult?.found && 'border-blue-500 focus:border-blue-500 bg-blue-50',
              isValid === true && !lookupResult?.found && 'border-green-500 focus:border-green-500',
              isValid === false && value.length === 13 && 'border-amber-500 focus:border-amber-500 bg-amber-50',
              isValid === false && value.length < 13 && value.length > 0 && 'border-red-500 focus:border-red-500',
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
          13-cifret EAN kode for produktet. Søger automatisk i database for at vise eksisterende produkter.
        </span>
      </FormDescription>
      {validationMessage && (
        <FormMessage className={cn('text-xs', getMessageColor())}>
          {validationMessage}
        </FormMessage>
      )}
      {lookupResult?.found && lookupResult.data && (
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center gap-2 mb-2">
            <Database className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Eksisterende produkt fundet</span>
          </div>
          <div className="text-xs text-blue-800 space-y-1">
            <div><strong>Navn:</strong> {lookupResult.data.produktnavn}</div>
            <div><strong>Kategori:</strong> {lookupResult.data.kategori}</div>
            <div><strong>Enhed:</strong> {lookupResult.data.enhed}</div>
            <div><strong>Pris:</strong> {lookupResult.data.basispris.toLocaleString('da-DK', { style: 'currency', currency: 'DKK' })}</div>
            {lookupResult.data.beskrivelse && (
              <div><strong>Beskrivelse:</strong> {lookupResult.data.beskrivelse.substring(0, 100)}{lookupResult.data.beskrivelse.length > 100 ? '...' : ''}</div>
            )}
          </div>
          <div className="mt-2 text-xs text-blue-700">
            <strong>Note:</strong> Du kan stadig oprette produktet med samme EAN hvis det er en variant eller opdatering.
          </div>
        </div>
      )}
    </FormItem>
  );
};

// Hook for EAN validation - NON-BLOCKING
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
      // 13 digits is always valid for submission, checksum is just visual feedback
      setIsValid(true);
      setError(null);
    } else {
      setIsValid(false);
      setError('EAN-nummer må kun være 13 cifre');
    }
  }, [value]);

  return { isValid, error };
}; 