import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Eye, Percent, Users, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { authService } from '@/lib/auth';
import { DiscountGroup, PriceCalculationResult } from '@/types/product';

interface RabatGruppePreviewProps {
  basispris: number;
  discount: {
    enabled: boolean;
    beforePrice?: number;
    discountPercentage?: number;
    discountAmount?: number;
    showStrikethrough?: boolean;
    discountLabel?: string;
  };
  produktnavn: string;
  isLoading?: boolean;
}

// Helper function to calculate final price with discount
const calculateDiscountedPrice = (
  basePrice: number, 
  discount: RabatGruppePreviewProps['discount']
): PriceCalculationResult => {
  if (!discount.enabled || basePrice <= 0) {
    return {
      type: 'none',
      originalPrice: basePrice,
      finalPrice: basePrice,
      discountAmount: 0,
      discountPercentage: 0
    };
  }

  let finalPrice = basePrice;
  let originalPrice = basePrice;
  let discountAmount = 0;
  let discountPercentage = 0;

  // If before price is set, use it as original price
  if (discount.beforePrice && discount.beforePrice > basePrice) {
    originalPrice = discount.beforePrice;
    discountAmount = originalPrice - finalPrice;
    discountPercentage = Math.round((discountAmount / originalPrice) * 100 * 100) / 100;
  }
  // If percentage discount is set
  else if (discount.discountPercentage && discount.discountPercentage > 0) {
    discountAmount = (basePrice * discount.discountPercentage) / 100;
    finalPrice = Math.max(0.01, basePrice - discountAmount);
    discountPercentage = discount.discountPercentage;
  }
  // If amount discount is set
  else if (discount.discountAmount && discount.discountAmount > 0) {
    discountAmount = discount.discountAmount;
    finalPrice = Math.max(0.01, basePrice - discountAmount);
    discountPercentage = Math.round((discountAmount / basePrice) * 100 * 100) / 100;
  }

  return {
    type: 'general',
    originalPrice,
    finalPrice,
    discountAmount,
    discountPercentage,
    label: discount.discountLabel || 'Tilbud'
  };
};

// Helper function to apply rabat gruppe discount to base price
const applyRabatGruppeDiscount = (
  basePrice: number, 
  rabatGruppePercentage: number
): PriceCalculationResult => {
  if (basePrice <= 0 || rabatGruppePercentage <= 0) {
    return {
      type: 'none',
      originalPrice: basePrice,
      finalPrice: basePrice,
      discountAmount: 0,
      discountPercentage: 0
    };
  }

  const discountAmount = (basePrice * rabatGruppePercentage) / 100;
  const finalPrice = Math.max(0.01, basePrice - discountAmount);

  return {
    type: 'group',
    originalPrice: basePrice,
    finalPrice,
    discountAmount,
    discountPercentage: rabatGruppePercentage
  };
};

// Helper function to format currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('da-DK', {
    style: 'currency',
    currency: 'DKK',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

// Preview card component for each discount scenario
const PricePreviewCard: React.FC<{
  title: string;
  description: string;
  calculation: PriceCalculationResult;
  showStrikethrough: boolean;
  discountLabel: string;
  color?: string;
  icon?: React.ReactNode;
}> = ({ title, description, calculation, showStrikethrough, discountLabel, color, icon }) => {
  const hasDiscount = calculation.type !== 'none' && calculation.discountAmount > 0;

  return (
    <Card className={cn("h-full", hasDiscount && "ring-2 ring-green-200")}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          {icon}
          <div className="flex-1">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <CardDescription className="text-xs">{description}</CardDescription>
          </div>
          {color && (
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: color }}
            />
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {hasDiscount ? (
            <>
              <div className="flex items-center gap-2">
                {showStrikethrough && calculation.originalPrice !== calculation.finalPrice && (
                  <span className="text-sm text-gray-500 line-through">
                    {formatCurrency(calculation.originalPrice)}
                  </span>
                )}
                <span className="text-lg font-bold text-brand-primary">
                  {formatCurrency(calculation.finalPrice)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs bg-brand-gray-100 text-brand-primary-dark">
                  {discountLabel} -{calculation.discountPercentage.toFixed(0)}%
                </Badge>
                <span className="text-xs text-gray-500">
                  Spar {formatCurrency(calculation.discountAmount)}
                </span>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-lg font-medium">
                {formatCurrency(calculation.finalPrice)}
              </span>
              <span className="text-xs text-gray-500">Standard pris</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export const RabatGruppePreview: React.FC<RabatGruppePreviewProps> = ({
  basispris,
  discount,
  produktnavn,
  isLoading = false
}) => {
  const [discountGroups, setDiscountGroups] = useState<DiscountGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);

  // Load discount groups function
  const loadDiscountGroups = async () => {
    try {
      setLoadingGroups(true);
      const response = await authService.getDiscountGroups();
      if (response.success && response.discountGroups) {
        setDiscountGroups(response.discountGroups as DiscountGroup[]);
        if (import.meta.env.DEV) {
          console.log('🔄 RabatGruppePreview: Loaded', response.discountGroups.length, 'discount groups');
        }
      }
    } catch (error) {
      console.error('Failed to load discount groups:', error);
    } finally {
      setLoadingGroups(false);
    }
  };

  // Load discount groups on component mount and listen for updates
  useEffect(() => {
    loadDiscountGroups();

    // Listen for custom events when discount groups are updated
    const handleDiscountGroupUpdate = () => {
      if (import.meta.env.DEV) {
        console.log('🔄 RabatGruppePreview: Received discount group update event');
      }
      // Add small delay to ensure data is ready
      setTimeout(() => {
        loadDiscountGroups();
      }, 100);
    };

    // Listen for the custom event
    window.addEventListener('discountGroupsUpdated', handleDiscountGroupUpdate);

    // Also listen for storage changes as a fallback
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'discountGroupsUpdated') {
        if (import.meta.env.DEV) {
          console.log('🔄 RabatGruppePreview: Received storage update event');
        }
        // Add small delay to ensure data is ready
        setTimeout(() => {
          loadDiscountGroups();
        }, 100);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Also listen for focus events to refresh data when user returns to tab
    const handleFocus = () => {
      if (import.meta.env.DEV) {
        console.log('🔄 RabatGruppePreview: Window focused - refreshing discount groups');
      }
      loadDiscountGroups();
    };

    window.addEventListener('focus', handleFocus);

    // Cleanup
    return () => {
      window.removeEventListener('discountGroupsUpdated', handleDiscountGroupUpdate);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Don't show preview if no product name or price
  if (!produktnavn || basispris <= 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Pris forhåndsvisning
          </CardTitle>
          <CardDescription>
            Indtast produktnavn og pris for at se forhåndsvisning
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-gray-500">
            <AlertCircle className="h-8 w-8 mr-2" />
            <span>Produktnavn og pris påkrævet for forhåndsvisning</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const generalDiscountCalculation = calculateDiscountedPrice(basispris, discount);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Pris forhåndsvisning
        </CardTitle>
        <CardDescription>
          Se hvordan "{produktnavn}" vil blive vist med forskellige rabatter
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* General Product Discount Preview */}
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Percent className="h-4 w-4" />
            Generel produktrabat
          </h4>
          <PricePreviewCard
            title="Alle kunder"
            description={discount.enabled ? "Med aktiveret produktrabat" : "Uden produktrabat"}
            calculation={generalDiscountCalculation}
            showStrikethrough={discount.showStrikethrough || true}
            discountLabel={discount.discountLabel || 'Tilbud'}
            icon={<Percent className="h-4 w-4 text-blue-500" />}
          />
        </div>

        <Separator />

        {/* Rabat Gruppe Discounts Preview */}
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Rabatgrupper
            {generalDiscountCalculation.type === 'general' && discount.beforePrice && (
              <Badge variant="outline" className="text-orange-700 border-orange-300 bg-orange-100 text-xs ml-2">
                Deaktiveret ved før-pris
              </Badge>
            )}
          </h4>
          
          {loadingGroups ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </CardContent>
            </Card>
          ) : discountGroups.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {discountGroups.map((group) => {
                // NEW LOGIC: If før-pris is set, rabat grupper don't get additional discount
                let finalCalculation;
                
                if (discount.enabled && discount.beforePrice && discount.beforePrice > basispris) {
                  // Før-pris is set - rabat grupper see current price as their discounted price
                  finalCalculation = {
                    type: 'general' as const,
                    originalPrice: discount.beforePrice,
                    finalPrice: basispris, // Current price becomes their "discounted" price
                    discountAmount: discount.beforePrice - basispris,
                    discountPercentage: Math.round(((discount.beforePrice - basispris) / discount.beforePrice) * 100 * 100) / 100,
                    label: discount.discountLabel || 'Produkt tilbud',
                    groupName: group.name,
                    note: 'Før-pris rabat (ingen yderligere rabat)'
                  };
                } else {
                  // No før-pris - calculate normal rabat gruppe discount
                  const rabatGruppeCalculation = applyRabatGruppeDiscount(basispris, group.discountPercentage);
                  
                  // Choose the best price between general discount and rabat gruppe discount
                  finalCalculation = generalDiscountCalculation.finalPrice < rabatGruppeCalculation.finalPrice 
                    ? { ...generalDiscountCalculation, groupName: group.name, note: 'Bedste pris: Produktrabat' }
                    : { ...rabatGruppeCalculation, groupName: group.name, note: `${group.discountPercentage}% rabatgruppe rabat` };
                }

                return (
                  <PricePreviewCard
                    key={group.id}
                    title={group.name}
                    description={
                      finalCalculation.note || 
                      `${group.discountPercentage}% rabat gruppe (${group.customerCount} kunder)`
                    }
                    calculation={finalCalculation}
                    showStrikethrough={discount.showStrikethrough || true}
                    discountLabel={
                      finalCalculation.type === 'general' 
                        ? (discount.discountLabel || 'Tilbud')
                        : `${group.name} rabat`
                    }
                    color={group.color}
                    icon={<Users className="h-4 w-4" style={{ color: group.color }} />}
                  />
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-8 text-gray-500">
                <Users className="h-8 w-8 mr-2" />
                <span>Ingen rabat grupper oprettet endnu</span>
              </CardContent>
            </Card>
          )}
          
          {/* Explanation Note */}
          {discount.enabled && discount.beforePrice && discount.beforePrice > basispris && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Rabatgruppe forklaring</span>
              </div>
              <p className="text-xs text-blue-700">
                Da du har angivet en før-pris ({formatCurrency(discount.beforePrice)}), får alle rabatgrupper den samme rabat som vist ovenfor. 
                De får <strong>ikke</strong> yderligere rabat oveni, hvilket forhindrer dobbelt rabat og sikrer fair prisfastsættelse.
              </p>
            </div>
          )}
        </div>

        {/* Preview Notes */}
  
      </CardContent>
    </Card>
  );
}; 