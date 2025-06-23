import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Eye, Percent, Users, AlertCircle } from 'lucide-react';
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
    currency: 'DKK'
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
                <span className="text-lg font-bold text-green-600">
                  {formatCurrency(calculation.finalPrice)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
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

  // Load discount groups on component mount
  useEffect(() => {
    const loadDiscountGroups = async () => {
      try {
        setLoadingGroups(true);
        const response = await authService.getDiscountGroups();
        if (response.success && response.discountGroups) {
          setDiscountGroups(response.discountGroups as DiscountGroup[]);
        }
      } catch (error) {
        console.error('Failed to load discount groups:', error);
      } finally {
        setLoadingGroups(false);
      }
    };

    loadDiscountGroups();
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
            Rabat gruppe priser
          </h4>
          
          {loadingGroups ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="h-32">
                  <CardContent className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : discountGroups.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {discountGroups.map((group) => {
                // Calculate the best price between general discount and rabat gruppe discount
                const rabatGruppeCalculation = applyRabatGruppeDiscount(basispris, group.discountPercentage);
                
                // Choose the best price for the customer (lowest final price)
                const bestCalculation = generalDiscountCalculation.finalPrice < rabatGruppeCalculation.finalPrice 
                  ? { ...generalDiscountCalculation, groupName: group.name }
                  : { ...rabatGruppeCalculation, groupName: group.name };

                return (
                  <PricePreviewCard
                    key={group.id}
                    title={group.name}
                    description={`${group.discountPercentage}% rabat gruppe (${group.customerCount} kunder)`}
                    calculation={bestCalculation}
                    showStrikethrough={discount.showStrikethrough || true}
                    discountLabel={bestCalculation.type === 'general' ? (discount.discountLabel || 'Tilbud') : `${group.name} rabat`}
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
        </div>

        {/* Preview Notes */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h5 className="font-medium text-blue-900 mb-2">Forhåndsvisning noter:</h5>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Kunder vil se den bedste tilgængelige pris (laveste pris vinder)</li>
            <li>• Generel produktrabat gælder for alle kunder, medmindre andet er specificeret</li>
            <li>• Rabat gruppe priser kombineres med generel produktrabat hvis det giver en bedre pris</li>
            <li>• Priserne vises med dansk valuta formatering (DKK)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}; 