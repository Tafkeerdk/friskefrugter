import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Star, Tag, Award, X, Search, Filter, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface CustomerProductFiltersProps {
  // Filter values
  search: string;
  category: string;
  priceRange: { min: number; max: number };
  rabatGruppe: boolean;
  fastUdsalgspris: boolean;
  uniqueOffer: boolean;
  sortBy: string;
  sortOrder: 'asc' | 'desc';

  // Filter handlers
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onPriceRangeChange: (range: { min: number; max: number }) => void;
  onRabatGruppeChange: (value: boolean) => void;
  onFastUdsalgsprisChange: (value: boolean) => void;
  onUniqueOfferChange: (value: boolean) => void;
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  onClearFilters: () => void;

  // Data
  categories: Array<{ _id: string; navn: string; productCount?: number }>;
  customerInfo?: {
    companyName: string;
    discountGroup?: {
      name: string;
      discountPercentage: number;
      color: string;
    };
    uniqueOffersCount: number;
  };

  // UI State
  isLoading?: boolean;
  isMobile?: boolean;
  className?: string;
}

export function CustomerProductFilters({
  search,
  category,
  priceRange,
  rabatGruppe,
  fastUdsalgspris,
  uniqueOffer,
  sortBy,
  sortOrder,
  onSearchChange,
  onCategoryChange,
  onPriceRangeChange,
  onRabatGruppeChange,
  onFastUdsalgsprisChange,
  onUniqueOfferChange,
  onSortChange,
  onClearFilters,
  categories = [],
  customerInfo,
  isLoading = false,
  isMobile = false,
  className
}: CustomerProductFiltersProps) {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const activeFiltersCount = [
    category !== 'all',
    priceRange.min > 0 || priceRange.max < 10000,
    rabatGruppe,
    fastUdsalgspris,
    uniqueOffer
  ].filter(Boolean).length;

  const handlePriceMinChange = (value: string) => {
    const min = parseFloat(value) || 0;
    onPriceRangeChange({ min, max: priceRange.max });
  };

  const handlePriceMaxChange = (value: string) => {
    const max = parseFloat(value) || 10000;
    onPriceRangeChange({ min: priceRange.min, max });
  };

  return (
    <Card className={cn("w-full", className)}>
      {/* Always Visible: Search + Customer Info */}
      <CardHeader className="pb-4">
        {/* Customer Info */}
        {customerInfo && (
          <div className="flex items-center justify-between text-sm mb-4">
            <div>
              <span className="font-medium text-gray-900">{customerInfo.companyName}</span>
              {customerInfo.discountGroup && (
                <span 
                  className="ml-2 text-xs px-2 py-1 rounded-full text-white font-medium"
                  style={{
                    backgroundColor: customerInfo.discountGroup.color || '#6B7280'
                  }}
                >
                  {customerInfo.discountGroup.name} Kunde
                  {customerInfo.discountGroup.discountPercentage > 0 && (
                    <span className="ml-1">({customerInfo.discountGroup.discountPercentage}% rabat)</span>
                  )}
                </span>
              )}
            </div>
            {customerInfo.uniqueOffersCount > 0 && (
              <Badge variant="default" className="bg-brand-primary text-xs">
                <Star className="h-3 w-3 mr-1" />
                {customerInfo.uniqueOffersCount} Unique Offers
              </Badge>
            )}
          </div>
        )}

        {/* Search - Always Visible */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Søg efter navn, varenummer eller EAN..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
              disabled={isLoading}
            />
          </div>
        </div>
      </CardHeader>

      {/* Collapsible Advanced Filters */}
      <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="pt-0 pb-4 cursor-pointer hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-brand-primary" />
                <span className="text-sm font-medium">Avancerede filtre</span>
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {activeFiltersCount}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {activeFiltersCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onClearFilters();
                    }}
                    className="text-xs"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Ryd
                  </Button>
                )}
                {isFiltersOpen ? (
                  <ChevronUp className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

                 <CollapsibleContent>
           <CardContent className="pt-0 space-y-6">

        {/* Category Filter */}
        <div className="space-y-2">
          <Label htmlFor="category">Kategori</Label>
          <Select
            value={category}
            onValueChange={onCategoryChange}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Vælg kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle kategorier</SelectItem>
              {categories
                .filter(cat => (cat.productCount || 0) > 0) // Only show categories with products
                .map((cat) => (
                <SelectItem key={cat._id} value={cat._id}>
                  <div className="flex items-center justify-between w-full">
                    <span>{cat.navn}</span>
                    <Badge variant="outline" className="ml-2 text-xs bg-gray-100 text-gray-600">
                      {cat.productCount}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Price Range Filter */}
        <div className="space-y-3">
          <Label>Prisinterval (DKK)</Label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="minPrice" className="text-xs text-gray-500">
                Fra
              </Label>
              <Input
                id="minPrice"
                type="number"
                placeholder="0"
                value={priceRange.min > 0 ? priceRange.min : ''}
                onChange={(e) => handlePriceMinChange(e.target.value)}
                disabled={isLoading}
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <Label htmlFor="maxPrice" className="text-xs text-gray-500">
                Til
              </Label>
              <Input
                id="maxPrice"
                type="number"
                placeholder="10000"
                value={priceRange.max < 10000 ? priceRange.max : ''}
                onChange={(e) => handlePriceMaxChange(e.target.value)}
                disabled={isLoading}
                min="0"
                step="0.01"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Discount Type Filters */}
        <div className="space-y-4">
          <Label>Specialtilbud</Label>
          
          {/* Unique Offers Filter */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-brand-primary" />
              <div>
                <Label htmlFor="uniqueOffer" className="text-sm font-medium">
                  Unique Offers
                </Label>
                <p className="text-xs text-gray-500">
                  Særlige tilbud kun til dig
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {customerInfo?.uniqueOffersCount > 0 && (
                <Badge variant="default" className="text-xs bg-brand-primary">
                  {customerInfo.uniqueOffersCount}
                </Badge>
              )}
              <Switch
                id="uniqueOffer"
                checked={uniqueOffer}
                onCheckedChange={onUniqueOfferChange}
                disabled={isLoading || !customerInfo?.uniqueOffersCount}
              />
            </div>
          </div>

          {/* Fast Udsalgspris Filter */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-brand-error" />
              <div>
                <Label htmlFor="fastUdsalgspris" className="text-sm font-medium">
                  Fast Udsalgspris
                </Label>
                <p className="text-xs text-gray-500">
                  Produkter på tilbud
                </p>
              </div>
            </div>
            <Switch
              id="fastUdsalgspris"
              checked={fastUdsalgspris}
              onCheckedChange={onFastUdsalgsprisChange}
              disabled={isLoading}
            />
          </div>

          {/* Rabat Gruppe Filter - Only show if customer has discount group with >0% */}
          {customerInfo?.discountGroup && customerInfo.discountGroup.discountPercentage > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-brand-secondary" />
                <div>
                  <Label htmlFor="rabatGruppe" className="text-sm font-medium">
                    {customerInfo.discountGroup.name} Rabat
                  </Label>
                  <p className="text-xs text-gray-500">
                    Produkter med {customerInfo.discountGroup.name} rabat
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span 
                  className="text-xs px-2 py-1 rounded text-white font-medium"
                  style={{
                    backgroundColor: customerInfo.discountGroup.color || '#6B7280'
                  }}
                >
                  -{customerInfo.discountGroup.discountPercentage}%
                </span>
                <Switch
                  id="rabatGruppe"
                  checked={rabatGruppe}
                  onCheckedChange={onRabatGruppeChange}
                  disabled={isLoading}
                />
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Sort Options */}
        <div className="space-y-3">
          <Label>Sortér efter</Label>
          <div className="grid grid-cols-1 gap-2">
            <Select
              value={`${sortBy}-${sortOrder}`}
              onValueChange={(value) => {
                const [newSortBy, newSortOrder] = value.split('-') as [string, 'asc' | 'desc'];
                onSortChange(newSortBy, newSortOrder);
              }}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="produktnavn-asc">Navn (A-Z)</SelectItem>
                <SelectItem value="produktnavn-desc">Navn (Z-A)</SelectItem>
                <SelectItem value="basispris-asc">Pris (lav til høj)</SelectItem>
                <SelectItem value="basispris-desc">Pris (høj til lav)</SelectItem>
                <SelectItem value="createdAt-desc">Nyeste først</SelectItem>
                <SelectItem value="createdAt-asc">Ældste først</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    );
} 