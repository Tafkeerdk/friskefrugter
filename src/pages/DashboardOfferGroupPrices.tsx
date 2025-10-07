import React, { useState, useEffect } from 'react';
import { Save, Package, Search, AlertCircle, CheckCircle2, Tag, TrendingDown, Filter, X } from 'lucide-react';
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
import { authService } from '@/lib/auth';
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
      const response = await authService.makeAuthenticatedRequest(
        '/api/auth/admin/offer-group-prices?view=by-product',
        { method: 'GET' }
      );

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
          description: 'Kunne ikke indlæse prisdata'
        });
      }
    } catch (error) {
      console.error('Error loading pricing data:', error);
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

  const handlePriceChange = (productId: string, offerGroupId: string, newPrice: string) => {
    const price = parseFloat(newPrice);
    
    if (isNaN(price) || price < 0) {
      return;
    }

    setPendingChanges(prev => {
      const updated = new Map(prev);
      const productChanges = updated.get(productId) || {};
      productChanges[offerGroupId] = price;
      updated.set(productId, productChanges);
      return updated;
    });

    setHasChanges(true);
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

      const response = await authService.makeAuthenticatedRequest(
        '/api/auth/admin/offer-group-prices',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'bulk-upsert',
            prices
          })
        }
      );

      if (response.success) {
        toast({
          title: 'Priser gemt',
          description: response.message || 'Priserne er blevet opdateret',
          duration: 3000
        });

        setPendingChanges(new Map());
        setHasChanges(false);
        await loadPricingData();
      } else {
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
      return productChanges[offerGroupId].toString();
    }

    // Check saved prices
    const savedPrice = product.groupPrices[offerGroupId];
    if (savedPrice !== null && savedPrice !== undefined) {
      return savedPrice.toString();
    }

    return '';
  };

  const hasProductChanges = (productId: string): boolean => {
    return pendingChanges.has(productId);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
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
          <div className="space-y-4 md:space-y-0 md:flex md:items-center md:justify-between mb-6">
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
                className="btn-brand-primary"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Gemmer...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Gem ændringer
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Info Alert */}
          <Alert className="mb-6 border-brand-primary bg-brand-primary/5">
            <AlertCircle className="h-4 w-4 text-brand-primary" />
            <AlertDescription className="text-brand-gray-700">
              <strong>Nyt prissystem:</strong> Sæt specifikke priser direkte for hver tilbudgruppe.
              Tomme felter bruger basisprisen. Unikke tilbud vil stadig have højeste prioritet.
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
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Kategori</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
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
                    className="w-full"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Ryd filtre
                  </Button>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-brand-gray-600">
                  Viser {filteredProducts.length} af {products.length} produkter
                </span>
                {hasChanges && (
                  <Badge variant="outline" className="border-brand-warning text-brand-warning">
                    {pendingChanges.size} produkt(er) med ugemte ændringer
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pricing Table */}
          <Card>
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
                            hasProductChanges(product.id) && "bg-brand-warning/5"
                          )}
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              {product.billeder && product.billeder.length > 0 ? (
                                <img
                                  src={product.billeder.find(b => b.isPrimary)?.url || product.billeder[0].url}
                                  alt={product.produktnavn}
                                  className="h-10 w-10 rounded object-cover"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded bg-brand-gray-100 flex items-center justify-center">
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
                          {offerGroups.map(group => (
                            <td key={group._id} className="py-3 px-4">
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder={product.basispris.toFixed(2)}
                                value={getDisplayPrice(product, group._id)}
                                onChange={(e) => handlePriceChange(product.id, group._id, e.target.value)}
                                className={cn(
                                  "text-center input-brand",
                                  pendingChanges.get(product.id)?.[group._id] !== undefined && 
                                  "border-brand-warning bg-brand-warning/5"
                                )}
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Help Section */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Hjælp til prisstyring</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-brand-gray-600">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-brand-success mt-0.5 flex-shrink-0" />
                  <p><strong>Direkte priser:</strong> Sæt specifikke priser for hver tilbudgruppe uden at regne procenter</p>
                </div>
                <div className="flex items-start gap-2">
                  <TrendingDown className="h-4 w-4 text-brand-primary mt-0.5 flex-shrink-0" />
                  <p><strong>Automatisk beregning:</strong> Tomme felter bruger automatisk produktets basispris</p>
                </div>
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-brand-warning mt-0.5 flex-shrink-0" />
                  <p><strong>Prishierarki:</strong> Unikke tilbud har stadig højeste prioritet og vil overskrive tilbudgruppe priser</p>
                </div>
                <div className="flex items-start gap-2">
                  <Save className="h-4 w-4 text-brand-gray-500 mt-0.5 flex-shrink-0" />
                  <p><strong>Gem ændringer:</strong> Husk at klikke "Gem ændringer" når du er færdig med at redigere</p>
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

