import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Users, Palette, Percent, Package, Eye, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { authService } from '@/lib/auth';
import { api, handleApiError } from '@/lib/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface DiscountGroup {
  id: string;
  name: string;
  description?: string;
  discountPercentage: number;
  isActive: boolean;
  sortOrder: number;
  color: string;
  customerCount: number;
  formattedDiscount: string;
  createdBy?: {
    name: string;
    email: string;
  };
  updatedBy?: {
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface Product {
  _id: string;
  produktnavn: string;
  varenummer: string;
  basispris: number;
  førpris?: number; // Legacy sale price field
  aktiv: boolean;
  kategori: {
    _id: string;
    navn: string;
  };
  enhed: {
    _id: string;
    label: string;
  };
  billeder?: Array<{
    url: string;
    isPrimary: boolean;
  }>;
  // General Product Discount System
  discount?: {
    enabled: boolean;
    beforePrice?: number;
    discountPercentage?: number;
    discountAmount?: number;
    showStrikethrough?: boolean;
    discountLabel?: string;
  };
}

const DashboardDiscountGroups: React.FC = () => {
  const [discountGroups, setDiscountGroups] = useState<DiscountGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<DiscountGroup | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Product visibility states - Nielsen's Heuristic #6: Recognition Rather Than Recall
  const [isProductsDialogOpen, setIsProductsDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<DiscountGroup | null>(null);
  const [discountEligibleProducts, setDiscountEligibleProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [totalProducts, setTotalProducts] = useState(0);
  const [productsWithSalePrice, setProductsWithSalePrice] = useState(0);
  
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    discountPercentage: '',
    color: '#6B7280'
  });

  // Enhanced color options with gradient effects
  const colorOptions = [
    { name: 'Standard', value: '#6B7280', gradient: 'from-gray-400 to-gray-600' },
    { name: 'Safir', value: '#3B82F6', gradient: 'from-blue-400 to-blue-600' },
    { name: 'Smaragd', value: '#10B981', gradient: 'from-emerald-400 to-emerald-600' },
    { name: 'Guld', value: '#F59E0B', gradient: 'from-yellow-400 to-yellow-600' },
    { name: 'Rav', value: '#F97316', gradient: 'from-orange-400 to-orange-600' },
    { name: 'Rubin', value: '#EF4444', gradient: 'from-red-400 to-red-600' },
    { name: 'Ametyst', value: '#8B5CF6', gradient: 'from-violet-400 to-violet-600' },
    { name: 'Diamant', value: '#EC4899', gradient: 'from-pink-400 to-pink-600' },
  ];

  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    fetchDiscountGroups();
    loadProductStatistics();
  }, []);

  const fetchDiscountGroups = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await authService.getDiscountGroups();
      
      if (response.success) {
        setDiscountGroups(response.discountGroups as DiscountGroup[] || []);
      } else {
        setError(response.message || 'Kunne ikke hente rabatgrupper');
      }
    } catch (err) {
      setError('Netværksfejl - kontroller din internetforbindelse');
      console.error('Error fetching discount groups:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      discountPercentage: '',
      color: '#6B7280'
    });
  };

  const handleCreate = async () => {
    if (!formData.name.trim() || !formData.discountPercentage) {
      toast({
        title: 'Manglende felter',
        description: 'Navn og rabat procent er påkrævet',
        variant: 'destructive',
      });
      return;
    }

    const percentage = parseFloat(formData.discountPercentage);
    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      toast({
        title: 'Ugyldig rabat',
        description: 'Rabat procent skal være mellem 0 og 100',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      const response = await authService.createDiscountGroup({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        discountPercentage: percentage,
        color: formData.color,
        sortOrder: 0
      });

      if (response.success) {
        toast({
          title: 'Rabatgruppe oprettet',
          description: `${formData.name} er blevet oprettet`,
        });
        
        setIsCreateDialogOpen(false);
        resetForm();
        await fetchDiscountGroups();
      } else {
        toast({
          title: 'Fejl',
          description: response.message || 'Kunne ikke oprette rabatgruppe',
          variant: 'destructive',
        });
      }
    } catch (err) {
      toast({
        title: 'Fejl',
        description: 'Der opstod en fejl ved oprettelse af rabatgruppe',
        variant: 'destructive',
      });
      console.error('Error creating discount group:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!editingGroup || !formData.name.trim() || !formData.discountPercentage) {
      toast({
        title: 'Manglende felter',
        description: 'Navn og rabat procent er påkrævet',
        variant: 'destructive',
      });
      return;
    }

    const percentage = parseFloat(formData.discountPercentage);
    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      toast({
        title: 'Ugyldig rabat',
        description: 'Rabat procent skal være mellem 0 og 100',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      const response = await authService.updateDiscountGroup(editingGroup.id, {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        discountPercentage: percentage,
        color: formData.color,
        sortOrder: 0
      });

      if (response.success) {
        toast({
          title: 'Rabatgruppe opdateret',
          description: `${formData.name} er blevet opdateret`,
        });
        
        setIsEditDialogOpen(false);
        setEditingGroup(null);
        resetForm();
        await fetchDiscountGroups();
      } else {
        toast({
          title: 'Fejl',
          description: response.message || 'Kunne ikke opdatere rabatgruppe',
          variant: 'destructive',
        });
      }
    } catch (err) {
      toast({
        title: 'Fejl',
        description: 'Der opstod en fejl ved opdatering af rabatgruppe',
        variant: 'destructive',
      });
      console.error('Error updating discount group:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (group: DiscountGroup) => {
    try {
      const response = await authService.deleteDiscountGroup(group.id);

      if (response.success) {
        toast({
          title: 'Rabatgruppe slettet',
          description: `${group.name} er blevet slettet`,
        });
        
        await fetchDiscountGroups();
      } else {
        toast({
          title: 'Fejl',
          description: response.message || 'Kunne ikke slette rabatgruppe',
          variant: 'destructive',
        });
      }
    } catch (err) {
      toast({
        title: 'Fejl',
        description: 'Der opstod en fejl ved sletning af rabatgruppe',
        variant: 'destructive',
      });
      console.error('Error deleting discount group:', err);
    }
  };

  const openEditDialog = (group: DiscountGroup) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      description: group.description || '',
      discountPercentage: group.discountPercentage.toString(),
      color: group.color
    });
    setIsEditDialogOpen(true);
  };

  const getColorName = (colorValue: string) => {
    const colorOption = colorOptions.find(option => option.value === colorValue);
    return colorOption ? colorOption.name : 'Brugerdefineret';
  };

  const getColorGradient = (colorValue: string) => {
    const colorOption = colorOptions.find(option => option.value === colorValue);
    return colorOption ? colorOption.gradient : 'from-gray-400 to-gray-600';
  };

  // Nielsen's Heuristic #1: Visibility of System Status
  const loadProductStatistics = async () => {
    try {
      // Get all products to calculate statistics
      const [allProductsResponse, eligibleProductsResponse] = await Promise.all([
        api.getProducts({ limit: 1000, aktiv: true }),
        api.getDiscountEligibleProducts({ limit: 1000, activeOnly: true })
      ]);

      if (allProductsResponse.success && allProductsResponse.data) {
        const allProducts = (allProductsResponse.data as any).products || [];
        setTotalProducts(allProducts.length);
        
        // Count products with sale price (either førpris OR discount.beforePrice)
        const withSalePrice = allProducts.filter((product: any) => {
          // Check both førpris and discount.beforePrice for comprehensive coverage
          const hasForpris = product.førpris && product.førpris > 0;
          const hasBeforePrice = product.discount?.enabled && product.discount?.beforePrice && product.discount.beforePrice > product.basispris;
          return hasForpris || hasBeforePrice;
        }).length;
        setProductsWithSalePrice(withSalePrice);
      }

      if (eligibleProductsResponse.success && eligibleProductsResponse.data) {
        const eligibleProducts = (eligibleProductsResponse.data as any).products || [];
        setDiscountEligibleProducts(eligibleProducts);
      }
    } catch (error) {
      console.error('Error loading product statistics:', error);
    }
  };

  // Nielsen's Heuristic #6: Recognition Rather Than Recall
  const openProductsDialog = (group: DiscountGroup) => {
    setSelectedGroup(group);
    setSelectedCategory('all'); // Reset category filter
    setIsProductsDialogOpen(true);
  };

  const calculateDiscountedPrice = (basePrice: number, discountPercentage: number) => {
    return basePrice * (1 - discountPercentage / 100);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency: 'DKK'
    }).format(price);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Henter rabatgrupper...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="dashboard-page-container">
        <div className="content-width">
          {/* Mobile-friendly header section */}
          <div className="space-y-4 md:space-y-0 md:flex md:items-center md:justify-between">
            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-brand-gray-900">Rabatgrupper</h2>
              <p className="text-sm md:text-base text-brand-gray-600">
                Administrer op til 5 rabatgrupper med forskellige rabatsatser.
              </p>
              {/* Nielsen's Heuristic #1: Visibility of System Status - Mobile optimized */}
              {totalProducts > 0 && (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4 text-xs sm:text-sm">
                  <span className="flex items-center gap-1 text-brand-success">
                    <CheckCircle2 className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{discountEligibleProducts.length} varer påvirkes af rabatgrupper</span>
                  </span>
                  <span className="flex items-center gap-1 text-brand-warning">
                    <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{productsWithSalePrice} varer har fast udsalgspris</span>
                  </span>
                </div>
              )}
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="btn-brand-primary flex items-center gap-2 w-full sm:w-auto"
                  disabled={discountGroups.length >= 5}
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Opret rabatgruppe</span>
                  <span className="sm:hidden">Opret</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Opret ny rabatgruppe</DialogTitle>
                  <DialogDescription>
                    Opret en ny rabatgruppe med tilpasset navn og rabatsats.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Navn *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="f.eks. Premium Kunder"
                      maxLength={50}
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Beskrivelse</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Valgfri beskrivelse af rabatgruppen"
                      maxLength={200}
                    />
                  </div>
                  <div>
                    <Label htmlFor="discountPercentage">Rabat procent * (%)</Label>
                    <Input
                      id="discountPercentage"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={formData.discountPercentage}
                      onChange={(e) => setFormData({...formData, discountPercentage: e.target.value})}
                      placeholder="f.eks. 15.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="color">Farve</Label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3 mt-2">
                      {colorOptions.map((colorOption) => (
                        <button
                          key={colorOption.value}
                          type="button"
                          onClick={() => setFormData({...formData, color: colorOption.value})}
                          className={`
                            relative h-10 sm:h-12 rounded-lg bg-gradient-to-br ${colorOption.gradient} 
                            shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200
                            ${formData.color === colorOption.value ? 'ring-2 ring-offset-2 ring-blue-500' : ''}
                          `}
                          title={colorOption.name}
                        >
                          {formData.color === colorOption.value && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-4 h-4 sm:w-6 sm:h-6 bg-white rounded-full shadow-sm flex items-center justify-center">
                                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded-full"></div>
                              </div>
                            </div>
                          )}
                          <span className="absolute bottom-0.5 left-0.5 right-0.5 text-xs text-white font-medium text-center bg-black bg-opacity-30 rounded px-1 py-0.5">
                            {colorOption.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-0 sm:space-x-2 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCreateDialogOpen(false);
                      resetForm();
                    }}
                    className="w-full sm:w-auto"
                  >
                    Annuller
                  </Button>
                  <Button 
                    onClick={handleCreate} 
                    disabled={isSubmitting}
                    className="w-full sm:w-auto"
                  >
                    {isSubmitting ? 'Opretter...' : 'Opret rabatgruppe'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {error && (
            <Alert variant="destructive" className="mt-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {discountGroups.length >= 5 && (
            <Alert className="mt-6">
              <AlertDescription>
                Du har nået maksimum antal rabatgrupper (5). Slet en eksisterende gruppe for at oprette en ny.
              </AlertDescription>
            </Alert>
          )}

          {/* Mobile-optimized grid layout */}
          <div className="mt-6 grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {discountGroups.map((group) => (
              <Card key={group.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: group.color }}
                      />
                      <CardTitle className="text-base sm:text-lg truncate">{group.name}</CardTitle>
                    </div>
                    <Badge 
                      variant="secondary"
                      className="text-sm sm:text-lg font-bold flex-shrink-0"
                      style={{ backgroundColor: `${group.color}20`, color: group.color }}
                    >
                      {group.formattedDiscount}
                    </Badge>
                  </div>
                  {group.description && (
                    <CardDescription className="text-sm">{group.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                      <Users className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span>{group.customerCount} kunde(r)</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                      <Palette className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="truncate">{getColorName(group.color)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                      <Percent className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span>{group.discountPercentage}% rabat</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                      <Package className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span>{discountEligibleProducts.length} påvirkede varer</span>
                    </div>
                  </div>
                  
                  {/* Mobile-friendly button layout */}
                  <div className="flex flex-col sm:flex-row justify-between gap-2 mt-4 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openProductsDialog(group)}
                      className="text-brand-primary hover:text-brand-primary-hover border-brand-primary/30 hover:border-brand-primary w-full sm:w-auto"
                    >
                      <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      <span className="text-xs sm:text-sm">Se varer</span>
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(group)}
                        className="flex-1 sm:flex-none"
                      >
                        <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        <span className="text-xs sm:text-sm">Rediger</span>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 flex-1 sm:flex-none"
                            disabled={group.customerCount > 0}
                          >
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                            <span className="text-xs sm:text-sm">Slet</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Slet rabatgruppe</AlertDialogTitle>
                            <AlertDialogDescription>
                              Er du sikker på, at du vil slette rabatgruppen "{group.name}"? 
                              Denne handling kan ikke fortrydes.
                              {group.customerCount > 0 && (
                                <span className="block mt-2 text-red-600 font-medium">
                                  Denne gruppe kan ikke slettes, da {group.customerCount} kunde(r) bruger den.
                                </span>
                              )}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuller</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(group)}
                              className="bg-red-600 hover:bg-red-700"
                              disabled={group.customerCount > 0}
                            >
                              Slet rabatgruppe
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {discountGroups.length === 0 && (
            <Card className="card-brand mt-6">
              <CardContent className="text-center py-8">
                <Percent className="h-12 w-12 text-brand-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-brand-gray-900 mb-2">Ingen rabatgrupper endnu</h3>
                <p className="text-brand-gray-600 mb-4">
                  Opret din første rabatgruppe for at begynde at tildele forskellige rabatsatser til dine kunder.
                </p>
                <Button 
                  className="btn-brand-primary w-full sm:w-auto"
                  onClick={() => setIsCreateDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Opret din første rabatgruppe
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Mobile-optimized status alert */}
          {totalProducts > 0 && (
            <Alert className="mt-6 border-brand-primary/30 bg-brand-primary/5">
              <Info className="h-4 w-4 text-brand-primary" />
              <AlertDescription className="text-brand-gray-700">
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <span className="font-medium">Produktoversigt:</span>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-xs sm:text-sm">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-brand-success" />
                        {discountEligibleProducts.length} påvirket af rabatgrupper
                      </span>
                      <span className="flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3 text-brand-warning" />
                        {productsWithSalePrice} med fast udsalgspris
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-brand-gray-500">
                    💡 Rabatgrupper påvirker kun produkter uden fast udsalgspris. Produkter med før-pris eller aktive produktrabatter får ikke yderligere rabatgruppe-rabat.
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      {/* COMPLETELY REDESIGNED Products Modal - Fixed Text Overlapping */}
      <Dialog open={isProductsDialogOpen} onOpenChange={setIsProductsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <div
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: selectedGroup?.color }}
              />
              <span>Varer påvirket af "{selectedGroup?.name}"</span>
            </DialogTitle>
            <DialogDescription className="text-sm">
              Disse varer får {selectedGroup?.discountPercentage}% rabat. Produkter med før-pris påvirkes ikke.
            </DialogDescription>
            
            {/* CATEGORY FILTER */}
            {discountEligibleProducts.length > 0 && (
              <div className="flex items-center gap-2 pt-2">
                <span className="text-sm text-gray-600">Filtrer kategori:</span>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
                >
                  <option value="all">Alle kategorier</option>
                  {[...new Set(discountEligibleProducts.map(p => p.kategori.navn))].sort().map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            )}
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto min-h-0">
            {loadingProducts ? (
              <div className="flex items-center justify-center p-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary mx-auto"></div>
                  <p className="mt-2 text-brand-gray-600">Henter produkter...</p>
                </div>
              </div>
            ) : discountEligibleProducts.length > 0 ? (
              <div className="space-y-6 p-1">
                {/* CLEAR CATEGORY GROUPING */}
                {Object.entries(
                  discountEligibleProducts
                    .filter(product => selectedCategory === 'all' || product.kategori.navn === selectedCategory)
                    .reduce((acc, product) => {
                      const categoryName = product.kategori.navn;
                      if (!acc[categoryName]) {
                        acc[categoryName] = [];
                      }
                      acc[categoryName].push(product);
                      return acc;
                    }, {} as Record<string, typeof discountEligibleProducts>)
                ).sort(([a], [b]) => a.localeCompare(b)).map(([categoryName, products]) => (
                  <div key={categoryName} className="bg-gray-50 rounded-lg p-4">
                    {/* PROMINENT CATEGORY HEADER */}
                    <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-brand-primary/20">
                      <h3 className="text-lg font-bold text-brand-primary">
                        📦 {categoryName}
                      </h3>
                      <span className="bg-brand-primary text-white px-3 py-1 rounded-full text-sm font-medium">
                        {products.length} varer
                      </span>
                    </div>
                    
                    {/* CLEAN PRODUCT GRID - NO TEXT OVERLAPPING */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {products.map((product) => (
                        <div key={product._id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                          <div className="flex gap-3">
                            {/* PRODUCT IMAGE */}
                            {product.billeder && product.billeder.length > 0 && (
                              <img
                                src={product.billeder.find(img => img.isPrimary)?.url || product.billeder[0]?.url}
                                alt={product.produktnavn}
                                className="w-16 h-16 object-cover rounded-lg flex-shrink-0 border border-gray-200"
                              />
                            )}
                            
                            {/* PRODUCT INFO - WELL SPACED */}
                            <div className="flex-1 min-w-0 space-y-2">
                              <h4 className="font-semibold text-gray-900 text-sm leading-tight">
                                {product.produktnavn}
                              </h4>
                              <p className="text-xs text-gray-500 font-mono">
                                {product.varenummer}
                              </p>
                              
                              {/* PRICING INFO - CLEAR LAYOUT */}
                              <div className="space-y-1">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-gray-600">Basispris:</span>
                                  <span className="text-sm font-medium text-gray-900">
                                    {formatPrice(product.basispris)}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center bg-green-50 px-2 py-1 rounded">
                                  <span className="text-xs text-green-700 font-medium">
                                    Med {selectedGroup?.discountPercentage}% rabat:
                                  </span>
                                  <span className="text-sm font-bold text-green-700">
                                    {formatPrice(calculateDiscountedPrice(product.basispris, selectedGroup?.discountPercentage || 0))}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                
                {/* SUMMARY SECTION */}
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-800 font-medium">
                      📊 {selectedCategory === 'all' ? 'Total påvirkede varer' : `Varer i ${selectedCategory}`}:
                    </span>
                    <span className="bg-blue-600 text-white px-3 py-1 rounded-full font-bold">
                      {selectedCategory === 'all' 
                        ? discountEligibleProducts.length 
                        : discountEligibleProducts.filter(p => p.kategori.navn === selectedCategory).length
                      }
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-brand-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-brand-gray-700 mb-2">
                  Ingen påvirkede varer
                </h3>
                <p className="text-brand-gray-500 text-sm">
                  Alle produkter har enten før-pris, aktive produktrabatter eller er ikke aktive.
                </p>
              </div>
            )}
          </div>
          
          <div className="flex-shrink-0 flex justify-end pt-4 border-t bg-white">
            <Button
              variant="outline"
              onClick={() => setIsProductsDialogOpen(false)}
              className="px-6"
            >
              Luk
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog - Mobile Optimized */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Rediger rabatgruppe</DialogTitle>
            <DialogDescription>
              Rediger rabatgruppens indstillinger.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Navn *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="f.eks. Premium Kunder"
                maxLength={50}
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Beskrivelse</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Valgfri beskrivelse af rabatgruppen"
                maxLength={200}
              />
            </div>
            <div>
              <Label htmlFor="edit-discountPercentage">Rabat procent * (%)</Label>
              <Input
                id="edit-discountPercentage"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.discountPercentage}
                onChange={(e) => setFormData({...formData, discountPercentage: e.target.value})}
                placeholder="f.eks. 15.5"
              />
            </div>
            <div>
              <Label htmlFor="edit-color">Farve</Label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3 mt-2">
                {colorOptions.map((colorOption) => (
                  <button
                    key={colorOption.value}
                    type="button"
                    onClick={() => setFormData({...formData, color: colorOption.value})}
                    className={`
                      relative h-10 sm:h-12 rounded-lg bg-gradient-to-br ${colorOption.gradient} 
                      shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200
                      ${formData.color === colorOption.value ? 'ring-2 ring-offset-2 ring-blue-500' : ''}
                    `}
                    title={colorOption.name}
                  >
                    {formData.color === colorOption.value && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-4 h-4 sm:w-6 sm:h-6 bg-white rounded-full shadow-sm flex items-center justify-center">
                          <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded-full"></div>
                        </div>
                      </div>
                    )}
                    <span className="absolute bottom-0.5 left-0.5 right-0.5 text-xs text-white font-medium text-center bg-black bg-opacity-30 rounded px-1 py-0.5">
                      {colorOption.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-0 sm:space-x-2 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setEditingGroup(null);
                resetForm();
              }}
              className="w-full sm:w-auto"
            >
              Annuller
            </Button>
            <Button 
              onClick={handleEdit} 
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? 'Opdaterer...' : 'Gem ændringer'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default DashboardDiscountGroups;