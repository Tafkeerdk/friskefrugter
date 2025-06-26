import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Search, Filter, LogIn, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

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

  const activeFiltersCount = [
    category !== 'all',
    search.length > 0
  ].filter(Boolean).length;

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-brand-primary" />
            Søg & Filtrer
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount}
              </Badge>
            )}
          </CardTitle>
          
          {activeFiltersCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearFilters}
              className="text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Ryd
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Login Prompt */}
        <div className="bg-brand-primary/5 border border-brand-primary/20 rounded-lg p-4">
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

        <Separator />

        {/* Search */}
        <div className="space-y-2">
          <Label htmlFor="search">Søg produkter</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="search"
              type="text"
              placeholder="Søg efter produktnavn..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
              disabled={isLoading}
            />
          </div>
        </div>

        <Separator />

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
              {categories.map((cat) => (
                <SelectItem key={cat._id} value={cat._id}>
                  <div className="flex items-center justify-between w-full">
                    <span>{cat.navn}</span>
                    {cat.productCount && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        {cat.productCount}
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
    </Card>
  );
} 