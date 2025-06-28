import React, { useState, useEffect } from 'react';
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
import { 
  Star, 
  Search, 
  Package,
  Trash2,
  Plus,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle
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
}

interface FeaturedProduct {
  id: string;
  name: string;
  image?: string;
  category: string;
  price: number;
  featuredOrder: number;
}

const DashboardFeaturedProducts: React.FC = () => {
  const { user } = useAuth();
  const [featuredProducts, setFeaturedProducts] = useState<FeaturedProduct[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load featured products and all products in parallel
      const [featuredResponse, productsResponse] = await Promise.all([
        api.getFeaturedProducts(),
        api.getProducts()
      ]);

      if (featuredResponse.success && featuredResponse.data) {
        const data = featuredResponse.data as any;
        setFeaturedProducts(data.products || []);
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

  const handleAddProducts = async () => {
    if (selectedProducts.size === 0) {
      toast.error('Vælg venligst produkter at tilføje');
      return;
    }

    if (featuredProducts.length + selectedProducts.size > 8) {
      toast.error(`Du kan kun have maksimalt 8 udvalgte produkter. Du har ${featuredProducts.length} og forsøger at tilføje ${selectedProducts.size}.`);
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

  const handleReorderProducts = async (newOrder: FeaturedProduct[]) => {
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

  const filteredProducts = allProducts.filter(product => {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Indlæser udvalgte produkter...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Star className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Udvalgte Produkter</h1>
            <p className="text-muted-foreground">
              Administrer de produkter der vises i "Udvalgte produkter" sektionen på forsiden
            </p>
          </div>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Du kan have maksimalt 8 udvalgte produkter. Disse vises på forsiden for både offentlige og logget ind brugere.
          </AlertDescription>
        </Alert>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Featured Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
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
                      className="flex items-center gap-3 p-3 border rounded-lg bg-green-50"
                    >
                      <div className="flex items-center justify-center w-8 h-8 bg-green-600 text-white rounded-full text-sm font-medium">
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
                        <p className="text-sm font-medium text-green-600">
                          {product.price?.toFixed(2)} DKK
                        </p>
                      </div>
                      
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
            {/* Search and Filters */}
            <div className="space-y-4 mb-4">
              <div>
                <Label htmlFor="search">Søg produkter</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Søg efter navn, varenummer eller EAN..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="category">Kategori</Label>
                <select
                  id="category"
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

              {selectedProducts.size > 0 && (
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
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
            </div>

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
  );
};

export default DashboardFeaturedProducts; 