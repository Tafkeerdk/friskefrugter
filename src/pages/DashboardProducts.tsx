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
  X
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

interface Product {
  _id: string;
  produktnavn: string;
  beskrivelse?: string;
  eanNummer: string;
  enhed: string;
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

const DashboardProducts: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  
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
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const itemsPerPage = 20;

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
        setProducts(data.products || data || []);
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
    if (!product.lagerstyring.enabled) {
      return { status: 'not-managed', text: 'Ikke styret', variant: 'outline' as const };
    }
    
    const stock = product.lagerstyring.antalPaaLager || 0;
    const minimum = product.lagerstyring.minimumslager || 0;
    
    if (stock === 0) {
      return { status: 'out-of-stock', text: 'Udsolgt', variant: 'destructive' as const };
    } else if (stock <= minimum) {
      return { status: 'low-stock', text: `Lav (${stock})`, variant: 'secondary' as const };
    } else {
      return { status: 'in-stock', text: `${stock} stk`, variant: 'default' as const };
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = !searchTerm || 
      product.produktnavn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.eanNummer.includes(searchTerm) ||
      (product.beskrivelse && product.beskrivelse.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesSearch;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Produkter</h2>
            <p className="text-muted-foreground">
              Administrer dine produkter, kategorier og lager.
            </p>
          </div>
          <Button 
            onClick={() => navigate('/admin/products/new')}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nyt produkt
          </Button>
        </div>

        {/* Filters */}
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

        {/* Products */}
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'cards' | 'list')}>
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="cards">Kortvisning</TabsTrigger>
              <TabsTrigger value="list">Listevisning</TabsTrigger>
            </TabsList>
            <div className="text-sm text-muted-foreground">
              {totalProducts} produkt(er) fundet
            </div>
          </div>

          <TabsContent value="cards" className="mt-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredProducts.map((product) => {
                  const stockInfo = getStockStatus(product);
                  const primaryImage = product.billeder.find(img => img.isPrimary) || product.billeder[0];
                  
                  return (
                    <Card key={product._id} className="overflow-hidden h-full">
                      <div className="relative aspect-video overflow-hidden bg-muted">
                        {primaryImage ? (
                          <img
                            src={primaryImage.url}
                            alt={primaryImage.altText || product.produktnavn}
                            className="object-cover w-full h-full cursor-pointer hover:scale-105 transition-transform duration-200"
                            onClick={() => openImageGallery(product, 0)}
                          />
                        ) : (
                          <div className="flex items-center justify-center w-full h-full bg-muted">
                            <ImageIcon className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                        <div className="absolute top-2 right-2 flex gap-1">
                          <Button 
                            size="icon" 
                            variant="secondary" 
                            className="h-8 w-8 rounded-full"
                            onClick={() => navigate(`/admin/products/edit/${product._id}`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="destructive" 
                            className="h-8 w-8 rounded-full"
                            onClick={() => openDeleteDialog(product)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="min-w-0 flex-1">
                              <h3 className="font-medium truncate">{product.produktnavn}</h3>
                              <p className="text-sm text-muted-foreground">
                                {product.kategori.navn}
                              </p>
                            </div>
                            <Badge variant={product.aktiv ? 'default' : 'secondary'}>
                              {product.aktiv ? 'Aktiv' : 'Inaktiv'}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="font-medium">{formatPrice(product.basispris)}</p>
                            <Badge variant={stockInfo.variant}>
                              {stockInfo.text}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>EAN: {product.eanNummer}</span>
                            <span>{product.enhed}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {filteredProducts.length === 0 && (
                  <div className="col-span-full text-center py-12">
                    <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">Ingen produkter fundet</h3>
                    <p className="text-muted-foreground">
                      Prøv at justere dine søgekriterier eller tilføj et nyt produkt.
                    </p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="list" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Produktliste</CardTitle>
                <CardDescription>
                  Detaljeret oversigt over alle produkter
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produkt</TableHead>
                        <TableHead>Kategori</TableHead>
                        <TableHead>EAN</TableHead>
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
                                <div className="h-10 w-10 rounded overflow-hidden bg-muted flex-shrink-0">
                                  {primaryImage ? (
                                    <img
                                      src={primaryImage.url}
                                      alt={primaryImage.altText || product.produktnavn}
                                      className="h-full w-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                      onClick={() => openImageGallery(product, 0)}
                                    />
                                  ) : (
                                    <div className="flex items-center justify-center w-full h-full">
                                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium truncate">{product.produktnavn}</p>
                                  <p className="text-sm text-muted-foreground truncate">
                                    {product.beskrivelse}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{product.kategori.navn}</TableCell>
                            <TableCell className="font-mono text-sm">{product.eanNummer}</TableCell>
                            <TableCell>{formatPrice(product.basispris)}</TableCell>
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
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Handlinger</DropdownMenuLabel>
                                  <DropdownMenuItem 
                                    onClick={() => navigate(`/admin/products/edit/${product._id}`)}
                                  >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Rediger
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => openDeleteDialog(product)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Slet
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {filteredProducts.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            Ingen produkter fundet
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Forrige
            </Button>
            <span className="text-sm text-muted-foreground">
              Side {currentPage} af {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Næste
            </Button>
          </div>
        )}

        {/* Image Gallery Dialog */}
        <Dialog open={isImageGalleryOpen} onOpenChange={setIsImageGalleryOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] p-0">
            <div className="relative">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <div>
                  <DialogTitle className="text-lg font-semibold">
                    {galleryProductName}
                  </DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground">
                    Billede {currentImageIndex + 1} af {galleryImages.length}
                  </DialogDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsImageGalleryOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Image Display */}
              <div className="relative bg-black">
                {galleryImages.length > 0 && (
                  <img
                    src={galleryImages[currentImageIndex]?.url}
                    alt={galleryImages[currentImageIndex]?.altText}
                    className="w-full h-auto max-h-[70vh] object-contain"
                  />
                )}
                
                {/* Navigation Arrows */}
                {galleryImages.length > 1 && (
                  <>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                      onClick={prevImage}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                      onClick={nextImage}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>

              {/* Thumbnail Navigation */}
              {galleryImages.length > 1 && (
                <div className="flex gap-2 p-4 overflow-x-auto">
                  {galleryImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden ${
                        index === currentImageIndex
                          ? 'border-blue-500'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <img
                        src={image.url}
                        alt={image.altText}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Product Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Slet produkt</DialogTitle>
              <DialogDescription>
                Er du sikker på, at du vil slette produktet "{selectedProduct?.produktnavn}"?
                Denne handling kan ikke fortrydes.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Annuller
              </Button>
              <Button variant="destructive" onClick={handleDeleteProduct}>
                Slet produkt
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default DashboardProducts;
