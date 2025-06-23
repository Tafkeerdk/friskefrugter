import React, { useState, useEffect, useRef } from 'react';
import { Input } from './input';
import { Label } from './label';
import { Button } from './button';
import { Card, CardContent } from './card';
import { MapPin, Loader2, Search } from 'lucide-react';

interface DAWAAddress {
  id: string;
  tekst: string;
  adresse: {
    vejnavn: string;
    husnr: string;
    etage?: string;
    dør?: string;
    postnr: string;
    postnrnavn: string;
  };
}

interface AddressData {
  street: string;
  city: string;
  postalCode: string;
  country: string;
}

interface DAWAAddressInputProps {
  onAddressSelect: (address: AddressData) => void;
  initialValue?: AddressData;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}

export const DAWAAddressInput: React.FC<DAWAAddressInputProps> = ({
  onAddressSelect,
  initialValue,
  label = "Adresse",
  placeholder = "Indtast adresse...",
  required = false,
  disabled = false
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<DAWAAddress[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<AddressData | null>(initialValue || null);
  const [isManualInput, setIsManualInput] = useState(false);
  const [manualAddress, setManualAddress] = useState<AddressData>({
    street: '',
    city: '',
    postalCode: '',
    country: 'Denmark'
  });
  
  const debounceRef = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize with existing address
  useEffect(() => {
    if (initialValue) {
      setSelectedAddress(initialValue);
      setQuery(`${initialValue.street}, ${initialValue.postalCode} ${initialValue.city}`);
    }
  }, [initialValue]);

  // Debounced DAWA API search
  useEffect(() => {
    if (query.length < 3 || isManualInput) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        // DAWA API call directly from frontend
        const response = await fetch(
          `https://api.dataforsyningen.dk/adresser/autocomplete?q=${encodeURIComponent(query)}&per_side=10`,
          {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          console.log('✅ DAWA API success:', { query, results: data.length });
          setSuggestions(data);
          setShowSuggestions(true);
        } else {
          console.warn('❌ DAWA API request failed:', {
            status: response.status,
            statusText: response.statusText,
            query,
            url: response.url
          });
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (error) {
        console.error('❌ DAWA API network error:', {
          error: error instanceof Error ? error.message : error,
          query,
          timestamp: new Date().toISOString()
        });
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, isManualInput]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddressSelect = (address: DAWAAddress) => {
    const addressData: AddressData = {
      street: `${address.adresse.vejnavn} ${address.adresse.husnr}${address.adresse.etage ? `, ${address.adresse.etage}` : ''}${address.adresse.dør ? ` ${address.adresse.dør}` : ''}`,
      city: address.adresse.postnrnavn,
      postalCode: address.adresse.postnr,
      country: 'Denmark'
    };

    setSelectedAddress(addressData);
    setQuery(address.tekst);
    setShowSuggestions(false);
    onAddressSelect(addressData);
  };

  const handleManualAddressChange = (field: keyof AddressData, value: string) => {
    const updatedAddress = { ...manualAddress, [field]: value };
    setManualAddress(updatedAddress);
    onAddressSelect(updatedAddress);
  };

  const toggleManualInput = () => {
    setIsManualInput(!isManualInput);
    setShowSuggestions(false);
    if (!isManualInput) {
      // Switching to manual input
      if (selectedAddress) {
        setManualAddress(selectedAddress);
      }
    } else {
      // Switching back to DAWA search
      setQuery('');
      setSuggestions([]);
    }
  };

  if (isManualInput) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">
            {label} {required && <span className="text-red-500">*</span>}
          </Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={toggleManualInput}
            className="text-xs"
          >
            <Search className="h-3 w-3 mr-1" />
            Brug adressesøgning
          </Button>
        </div>
        
        <div className="grid grid-cols-1 gap-3">
          <div>
            <Label htmlFor="manual-street" className="text-xs text-gray-600">Gade og nummer</Label>
            <Input
              id="manual-street"
              placeholder="Hovedgade 123"
              value={manualAddress.street}
              onChange={(e) => handleManualAddressChange('street', e.target.value)}
              disabled={disabled}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="manual-postal" className="text-xs text-gray-600">Postnummer</Label>
              <Input
                id="manual-postal"
                placeholder="1000"
                value={manualAddress.postalCode}
                onChange={(e) => handleManualAddressChange('postalCode', e.target.value)}
                disabled={disabled}
              />
            </div>
            <div>
              <Label htmlFor="manual-city" className="text-xs text-gray-600">By</Label>
              <Input
                id="manual-city"
                placeholder="København"
                value={manualAddress.city}
                onChange={(e) => handleManualAddressChange('city', e.target.value)}
                disabled={disabled}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="address-search" className="text-sm font-medium">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={toggleManualInput}
          className="text-xs"
        >
          <MapPin className="h-3 w-3 mr-1" />
          Indtast manuelt
        </Button>
      </div>
      
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="address-search"
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            className="pl-10 pr-10"
            disabled={disabled}
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
          )}
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-60 overflow-y-auto shadow-lg">
            <CardContent className="p-0">
              {suggestions.map((address) => (
                <button
                  key={address.id}
                  type="button"
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                  onClick={() => handleAddressSelect(address)}
                >
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{address.tekst}</p>
                      <p className="text-xs text-gray-600">
                        {address.adresse.postnr} {address.adresse.postnrnavn}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {selectedAddress && (
        <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-green-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-green-900">{selectedAddress.street}</p>
              <p className="text-green-700">
                {selectedAddress.postalCode} {selectedAddress.city}, {selectedAddress.country}
              </p>
            </div>
          </div>
        </div>
      )}

      {query.length >= 3 && !isLoading && suggestions.length === 0 && !selectedAddress && (
        <p className="text-xs text-gray-500 mt-1">
          Ingen adresser fundet. Prøv at justere din søgning eller brug manuel indtastning.
        </p>
      )}
    </div>
  );
}; 