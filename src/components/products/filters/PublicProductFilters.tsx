import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Search, Filter, LogIn, X, ChevronDown, ChevronUp, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { useDebounce } from "@/hooks/useDebounce";

interface PublicProductFiltersProps {
  // Filter values
  search: string;
  category: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';

  // Filter handlers
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  onClearFilters: () => void;

  // Data
  categories: Array<{ _id: string; navn: string; productCount?: number }>;

  // UI State
  isLoading?: boolean;
  isMobile?: boolean;
  className?: string;
}

export function PublicProductFilters({
  search,
  category,
  sortBy,
  sortOrder,
  onSearchChange,
  onCategoryChange,
  onSortChange,
  onClearFilters,
  categories = [],
  isLoading = false,
  isMobile = false,
  className
}: PublicProductFiltersProps) {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  
  // **LOCAL STATE FOR DEBOUNCED SEARCH - CRITICAL FIX**
  const [localSearch, setLocalSearch] = useState(search);
  
  // **DEBOUNCED SEARCH VALUE - 600MS DELAY**
  const debouncedSearch = useDebounce(localSearch, 600);

  // **SYNC LOCAL SEARCH WITH PROP WHEN IT CHANGES EXTERNALLY**
  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  // **TRIGGER API CALL WHEN DEBOUNCED SEARCH CHANGES**
  useEffect(() => {
    if (debouncedSearch !== search) {
      onSearchChange(debouncedSearch);
    }
  }, [debouncedSearch, search, onSearchChange]);

  // **HANDLE ENTER KEY FOR IMMEDIATE SEARCH**
  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Trigger immediate search on Enter
      onSearchChange(localSearch);
    }
  };

  // **CLEAR SEARCH HANDLER**
  const handleClearSearch = () => {
    setLocalSearch('');
    onSearchChange('');
  };

  // **CHECK IF SEARCH IS PENDING (USER IS STILL TYPING)**
  const isSearchPending = localSearch !== search && localSearch !== debouncedSearch;

  const activeFiltersCount = [
    category !== 'all',
    search.length > 0
  ].filter(Boolean).length;

  return (
    <Card className={cn("w-full", className)}>
      {/* Always Visible: Login Prompt + Search */}
      <CardHeader className="pb-4">
        {/* Login Prompt - Always Visible */}
        <div className="bg-brand-primary/5 border border-brand-primary/20 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-3">
            <LogIn className="h-5 w-5 text-brand-primary flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-brand-primary-dark">
                Log ind for at se priser
              </h4>
              <p className="text-xs text-gray-600 mt-1">
                Se specialpriser, tilbud og få adgang til avancerede filtre
              </p>
            </div>
            <Link to="/login">
              <Button size="sm" className="btn-brand-primary text-xs">
                Log ind
              </Button>
            </Link>
          </div>
        </div>

        {/* **DEBOUNCED SEARCH WITH PENDING INDICATOR** */}
        <div className="space-y-2">
          <div className="relative">
            {isSearchPending ? (
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-orange-500 animate-pulse" />
            ) : (
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            )}
            <Input
              type="text"
              placeholder="Søg efter produktnavn... (Tryk Enter for øjeblikkelig søgning)"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              onKeyDown={handleSearchKeyPress}
              className={cn(
                "pl-10 pr-10",
                isSearchPending && "border-orange-300 focus:border-orange-400"
              )}
              disabled={isLoading}
            />
            {localSearch && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
                onClick={handleClearSearch}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          {isSearchPending && (
            <p className="text-xs text-orange-600 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Søger automatisk om {Math.ceil(600 / 1000)} sekunder eller tryk Enter...
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
                <span className="text-sm font-medium">Filtre & Sortering</span>
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
                      setLocalSearch('');
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

        {/* Sort Options */}
        <div className="space-y-2">
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
                <SelectItem value="createdAt-desc">Nyeste først</SelectItem>
                <SelectItem value="createdAt-asc">Ældste først</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Limitation Notice */}
        <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3 border">
          <p className="font-medium mb-1">Begrænsede filtermuligheder</p>
          <p>Log ind som kunde for at få adgang til prisfiltre, specialtilbud og rabatgrupper.</p>
        </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    );
} 