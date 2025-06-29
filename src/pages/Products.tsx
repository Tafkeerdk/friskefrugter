import React, { useState, useEffect } from 'react';
import { useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ProductCard } from "@/components/products/ProductCard";
import { CustomerProductFilters } from "@/components/products/filters/CustomerProductFilters";
import { PublicProductFilters } from "@/components/products/filters/PublicProductFilters";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { ChevronDown, Package, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { api, handleApiError } from "@/lib/api";
import { authService } from "@/lib/auth";
import { CustomerPricing } from "@/components/products/card/ProductPricing";
import { FabBackToTop } from '@/components/ui/fab-back-to-top';
import { cn } from '@/lib/utils';

// Types
interface Product {
  _id: string;
  produktnavn: string;
  beskrivelse?: string;
  billeder: Array<{
    _id: string;
    url: string;
    filename: string;
    isPrimary: boolean;
  }>;
  kategori: {
    _id: string;
    navn: string;
  };
  basispris: number;
  enhed: string | {
    _id: string;
    value: string;
    label: string;
    description?: string;
  };
  aktiv: boolean;
  varenummer?: string;
  eanNummer?: string;
  createdAt: string;
  updatedAt: string;
  // Customer-specific pricing (only for logged-in users)
  customerPricing?: CustomerPricing;
}

interface Category {
  _id: string;
  navn: string;
  productCount?: number;
}

interface ProductFilters {
  search: string;
  category: string;
  priceRange: {
    min: number;
    max: number;
  };
  uniqueOffers: boolean;
  fastUdsalgspris: boolean;
  rabatGruppe: boolean;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

const Products = () => {
  const { user, isAuthenticated, isCustomerAuthenticated } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State management
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  
  // Race condition fix: Track when processing URL search
  const [isProcessingUrlSearch, setIsProcessingUrlSearch] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState<ProductFilters>({
    search: '',
    category: 'all',
    priceRange: { min: 0, max: 10000 },
    uniqueOffers: false,
    fastUdsalgspris: false,
    rabatGruppe: false,
    sortBy: 'produktnavn',
    sortOrder: 'asc'
  });
  
  // Customer info for authenticated users
  const [customerInfo, setCustomerInfo] = useState<any>(null);

  // **HANDLE URL SEARCH PARAMETERS FROM NAVBAR - FIXED RACE CONDITION**
  useEffect(() => {
    const urlSearch = searchParams.get('search');
    if (urlSearch && urlSearch.trim()) {
      setIsProcessingUrlSearch(true); // Prevent other useEffect from interfering
      setFilters(prev => ({ ...prev, search: urlSearch.trim() }));
      
      // Clear the URL parameter after setting the search
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('search');
      setSearchParams(newParams, { replace: true });
      
      // Load products with search term after categories are loaded
      const loadSearchResults = async () => {
        try {
          // Wait for categories if they're not loaded yet
          if (categories.length === 0) {
            // Wait a bit and try again, or load categories first
            setTimeout(() => {
              loadProducts(true).finally(() => {
                setIsProcessingUrlSearch(false);
                setIsLoading(false); // Ensure loading state is cleared
              });
            }, 200);
          } else {
            await loadProducts(true);
            setIsProcessingUrlSearch(false);
            setIsLoading(false); // Ensure loading state is cleared
          }
        } catch (error) {
          console.error('Error loading search results:', error);
          setIsProcessingUrlSearch(false);
          setIsLoading(false);
        }
      };
      
      loadSearchResults();
    }
  }, [searchParams, setSearchParams, categories.length]);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, [isCustomerAuthenticated]);

  // Load products when filters change - FIXED TO AVOID RACE CONDITION
  useEffect(() => {
    // Only auto-load products if:
    // 1. We have categories loaded
    // 2. We're NOT processing a URL search (prevents race condition)
    // 3. This isn't the initial load
    // 4. Not currently loading or loading more
    if (categories.length > 0 && !isProcessingUrlSearch && !isLoading && !isLoadingMore) {
      loadProducts(true); // Reset to page 1 when filters change
    }
  }, [filters, isCustomerAuthenticated, categories.length, isProcessingUrlSearch]); // Removed isLoading to prevent infinite loop

  // Load initial data (categories and customer info)
  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      
      // Load categories with product counts
      const categoriesResponse = await api.getCategories({ 
        activeOnly: true, 
        includeProductCount: true 
      });
      if (categoriesResponse.success && categoriesResponse.data) {
        setCategories(categoriesResponse.data as Category[]);
      }
      
      // Load customer info if authenticated as customer (not admin)
      if (isCustomerAuthenticated && user && user.userType === 'customer') {
        try {
          const customerResponse = await authService.getCustomerProfile();
          if (customerResponse.success && customerResponse.customer) {
            // Ensure discount group is properly structured
            const customerData = { ...customerResponse.customer } as any;
            if (customerData.discountGroupId && typeof customerData.discountGroupId === 'object') {
              // Transform discountGroupId object to discountGroup for consistency
              customerData.discountGroup = {
                name: customerData.discountGroupId.name || 'Standard',
                discountPercentage: customerData.discountGroupId.discountPercentage || 0
              };
            } else {
              // Default to Standard if no discount group
              customerData.discountGroup = {
                name: 'Standard',
                discountPercentage: 0
              };
            }
            setCustomerInfo(customerData);
          }
        } catch (error) {
          console.warn('Could not load customer profile:', error);
        }
      }

      // FIXED: Only load initial products if NOT processing URL search and no search filters
      // This prevents overwriting search results from navbar
      if (!isProcessingUrlSearch && !filters.search.trim()) {
        await loadProducts(true);
      }
      
    } catch (error) {
      console.error('Error loading initial data:', error);
      const apiError = handleApiError(error);
      setError(apiError.message);
      toast({
        title: 'Fejl',
        description: 'Kunne ikke indlæse data',
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      // Only set loading to false if we're not processing URL search
      // URL search processing will handle this flag
      if (!isProcessingUrlSearch) {
        setIsLoading(false);
      }
    }
  };

  // Load products based on authentication status
  const loadProducts = async (resetPagination = false) => {
    try {
      if (resetPagination) {
        setCurrentPage(1);
        setIsLoading(true);
      } else {
    setIsLoadingMore(true);
      }
      
      setError(null);
      
      const page = resetPagination ? 1 : currentPage;
      const limit = 20;
      
      // Build filter parameters
      const params: any = {
        page,
        limit,
        aktiv: true, // Only show active products
      };
      
      // Add search filter
      if (filters.search.trim()) {
        params.search = filters.search.trim();
      }
      
      // Add category filter
      if (filters.category !== 'all') {
        params.kategori = filters.category;
      }
      
      // Add sorting
      params.sortBy = filters.sortBy;
      params.sortOrder = filters.sortOrder;
      
      let response;
      
      if (isCustomerAuthenticated && user && user.userType === 'customer') {
        // Customer endpoint with advanced filtering
        if (filters.priceRange.min > 0 || filters.priceRange.max < 10000) {
          params.minPrice = filters.priceRange.min;
          params.maxPrice = filters.priceRange.max;
        }
        
        if (filters.uniqueOffers) {
          params.uniqueOffer = true;
        }
        
        if (filters.fastUdsalgspris) {
          params.fastUdsalgspris = true;
        }
        
        if (filters.rabatGruppe) {
          params.rabatGruppe = true;
        }
        
        // Debug logging for filter parameters
        console.log('🔍 Customer filter parameters:', {
          hasSpecialFilters: filters.uniqueOffers || filters.fastUdsalgspris || filters.rabatGruppe,
          uniqueOffer: params.uniqueOffer,
          fastUdsalgspris: params.fastUdsalgspris,
          rabatGruppe: params.rabatGruppe,
          search: params.search,
          kategori: params.kategori
        });
        
        response = await api.getCustomerProducts(params);
      } else {
        // Public endpoint with limited filtering (used for both non-authenticated users and admins)
        response = await api.getPublicProducts(params);
      }
      
      if (response.success && response.data) {
        const newProducts = response.data.products || [];
        // Handle both formats: direct total/totalPages or pagination object
        const total = response.data.total || response.data.pagination?.total || 0;
        const totalPages = response.data.totalPages || response.data.pagination?.pages || 1;
        
        if (resetPagination) {
          setProducts(newProducts);
          setCurrentPage(1);
        } else {
          setProducts(prev => [...prev, ...newProducts]);
        }
        
        setTotalPages(totalPages);
        setTotalProducts(total);
        setHasMore(page < totalPages);
        
        // Update customer info if provided from backend (for customer endpoints)
        if (response.data.customerInfo && isCustomerAuthenticated) {
          // Only update if customer info has actually changed to prevent unnecessary re-renders
          setCustomerInfo(prev => {
            const newInfo = response.data.customerInfo;
            // Simple comparison - update if it's different from current state
            if (JSON.stringify(prev) !== JSON.stringify(newInfo)) {
              return newInfo;
            }
            return prev;
          });
        }
        
        // Auto-increment page for next load
        if (!resetPagination) {
          setCurrentPage(prev => prev + 1);
        }
      } else {
        throw new Error(response.error || 'Kunne ikke hente produkter');
      }
      
    } catch (error) {
      console.error('Error loading products:', error);
      const apiError = handleApiError(error);
      setError(apiError.message);
      
      toast({
        title: 'Fejl',
        description: apiError.message,
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  // Handle filter changes for customer filters
  const handleCustomerFilterChange = (field: keyof ProductFilters, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  // Handle filter changes for public filters
  const handlePublicFilterChange = (field: keyof ProductFilters, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  // Load more products (pagination)
  const loadMoreProducts = async () => {
    if (!isLoadingMore && hasMore) {
      await loadProducts(false);
    }
  };

  // Get product image URL
  const getProductImageUrl = (product: Product) => {
    const primaryImage = product.billeder?.find(img => img.isPrimary);
    const fallbackImage = product.billeder?.[0];
    return primaryImage?.url || fallbackImage?.url || '';
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      search: '',
      category: 'all',
      priceRange: { min: 0, max: 10000 },
      uniqueOffers: false,
      fastUdsalgspris: false,
      rabatGruppe: false,
      sortBy: 'produktnavn',
      sortOrder: 'asc'
    });
  };

  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.search.trim()) count++;
    if (filters.category !== 'all') count++;
    if (filters.priceRange.min > 0 || filters.priceRange.max < 10000) count++;
    if (filters.uniqueOffers) count++;
    if (filters.fastUdsalgspris) count++;
    if (filters.rabatGruppe) count++;
    return count;
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow bg-gray-50">
        <div className="page-container py-6 md:py-8">
          {/* Header */}
          <div className="text-center mb-8 md:mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              Vores Produkter
            </h1>
              {isAuthenticated && (
                <Badge variant="default" className="bg-brand-primary">
                  B2B Kunde
                </Badge>
              )}
            </div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {isCustomerAuthenticated && user?.userType === 'customer'
                ? "Professionelle priser og tilbud til din virksomhed"
                : "Friske råvarer af højeste kvalitet - Log ind for at se priser"
              }
            </p>
          </div>

          {/* Filters */}
          {isCustomerAuthenticated && user?.userType === 'customer' ? (
            <CustomerProductFilters
              search={filters.search}
              category={filters.category}
              priceRange={filters.priceRange}
              rabatGruppe={filters.rabatGruppe}
              fastUdsalgspris={filters.fastUdsalgspris}
              uniqueOffer={filters.uniqueOffers}
              sortBy={filters.sortBy}
              sortOrder={filters.sortOrder}
              onSearchChange={(value) => handleCustomerFilterChange('search', value)}
              onCategoryChange={(value) => handleCustomerFilterChange('category', value)}
              onPriceRangeChange={(value) => handleCustomerFilterChange('priceRange', value)}
              onRabatGruppeChange={(value) => handleCustomerFilterChange('rabatGruppe', value)}
              onFastUdsalgsprisChange={(value) => handleCustomerFilterChange('fastUdsalgspris', value)}
              onUniqueOfferChange={(value) => handleCustomerFilterChange('uniqueOffers', value)}
              onSortChange={(sortBy, sortOrder) => {
                handleCustomerFilterChange('sortBy', sortBy);
                handleCustomerFilterChange('sortOrder', sortOrder);
              }}
              onClearFilters={clearFilters}
              categories={categories}
              customerInfo={customerInfo}
              isLoading={isLoading}
            />
          ) : (
            <PublicProductFilters
              search={filters.search}
              category={filters.category}
              sortBy={filters.sortBy}
              sortOrder={filters.sortOrder}
              onSearchChange={(value) => handlePublicFilterChange('search', value)}
              onCategoryChange={(value) => handlePublicFilterChange('category', value)}
              onSortChange={(sortBy, sortOrder) => {
                handlePublicFilterChange('sortBy', sortBy);
                handlePublicFilterChange('sortOrder', sortOrder);
              }}
              onClearFilters={clearFilters}
              categories={categories}
              isLoading={isLoading}
            />
          )}

          {/* Results Summary */}
          {!isLoading && (
            <div className="mb-6 flex items-center justify-between">
              <div>
              <p className="text-sm text-gray-600">
                  {products.length > 0 ? (
                    <>
                      Viser {products.length} af {totalProducts} produkter
                      {filters.category !== 'all' && (
                        <span className="ml-1">
                          i {categories.find(cat => cat._id === filters.category)?.navn || filters.category}
                        </span>
                      )}
                      {filters.search && (
                        <span className="ml-1">for "{filters.search}"</span>
                      )}
                    </>
                  ) : (
                    'Ingen produkter fundet'
                  )}
              </p>
              </div>
              
              {getActiveFilterCount() > 0 && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={clearFilters}
                  className="text-xs"
                >
                  Ryd filtre ({getActiveFilterCount()})
                </Button>
              )}
            </div>
          )}

          {/* Error State */}
          {error && (
            <Card className="border-red-200 bg-red-50 mb-6">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertCircle className="h-5 w-5" />
                  <div>
                    <h3 className="font-medium">Der opstod en fejl</h3>
                    <p className="text-sm text-red-600 mt-1">{error}</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => loadProducts(true)}
                  className="mt-3"
                >
                  Prøv igen
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Products Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <div className="aspect-video bg-gray-200 animate-pulse" />
                  <CardContent className="p-4">
                    <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : products.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Ingen produkter fundet
                </h3>
                <p className="text-gray-600 mb-4">
                  {getActiveFilterCount() > 0
                    ? "Prøv at ændre dine søgekriterier eller filtrer" 
                    : "Der er ingen produkter tilgængelige i øjeblikket"
                  }
                </p>
                {getActiveFilterCount() > 0 && (
                  <Button 
                    variant="outline" 
                    onClick={clearFilters}
                  >
                    Ryd alle filtre
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard
                  key={product._id}
                  id={product._id}
                  name={product.produktnavn}
                  image={getProductImageUrl(product)}
                  category={product.kategori?.navn || 'Ukategoriserad'}
                  unit={product.enhed}
                  isLoggedIn={isCustomerAuthenticated && user?.userType === 'customer'}
                  userType={isCustomerAuthenticated && user?.userType === 'customer' ? 'customer' : 'public'}
                  price={!(isCustomerAuthenticated && user?.userType === 'customer') ? undefined : product.basispris}
                  customerPricing={product.customerPricing as any}
                />
              ))}
            </div>
          )}

          {/* Load More Button */}
          {!isLoading && products.length > 0 && hasMore && (
            <div className="text-center mt-8">
              <Button 
                onClick={loadMoreProducts}
                disabled={isLoadingMore}
                className="btn-brand-primary min-w-[200px]"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Indlæser...
                  </>
                ) : (
                  <>
                    Indlæs flere produkter
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </main>
      <Footer />
      
      {/* **FAB BACK-TO-TOP BUTTON - PC & MOBILE** */}
      <FabBackToTop />
    </div>
  );
};

export default Products;
