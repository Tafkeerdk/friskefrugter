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
  id: string;
  name: string;
  description?: string;
  image?: string;
  category: string;
  price: number;
  varenummer: string;
  eanNummer?: string;
  featuredOrder?: number;
  isFeatured?: boolean;
  aktiv: boolean; // CRITICAL: Track if product is active
}

interface FeaturedProduct {
  id: string;
  name: string;
  image?: string;
  category: string;
  price: number;
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

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load featured products, all products, and settings in parallel
      const [featuredResponse, productsResponse, settingsResponse] = await Promise.all([
        api.getFeaturedProducts(),
        api.getProducts(),
        api.getFeaturedProductsSettings()
      ]);

      if (featuredResponse.success && featuredResponse.data) {
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
      }

      // Load settings from dedicated settings endpoint
      if (settingsResponse.success && settingsResponse.data) {
        const settingsData = settingsResponse.data as any;
        setSettings(prev => ({
          ...prev,
          ...settingsData.settings
        }));
      }

      if (productsResponse.success && productsResponse.data) {
        const data = productsResponse.data as any;
        const products = data.products || [];
        setAllProducts(products);
        
        // Extract unique categories with proper typing
        const uniqueCategories = [...new Set(products.map((p: Product) => p.category).filter(Boolean))] as string[];
        setCategories(uniqueCategories);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Fejl ved indlæsning af data');
    } finally {
      setLoading(false);
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
      toast.error('Fejl ved gemning af indstillinger');
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
    const selectedProductDetails = allProducts.filter(p => selectedProductIds.includes(p.id));
    const inactiveProducts = selectedProductDetails.filter(p => !p.aktiv);
    
    if (inactiveProducts.length > 0) {
      toast.error(`Kun aktive produkter kan udvælges. Følgende produkter er inaktive: ${inactiveProducts.map(p => p.name).join(', ')}`);
      return;
    }

    const maxFeatured = settings.maxFeaturedProducts || 8;
    if (featuredProducts.length + selectedProducts.size > maxFeatured) {
      toast.error(`Du kan kun have maksimalt ${maxFeatured} udvalgte produkter. Du har ${featuredProducts.length} og forsøger at tilføje ${selectedProducts.size}.`);
      return;
    }

    try {
      setSaving(true);
      
      const response = await api.addFeaturedProducts(Array.from(selectedProducts));

      if (response.success) {
        toast.success('Produkter tilføjet til udvalgte produkter');
        setSelectedProducts(new Set());
        await loadData(); // Reload data
      } else {
        toast.error(response.error || 'Fejl ved tilføjelse af produkter');
      }
    } catch (error: any) {
      console.error('Error adding featured products:', error);
      toast.error(error.response?.data?.error || 'Fejl ved tilføjelse af produkter');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveProduct = async (productId: string) => {
    try {
      setSaving(true);
      
      const response = await api.removeFeaturedProduct(productId);

      if (response.success) {
        toast.success('Produkt fjernet fra udvalgte produkter');
        await loadData(); // Reload data
      } else {
        toast.error(response.error || 'Fejl ved fjernelse af produkt');
      }
    } catch (error: any) {
      console.error('Error removing featured product:', error);
      toast.error(error.response?.data?.error || 'Fejl ved fjernelse af produkt');
    } finally {
      setSaving(false);
    }
  };

  const handleMoveProduct = async (productId: string, direction: 'up' | 'down') => {
    const currentIndex = featuredProducts.findIndex(p => p.id === productId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= featuredProducts.length) return;

    const newOrder = [...featuredProducts];
    [newOrder[currentIndex], newOrder[newIndex]] = [newOrder[newIndex], newOrder[currentIndex]];

    try {
      setSaving(true);
      
      const response = await api.updateFeaturedProducts(
        newOrder.map((product, index) => ({
          productId: product.id,
          featuredOrder: index + 1
        }))
      );

      if (response.success) {
        toast.success('Produktrækkefølge opdateret');
        await loadData(); // Reload data
      } else {
        toast.error(response.error || 'Fejl ved opdatering af rækkefølge');
      }
    } catch (error: any) {
      console.error('Error reordering products:', error);
      toast.error(error.response?.data?.error || 'Fejl ved opdatering af rækkefølge');
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    // Open the homepage in a new tab to preview the featured products
    window.open('/', '_blank');
  };

  const filteredProducts = allProducts.filter(product => {
    // CRITICAL: Only show active products that can be featured
    if (!product.aktiv) return false;
    
    // Don't show products that are already featured
    const isAlreadyFeatured = featuredProducts.some(fp => fp.id === product.id);
    if (isAlreadyFeatured) return false;

    // Filter by search term
    const matchesSearch = searchTerm === '' || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.varenummer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.eanNummer && product.eanNummer.toLowerCase().includes(searchTerm.toLowerCase()));

    // Filter by category
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;

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
              <Eye className="h-4 w-4" />
              {isMobile ? "Forhåndsvisning" : "Forhåndsvis"}
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

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Du kan have maksimalt 8 udvalgte produkter. Disse vises på forsiden for både offentlige og logget ind brugere.
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
                    {featuredProducts.map((product, index) => (
                      <div
                        key={product.id}
                        className="flex items-center gap-3 p-3 border rounded-lg bg-brand-success/10"
                      >
                        <div className="flex items-center justify-center w-8 h-8 bg-brand-success text-white rounded-full text-sm font-medium">
                          {index + 1}
                        </div>
                        
                        {product.image && (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded-md"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/placeholder.svg';
                            }}
                          />
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{product.name}</p>
                          <p className="text-sm text-muted-foreground">{product.category}</p>
                          <p className="text-sm font-medium text-brand-success">
                            {product.price?.toFixed(2)} DKK
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMoveProduct(product.id, 'up')}
                            disabled={saving || index === 0}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <MoveUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMoveProduct(product.id, 'down')}
                            disabled={saving || index === featuredProducts.length - 1}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <MoveDown className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveProduct(product.id)}
                            disabled={saving}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
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
              </CardTitle>
              <CardDescription>
                Vælg produkter at tilføje til udvalgte produkter
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
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                      onClick={() => toggleProductSelection(product.id)}
                    >
                      <Checkbox
                        checked={selectedProducts.has(product.id)}
                        onChange={() => toggleProductSelection(product.id)}
                      />
                      
                      {product.image && (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-10 h-10 object-cover rounded-md"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/placeholder.svg';
                          }}
                        />
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {product.category} • {product.varenummer}
                        </p>
                        <p className="text-sm font-medium text-blue-600">
                          {product.price?.toFixed(2)} DKK
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {filteredProducts.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Ingen produkter matchede din søgning</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardFeaturedProducts; 