import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Loader2, Search, Eye, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  name: string;
  image: string;
  price?: number;
  category: string;
}

interface SearchResultsProps {
  results: SearchResult[];
  isVisible: boolean;
  isLoading?: boolean;
  onResultClick?: () => void;
  onViewAllResults?: () => void;
  searchQuery?: string;
  isAuthenticated?: boolean;
}

export const SearchResults = ({ 
  results, 
  isVisible, 
  isLoading = false,
  onResultClick,
  onViewAllResults,
  searchQuery = '',
  isAuthenticated = false
}: SearchResultsProps) => {
  if (!isVisible) {
    return null;
  }
  
  return (
    <div className={cn(
      "bg-white rounded-lg shadow-lg border border-gray-200 max-h-[400px] overflow-y-auto z-50",
      // Desktop: positioned relative to search input
      "hidden md:block md:absolute md:top-full md:mt-1 md:left-0 md:right-0",
      // Mobile: full-width fixed overlay
      "md:hidden fixed top-[4.5rem] left-2 right-2 mt-1"
    )}>
      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Søger efter produkter...</span>
          </div>
        </div>
      )}

      {/* No Results */}
      {!isLoading && results.length === 0 && searchQuery && (
        <div className="flex flex-col items-center justify-center py-8 px-4">
          <Search className="h-8 w-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-500 text-center">
            Ingen produkter fundet for "{searchQuery}"
          </p>
          <p className="text-xs text-gray-400 text-center mt-1">
            Prøv at søge efter noget andet
          </p>
        </div>
      )}

      {/* Search Results */}
      {!isLoading && results.length > 0 && (
        <>
          {results.map((product) => (
            <Link 
              to={`/products/${product.id}`} 
              key={product.id}
              onClick={onResultClick}
              className="block"
            >
              <div className="flex items-center gap-4 p-4 md:p-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0">
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-14 w-14 md:h-12 md:w-12 object-cover rounded-md border flex-shrink-0"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder.svg';
                  }}
                />
                <div className="flex-1 min-w-0 pr-3">
                  <h4 className="font-medium text-base md:text-sm text-gray-900 line-clamp-2 md:truncate leading-tight mb-1">{product.name}</h4>
                  <p className="text-sm md:text-xs text-gray-500">{product.category}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  {isAuthenticated && product.price !== undefined ? (
                    <span className="text-base md:text-sm font-medium text-brand-primary whitespace-nowrap">
                      {product.price.toFixed(2)} kr
                    </span>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 md:gap-1">
                      {/* Mobile: Styled pill with generous padding */}
                      <div className="md:hidden flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg">
                        <Lock className="h-4 w-4 flex-shrink-0" />
                        <span className="whitespace-nowrap text-sm">Log ind for priser</span>
                      </div>
                      {/* Desktop: Simple layout (unchanged) */}
                      <div className="hidden md:flex items-center gap-1">
                        <Lock className="h-3 w-3" />
                        <span>Log ind for priser</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}

          {/* View All Results Button */}
          {onViewAllResults && searchQuery && (
            <div className="p-4 md:p-3 border-t border-gray-200 bg-gray-50">
              <Button
                variant="outline"
                size="default"
                onClick={onViewAllResults}
                className="w-full text-brand-primary border-brand-primary hover:bg-brand-primary hover:text-white h-12 md:h-auto text-base md:text-sm"
              >
                <Eye className="h-5 w-5 md:h-4 md:w-4 mr-2 flex-shrink-0" />
                <span className="truncate">
                  <span className="hidden sm:inline">Se alle resultater for "{searchQuery}"</span>
                  <span className="sm:hidden">Se alle ({searchQuery})</span>
                </span>
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
