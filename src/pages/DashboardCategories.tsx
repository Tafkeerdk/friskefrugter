import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import {
  Plus,
  Edit,
  Trash2,
  Package,
  Eye,
  Search,
  Filter,
  MoreHorizontal,
  ArrowUpDown
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { api, handleApiError } from '@/lib/api';

interface Category {
  _id: string;
  navn: string;
  beskrivelse?: string;
  slug: string;
  aktiv: boolean;
  productCount: number;
  createdAt: string;
  updatedAt: string;
}

interface Product {
  _id: string;
  produktnavn: string;
  basispris: number;
  enhed: {
    _id: string;
    value: string;
    label: string;
    description?: string;
    isActive: boolean;
    sortOrder: number;
  };
  aktiv: boolean;
  lagerstyring: {
    enabled: boolean;
    antalPaaLager?: number;
  };
}

const DashboardCategories: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categoryProducts, setCategoryProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  
  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isProductsDialogOpen, setIsProductsDialogOpen] = useState(false);
  
  // Form states
  const [categoryForm, setCategoryForm] = useState({
    navn: '',
    beskrivelse: '',
    aktiv: true
  });
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  // Load categories on component mount
  useEffect(() => {
    loadCategories();
  }, [showInactive]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await api.getCategories({
        includeProductCount: true,
        activeOnly: !showInactive
      });
      
      if (response.success && response.data) {
        setCategories(response.data as Category[]);
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

  const loadCategoryProducts = async (categoryId: string) => {
    try {
      setLoadingProducts(true);
      const response = await api.getCategoryProducts(categoryId, {
        limit: 50,
        activeOnly: false
      });
      
      if (response.success && response.data) {
        const data = response.data as any;
        setCategoryProducts(data.products || []);
      }
    } catch (error) {
      const apiError = handleApiError(error);
      toast({
        title: 'Fejl',
        description: apiError.message,
        variant: 'destructive',
        duration: 3000,
      });
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleCreateCategory = async () => {
    try {
      const response = await api.createCategory(categoryForm);
      
      if (response.success) {
        toast({
          title: 'Kategori oprettet',
          description: `Kategorien "${categoryForm.navn}" blev oprettet succesfuldt.`,
          duration: 3000,
        });
        
        setIsCreateDialogOpen(false);
        setCategoryForm({ navn: '', beskrivelse: '', aktiv: true });
        loadCategories();
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

  const handleEditCategory = async () => {
    if (!selectedCategory) return;
    
    try {
      const response = await api.updateCategory(selectedCategory._id, categoryForm);
      
      if (response.success) {
        toast({
          title: 'Kategori opdateret',
          description: `Kategorien "${categoryForm.navn}" blev opdateret succesfuldt.`,
          duration: 3000,
        });
        
        setIsEditDialogOpen(false);
        setSelectedCategory(null);
        setCategoryForm({ navn: '', beskrivelse: '', aktiv: true });
        loadCategories();
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

  const handleDeleteCategory = async () => {
    if (!selectedCategory) return;
    
    try {
      const response = await api.deleteCategory(selectedCategory._id);
      
      if (response.success) {
        toast({
          title: 'Kategori slettet',
          description: `Kategorien "${selectedCategory.navn}" blev slettet succesfuldt.`,
          duration: 3000,
        });
        
        setIsDeleteDialogOpen(false);
        setSelectedCategory(null);
        loadCategories();
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

  const openEditDialog = (category: Category) => {
    setSelectedCategory(category);
    setCategoryForm({
      navn: category.navn,
      beskrivelse: category.beskrivelse || '',
      aktiv: category.aktiv
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (category: Category) => {
    setSelectedCategory(category);
    setIsDeleteDialogOpen(true);
  };

  const openProductsDialog = (category: Category) => {
    setSelectedCategory(category);
    setIsProductsDialogOpen(true);
    loadCategoryProducts(category._id);
  };

  // Filter categories based on search term
  const filteredCategories = categories.filter(category =>
    category.navn.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.beskrivelse && category.beskrivelse.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('da-DK');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency: 'DKK'
    }).format(price);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Kategorier</h2>
            <p className="text-muted-foreground">
              Administrer produktkategorier og organiser dit sortiment.
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Ny kategori
          </Button>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtrering og søgning
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Søg i kategorier..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-inactive"
                  checked={showInactive}
                  onCheckedChange={setShowInactive}
                />
                <label htmlFor="show-inactive" className="text-sm font-medium">
                  Vis inaktive kategorier
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Categories Table */}
        <Card>
          <CardHeader>
            <CardTitle>Kategorioversigt</CardTitle>
            <CardDescription>
              {filteredCategories.length} kategori(er) fundet
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
                    <TableHead>Navn</TableHead>
                    <TableHead>Beskrivelse</TableHead>
                    <TableHead>Produkter</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Oprettet</TableHead>
                    <TableHead className="text-right">Handlinger</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCategories.map((category) => (
                    <TableRow key={category._id}>
                      <TableCell className="font-medium">{category.navn}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {category.beskrivelse || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {category.productCount} produkter
                          </Badge>
                          {category.productCount > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openProductsDialog(category)}
                              className="h-6 px-2"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={category.aktiv ? 'default' : 'secondary'}>
                          {category.aktiv ? 'Aktiv' : 'Inaktiv'}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(category.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Handlinger</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => openEditDialog(category)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Rediger
                            </DropdownMenuItem>
                            {category.productCount > 0 && (
                              <DropdownMenuItem onClick={() => openProductsDialog(category)}>
                                <Package className="mr-2 h-4 w-4" />
                                Se produkter ({category.productCount})
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => openDeleteDialog(category)}
                              className="text-red-600"
                              disabled={category.productCount > 0}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Slet
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredCategories.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Ingen kategorier fundet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Create Category Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Opret ny kategori</DialogTitle>
              <DialogDescription>
                Udfyld oplysningerne for den nye kategori.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Navn *</label>
                <Input
                  value={categoryForm.navn}
                  onChange={(e) => setCategoryForm({ ...categoryForm, navn: e.target.value })}
                  placeholder="f.eks. Frugt og grønt"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Beskrivelse</label>
                <Textarea
                  value={categoryForm.beskrivelse}
                  onChange={(e) => setCategoryForm({ ...categoryForm, beskrivelse: e.target.value })}
                  placeholder="Valgfri beskrivelse af kategorien"
                  rows={3}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={categoryForm.aktiv}
                  onCheckedChange={(checked) => setCategoryForm({ ...categoryForm, aktiv: checked })}
                />
                <label className="text-sm font-medium">Aktiv kategori</label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Annuller
              </Button>
              <Button 
                onClick={handleCreateCategory}
                disabled={!categoryForm.navn.trim()}
              >
                Opret kategori
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Category Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rediger kategori</DialogTitle>
              <DialogDescription>
                Opdater oplysningerne for kategorien.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Navn *</label>
                <Input
                  value={categoryForm.navn}
                  onChange={(e) => setCategoryForm({ ...categoryForm, navn: e.target.value })}
                  placeholder="f.eks. Frugt og grønt"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Beskrivelse</label>
                <Textarea
                  value={categoryForm.beskrivelse}
                  onChange={(e) => setCategoryForm({ ...categoryForm, beskrivelse: e.target.value })}
                  placeholder="Valgfri beskrivelse af kategorien"
                  rows={3}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={categoryForm.aktiv}
                  onCheckedChange={(checked) => setCategoryForm({ ...categoryForm, aktiv: checked })}
                />
                <label className="text-sm font-medium">Aktiv kategori</label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Annuller
              </Button>
              <Button 
                onClick={handleEditCategory}
                disabled={!categoryForm.navn.trim()}
              >
                Gem ændringer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Category Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Slet kategori</DialogTitle>
              <DialogDescription>
                Er du sikker på, at du vil slette kategorien "{selectedCategory?.navn}"?
                Denne handling kan ikke fortrydes.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Annuller
              </Button>
              <Button variant="destructive" onClick={handleDeleteCategory}>
                Slet kategori
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Category Products Dialog */}
        <Dialog open={isProductsDialogOpen} onOpenChange={setIsProductsDialogOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>
                Produkter i kategorien "{selectedCategory?.navn}"
              </DialogTitle>
              <DialogDescription>
                Oversigt over produkter i denne kategori.
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-96 overflow-y-auto">
              {loadingProducts ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produktnavn</TableHead>
                      <TableHead>Pris</TableHead>
                      <TableHead>Enhed</TableHead>
                      <TableHead>Lager</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categoryProducts.map((product) => (
                      <TableRow key={product._id}>
                        <TableCell className="font-medium">{product.produktnavn}</TableCell>
                        <TableCell>{formatPrice(product.basispris)}</TableCell>
                        <TableCell>{product.enhed.label}</TableCell>
                        <TableCell>
                          {product.lagerstyring.enabled ? (
                            <Badge variant="outline">
                              {product.lagerstyring.antalPaaLager || 0} stk
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">Ikke styret</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={product.aktiv ? 'default' : 'secondary'}>
                            {product.aktiv ? 'Aktiv' : 'Inaktiv'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {categoryProducts.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                          Ingen produkter fundet i denne kategori
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
            <DialogFooter>
              <Button onClick={() => setIsProductsDialogOpen(false)}>
                Luk
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default DashboardCategories;
