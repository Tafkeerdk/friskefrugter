import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Star, Tag, Award, X, Search, Filter, ChevronDown, ChevronUp, Clock } from "lucide-react";
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
    fastUdsalgsprisCount?: number;
    tilbudsgruppeCount?: number; // ✅ NEW: Count of products with fixed offer group prices
    rabatGruppeCount?: number; // Deprecated, kept for backwards compatibility
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
  
  // **LOCAL STATE FOR DEBOUNCED SEARCH**
  const [localSearch, setLocalSearch] = useState(search);
  const [pendingFilters, setPendingFilters] = useState({
    category,
    priceRange,
    rabatGruppe,
    fastUdsalgspris,
    uniqueOffer,
    sortBy,
    sortOrder
  });
  
  // **DEBOUNCING REFS**
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // **SYNC LOCAL SEARCH WITH PROP WHEN IT CHANGES EXTERNALLY**
  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  // **DEBOUNCED SEARCH - 800MS DELAY**
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (localSearch !== search) {
        onSearchChange(localSearch);
      }
    }, 800);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [localSearch, search, onSearchChange]);

  // **HANDLE ENTER KEY FOR IMMEDIATE SEARCH**
  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      onSearchChange(localSearch);
    }
  };

  // **CHECK IF FILTERS HAVE PENDING CHANGES**
  const hasFilterChanges = () => {
    return (
      pendingFilters.category !== category ||
      pendingFilters.priceRange.min !== priceRange.min ||
      pendingFilters.priceRange.max !== priceRange.max ||
      pendingFilters.rabatGruppe !== rabatGruppe ||
      pendingFilters.fastUdsalgspris !== fastUdsalgspris ||
      pendingFilters.uniqueOffer !== uniqueOffer ||
      pendingFilters.sortBy !== sortBy ||
      pendingFilters.sortOrder !== sortOrder
    );
  };

  // **APPLY FILTERS BUTTON HANDLER**
  const handleApplyFilters = () => {
    if (pendingFilters.category !== category) {
      onCategoryChange(pendingFilters.category);
    }
    if (pendingFilters.priceRange.min !== priceRange.min || pendingFilters.priceRange.max !== priceRange.max) {
      onPriceRangeChange(pendingFilters.priceRange);
    }
    if (pendingFilters.rabatGruppe !== rabatGruppe) {
      onRabatGruppeChange(pendingFilters.rabatGruppe);
    }
    if (pendingFilters.fastUdsalgspris !== fastUdsalgspris) {
      onFastUdsalgsprisChange(pendingFilters.fastUdsalgspris);
    }
    if (pendingFilters.uniqueOffer !== uniqueOffer) {
      onUniqueOfferChange(pendingFilters.uniqueOffer);
    }
    if (pendingFilters.sortBy !== sortBy || pendingFilters.sortOrder !== sortOrder) {
      onSortChange(pendingFilters.sortBy, pendingFilters.sortOrder);
    }
  };

  const activeFiltersCount = [
    category !== 'all',
    priceRange.min > 0 || priceRange.max < 10000,
    rabatGruppe,
    fastUdsalgspris,
    uniqueOffer
  ].filter(Boolean).length;

  const handlePriceMinChange = (value: string) => {
    const min = parseFloat(value) || 0;
    setPendingFilters(prev => ({ 
      ...prev, 
      priceRange: { min, max: prev.priceRange.max } 
    }));
  };

  const handlePriceMaxChange = (value: string) => {
    const max = parseFloat(value) || 10000;
    setPendingFilters(prev => ({ 
      ...prev, 
      priceRange: { min: prev.priceRange.min, max } 
    }));
  };

  return (
    <Card className={cn("w-full", className)}>
      {/* Always Visible: Search + Customer Info */}
      <CardHeader className="pb-4">
        {/* Customer Info - Mobile Responsive */}
        {customerInfo && (
          <div className={cn(
            "text-sm mb-4 space-y-3",
            isMobile ? "space-y-2" : "space-y-3"
          )}>
            {/* Company Name Row */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-gray-900 truncate">
                {customerInfo.companyName}
              </span>
              {customerInfo.discountGroup && (
                <span 
                  className={cn(
                    "text-xs px-2 py-1 rounded-full text-white font-medium inline-flex items-center flex-shrink-0",
                    isMobile ? "text-xs" : "text-xs"
                  )}
                  style={{
                    backgroundColor: customerInfo.discountGroup.color || '#6B7280'
                  }}
                >
                  <span className={cn(isMobile ? "hidden" : "inline")}>
                    {customerInfo.discountGroup.name} Kunde
                  </span>
                  <span className={cn(isMobile ? "inline" : "hidden")}>
                    {customerInfo.discountGroup.name}
                  </span>
                  {customerInfo.discountGroup.discountPercentage > 0 && (
                    <span className="ml-1">
                      ({customerInfo.discountGroup.discountPercentage}%)
                    </span>
                  )}
                </span>
              )}
            </div>
            
            {/* Unique Offers Badge - Separate Row on Mobile */}
            {customerInfo.uniqueOffersCount > 0 && (
              <div className={cn(
                "flex",
                isMobile ? "justify-start" : "justify-end"
              )}>
                <Badge variant="default" className="bg-brand-primary text-xs flex-shrink-0">
                  <Star className="h-3 w-3 mr-1" />
                  <span className={cn(isMobile ? "hidden" : "inline")}>
                    {customerInfo.uniqueOffersCount} Unikke Tilbud
                  </span>
                  <span className={cn(isMobile ? "inline" : "hidden")}>
                    {customerInfo.uniqueOffersCount} Tilbud
                  </span>
                </Badge>
              </div>
            )}
          </div>
        )}

        {/* **DEBOUNCED SEARCH WITH ENTER KEY SUPPORT** */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Søg efter navn, varenummer eller EAN... (Tryk Enter for øjeblikkelig søgning)"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              onKeyDown={handleSearchKeyPress}
              className={cn(
                "pl-10 pr-10",
                localSearch !== search && "border-orange-300 focus:border-orange-400"
              )}
              disabled={isLoading}
            />
            {localSearch && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
                onClick={() => {
                  setLocalSearch('');
                  onSearchChange('');
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          {localSearch !== search && (
            <p className="text-xs text-orange-600 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Søger automatisk om {Math.ceil(800 / 1000)} sekund eller tryk Enter...
            </p>
          )}
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
                {hasFilterChanges() && (
                  <Badge variant="outline" className="text-xs border-orange-400 text-orange-600">
                    Ikke anvendt
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
                      setPendingFilters({
                        category: 'all',
                        priceRange: { min: 0, max: 10000 },
                        rabatGruppe: false,
                        fastUdsalgspris: false,
                        uniqueOffer: false,
                        sortBy: 'produktnavn',
                        sortOrder: 'asc'
                      });
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
            value={pendingFilters.category}
            onValueChange={(value) => setPendingFilters(prev => ({ ...prev, category: value }))}
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
                value={pendingFilters.priceRange.min > 0 ? pendingFilters.priceRange.min : ''}
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
                value={pendingFilters.priceRange.max < 10000 ? pendingFilters.priceRange.max : ''}
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
                  Unikke Tilbud
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
                checked={pendingFilters.uniqueOffer}
                onCheckedChange={(value) => setPendingFilters(prev => ({ ...prev, uniqueOffer: value }))}
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
            <div className="flex items-center gap-2">
              {customerInfo?.fastUdsalgsprisCount > 0 && (
                <Badge variant="default" className="text-xs bg-red-600">
                  {customerInfo.fastUdsalgsprisCount}
                </Badge>
              )}
              <Switch
                id="fastUdsalgspris"
                checked={pendingFilters.fastUdsalgspris}
                onCheckedChange={(value) => setPendingFilters(prev => ({ ...prev, fastUdsalgspris: value }))}
                disabled={isLoading || !customerInfo?.fastUdsalgsprisCount}
              />
            </div>
          </div>

          {/* Tilbudsgruppe Filter - Show if customer has offer group with fixed prices */}
          {customerInfo?.discountGroup && (customerInfo.tilbudsgruppeCount > 0 || customerInfo.rabatGruppeCount > 0) && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-brand-secondary" />
                <div>
                  <Label htmlFor="rabatGruppe" className="text-sm font-medium">
                    {customerInfo.discountGroup.name} Priser
                  </Label>
                  <p className="text-xs text-gray-500">
                    Produkter med {customerInfo.discountGroup.name} tilbudspriser
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {(customerInfo?.tilbudsgruppeCount > 0 || customerInfo?.rabatGruppeCount > 0) && (
                  <Badge 
                    variant="default" 
                    className="text-xs text-white" 
                    style={{
                      backgroundColor: customerInfo.discountGroup.color || '#6B7280'
                    }}
                  >
                    {customerInfo.tilbudsgruppeCount || customerInfo.rabatGruppeCount}
                  </Badge>
                )}
                <span 
                  className="text-xs px-2 py-1 rounded text-white font-medium"
                  style={{
                    backgroundColor: customerInfo.discountGroup.color || '#6B7280'
                  }}
                >
                  Tilbud
                </span>
                <Switch
                  id="rabatGruppe"
                  checked={pendingFilters.rabatGruppe}
                  onCheckedChange={(value) => setPendingFilters(prev => ({ ...prev, rabatGruppe: value }))}
                  disabled={isLoading || !customerInfo?.rabatGruppeCount}
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
              value={`${pendingFilters.sortBy}-${pendingFilters.sortOrder}`}
              onValueChange={(value) => {
                const [newSortBy, newSortOrder] = value.split('-') as [string, 'asc' | 'desc'];
                setPendingFilters(prev => ({ ...prev, sortBy: newSortBy, sortOrder: newSortOrder }));
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

        {/* **APPLY FILTERS BUTTON - INDUSTRY STANDARD UX PATTERN** */}
        {hasFilterChanges() && (
          <>
            <Separator />
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-gray-600">
                Du har ændringer, der ikke er anvendt endnu
              </p>
              <Button 
                onClick={handleApplyFilters}
                disabled={isLoading}
                className="bg-brand-primary hover:bg-brand-primary-hover text-white font-semibold px-6"
              >
                <Filter className="h-4 w-4 mr-2" />
                Anvend filtre
              </Button>
            </div>
          </>
        )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    );
} 