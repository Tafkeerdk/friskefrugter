import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Package,
  MoreHorizontal,
  ImageIcon,
  ChevronLeft,
  ChevronRight,
  X,
  Grid3X3,
  List,
  SlidersHorizontal,
  ShoppingCart,
  Zap
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { api, handleApiError } from '@/lib/api';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface Product {
  _id: string;
  produktnavn: string;
  varenummer: string;
  beskrivelse?: string;
  eanNummer: string;
  enhed: {
    _id: string;
    value: string;
    label: string;
    description?: string;
    isActive: boolean;
    sortOrder: number;
  };
  basispris: number;
  kategori: {
    _id: string;
    navn: string;
  };
  lagerstyring: {
    enabled: boolean;
    antalPaaLager?: number;
    minimumslager?: number;
  };
  billeder: Array<{
    url: string;
    altText?: string;
    isPrimary: boolean;
  }>;
  aktiv: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Category {
  _id: string;
  navn: string;
  beskrivelse?: string;
  aktiv: boolean;
  productCount: number;
}

// Enhanced Product Image Component with better placeholder
const ProductImage: React.FC<{
  src?: string;
  alt: string;
  className?: string;
  onClick?: () => void;
  size?: 'small' | 'medium' | 'large';
}> = ({ src, alt, className = '', onClick, size = 'medium' }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const sizeClasses = {
    small: 'h-10 w-10',
    medium: 'h-12 w-12',
    large: 'w-full h-full'
  };

  const iconSizes = {
    small: 'h-4 w-4',
    medium: 'h-6 w-6', 
    large: 'h-8 w-8'
  };

  if (!src || imageError) {
    return (
      <div 
        className={cn(
          "flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-dashed border-blue-200 rounded-lg transition-colors hover:from-blue-100 hover:to-indigo-200 placeholder-content",
          sizeClasses[size],
          className
        )}
      >
        <div className="flex flex-col items-center justify-center space-y-1">
          <div className="relative">
            <Package className={cn("text-blue-400", iconSizes[size])} />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-400 rounded-full flex items-center justify-center">
              <Zap className="h-2 w-2 text-white" />
            </div>
          </div>
          {size === 'large' && (
            <div className="text-center">
              <p className="text-xs font-medium text-blue-600">Intet billede</p>
              <p className="text-xs text-blue-500">Klik for at tilføje</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {imageLoading && (
        <div className={cn(
          "absolute inset-0 flex items-center justify-center bg-gray-100 animate-pulse",
          sizeClasses[size]
        )}>
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={cn(
          "object-cover transition-all duration-200",
          sizeClasses[size],
          imageLoading && "opacity-0"
        )}
        onError={handleImageError}
        onLoad={handleImageLoad}
      />
    </div>
  );
};

const DashboardProducts: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const isMobile = useIsMobile();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Image gallery states
  const [isImageGalleryOpen, setIsImageGalleryOpen] = useState(false);
  const [galleryImages, setGalleryImages] = useState<Array<{url: string; altText?: string}>>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [galleryProductName, setGalleryProductName] = useState('');
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('kategori') || 'all');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [viewMode, setViewMode] = useState<'cards' | 'list'>(isMobile ? 'cards' : 'cards');
  
  // Mobile filter state
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const itemsPerPage = isMobile ? 12 : 20; // Fewer items on mobile for better performance

  // Load data on component mount and when filters change
  useEffect(() => {
    loadProducts();
    loadCategories();
  }, [currentPage, selectedCategory, statusFilter, searchTerm]);

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (selectedCategory !== 'all') params.set('kategori', selectedCategory);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    setSearchParams(params);
  }, [searchTerm, selectedCategory, statusFilter, setSearchParams]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit: itemsPerPage,
      };

      if (searchTerm) params.search = searchTerm;
      if (selectedCategory !== 'all') params.kategori = selectedCategory;
      if (statusFilter === 'active') params.aktiv = true;
      if (statusFilter === 'inactive') params.aktiv = false;

      const response = await api.getProducts(params);
      
      if (response.success && response.data) {
        const data = response.data as any;
        const products = data.products || data || [];
        
        console.log('📋 Products loaded from backend:', products.map((product: any) => ({
          id: product._id,
          name: product.produktnavn,
          images: product.billeder?.map((img: any, index: number) => ({
            index,
            _id: img._id,
            filename: img.filename,
            isPrimary: img.isPrimary,
            url: img.url ? img.url.substring(0, 50) + '...' : 'no url'
          })) || []
        })));
        
        setProducts(products);
        setTotalPages(data.totalPages || 1);
        setTotalProducts(data.total || 0);
      }
    } catch (error) {
      const apiError = handleApiError(error);
      toast({
        title: 'Fejl',
        description: apiError.message,
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await api.getCategories({ 
        includeProductCount: true,
        activeOnly: true 
      });
      
      if (response.success && response.data) {
        setCategories(response.data as Category[]);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;
    
    try {
      const response = await api.deleteProduct(selectedProduct._id);
      
      if (response.success) {
        toast({
          title: 'Produkt slettet',
          description: `Produktet "${selectedProduct.produktnavn}" blev slettet succesfuldt.`,
          duration: 3000,
        });
        
        setIsDeleteDialogOpen(false);
        setSelectedProduct(null);
        loadProducts();
      }
    } catch (error) {
      const apiError = handleApiError(error);
      toast({
        title: 'Fejl',
        description: apiError.message,
        variant: 'destructive',
        duration: 5000,
      });
    }
  };

  const openDeleteDialog = (product: Product) => {
    setSelectedProduct(product);
    setIsDeleteDialogOpen(true);
  };

  const openImageGallery = (product: Product, startIndex: number = 0) => {
    const images = product.billeder.map(img => ({
      url: img.url,
      altText: img.altText || `${product.produktnavn} billede`
    }));
    
    setGalleryImages(images);
    setCurrentImageIndex(startIndex);
    setGalleryProductName(product.produktnavn);
    setIsImageGalleryOpen(true);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency: 'DKK'
    }).format(price);
  };

  const getStockStatus = (product: Product) => {
    // Since inventory management is not implemented, all products show "På lager"
    // This is because they are wholesale products and availability is managed externally
    return { status: 'available', text: 'På lager', variant: 'default' as const };
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = !searchTerm || 
      product.produktnavn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.eanNummer.includes(searchTerm) ||
      (product.beskrivelse && product.beskrivelse.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesSearch;
  });

  // Mobile filter section component
  const renderMobileFilters = () => (
    <Collapsible open={isFilterOpen} onOpenChange={setIsFilterOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between h-12 mb-4"
          type="button"
        >
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            <span className="text-sm font-medium">Filtre og søgning</span>
          </div>
          {isFilterOpen ? <X className="h-4 w-4" /> : <Filter className="h-4 w-4" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-4 pb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Søg produkter..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12 text-base"
          />
        </div>
        <div className="grid grid-cols-1 gap-3">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Vælg kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle kategorier</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category._id} value={category._id}>
                  {category.navn} ({category.productCount})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle</SelectItem>
              <SelectItem value="active">Aktive</SelectItem>
              <SelectItem value="inactive">Inaktive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );

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
            <h2 className={cn(
              "font-bold tracking-tight",
              isMobile ? "text-2xl" : "text-3xl"
            )}>
              Produkter
            </h2>
            <p className={cn(
              "text-muted-foreground",
              isMobile ? "text-sm" : "text-base"
            )}>
              {isMobile ? "Administrer produkter og lager" : "Administrer dine produkter, kategorier og lager."}
            </p>
          </div>
          <Button 
            onClick={() => navigate('/admin/products/new')}
            className={cn(
              "flex items-center gap-2",
              isMobile ? "w-full h-12 text-base font-medium" : ""
            )}
            size={isMobile ? "default" : "default"}
          >
            <Plus className="h-4 w-4" />
            {isMobile ? "Tilføj nyt produkt" : "Nyt produkt"}
          </Button>
        </div>

        {/* Mobile Filters */}
        {isMobile && renderMobileFilters()}

        {/* Desktop Filters */}
        {!isMobile && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtrering og søgning
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Søg efter produktnavn, EAN eller beskrivelse..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Vælg kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle kategorier</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category._id} value={category._id}>
                          {category.navn} ({category.productCount})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle</SelectItem>
                      <SelectItem value="active">Aktive</SelectItem>
                      <SelectItem value="inactive">Inaktive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mobile-Optimized View Toggle and Results */}
        <div className={cn(
          "flex items-center justify-between",
          isMobile ? "flex-col space-y-3" : "flex-row"
        )}>
          {/* View Mode Toggle */}
          <div className={cn(
            "flex items-center",
            isMobile ? "w-full" : ""
          )}>
            {!isMobile && (
              <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'cards' | 'list')}>
                <TabsList>
                  <TabsTrigger value="cards" className="flex items-center gap-2">
                    <Grid3X3 className="h-4 w-4" />
                    Kort
                  </TabsTrigger>
                  <TabsTrigger value="list" className="flex items-center gap-2">
                    <List className="h-4 w-4" />
                    Liste
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            )}
            {isMobile && (
              <div className="flex w-full bg-muted rounded-lg p-1">
                <Button
                  variant={viewMode === 'cards' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('cards')}
                  className="flex-1 h-10"
                >
                  <Grid3X3 className="h-4 w-4 mr-2" />
                  Kort
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="flex-1 h-10"
                >
                  <List className="h-4 w-4 mr-2" />
                  Liste
                </Button>
              </div>
            )}
          </div>
          
          {/* Results Count */}
          <div className={cn(
            "text-muted-foreground",
            isMobile ? "text-sm w-full text-center" : "text-sm"
          )}>
            {totalProducts} produkt(er) fundet
          </div>
        </div>

        {/* Products Display */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Cards View */}
            {viewMode === 'cards' && (
              <div className={cn(
                "grid gap-4",
                isMobile 
                  ? "grid-cols-1 sm:grid-cols-2" 
                  : "grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              )}>
                {filteredProducts.map((product) => {
                  const stockInfo = getStockStatus(product);
                  const primaryImage = product.billeder.find(img => img.isPrimary) || product.billeder[0];
                  
                  // Debug logging
                  if (product.produktnavn.includes('Champignon') || product.produktnavn.includes('Artiskokker')) {
                    console.log('Product debug:', {
                      name: product.produktnavn,
                      imagesCount: product.billeder.length,
                      images: product.billeder,
                      primaryImage: primaryImage,
                      hasUrl: primaryImage?.url ? 'YES' : 'NO'
                    });
                  }
                  
                  return (
                    <Card key={product._id} className="overflow-hidden h-full hover:shadow-lg transition-shadow">
                      <div 
                        className={cn(
                          "relative overflow-hidden cursor-pointer product-image-container",
                          isMobile ? "aspect-square" : "aspect-video"
                        )}
                        data-product-id={product._id}
                        onClick={() => {
                          console.log('Card image clicked:', product.produktnavn, 'Images:', product.billeder.length, 'Primary image:', primaryImage);
                          
                          // Check if we have images AND the primary image has a valid URL that can load
                          const hasValidImages = product.billeder.length > 0 && primaryImage?.url;
                          
                          // If no images or primary image failed to load (showing placeholder), go to edit
                          if (!hasValidImages || !primaryImage?.url) {
                            console.log('🔄 Navigating to edit page - no valid images');
                            toast({
                              title: 'Åbner redigeringsside',
                              description: `Åbner redigeringsside for "${product.produktnavn}" hvor du kan uploade billeder`,
                              duration: 2000,
                            });
                            navigate(`/admin/products/edit/${product._id}`);
                          } else {
                            // Check if the image element is actually showing a placeholder
                            const imageContainer = document.querySelector(`[data-product-id="${product._id}"] .product-image-container`);
                            const isShowingPlaceholder = imageContainer?.querySelector('.placeholder-content');
                            
                            if (isShowingPlaceholder) {
                              console.log('🔄 Navigating to edit page - placeholder detected');
                              toast({
                                title: 'Åbner redigeringsside',
                                description: `Åbner redigeringsside for "${product.produktnavn}" hvor du kan uploade billeder`,
                                duration: 2000,
                              });
                              navigate(`/admin/products/edit/${product._id}`);
                            } else {
                              console.log('🖼️ Opening image gallery - valid image detected');
                              openImageGallery(product, 0);
                            }
                          }
                        }}
                      >
                        <ProductImage
                          src={primaryImage?.url}
                          alt={primaryImage?.altText || product.produktnavn}
                          size="large"
                          className={cn(
                            isMobile ? "aspect-square" : "aspect-video"
                          )}
                        />
                        <div className={cn(
                          "absolute flex gap-1",
                          isMobile ? "top-2 right-2" : "top-2 right-2"
                        )}>
                          <Button 
                            size="icon" 
                            variant="secondary" 
                            className={cn(
                              "rounded-full shadow-sm",
                              isMobile ? "h-8 w-8" : "h-8 w-8"
                            )}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/admin/products/edit/${product._id}`);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="destructive" 
                            className={cn(
                              "rounded-full shadow-sm",
                              isMobile ? "h-8 w-8" : "h-8 w-8"
                            )}
                            onClick={(e) => {
                              e.stopPropagation();
                              openDeleteDialog(product);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <CardContent className={cn(isMobile ? "p-3" : "p-4")}>
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="min-w-0 flex-1">
                              <h3 className={cn(
                                "font-medium truncate",
                                isMobile ? "text-sm" : "text-base"
                              )}>
                                {product.produktnavn}
                              </h3>
                              <p className={cn(
                                "text-muted-foreground",
                                isMobile ? "text-xs" : "text-sm"
                              )}>
                                {product.kategori.navn}
                              </p>
                            </div>
                            <Badge variant={product.aktiv ? 'default' : 'secondary'} className={cn(
                              isMobile ? "text-xs" : ""
                            )}>
                              {product.aktiv ? 'Aktiv' : 'Inaktiv'}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className={cn(
                              "font-medium",
                              isMobile ? "text-sm" : "text-base"
                            )}>
                              {formatPrice(product.basispris)}
                            </p>
                            <Badge variant={stockInfo.variant} className={cn(
                              isMobile ? "text-xs" : ""
                            )}>
                              {stockInfo.text}
                            </Badge>
                          </div>
                          <div className={cn(
                            "flex items-center justify-between text-muted-foreground",
                            isMobile ? "text-xs" : "text-sm"
                          )}>
                            <span>EAN: {product.eanNummer}</span>
                            <span>{product.enhed.label}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {filteredProducts.length === 0 && (
                  <div className="col-span-full text-center py-12">
                    <Package className={cn(
                      "mx-auto text-muted-foreground mb-4",
                      isMobile ? "h-8 w-8" : "h-12 w-12"
                    )} />
                    <h3 className={cn(
                      "font-medium",
                      isMobile ? "text-base" : "text-lg"
                    )}>
                      Ingen produkter fundet
                    </h3>
                    <p className={cn(
                      "text-muted-foreground",
                      isMobile ? "text-sm" : "text-base"
                    )}>
                      Prøv at justere dine søgekriterier eller tilføj et nyt produkt.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* List View - Optimized for mobile */}
            {viewMode === 'list' && (
              <Card>
                <CardHeader className={cn(isMobile ? "p-4" : "")}>
                  <CardTitle className={cn(isMobile ? "text-lg" : "")}>
                    Produktliste
                  </CardTitle>
                  <CardDescription className={cn(isMobile ? "text-sm" : "")}>
                    {isMobile ? "Detaljeret produktoversigt" : "Detaljeret oversigt over alle produkter"}
                  </CardDescription>
                </CardHeader>
                <CardContent className={cn(isMobile ? "p-4 pt-0" : "")}>
                  {isMobile ? (
                    // Mobile list view - card-based
                    <div className="space-y-3">
                      {filteredProducts.map((product) => {
                        const stockInfo = getStockStatus(product);
                        const primaryImage = product.billeder.find(img => img.isPrimary) || product.billeder[0];
                        
                        return (
                          <div key={product._id} className="border rounded-lg p-3 bg-white">
                            <div className="flex items-start gap-3">
                              <div 
                                className="flex-shrink-0 cursor-pointer product-image-container"
                                data-product-id={product._id}
                                onClick={() => {
                                  console.log('Mobile list image clicked:', product.produktnavn, 'Images:', product.billeder.length);
                                  
                                  // Check if we have images AND the primary image has a valid URL that can load
                                  const hasValidImages = product.billeder.length > 0 && primaryImage?.url;
                                  
                                  // If no images or primary image failed to load (showing placeholder), go to edit
                                  if (!hasValidImages || !primaryImage?.url) {
                                    console.log('🔄 Mobile: Navigating to edit page - no valid images');
                                    toast({
                                      title: 'Åbner redigeringsside',
                                      description: `Åbner redigeringsside for "${product.produktnavn}" hvor du kan uploade billeder`,
                                      duration: 2000,
                                    });
                                    navigate(`/admin/products/edit/${product._id}`);
                                  } else {
                                    // Check if the image element is actually showing a placeholder
                                    const imageContainer = document.querySelector(`[data-product-id="${product._id}"] .product-image-container`);
                                    const isShowingPlaceholder = imageContainer?.querySelector('.placeholder-content');
                                    
                                    if (isShowingPlaceholder) {
                                      console.log('🔄 Mobile: Navigating to edit page - placeholder detected');
                                      toast({
                                        title: 'Åbner redigeringsside',
                                        description: `Åbner redigeringsside for "${product.produktnavn}" hvor du kan uploade billeder`,
                                        duration: 2000,
                                      });
                                      navigate(`/admin/products/edit/${product._id}`);
                                    } else {
                                      console.log('🖼️ Mobile: Opening image gallery - valid image detected');
                                      openImageGallery(product, 0);
                                    }
                                  }
                                }}
                              >
                                <ProductImage
                                  src={primaryImage?.url}
                                  alt={primaryImage?.altText || product.produktnavn}
                                  size="medium"
                                  className="rounded"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between mb-1">
                                  <h3 className="font-medium text-sm truncate">{product.produktnavn}</h3>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => navigate(`/admin/products/edit/${product._id}`)}>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Rediger
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => openDeleteDialog(product)} className="text-red-600">
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Slet
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                                <p className="text-xs text-muted-foreground mb-2">{product.kategori.navn}</p>
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-medium">{formatPrice(product.basispris)}</span>
                                  <div className="flex items-center gap-2">
                                    <Badge variant={stockInfo.variant} className="text-xs">
                                      {stockInfo.text}
                                    </Badge>
                                    <Badge variant={product.aktiv ? 'default' : 'secondary'} className="text-xs">
                                      {product.aktiv ? 'Aktiv' : 'Inaktiv'}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                                  <div className="flex flex-col gap-0.5">
                                    {product.varenummer && (
                                      <span className="font-mono">Vare: {product.varenummer}</span>
                                    )}
                                    {product.eanNummer && (
                                      <span className="font-mono">EAN: {product.eanNummer}</span>
                                    )}
                                  </div>
                                  <span>{product.enhed.label}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    // Desktop table view
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Produkt</TableHead>
                            <TableHead>Kategori</TableHead>
                            <TableHead>Varenr/EAN</TableHead>
                            <TableHead>Pris</TableHead>
                            <TableHead>Lager</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Handlinger</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredProducts.map((product) => {
                            const stockInfo = getStockStatus(product);
                            const primaryImage = product.billeder.find(img => img.isPrimary) || product.billeder[0];
                            
                            return (
                              <TableRow key={product._id}>
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <div 
                                      className="cursor-pointer product-image-container"
                                      data-product-id={product._id}
                                      onClick={() => {
                                        console.log('Desktop table image clicked:', product.produktnavn, 'Images:', product.billeder.length);
                                        
                                        // Check if we have images AND the primary image has a valid URL that can load
                                        const hasValidImages = product.billeder.length > 0 && primaryImage?.url;
                                        
                                        // If no images or primary image failed to load (showing placeholder), go to edit
                                        if (!hasValidImages || !primaryImage?.url) {
                                          console.log('🔄 Desktop: Navigating to edit page - no valid images');
                                          toast({
                                            title: 'Åbner redigeringsside',
                                            description: `Åbner redigeringsside for "${product.produktnavn}" hvor du kan uploade billeder`,
                                            duration: 2000,
                                          });
                                          navigate(`/admin/products/edit/${product._id}`);
                                        } else {
                                          // Check if the image element is actually showing a placeholder
                                          const imageContainer = document.querySelector(`[data-product-id="${product._id}"] .product-image-container`);
                                          const isShowingPlaceholder = imageContainer?.querySelector('.placeholder-content');
                                          
                                          if (isShowingPlaceholder) {
                                            console.log('🔄 Desktop: Navigating to edit page - placeholder detected');
                                            toast({
                                              title: 'Åbner redigeringsside',
                                              description: `Åbner redigeringsside for "${product.produktnavn}" hvor du kan uploade billeder`,
                                              duration: 2000,
                                            });
                                            navigate(`/admin/products/edit/${product._id}`);
                                          } else {
                                            console.log('🖼️ Desktop: Opening image gallery - valid image detected');
                                            openImageGallery(product, 0);
                                          }
                                        }
                                      }}
                                    >
                                      <ProductImage
                                        src={primaryImage?.url}
                                        alt={primaryImage?.altText || product.produktnavn}
                                        size="small"
                                        className="rounded flex-shrink-0"
                                      />
                                    </div>
                                    <div className="min-w-0">
                                      <div className="font-medium truncate">{product.produktnavn}</div>
                                      <div className="text-sm text-muted-foreground truncate">
                                        {product.beskrivelse}
                                      </div>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>{product.kategori.navn}</TableCell>
                                <TableCell className="font-mono text-sm">
                                  <div className="flex flex-col gap-1">
                                    {product.varenummer && (
                                      <span className="text-brand-primary font-semibold">
                                        {product.varenummer}
                                      </span>
                                    )}
                                    {product.eanNummer && (
                                      <span className="text-muted-foreground text-xs">
                                        {product.eanNummer}
                                      </span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="font-medium">{formatPrice(product.basispris)}</TableCell>
                                <TableCell>
                                  <Badge variant={stockInfo.variant}>
                                    {stockInfo.text}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant={product.aktiv ? 'default' : 'secondary'}>
                                    {product.aktiv ? 'Aktiv' : 'Inaktiv'}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => navigate(`/admin/products/edit/${product._id}`)}>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Rediger
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => openDeleteDialog(product)} className="text-red-600">
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Slet
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Mobile-Optimized Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2">
            <Button
              variant="outline"
              size={isMobile ? "sm" : "default"}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              {!isMobile && "Forrige"}
            </Button>
            <span className={cn(
              "px-3 py-2 text-sm",
              isMobile ? "text-xs" : ""
            )}>
              Side {currentPage} af {totalPages}
            </span>
            <Button
              variant="outline"
              size={isMobile ? "sm" : "default"}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              {!isMobile && "Næste"}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className={cn(isMobile ? "max-w-[95vw] rounded-lg" : "")}>
          <DialogHeader>
            <DialogTitle className={cn(isMobile ? "text-lg" : "")}>
              Bekræft sletning
            </DialogTitle>
            <DialogDescription className={cn(isMobile ? "text-sm" : "")}>
              Er du sikker på, at du vil slette produktet "{selectedProduct?.produktnavn}"? 
              Denne handling kan ikke fortrydes.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className={cn(isMobile ? "flex-col space-y-2" : "")}>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
              className={cn(isMobile ? "w-full" : "")}
            >
              Annuller
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteProduct}
              className={cn(isMobile ? "w-full" : "")}
            >
              Slet produkt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Gallery Dialog */}
      <Dialog open={isImageGalleryOpen} onOpenChange={setIsImageGalleryOpen}>
        <DialogContent className={cn(
          "max-w-4xl",
          isMobile ? "max-w-[95vw] max-h-[90vh] p-2" : ""
        )}>
          <DialogHeader className={cn(isMobile ? "p-2" : "")}>
            <DialogTitle className={cn(isMobile ? "text-lg" : "")}>
              {galleryProductName} - Billeder
            </DialogTitle>
          </DialogHeader>
          <div className="relative">
            {galleryImages.length > 0 && (
              <>
                <img
                  src={galleryImages[currentImageIndex].url}
                  alt={galleryImages[currentImageIndex].altText}
                  className={cn(
                    "w-full object-contain rounded-lg",
                    isMobile ? "max-h-[60vh]" : "max-h-[70vh]"
                  )}
                />
                {galleryImages.length > 1 && (
                  <>
                    <Button
                      variant="secondary"
                      size="icon"
                      className={cn(
                        "absolute left-2 top-1/2 transform -translate-y-1/2",
                        isMobile ? "h-8 w-8" : ""
                      )}
                      onClick={prevImage}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className={cn(
                        "absolute right-2 top-1/2 transform -translate-y-1/2",
                        isMobile ? "h-8 w-8" : ""
                      )}
                      onClick={nextImage}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <div className={cn(
                      "absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-2 py-1 rounded text-sm",
                      isMobile ? "text-xs px-2 py-1" : ""
                    )}>
                      {currentImageIndex + 1} / {galleryImages.length}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default DashboardProducts;
