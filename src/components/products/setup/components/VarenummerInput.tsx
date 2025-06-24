import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { FormLabel, FormDescription, FormMessage, FormItem, FormControl } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, Search, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

interface VarenummerInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  productId?: string; // For edit mode - exclude current product from validation
}

export const VarenummerInput: React.FC<VarenummerInputProps> = ({
  value,
  onChange,
  error,
  disabled,
  productId
}) => {
  const [isChecking, setIsChecking] = useState(false);
  const [lookupResult, setLookupResult] = useState<{
    status: 'available' | 'exists' | 'invalid' | null;
    message?: string;
    existingProduct?: any;
  }>({ status: null });

  // Debounced lookup function
  useEffect(() => {
    if (!value || value.trim().length === 0) {
      setLookupResult({ status: null });
      return;
    }

    if (value.length < 3) {
      setLookupResult({ status: null });
      return;
    }

    // Validate format first
    if (!/^[A-Za-z0-9\-_]+$/.test(value)) {
      setLookupResult({
        status: 'invalid',
        message: 'Varenummer må kun indeholde bogstaver, tal, bindestreg og underscore'
      });
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        setIsChecking(true);
        const response = await api.lookupVarenummer(value);
        
        if (response.success) {
          if ((response as any).found && response.data) {
            // If editing and found product is the same as current product, it's okay
            if (productId && (response.data as any).id === productId) {
              setLookupResult({
                status: 'available',
                message: 'Dette er det nuværende produkts varenummer'
              });
            } else {
              setLookupResult({
                status: 'exists',
                message: 'Varenummer er allerede i brug',
                existingProduct: response.data
              });
            }
          } else {
            setLookupResult({
              status: 'available',
              message: 'Varenummer er tilgængeligt'
            });
          }
        } else {
          setLookupResult({
            status: 'invalid',
            message: 'Kunne ikke validere varenummer'
          });
        }
      } catch (error) {
        console.error('Varenummer lookup error:', error);
        setLookupResult({
          status: 'invalid',
          message: 'Fejl ved validering af varenummer'
        });
      } finally {
        setIsChecking(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [value, productId]);

  const getStatusIcon = () => {
    if (isChecking) {
      return <Loader2 className="h-4 w-4 animate-spin text-gray-500" />;
    }

    switch (lookupResult.status) {
      case 'available':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'exists':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'invalid':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Search className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = () => {
    if (!value || value.length < 3) return null;

    switch (lookupResult.status) {
      case 'available':
        return (
          <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50 font-semibold">
            <CheckCircle className="h-3 w-3 mr-1" />
            ✅ Tilgængeligt
          </Badge>
        );
      case 'exists':
        return (
          <Badge variant="outline" className="text-red-700 border-red-300 bg-red-50 font-semibold">
            <AlertTriangle className="h-3 w-3 mr-1" />
            ❌ Allerede i brug
          </Badge>
        );
      case 'invalid':
        return (
          <Badge variant="outline" className="text-yellow-700 border-yellow-300 bg-yellow-50 font-semibold">
            <AlertTriangle className="h-3 w-3 mr-1" />
            ⚠️ Ugyldigt format
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <FormItem>
      <FormLabel className="flex items-center gap-2">
        Varenummer (valgfrit)
      </FormLabel>
      <FormControl>
        <div className="relative">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value.toUpperCase())}
            placeholder="f.eks. ÆBLE001, GUL001"
            disabled={disabled}
            className={cn(
              'pr-10',
              error && 'border-red-500',
              lookupResult.status === 'exists' && 'border-red-500',
              lookupResult.status === 'available' && 'border-green-500'
            )}
            maxLength={50}
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {getStatusIcon()}
          </div>
        </div>
      </FormControl>
      
      <div className="flex items-center justify-between">
        <FormDescription>
          Valgfrit unikt varenummer til identifikation af produktet
        </FormDescription>
        {getStatusBadge()}
      </div>

      {/* Show existing product info if varenummer exists */}
      {lookupResult.status === 'exists' && lookupResult.existingProduct && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800 font-medium">
            Varenummer bruges allerede af:
          </p>
          <p className="text-sm text-red-700 mt-1">
            <strong>{lookupResult.existingProduct.produktnavn}</strong>
            {lookupResult.existingProduct.kategori && (
              <span className="text-red-600"> • {lookupResult.existingProduct.kategori}</span>
            )}
          </p>
          <p className="text-xs text-red-600 mt-1">
            Oprettet: {new Date(lookupResult.existingProduct.createdAt).toLocaleDateString('da-DK')}
          </p>
        </div>
      )}

      {/* Show validation message */}
      {lookupResult.message && lookupResult.status !== 'exists' && (
        <p className={cn(
          'text-sm mt-1',
          lookupResult.status === 'available' && 'text-green-600',
          lookupResult.status === 'invalid' && 'text-yellow-600'
        )}>
          {lookupResult.message}
        </p>
      )}

      <FormMessage />
    </FormItem>
  );
}; 