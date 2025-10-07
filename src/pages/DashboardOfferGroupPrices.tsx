import React, { useState, useEffect } from 'react';
import { Save, Package, Search, AlertCircle, CheckCircle2, Tag, TrendingDown, Filter, X, Edit2 } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { tokenManager } from '@/lib/auth';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface OfferGroup {
  _id: string;
  name: string;
  description?: string;
  discountPercentage: number;
  isActive: boolean;
  color: string;
  customerCount: number;
}

interface Product {
  id: string;
  produktnavn: string;
  varenummer: string;
  basispris: number;
  kategori: {
    navn: string;
  };
  enhed: {
    navn: string;
    kortform: string;
  };
  billeder: Array<{
    url: string;
    isPrimary: boolean;
  }>;
  groupPrices: Record<string, number | null>;
}

const DashboardOfferGroupPrices: React.FC = () => {
  const [offerGroups, setOfferGroups] = useState<OfferGroup[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Map<string, Record<string, number>>>(new Map());
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  
  const { toast } = useToast();

  useEffect(() => {
    loadPricingData();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [searchTerm, selectedCategory, products]);

  const loadPricingData = async () => {
    try {
      setIsLoading(true);
      
      const token = tokenManager.getAccessToken('admin');
      
      if (!token) {
        toast({
          variant: 'destructive',
          title: 'Fejl',
          description: 'Ikke godkendt. Log venligst ind igen.'
        });
        return;
      }

      const url = `${import.meta.env.VITE_API_BASE_URL || 'https://famous-dragon-b033ac.netlify.app'}/.netlify/functions/admin-offer-group-prices?view=by-product`;

      const apiResponse = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Session-Type': 'browser',
          'X-PWA': 'false',
          'X-Display-Mode': 'browser'
        }
      });

      if (!apiResponse.ok) {
        throw new Error(`HTTP error! status: ${apiResponse.status}`);
      }

      const response = await apiResponse.json();

      if (response.success) {
        setOfferGroups(response.offerGroups || []);
        setProducts(response.products || []);
        
        // Extract unique categories
        const uniqueCategories = [
          ...new Set(response.products.map((p: Product) => p.kategori.navn))
        ].sort();
        setCategories(uniqueCategories);
      } else {
        toast({
          variant: 'destructive',
          title: 'Fejl',
          description: response.error || 'Kunne ikke indlæse prisdata'
        });
      }
    } catch (error) {
      console.error('❌ Error loading pricing data:', error);
      toast({
        variant: 'destructive',
        title: 'Fejl',
        description: 'Der opstod en fejl ved indlæsning af data'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = products;

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        p =>
          p.produktnavn.toLowerCase().includes(term) ||
          p.varenummer.toLowerCase().includes(term)
      );
    }

    // Filter by category
    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.kategori.navn === selectedCategory);
    }

    setFilteredProducts(filtered);
  };

  const handlePriceChange = (productId: string, offerGroupId: string, newPrice: string, basispris: number) => {
    // If empty string, remove the pending change
    if (newPrice === '') {
      setPendingChanges(prev => {
        const updated = new Map(prev);
        const productChanges = updated.get(productId) || {};
        delete productChanges[offerGroupId];
        
        // If no more changes for this product, remove the product from pending changes
        if (Object.keys(productChanges).length === 0) {
          updated.delete(productId);
        } else {
          updated.set(productId, productChanges);
        }
        
        setHasChanges(updated.size > 0);
        return updated;
      });
      return;
    }

    const price = parseFloat(newPrice);
    
    if (isNaN(price) || price < 0) {
      return;
    }

    setPendingChanges(prev => {
      const updated = new Map(prev);
      const productChanges = updated.get(productId) || {};
      productChanges[offerGroupId] = price;
      updated.set(productId, productChanges);
      setHasChanges(true);
      return updated;
    });
  };

  const handleSaveChanges = async () => {
    if (pendingChanges.size === 0) {
      toast({
        title: 'Ingen ændringer',
        description: 'Der er ingen ændringer at gemme'
      });
      return;
    }

    try {
      setIsSaving(true);

      const token = tokenManager.getAccessToken('admin');
      if (!token) {
        toast({
          variant: 'destructive',
          title: 'Fejl',
          description: 'Ikke godkendt. Log venligst ind igen.'
        });
        return;
      }

      // Convert pending changes to API format
      const prices: Array<{
        product: string;
        offerGroup: string;
        price: number;
      }> = [];

      pendingChanges.forEach((groupPrices, productId) => {
        Object.entries(groupPrices).forEach(([offerGroupId, price]) => {
          prices.push({
            product: productId,
            offerGroup: offerGroupId,
            price
          });
        });
      });

      console.log('💾 Saving prices - COUNT:', prices.length);
      console.log('💾 Saving prices - DETAILED:', JSON.stringify(prices, null, 2));

      const apiResponse = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'https://famous-dragon-b033ac.netlify.app'}/.netlify/functions/admin-offer-group-prices`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'X-Session-Type': 'browser',
            'X-PWA': 'false',
            'X-Display-Mode': 'browser'
          },
          body: JSON.stringify({
            action: 'bulk-upsert',
            prices
          })
        }
      );

      console.log('📡 Response status:', apiResponse.status);
      console.log('📡 Response ok:', apiResponse.ok);

      if (!apiResponse.ok) {
        const errorText = await apiResponse.text();
        console.error('❌ API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${apiResponse.status}`);
      }

      const response = await apiResponse.json();
      console.log('✅ API Response:', JSON.stringify(response, null, 2));

      if (response.success) {
        console.log('✅ Save successful! Results:', response.results);
        
        toast({
          title: '✅ Priser gemt',
          description: response.message || `${prices.length} priser er blevet opdateret`,
          duration: 3000
        });

        setPendingChanges(new Map());
        setHasChanges(false);
        await loadPricingData();
      } else {
        console.error('❌ Save failed:', response.error);
        
        toast({
          variant: 'destructive',
          title: 'Fejl',
          description: response.error || 'Kunne ikke gemme priserne'
        });
      }
    } catch (error) {
      console.error('Error saving prices:', error);
      toast({
        variant: 'destructive',
        title: 'Fejl',
        description: 'Der opstod en fejl ved gem af priser'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getDisplayPrice = (product: Product, offerGroupId: string): string => {
    // Check pending changes first
    const productChanges = pendingChanges.get(product.id);
    if (productChanges && productChanges[offerGroupId] !== undefined) {
      return productChanges[offerGroupId].toFixed(2);
    }

    // Check saved prices
    const savedPrice = product.groupPrices[offerGroupId];
    if (savedPrice !== null && savedPrice !== undefined) {
      return savedPrice.toFixed(2);
    }

    // Return basispris as default
    return product.basispris.toFixed(2);
  };

  const isPriceChanged = (product: Product, offerGroupId: string): boolean => {
    const productChanges = pendingChanges.get(product.id);
    return productChanges !== undefined && productChanges[offerGroupId] !== undefined;
  };

  const hasCustomPrice = (product: Product, offerGroupId: string): boolean => {
    const savedPrice = product.groupPrices[offerGroupId];
    return savedPrice !== null && savedPrice !== undefined && savedPrice !== product.basispris;
  };

  const hasProductChanges = (productId: string): boolean => {
    return pendingChanges.has(productId);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
  };

  const handleImageError = (productId: string) => {
    setImageErrors(prev => new Set([...prev, productId]));
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="dashboard-page-container">
          <div className="content-width">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto"></div>
                <p className="text-brand-gray-600">Indlæser prisdata...</p>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="dashboard-page-container">
        <div className="content-width">
          {/* Header */}
          <div className="space-y-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-2">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-brand-gray-900">
                  Tilbudgrupper Priser
                </h2>
                <p className="text-sm md:text-base text-brand-gray-600">
                  Administrer priser direkte for hver tilbudgruppe per produkt
                </p>
              </div>
              
              {hasChanges && (
                <Button
                  onClick={handleSaveChanges}
                  disabled={isSaving}
                  className="btn-brand-primary min-h-[44px] w-full sm:w-auto touch-manipulation"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Gemmer...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Gem ændringer ({pendingChanges.size})
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Info Alert */}
          <Alert className="mb-6 border-brand-primary bg-brand-primary/5">
            <AlertCircle className="h-4 w-4 text-brand-primary" />
            <AlertDescription className="text-brand-gray-700 text-sm">
              <strong>Sådan virker det:</strong> Priser vises som grå tekst (basispris). Klik for at ændre.
              Ændrede priser markeres med grøn farve. Tomme felter bruger automatisk basisprisen.
            </AlertDescription>
          </Alert>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="search">Søg produkter</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-brand-gray-400" />
                    <Input
                      id="search"
                      placeholder="Søg efter navn eller varenummer..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 min-h-[44px]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Kategori</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="min-h-[44px]">
                      <SelectValue placeholder="Vælg kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle kategorier</SelectItem>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="w-full min-h-[44px] touch-manipulation"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Ryd filtre
                  </Button>
                </div>
              </div>

              <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
                <span className="text-brand-gray-600">
                  Viser {filteredProducts.length} af {products.length} produkter
                </span>
                {hasChanges && (
                  <Badge variant="outline" className="border-brand-success text-brand-success bg-brand-success/10 w-fit">
                    <Edit2 className="h-3 w-3 mr-1" />
                    {pendingChanges.size} produkt(er) med ugemte ændringer
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Desktop Table View - Hidden on Mobile */}
          <Card className="hidden lg:block mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-brand-primary" />
                Prisstyring
              </CardTitle>
              <CardDescription>
                Opdater priser direkte i tabellen. Ændringer gemmes når du klikker "Gem ændringer"
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredProducts.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-brand-gray-400 mx-auto mb-4" />
                  <p className="text-brand-gray-600">Ingen produkter fundet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-brand-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-brand-gray-900 min-w-[200px]">
                          Produkt
                        </th>
                        <th className="text-right py-3 px-4 font-semibold text-brand-gray-900 min-w-[100px]">
                          Basispris
                        </th>
                        {offerGroups.map(group => (
                          <th key={group._id} className="text-center py-3 px-4 font-semibold min-w-[120px]">
                            <div className="flex flex-col items-center gap-1">
                              <span 
                                className="px-2 py-1 rounded text-sm text-white"
                                style={{ backgroundColor: group.color }}
                              >
                                {group.name}
                              </span>
                              <span className="text-xs text-brand-gray-500 font-normal">
                                {group.customerCount} kunder
                              </span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map(product => (
                        <tr 
                          key={product.id}
                          className={cn(
                            "border-b border-brand-gray-100 hover:bg-brand-gray-50 transition-colors",
                            hasProductChanges(product.id) && "bg-brand-success/5"
                          )}
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              {!imageErrors.has(product.id) && product.billeder && product.billeder.length > 0 ? (
                                <img
                                  src={product.billeder.find(b => b.isPrimary)?.url || product.billeder[0]?.url}
                                  alt={product.produktnavn}
                                  className="h-10 w-10 rounded object-cover"
                                  onError={() => handleImageError(product.id)}
                                />
                              ) : (
                                <div className="h-10 w-10 rounded bg-gradient-to-br from-brand-gray-100 to-brand-gray-200 flex items-center justify-center">
                                  <Package className="h-5 w-5 text-brand-gray-400" />
                                </div>
                              )}
                              <div>
                                <div className="font-medium text-brand-gray-900">{product.produktnavn}</div>
                                <div className="text-sm text-brand-gray-500">{product.varenummer}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-brand-gray-900">
                            {product.basispris.toFixed(2)} kr
                          </td>
                          {offerGroups.map(group => {
                            const isChanged = isPriceChanged(product, group._id);
                            return (
                              <td key={group._id} className="py-3 px-4">
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={getDisplayPrice(product, group._id)}
                                  onChange={(e) => handlePriceChange(product.id, group._id, e.target.value, product.basispris)}
                                  onFocus={(e) => e.target.select()}
                                  className={cn(
                                    "text-center input-brand",
                                    isChanged 
                                      ? "border-brand-success bg-brand-success/5 text-brand-success font-semibold focus:ring-brand-success" 
                                      : "text-brand-gray-500 focus:text-brand-gray-900"
                                  )}
                                />
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Mobile Card View - Hidden on Desktop */}
          <div className="lg:hidden space-y-4 mb-6">
            {filteredProducts.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <Package className="h-12 w-12 text-brand-gray-400 mx-auto mb-4" />
                    <p className="text-brand-gray-600">Ingen produkter fundet</p>
                    {searchTerm && (
                      <Button
                        variant="outline"
                        onClick={clearFilters}
                        className="mt-4"
                      >
                        Ryd filtre
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Tilbudgruppe Legend - Mobile Only */}
                <Card className="bg-brand-gray-50 border-brand-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Tag className="h-4 w-4 text-brand-primary" />
                      <span className="font-semibold text-brand-gray-900 text-sm">Tilbudgrupper:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {offerGroups.map(group => (
                        <div
                          key={group._id}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-white text-sm font-medium"
                          style={{ backgroundColor: group.color }}
                        >
                          <span>{group.name}</span>
                          <Badge variant="secondary" className="bg-white/20 text-white border-0 text-xs">
                            {group.customerCount}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Product Cards */}
                {filteredProducts.map(product => (
                  <Card 
                    key={product.id}
                    className={cn(
                      "transition-all duration-200",
                      hasProductChanges(product.id) && "ring-2 ring-brand-success shadow-lg"
                    )}
                  >
                    <CardContent className="p-4">
                      {/* Product Header */}
                      <div className="flex gap-3 mb-4 pb-4 border-b border-brand-gray-200">
                        {/* Product Image */}
                        <div className="w-16 h-16 flex-shrink-0 rounded-lg border-2 border-brand-gray-200 overflow-hidden bg-gradient-to-br from-brand-gray-50 to-brand-gray-100">
                          {!imageErrors.has(product.id) && product.billeder && product.billeder.length > 0 ? (
                            <img
                              src={product.billeder.find(b => b.isPrimary)?.url || product.billeder[0]?.url}
                              alt={product.produktnavn}
                              className="w-full h-full object-cover"
                              onError={() => handleImageError(product.id)}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-8 w-8 text-brand-gray-400" />
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-brand-gray-900 text-base mb-1 break-words">
                            {product.produktnavn}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-brand-gray-500">
                            <span className="font-mono bg-brand-gray-100 px-2 py-0.5 rounded">
                              {product.varenummer}
                            </span>
                            <span className="text-brand-gray-400">•</span>
                            <span>{product.kategori.navn}</span>
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-sm text-brand-gray-600">Basispris:</span>
                            <span className="font-bold text-brand-primary-dark text-lg">
                              {product.basispris.toFixed(2)} kr
                            </span>
                            <span className="text-xs text-brand-gray-500">
                              / {product.enhed.kortform}
                            </span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        {hasProductChanges(product.id) && (
                          <div className="flex-shrink-0">
                            <Badge className="bg-brand-success text-white border-0">
                              <Edit2 className="h-3 w-3 mr-1" />
                              Ændret
                            </Badge>
                          </div>
                        )}
                      </div>

                      {/* Pricing Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {offerGroups.map(group => {
                          const isChanged = isPriceChanged(product, group._id);
                          const hasCustom = hasCustomPrice(product, group._id);
                          const displayPrice = getDisplayPrice(product, group._id);

                          return (
                            <div
                              key={group._id}
                              className={cn(
                                "relative rounded-lg border-2 p-3 transition-all duration-200",
                                isChanged 
                                  ? "border-brand-success bg-brand-success/5 shadow-md" 
                                  : hasCustom
                                  ? "border-brand-primary/30 bg-brand-primary/5"
                                  : "border-brand-gray-200 hover:border-brand-gray-300"
                              )}
                            >
                              {/* Group Header */}
                              <div className="flex items-center justify-between mb-2">
                                <span
                                  className="text-sm font-semibold px-2 py-0.5 rounded text-white"
                                  style={{ backgroundColor: group.color }}
                                >
                                  {group.name}
                                </span>
                                {isChanged && (
                                  <CheckCircle2 className="h-4 w-4 text-brand-success" />
                                )}
                              </div>

                              {/* Price Input */}
                              <div className="relative">
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={displayPrice}
                                  onChange={(e) => handlePriceChange(product.id, group._id, e.target.value, product.basispris)}
                                  className={cn(
                                    "text-center font-semibold text-base min-h-[44px] touch-manipulation",
                                    isChanged 
                                      ? "border-brand-success bg-white text-brand-success focus:ring-brand-success" 
                                      : hasCustom
                                      ? "border-brand-primary text-brand-primary-dark focus:ring-brand-primary"
                                      : "text-brand-gray-500 focus:text-brand-gray-900 border-brand-gray-300"
                                  )}
                                  onFocus={(e) => e.target.select()}
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-brand-gray-400 pointer-events-none">
                                  kr
                                </span>
                              </div>

                              {/* Helper Text */}
                              <div className="mt-1.5 text-xs text-center">
                                {isChanged ? (
                                  <span className="text-brand-success font-medium">
                                    ✓ Ny pris (ikke gemt)
                                  </span>
                                ) : hasCustom ? (
                                  <span className="text-brand-primary">
                                    💰 Tilpasset pris
                                  </span>
                                ) : (
                                  <span className="text-brand-gray-500">
                                    Bruger basispris
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
          </div>

          {/* Floating Save Button - Mobile Only */}
          {hasChanges && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 lg:hidden">
              <Button
                onClick={handleSaveChanges}
                disabled={isSaving}
                className="btn-brand-primary shadow-2xl px-8 py-6 text-lg font-semibold"
                size="lg"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Gemmer...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5 mr-2" />
                    Gem {pendingChanges.size} ændring{pendingChanges.size !== 1 ? 'er' : ''}
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Help Section */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base md:text-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-brand-primary" />
                Hjælp til prisstyring
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-brand-gray-600">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-brand-gray-50">
                  <CheckCircle2 className="h-5 w-5 text-brand-success mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-brand-gray-900 mb-1">Direkte priser</p>
                    <p>Sæt specifikke priser for hver tilbudgruppe. Priser vises som grå tekst indtil du ændrer dem.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-brand-gray-50">
                  <Edit2 className="h-5 w-5 text-brand-success mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-brand-gray-900 mb-1">Visuel feedback</p>
                    <p>Ændrede priser markeres med grøn farve, så du altid kan se hvad der er modificeret.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-brand-gray-50">
                  <TrendingDown className="h-5 w-5 text-brand-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-brand-gray-900 mb-1">Automatisk beregning</p>
                    <p>Hvis du ikke sætter en pris, bruges produktets basispris automatisk.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-brand-gray-50">
                  <Save className="h-5 w-5 text-brand-gray-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-brand-gray-900 mb-1">Gem ændringer</p>
                    <p>Husk at klikke "Gem ændringer" når du er færdig. Knappen viser antal af ændrede produkter.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardOfferGroupPrices;
