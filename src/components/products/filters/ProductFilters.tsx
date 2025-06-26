import React, { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Search, Filter, ChevronDown } from "lucide-react";
import { useProductFilters, sortOptions } from "@/hooks/products/useProductFilters";

interface ProductFiltersProps {
  onFilterChange?: (category: string) => void;
  onSortChange?: (sort: string) => void;
  onSearchChange?: (search: string) => void;
}

export function ProductFilters({ 
  onFilterChange, 
  onSortChange, 
  onSearchChange 
}: ProductFiltersProps) {
  const { 
    filters, 
    categories, 
    isLoadingCategories, 
    updateFilter 
  } = useProductFilters();

  // Use refs to store current callbacks without causing re-renders
  const onFilterChangeRef = useRef(onFilterChange);
  const onSortChangeRef = useRef(onSortChange);
  const onSearchChangeRef = useRef(onSearchChange);

  // Update refs when callbacks change
  useEffect(() => {
    onFilterChangeRef.current = onFilterChange;
  }, [onFilterChange]);

  useEffect(() => {
    onSortChangeRef.current = onSortChange;
  }, [onSortChange]);

  useEffect(() => {
    onSearchChangeRef.current = onSearchChange;
  }, [onSearchChange]);

  // FIXED: Notify parent components when filters change - NO CALLBACK DEPENDENCIES
  useEffect(() => {
    onFilterChangeRef.current?.(filters.category);
  }, [filters.category]); // FIXED: Removed onFilterChange dependency

  useEffect(() => {
    onSortChangeRef.current?.(filters.sort);
  }, [filters.sort]); // FIXED: Removed onSortChange dependency

  useEffect(() => {
    onSearchChangeRef.current?.(filters.search);
  }, [filters.search]); // FIXED: Removed onSearchChange dependency

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFilter('search', e.target.value);
  };

  const handleCategoryChange = (value: string) => {
    updateFilter('category', value);
  };

  const handleSortChange = (value: string) => {
    updateFilter('sort', value);
  };

  const getCategoryDisplayName = (categoryId: string) => {
    if (categoryId === 'all') return 'Alle';
    const category = categories.find(cat => cat._id === categoryId);
    return category?.navn || categoryId;
  };

  const getSortDisplayName = (sortValue: string) => {
    const option = sortOptions.find(opt => opt.value === sortValue);
    return option?.label || sortValue;
  };

  return (
    <div className="flex flex-col md:flex-row gap-3 mb-6">
      {/* Search Input */}
      <div className="relative flex-grow">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Søg efter produkter..."
          className="pl-10"
          value={filters.search}
          onChange={handleSearchChange}
        />
      </div>
      
      {/* Filter Controls */}
      <div className="flex gap-2">
        {/* Category Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex gap-2 min-w-[140px]">
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Kategori:</span>
              <span className="font-medium truncate">
                {getCategoryDisplayName(filters.category)}
              </span>
              <ChevronDown className="h-4 w-4 ml-auto" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuRadioGroup 
              value={filters.category} 
              onValueChange={handleCategoryChange}
            >
              <DropdownMenuRadioItem value="all">
                Alle kategorier
              </DropdownMenuRadioItem>
              {isLoadingCategories ? (
                <DropdownMenuRadioItem value="loading" disabled>
                  Indlæser kategorier...
                </DropdownMenuRadioItem>
              ) : categories.length > 0 ? (
                categories.map(category => (
                  <DropdownMenuRadioItem 
                    key={category._id} 
                    value={category._id}
                  >
                    {category.navn}
                  </DropdownMenuRadioItem>
                ))
              ) : (
                <DropdownMenuRadioItem value="no-categories" disabled>
                  Ingen kategorier tilgængelige
                </DropdownMenuRadioItem>
              )}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Sort Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex gap-2 min-w-[140px]">
              <span className="hidden sm:inline">Sortering:</span>
              <span className="font-medium truncate">
                {getSortDisplayName(filters.sort)}
              </span>
              <ChevronDown className="h-4 w-4 ml-auto" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuRadioGroup 
              value={filters.sort} 
              onValueChange={handleSortChange}
            >
              {sortOptions.map(option => (
                <DropdownMenuRadioItem 
                  key={option.value} 
                  value={option.value}
                >
                  {option.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
} 