import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { 
  Star, 
  Search, 
  Package,
  Trash2,
  Plus,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Eye,
  Filter,
  Grid3X3,
  MoveUp,
  MoveDown,
  ExternalLink,
  Settings
} from 'lucide-react';

interface Product {
  _id: string;
  produktnavn: string;
  beskrivelse?: string;
  billeder?: Array<{
    url: string;
    altText?: string;
    isPrimary: boolean;
  }>;
  kategori: {
    _id: string;
    navn: string;
  };
  enhed: {
    _id: string;
    value: string;
    label: string;
    description?: string;
    isActive: boolean;
    sortOrder: number;
  };
  basispris: number;
  varenummer: string;
  eanNummer?: string;
  featuredOrder?: number;
  isFeatured?: boolean;
  aktiv: boolean;
  lagerstyring: {
    enabled: boolean;
    antalPaaLager?: number;
    minimumslager?: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface FeaturedProduct {
  _id: string;
  produktnavn: string;
  billeder?: Array<{
    url: string;
    altText?: string;
    isPrimary: boolean;
  }>;
  kategori: {
    _id: string;
    navn: string;
  };
  basispris: number;
  featuredOrder: number;
}

interface FeaturedProductsSettings {
  title: string;
  subtitle: string;
  enabled: boolean;
  maxFeaturedProducts?: number; // CRITICAL: Max number of featured products allowed
}

const DashboardFeaturedProducts: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [featuredProducts, setFeaturedProducts] = useState<FeaturedProduct[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [showLivePreview, setShowLivePreview] = useState(false);
  
  // Pagination state for available products
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const productsPerPage = 20;
  
  // New state for title/subtitle settings
  const [settings, setSettings] = useState<FeaturedProductsSettings>({
    title: 'Udvalgte Produkter',
    subtitle: 'Opdage vores bedste tilbud og friske produkter',
    enabled: true
  });
  const [settingsChanged, setSettingsChanged] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  // Reset pagination when search or category changes (with debouncing for search)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentPage > 1) {
        setCurrentPage(1);
        setAllProducts([]);
        loadProducts(true);
      } else {
        loadProducts(true);
      }
    }, searchTerm ? 500 : 0); // 500ms debounce for search, immediate for category

    return () => clearTimeout(timeoutId);
  }, [searchTerm, selectedCategory]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load featured products, initial products, and categories
      const [featuredResponse, categoriesResponse] = await Promise.all([
        api.getFeaturedProducts().catch(err => {
          console.error('Featured products API failed:', err);
          return { success: false, error: 'Featured products endpoint failed' };
        }),
        api.getCategories({ 
          activeOnly: true, 
          includeProductCount: true 
        }).catch(err => {
          console.error('Categories API failed:', err);
          return { success: false, error: 'Categories endpoint failed' };
        })
      ]);

      if (featuredResponse.success && 'data' in featuredResponse && featuredResponse.data) {
        const data = featuredResponse.data as any;
        setFeaturedProducts(data.products || []);
        
        // Load settings if available from featured products response
        if (data.settings) {
          setSettings(prev => ({
            ...prev,
            ...data.settings,
            maxFeaturedProducts: data.maxAllowed || 8
          }));
        }
      } else {
        console.error('Featured products failed:', 'error' in featuredResponse ? featuredResponse.error : 'Unknown error');
        toast.error('Kunne ikke indlæse udvalgte produkter');
      }

      if (categoriesResponse.success && 'data' in categoriesResponse && categoriesResponse.data) {
        const categoriesData = categoriesResponse.data as any;
        // Extract unique categories with proper typing
        const uniqueCategories = [...new Set(categoriesData.map((cat: any) => cat.navn).filter(Boolean))] as string[];
        setCategories(uniqueCategories);
      } else {
        console.error('Categories failed:', 'error' in categoriesResponse ? categoriesResponse.error : 'Unknown error');
        toast.error('Kunne ikke indlæse kategorier');
      }

      // Load initial products
      await loadProducts(true);

      // Try to load settings separately - may fail if endpoint not deployed yet
      try {
        const settingsResponse = await api.getFeaturedProductsSettings();
        if (settingsResponse.success && settingsResponse.data) {
          const settingsData = settingsResponse.data as any;
          setSettings(prev => ({
            ...prev,
            ...settingsData.settings
          }));
        }
      } catch (settingsError) {
        console.log('Settings endpoint not available yet - using defaults');
        // Don't show error to user, just use default settings
      }

    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Fejl ved indlæsning af data');
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async (reset = false) => {
    try {
      if (reset) {
        setLoadingMore(false);
      } else {
        setLoadingMore(true);
      }

      const page = reset ? 1 : currentPage + 1;
      
      const params: any = {
        page,
        limit: productsPerPage,
        aktiv: true // Only active products
      };

      // Add search filter
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      // Add category filter
      if (selectedCategory !== 'all') {
        // Find category ID from categories list - need to get full category data
        const categoriesFullResponse = await api.getCategories({ activeOnly: true });
        if (categoriesFullResponse.success && categoriesFullResponse.data) {
          const categoryData = (categoriesFullResponse.data as any[]).find(cat => cat.navn === selectedCategory);
          if (categoryData) {
            params.kategori = categoryData._id;
          }
        }
      }

      console.log('🔍 Loading products with params:', params);

      const response = await api.getProducts(params);

      if (response.success && response.data) {
        const data = response.data as any;
        const newProducts = data.products || [];
        const pagination = data.pagination || {};
        
        console.log(`📦 Loaded ${newProducts.length} products, page ${page}/${pagination.pages || 1}`);

        if (reset) {
          setAllProducts(newProducts);
          setCurrentPage(1);
        } else {
          setAllProducts(prev => [...prev, ...newProducts]);
          setCurrentPage(page);
        }

        setTotalPages(pagination.pages || 1);
        setTotalProducts(pagination.total || 0);
        setHasMore(page < (pagination.pages || 1));
      } else {
        console.error('Products failed:', 'error' in response ? response.error : 'Unknown error');
        if (reset) {
          toast.error('Kunne ikke indlæse produkter');
        }
      }
    } catch (error) {
      console.error('Error loading products:', error);
      if (reset) {
        toast.error('Fejl ved indlæsning af produkter');
      }
    } finally {
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (hasMore && !loadingMore) {
      loadProducts(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      
      const response = await api.updateFeaturedProductsSettings(settings);

      if (response.success) {
        toast.success('Indstillinger gemt');
        setSettingsChanged(false);
      } else {
        toast.error(response.error || 'Fejl ved gemning af indstillinger');
      }
    } catch (error: any) {
      console.error('Error saving settings:', error);
      
      // If settings endpoint is not available yet, just save locally
      if (error.message?.includes('503') || error.message?.includes('not available')) {
        toast.success('Indstillinger gemt lokalt (endpoint ikke tilgængeligt endnu)');
        setSettingsChanged(false);
      } else {
        toast.error('Fejl ved gemning af indstillinger');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleAddProducts = async () => {
    if (selectedProducts.size === 0) {
      toast.error('Vælg venligst produkter at tilføje');
      return;
    }

    // FRONTEND VALIDATION: Only active products can be featured
    const selectedProductIds = Array.from(selectedProducts);
    const selectedProductDetails = allProducts.filter(p => selectedProductIds.includes(p._id));
    const inactiveProducts = selectedProductDetails.filter(p => !p.aktiv);
    
    if (inactiveProducts.length > 0) {
      toast.error(`Kun aktive produkter kan udvælges. Følgende produkter er inaktive: ${inactiveProducts.map(p => p.produktnavn).join(', ')}`);
      return;
    }

    const maxFeatured = settings.maxFeaturedProducts || 8;
    if (featuredProducts.length + selectedProducts.size > maxFeatured) {
      toast.error(`Du kan kun have maksimalt ${maxFeatured} udvalgte produkter. Du har ${featuredProducts.length} og forsøger at tilføje ${selectedProducts.size}.`);
      return;
    }

    try {
      setSaving(true);
      
      console.log('🚀 Adding products to featured list:', selectedProductIds);
      
      const response = await api.addFeaturedProducts(selectedProductIds);

      if (response.success) {
        console.log('✅ Backend confirmed products added successfully');
        
        // OPTIMISTIC UPDATE: Immediately add products to featured list
        // This prevents the weird behavior where products don't show up
        const nextFeaturedOrder = featuredProducts.length > 0 
          ? Math.max(...featuredProducts.map(p => p.featuredOrder || 0)) + 1 
          : 1;
        
        const newFeaturedProducts = selectedProductDetails.map((product, index) => ({
          ...product,
          featured: true,
          featuredOrder: nextFeaturedOrder + index,
          featuredAt: new Date().toISOString(),
          isFeatured: true
        }));
        
        // Update featured products state immediately
        setFeaturedProducts(prev => [...prev, ...newFeaturedProducts]);
        
        // Clear selections
        setSelectedProducts(new Set());
        
        // Show success message
        toast.success(`${selectedProductIds.length} produkter tilføjet til udvalgte produkter`);
        
        // Reload available products to remove the ones we just added
        // Small delay to ensure database consistency
        setTimeout(async () => {
          console.log('🔄 Refreshing available products after adding featured products');
          await loadProducts(true);
        }, 500);
        
      } else {
        console.error('❌ Backend returned error:', response.error);
        toast.error(response.error || 'Fejl ved tilføjelse af produkter');
      }
    } catch (error: any) {
      console.error('❌ Error adding featured products:', error);
      toast.error(error.response?.data?.error || 'Fejl ved tilføjelse af produkter');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveProduct = async (productId: string) => {
    try {
      setSaving(true);
      
      console.log('🗑️ Removing product from featured list:', productId);
      
      const response = await api.removeFeaturedProduct(productId);

      if (response.success) {
        console.log('✅ Backend confirmed product removed successfully');
        
        // OPTIMISTIC UPDATE: Immediately remove product from featured list
        const removedProduct = featuredProducts.find(p => p._id === productId);
        setFeaturedProducts(prev => prev.filter(p => p._id !== productId));
        
        // Show success message
        toast.success(`Produkt "${removedProduct?.produktnavn || 'Unknown'}" fjernet fra udvalgte produkter`);
        
        // Reload available products to add the removed product back
        // Small delay to ensure database consistency
        setTimeout(async () => {
          console.log('🔄 Refreshing available products after removing featured product');
          await loadProducts(true);
        }, 500);
        
      } else {
        console.error('❌ Backend returned error:', response.error);
        toast.error(response.error || 'Fejl ved fjernelse af produkt');
      }
    } catch (error: any) {
      console.error('❌ Error removing featured product:', error);
      toast.error(error.response?.data?.error || 'Fejl ved fjernelse af produkt');
    } finally {
      setSaving(false);
    }
  };

  const handleMoveProduct = async (productId: string, direction: 'up' | 'down') => {
    const currentIndex = featuredProducts.findIndex(p => p._id === productId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= featuredProducts.length) return;

    const newOrder = [...featuredProducts];
    [newOrder[currentIndex], newOrder[newIndex]] = [newOrder[newIndex], newOrder[currentIndex]];

    try {
      setSaving(true);
      
      console.log('🔄 Reordering featured products:', { productId, direction, currentIndex, newIndex });
      
      // Send array of product IDs in the new order (backend expects this format)
      const response = await api.updateFeaturedProducts(
        newOrder.map(product => product._id)
      );

      if (response.success) {
        console.log('✅ Backend confirmed order updated successfully');
        
        // OPTIMISTIC UPDATE: Immediately update the order in state
        setFeaturedProducts(newOrder);
        
        // Show success message
        toast.success('Produktrækkefølge opdateret');
        
      } else {
        console.error('❌ Backend returned error:', response.error);
        toast.error(response.error || 'Fejl ved opdatering af rækkefølge');
      }
    } catch (error: any) {
      console.error('❌ Error reordering products:', error);
      toast.error(error.response?.data?.error || 'Fejl ved opdatering af rækkefølge');
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    // Open the homepage in a new tab to preview the featured products
    window.open('/', '_blank');
  };

  const handleLivePreview = () => {
    // Toggle live preview mode
    setShowLivePreview(!showLivePreview);
  };

  const filteredProducts = allProducts.filter(product => {
    // CRITICAL: Only show active products that can be featured
    if (!product.aktiv) return false;
    
    // Don't show products that are already featured  
    const isAlreadyFeatured = featuredProducts.some(fp => fp._id === product._id);
    if (isAlreadyFeatured) return false;

    // Filter by search term
    const matchesSearch = searchTerm === '' || 
      product.produktnavn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.varenummer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.eanNummer && product.eanNummer.toLowerCase().includes(searchTerm.toLowerCase()));

    // Filter by category
    const matchesCategory = selectedCategory === 'all' || product.kategori?.navn === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const toggleProductSelection = (productId: string) => {
    const newSelection = new Set(selectedProducts);
    if (newSelection.has(productId)) {
      newSelection.delete(productId);
    } else {
      newSelection.add(productId);
    }
    setSelectedProducts(newSelection);
  };

  const renderMobileFilters = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filtrering
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Søg produkter..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div>
          <Label htmlFor="mobile-category">Kategori</Label>
          <select
            id="mobile-category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full p-2 border border-input rounded-md bg-background"
          >
            <option value="all">Alle kategorier</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <RefreshCw className="h-8 w-8 animate-spin text-brand-primary" />
            <p className="text-muted-foreground">Indlæser udvalgte produkter...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className={cn(
        "space-y-6",
        isMobile ? "space-y-4" : "space-y-6"
      )}>
        {/* Mobile-Optimized Header */}
        <div className={cn(
          "flex items-center justify-between",
          isMobile ? "flex-col space-y-3" : "flex-row"
        )}>
          <div className={cn(isMobile ? "w-full text-center" : "")}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-primary/10 rounded-lg">
                <Star className="h-6 w-6 text-brand-primary" />
              </div>
              <div>
                <h2 className={cn(
                  "font-bold tracking-tight",
                  isMobile ? "text-2xl" : "text-3xl"
                )}>
                  Udvalgte Produkter
                </h2>
                <p className={cn(
                  "text-muted-foreground",
                  isMobile ? "text-sm" : "text-base"
                )}>
                  {isMobile ? "Administrer forsidens produkter" : "Administrer de produkter der vises i 'Udvalgte produkter' sektionen på forsiden"}
                </p>
              </div>
            </div>
          </div>
          <div className={cn(
            "flex gap-2",
            isMobile ? "w-full" : ""
          )}>
            <Button 
              onClick={handlePreview}
              variant="outline"
              className={cn(
                "flex items-center gap-2",
                isMobile ? "flex-1 h-12 text-base font-medium" : ""
              )}
              size={isMobile ? "default" : "default"}
            >
              <ExternalLink className="h-4 w-4" />
              {isMobile ? "Åbn Forside" : "Åbn Forside"}
            </Button>
            <Button 
              onClick={handleLivePreview}
              variant={showLivePreview ? "default" : "outline"}
              className={cn(
                "flex items-center gap-2",
                isMobile ? "flex-1 h-12 text-base font-medium" : ""
              )}
              size={isMobile ? "default" : "default"}
            >
              <Eye className="h-4 w-4" />
              {showLivePreview ? 'Skjul Preview' : 'Live Preview'}
            </Button>
          </div>
        </div>

        {/* Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-brand-primary" />
              Sektion Indstillinger
            </CardTitle>
            <CardDescription>
              Tilpas titel og undertekst for den udvalgte produkter sektion på forsiden
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Titel</Label>
                <Input
                  id="title"
                  value={settings.title}
                  onChange={(e) => {
                    setSettings(prev => ({ ...prev, title: e.target.value }));
                    setSettingsChanged(true);
                  }}
                  placeholder="Udvalgte Produkter"
                />
              </div>
              <div>
                <Label htmlFor="subtitle">Undertekst</Label>
                <Input
                  id="subtitle"
                  value={settings.subtitle}
                  onChange={(e) => {
                    setSettings(prev => ({ ...prev, subtitle: e.target.value }));
                    setSettingsChanged(true);
                  }}
                  placeholder="Opdage vores bedste tilbud og friske produkter"
                />
              </div>
            </div>
            
            {settingsChanged && (
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span className="text-sm font-medium text-blue-800">
                  Du har ugemte ændringer
                </span>
                <Button
                  onClick={handleSaveSettings}
                  disabled={saving}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {saving ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Gem
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Live Preview */}
        {showLivePreview && (
          <Card className="border-brand-primary/20 bg-gradient-to-r from-brand-primary/5 to-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-brand-primary" />
                Live Forhåndsvisning - Forsidesektion
              </CardTitle>
              <CardDescription>
                Sådan ser den udvalgte produkter sektion ud på forsiden
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4 relative inline-block">
                    {settings.title}
                    <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 h-1 w-16 bg-brand-primary rounded-full"></div>
                  </h2>
                  <p className="text-gray-600 max-w-2xl mx-auto">
                    {settings.subtitle}
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {featuredProducts.length > 0 ? (
                    featuredProducts.slice(0, 4).map((product) => {
                      const primaryImage = product.billeder?.find(img => img.isPrimary)?.url || 
                                         product.billeder?.[0]?.url || 
                                         '/placeholder.svg';
                      
                      return (
                        <div key={product._id} className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                          <img
                            src={primaryImage}
                            alt={product.produktnavn}
                            className="w-full h-32 object-cover rounded-md mb-3"
                            onError={(e) => {
                              e.currentTarget.src = '/placeholder.svg';
                            }}
                          />
                          <h3 className="font-medium text-gray-900 mb-1 text-sm truncate">
                            {product.produktnavn}
                          </h3>
                          <p className="text-xs text-gray-500 mb-2">{product.kategori?.navn}</p>
                          <div className="text-brand-primary font-semibold text-sm">
                            Fra {product.basispris ? `${product.basispris.toFixed(2)} kr` : 'Se pris'}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="col-span-full text-center py-8 text-gray-500">
                      <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Ingen udvalgte produkter at vise</p>
                    </div>
                  )}
                </div>
                {featuredProducts.length > 4 && (
                  <p className="text-center text-sm text-gray-500 mt-4">
                    ... og {featuredProducts.length - 4} flere produkter
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Du kan have maksimalt {settings.maxFeaturedProducts || 8} udvalgte produkter. Disse vises på forsiden for både offentlige og logget ind brugere.
          </AlertDescription>
        </Alert>

        {/* Mobile Filters */}
        {isMobile && renderMobileFilters()}

        {/* Desktop Filters */}
        {!isMobile && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Søg og filtrér produkter
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Søg efter navn, varenummer eller EAN..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-48 p-2 border border-input rounded-md bg-background"
                  >
                    <option value="all">Alle kategorier</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Current Featured Products */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-brand-success" />
                Nuværende Udvalgte Produkter
                <Badge variant="secondary">{featuredProducts.length}/8</Badge>
              </CardTitle>
              <CardDescription>
                Produkter der i øjeblikket vises på forsiden
              </CardDescription>
            </CardHeader>
            <CardContent>
              {featuredProducts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Ingen udvalgte produkter endnu</p>
                  <p className="text-sm">Vælg produkter fra listen til højre</p>
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3">
                    {featuredProducts.map((product, index) => {
                      const primaryImage = product.billeder?.find(img => img.isPrimary)?.url || 
                                         product.billeder?.[0]?.url || 
                                         '/placeholder.svg';
                      
                      return (
                        <div
                          key={product._id}
                          className="flex items-center gap-3 p-3 border rounded-lg bg-brand-success/10"
                        >
                          <div className="flex items-center justify-center w-8 h-8 bg-brand-success text-white rounded-full text-sm font-medium">
                            {index + 1}
                          </div>
                          
                          <img
                            src={primaryImage}
                            alt={product.produktnavn}
                            className="w-12 h-12 object-cover rounded-md"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/placeholder.svg';
                            }}
                          />
                          
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{product.produktnavn}</p>
                            <p className="text-sm text-muted-foreground">{product.kategori?.navn}</p>
                            <p className="text-sm font-medium text-brand-success">
                              {product.basispris?.toFixed(2)} DKK
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMoveProduct(product._id, 'up')}
                              disabled={saving || index === 0}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <MoveUp className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMoveProduct(product._id, 'down')}
                              disabled={saving || index === featuredProducts.length - 1}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <MoveDown className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveProduct(product._id)}
                              disabled={saving}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Available Products */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-blue-600" />
                Tilgængelige Produkter
                {totalProducts > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {totalProducts} total
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Vælg produkter at tilføje til udvalgte produkter
                {totalProducts > 0 && ` • ${totalProducts} produkter tilgængelige`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedProducts.size > 0 && (
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg mb-4">
                  <span className="text-sm font-medium">
                    {selectedProducts.size} produkter valgt
                  </span>
                  <Button
                    onClick={handleAddProducts}
                    disabled={saving || featuredProducts.length + selectedProducts.size > 8}
                    size="sm"
                  >
                    {saving ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Tilføj valgte
                  </Button>
                </div>
              )}

              <Separator className="mb-4" />

              {/* Products List */}
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {filteredProducts.map((product) => {
                    const primaryImage = product.billeder?.find(img => img.isPrimary)?.url || 
                                       product.billeder?.[0]?.url || 
                                       '/placeholder.svg';
                    
                    return (
                      <div
                        key={product._id}
                        className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                        onClick={() => toggleProductSelection(product._id)}
                      >
                        <Checkbox
                          checked={selectedProducts.has(product._id)}
                          onChange={() => toggleProductSelection(product._id)}
                        />
                        
                        <img
                          src={primaryImage}
                          alt={product.produktnavn}
                          className="w-10 h-10 object-cover rounded-md"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/placeholder.svg';
                          }}
                        />
                        
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{product.produktnavn}</p>
                          <p className="text-sm text-muted-foreground">
                            {product.kategori?.navn} • {product.varenummer}
                          </p>
                          <p className="text-sm font-medium text-blue-600">
                            {product.basispris?.toFixed(2)} DKK
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  
                  {filteredProducts.length === 0 && !loadingMore && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Ingen produkter matchede din søgning</p>
                    </div>
                  )}

                  {/* Loading more indicator */}
                  {loadingMore && (
                    <div className="flex items-center justify-center py-4">
                      <RefreshCw className="h-4 w-4 animate-spin text-brand-primary mr-2" />
                      <span className="text-sm text-muted-foreground">Indlæser flere produkter...</span>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Load More Button */}
              {hasMore && !loadingMore && filteredProducts.length > 0 && (
                <div className="mt-4 text-center">
                  <Button
                    onClick={handleLoadMore}
                    variant="outline"
                    className="w-full"
                    disabled={loadingMore}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Indlæs flere produkter ({totalProducts - filteredProducts.length} tilbage)
                  </Button>
                </div>
              )}

              {/* Products summary */}
              {totalProducts > 0 && (
                <div className="mt-2 text-center text-sm text-muted-foreground">
                  Viser {filteredProducts.length} af {totalProducts} produkter
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardFeaturedProducts; 