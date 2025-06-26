import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { ChevronDown, Package, Search, Filter, Eye, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { authService } from "@/lib/auth";
import { useToast } from "@/components/ui/use-toast";

interface PublicProduct {
  _id: string;
  produktnavn: string;
  varenummer: string;
  beskrivelse?: string;
  kategori?: {
    _id: string;
    navn: string;
    beskrivelse?: string;
  };
  enhed?: {
    _id: string;
    navn: string;
    forkortelse: string;
  };
  billeder: Array<{
    original: string;
    thumbnail: string;
    small: string;
    medium: string;
    large: string;
  }>;
  aktiv: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PublicCategory {
  _id: string;
  navn: string;
  beskrivelse?: string;
}

const Products = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State for products and categories
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filter and pagination state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('produktnavn');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  // Load products and categories
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load products when filters change
  useEffect(() => {
    if (!loading) {
      setCurrentPage(1);
      loadProducts(1);
    }
  }, [searchTerm, selectedCategory, sortBy, sortOrder]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load categories and initial products in parallel
      const [categoriesResponse, productsResponse] = await Promise.all([
        authService.getPublicCategories({ sortBy: 'navn', sortOrder: 'asc' }),
        authService.getPublicProducts({ 
          page: 1, 
          limit: 20, 
          sortBy: 'produktnavn', 
          sortOrder: 'asc' 
        })
      ]);
      
      if (categoriesResponse.success) {
        setCategories(categoriesResponse.categories || []);
      }
      
      if (productsResponse.success) {
        setProducts(productsResponse.products || []);
        setTotalPages(productsResponse.pagination?.totalPages || 1);
        setTotalCount(productsResponse.pagination?.totalCount || 0);
      } else {
        setError(productsResponse.message || 'Kunne ikke hente produkter');
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      setError('Der opstod en fejl ved indlæsning af produkter');
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async (page: number = currentPage) => {
    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);
      
      const response = await authService.getPublicProducts({
        page,
        limit: 20,
        search: searchTerm || undefined,
        category: selectedCategory || undefined,
        sortBy,
        sortOrder
      });
      
      if (response.success) {
        if (page === 1) {
          setProducts(response.products || []);
        } else {
          setProducts(prev => [...prev, ...(response.products || [])]);
        }
        setTotalPages(response.pagination?.totalPages || 1);
        setTotalCount(response.pagination?.totalCount || 0);
        setCurrentPage(page);
      } else {
        setError(response.message || 'Kunne ikke hente produkter');
        toast({
          title: "Fejl",
          description: response.message || 'Kunne ikke hente produkter',
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error loading products:', error);
      setError('Der opstod en fejl ved indlæsning af produkter');
      toast({
        title: "Fejl", 
        description: 'Der opstod en fejl ved indlæsning af produkter',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreProducts = () => {
    if (currentPage < totalPages && !loadingMore) {
      loadProducts(currentPage + 1);
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSortBy('produktnavn');
    setSortOrder('asc');
  };

  const getProductImage = (product: PublicProduct) => {
    if (product.billeder && product.billeder.length > 0) {
      return product.billeder[0].medium || product.billeder[0].small || product.billeder[0].thumbnail;
    }
    return null;
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow bg-gray-50">
        <div className="page-container py-6 md:py-8">
          {/* Header */}
          <div className="text-center mb-8 md:mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Vores Produkter
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Friske råvarer af højeste kvalitet til din virksomhed
            </p>
            {!user && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg max-w-lg mx-auto">
                <div className="flex items-center gap-2 text-blue-800">
                  <Eye className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Log ind for at se priser og bestille produkter
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-brand-gray-400" />
                  <Input
                    placeholder="Søg produkter..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Category Filter */}
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Alle kategorier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Alle kategorier</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category._id} value={category._id}>
                        {category.navn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Sort By */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sorter efter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="produktnavn">Navn</SelectItem>
                    <SelectItem value="varenummer">Varenummer</SelectItem>
                    <SelectItem value="createdAt">Nyeste</SelectItem>
                    <SelectItem value="updatedAt">Senest opdateret</SelectItem>
                  </SelectContent>
                </Select>

                {/* Sort Order */}
                <Select value={sortOrder} onValueChange={setSortOrder}>
                  <SelectTrigger>
                    <SelectValue placeholder="Rækkefølge" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Stigende</SelectItem>
                    <SelectItem value="desc">Faldende</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filter Actions */}
              {(searchTerm || selectedCategory || sortBy !== 'produktnavn' || sortOrder !== 'asc') && (
                <div className="mt-4 flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={resetFilters}>
                    <Filter className="h-3 w-3 mr-1" />
                    Ryd filtre
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Error State */}
          {error && (
            <Card className="border-brand-error bg-brand-error/10 mb-6">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-brand-error">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results count */}
          {!loading && products.length > 0 && (
            <div className="mb-6">
              <p className="text-sm text-brand-gray-600">
                Viser {products.length} af {totalCount} produkter
                {selectedCategory && ` i valgt kategori`}
                {searchTerm && ` for "${searchTerm}"`}
              </p>
            </div>
          )}

          {/* Products Grid */}
          <div className="content-width">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <div className="aspect-square bg-gray-200 animate-pulse" />
                    <CardContent className="p-4">
                      <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3 mb-2" />
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
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
                    {searchTerm || selectedCategory
                      ? "Prøv at ændre dine søgekriterier eller filtrer" 
                      : "Der er ingen produkter tilgængelige i øjeblikket"
                    }
                  </p>
                  {(searchTerm || selectedCategory) && (
                    <Button variant="outline" onClick={resetFilters}>
                      Ryd filtre
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                  <Card key={product._id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <div className="aspect-square relative overflow-hidden bg-gray-100">
                      {getProductImage(product) ? (
                        <img 
                          src={getProductImage(product)!} 
                          alt={product.produktnavn}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <CardHeader className="p-0 mb-2">
                        <CardTitle className="text-lg font-semibold text-brand-gray-900 line-clamp-2">
                          {product.produktnavn}
                        </CardTitle>
                        <CardDescription className="text-sm text-brand-gray-600">
                          Varenr: {product.varenummer}
                        </CardDescription>
                      </CardHeader>
                      
                      {product.beskrivelse && (
                        <p className="text-sm text-brand-gray-600 mb-3 line-clamp-2">
                          {product.beskrivelse}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-1 mb-3">
                        {product.kategori && (
                          <Badge variant="secondary" className="text-xs">
                            {product.kategori.navn}
                          </Badge>
                        )}
                        {product.enhed && (
                          <Badge variant="outline" className="text-xs">
                            {product.enhed.forkortelse}
                          </Badge>
                        )}
                      </div>

                      {/* NO PRICING INFORMATION FOR PUBLIC ACCESS */}
                      
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-brand-gray-500">
                          {product.aktiv ? 'Tilgængelig' : 'Ikke tilgængelig'}
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          disabled={!product.aktiv}
                          className="text-brand-primary border-brand-primary hover:bg-brand-primary hover:text-white"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Se detaljer
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Load More Button */}
          {!loading && products.length > 0 && currentPage < totalPages && (
            <div className="text-center mt-8">
              <Button 
                onClick={loadMoreProducts}
                disabled={loadingMore}
                className="btn-brand-primary"
              >
                {loadingMore ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
    </div>
  );
};

export default Products;
