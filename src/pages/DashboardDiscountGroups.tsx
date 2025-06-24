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
  førpris?: number; // Sale price - if set, discount groups don't apply
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
        
        // Count products with sale price (førpris)
        const withSalePrice = allProducts.filter((product: Product) => 
          product.førpris && product.førpris > 0
        ).length;
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
                  className="btn-brand-primary flex items-center gap-2 w-full sm:w-auto min-h-[44px]"
                  disabled={discountGroups.length >= 5}
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Opret rabatgruppe</span>
                  <span className="sm:hidden">Opret</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] mx-4">
                <DialogHeader>
                  <DialogTitle>Opret ny rabatgruppe</DialogTitle>
                  <DialogDescription>
                    Opret en ny rabatgruppe med tilpasset rabatsats og farve.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Navn</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="f.eks. Premium, Guldkunde..."
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Beskrivelse (valgfri)</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Kort beskrivelse af rabatgruppen..."
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="discountPercentage">Rabatprocent</Label>
                                         <Input
                       id="discountPercentage"
                       type="number"
                       min="0"
                       max="50"
                       value={formData.discountPercentage}
                       onChange={(e) => setFormData({...formData, discountPercentage: e.target.value})}
                       placeholder="f.eks. 15"
                       className="mt-1"
                     />
                  </div>
                  <div>
                    <Label htmlFor="color">Farve</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                      {colorOptions.map((colorOption) => (
                        <button
                          key={colorOption.value}
                          type="button"
                          onClick={() => setFormData({...formData, color: colorOption.value})}
                          className={`
                            relative h-16 sm:h-12 rounded-lg bg-gradient-to-br ${colorOption.gradient} 
                            shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200
                            ${formData.color === colorOption.value ? 'ring-2 ring-offset-2 ring-blue-500' : ''}
                            touch-manipulation
                          `}
                        >
                          {formData.color === colorOption.value && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-6 h-6 bg-white rounded-full shadow-sm flex items-center justify-center">
                                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                              </div>
                            </div>
                          )}
                          <span className="absolute bottom-1 left-1 right-1 text-xs text-white font-medium text-center bg-black bg-opacity-30 rounded px-1 py-0.5">
                            {colorOption.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-2 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCreateDialogOpen(false);
                      resetForm();
                    }}
                    className="w-full sm:w-auto min-h-[44px]"
                  >
                    Annuller
                  </Button>
                  <Button 
                    onClick={handleCreate} 
                    disabled={isSubmitting}
                    className="w-full sm:w-auto min-h-[44px]"
                  >
                    {isSubmitting ? 'Opretter...' : 'Opret rabatgruppe'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {discountGroups.length === 0 ? (
            <Card className="text-center py-12 mt-6">
              <CardContent>
                <div className="mx-auto w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Percent className="h-8 w-8 text-brand-primary" />
                </div>
                <h3 className="text-xl font-semibold text-brand-gray-900 mb-2">
                  Ingen rabatgrupper endnu
                </h3>
                <p className="text-brand-gray-600 mb-6">
                  Opret din første rabatgruppe for at give forskellige kunder forskellige rabatsatser.
                </p>
                <Button 
                  className="btn-brand-primary min-h-[44px]"
                  onClick={() => setIsCreateDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Opret første rabatgruppe
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Mobile-optimized grid layout with better spacing */}
              <div className="mt-6 grid gap-6 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                {discountGroups.map((group) => (
                  <Card key={group.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded-full flex-shrink-0"
                            style={{ backgroundColor: group.color }}
                          />
                          <CardTitle className="text-lg truncate">{group.name}</CardTitle>
                        </div>
                        <Badge 
                          variant="secondary"
                          className="text-lg font-bold px-3 py-1"
                          style={{ backgroundColor: `${group.color}20`, color: group.color }}
                        >
                          {group.discountPercentage}%
                        </Badge>
                      </div>
                      {group.description && (
                        <CardDescription className="mt-2">{group.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="h-4 w-4 flex-shrink-0" />
                          <span>{group.customerCount} kunde(r)</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Palette className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{getColorName(group.color)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Percent className="h-4 w-4 flex-shrink-0" />
                          <span>{group.discountPercentage}% rabat</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Package className="h-4 w-4 flex-shrink-0" />
                          <span>{discountEligibleProducts.length} påvirkede varer</span>
                        </div>
                      </div>
                      
                      {/* Mobile-friendly button layout with proper spacing */}
                      <div className="pt-4 border-t space-y-3">
                        {/* Primary action button - full width on mobile */}
                        <Button
                          variant="outline"
                          onClick={() => openProductsDialog(group)}
                          className="w-full text-brand-primary hover:text-brand-primary-hover border-brand-primary/30 hover:border-brand-primary min-h-[44px] touch-manipulation"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Se varer ({discountEligibleProducts.length})
                        </Button>
                        
                        {/* Secondary actions - grid layout for better spacing */}
                        <div className="grid grid-cols-2 gap-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(group)}
                            className="min-h-[44px] touch-manipulation"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            <span className="hidden sm:inline">Rediger</span>
                            <span className="sm:hidden">Ret</span>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 min-h-[44px] touch-manipulation"
                                disabled={group.customerCount > 0}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                <span className="hidden sm:inline">Slet</span>
                                <span className="sm:hidden">Slet</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="mx-4">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Er du sikker?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Denne handling kan ikke fortrydes. Rabatgruppen "{group.name}" vil blive slettet permanent.
                                  {group.customerCount > 0 && (
                                    <span className="block mt-2 text-red-600 font-medium">
                                      Du kan ikke slette en rabatgruppe med kunder.
                                    </span>
                                  )}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="flex-col sm:flex-row gap-3 sm:gap-2">
                                <AlertDialogCancel className="w-full sm:w-auto min-h-[44px]">
                                  Annuller
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(group)}
                                  className="w-full sm:w-auto min-h-[44px] bg-red-600 hover:bg-red-700"
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
            </>
          )}

          {discountGroups.length === 0 && (
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center mb-4">
                <Percent className="h-8 w-8 text-brand-primary" />
              </div>
              <h3 className="text-xl font-semibold text-brand-gray-900 mb-2">
                Ingen rabatgrupper endnu
              </h3>
              <p className="text-brand-gray-600 mb-6">
                Opret din første rabatgruppe for at give forskellige kunder forskellige rabatsatser.
              </p>
              <Button 
                className="btn-brand-primary min-h-[44px]"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Opret første rabatgruppe
              </Button>
            </div>
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
                    💡 Rabatgrupper påvirker kun produkter uden fast udsalgspris (førpris). Når et produkt har en udsalgspris, slås rabatgruppen fra.
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      {/* Products Dialog - Nielsen's Heuristic #6: Recognition Rather Than Recall */}
      <Dialog open={isProductsDialogOpen} onOpenChange={setIsProductsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: selectedGroup?.color }}
              />
              Varer påvirket af "{selectedGroup?.name}"
            </DialogTitle>
            <DialogDescription>
              Disse varer får {selectedGroup?.discountPercentage}% rabat for kunder i denne rabatgruppe.
              Varer med fast udsalgspris (førpris) påvirkes ikke af rabatgrupper.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto">
            {loadingProducts ? (
              <div className="flex items-center justify-center p-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary mx-auto"></div>
                  <p className="mt-2 text-brand-gray-600">Henter produkter...</p>
                </div>
              </div>
            ) : discountEligibleProducts.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                  {discountEligibleProducts.map((product) => (
                    <Card key={product._id} className="p-4">
                      <div className="flex items-start gap-3">
                        {product.billeder && product.billeder.length > 0 && (
                          <img
                            src={product.billeder.find(img => img.isPrimary)?.url || product.billeder[0]?.url}
                            alt={product.produktnavn}
                            className="w-12 h-12 object-cover rounded-md"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-brand-gray-900 truncate">
                            {product.produktnavn}
                          </h4>
                          <p className="text-sm text-brand-gray-500">
                            {product.varenummer} • {product.kategori.navn}
                          </p>
                          <div className="mt-2 space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-brand-gray-600">Basispris:</span>
                              <span className="font-medium">{formatPrice(product.basispris)}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-brand-primary">Med {selectedGroup?.discountPercentage}% rabat:</span>
                              <span className="font-bold text-brand-primary">
                                {formatPrice(calculateDiscountedPrice(product.basispris, selectedGroup?.discountPercentage || 0))}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
                
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between text-sm text-brand-gray-600">
                    <span>Total påvirkede varer:</span>
                    <span className="font-medium">{discountEligibleProducts.length}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-brand-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-brand-gray-700 mb-2">
                  Ingen påvirkede varer
                </h3>
                <p className="text-brand-gray-500">
                  Alle produkter har enten fast udsalgspris eller er ikke aktive.
                </p>
              </div>
            )}
          </div>
          
          <div className="flex justify-end pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setIsProductsDialogOpen(false)}
            >
              Luk
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog - Mobile Optimized */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px] mx-4">
          <DialogHeader>
            <DialogTitle>Rediger rabatgruppe</DialogTitle>
            <DialogDescription>
              Rediger rabatgruppens indstillinger.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Navn</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="f.eks. Premium, Guldkunde..."
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Beskrivelse (valgfri)</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Kort beskrivelse af rabatgruppen..."
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-discountPercentage">Rabatprocent</Label>
              <Input
                id="edit-discountPercentage"
                type="number"
                min="0"
                max="50"
                value={formData.discountPercentage}
                onChange={(e) => setFormData({...formData, discountPercentage: e.target.value})}
                placeholder="f.eks. 15"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-color">Farve</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                {colorOptions.map((colorOption) => (
                  <button
                    key={colorOption.value}
                    type="button"
                    onClick={() => setFormData({...formData, color: colorOption.value})}
                    className={`
                      relative h-16 sm:h-12 rounded-lg bg-gradient-to-br ${colorOption.gradient} 
                      shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200
                      ${formData.color === colorOption.value ? 'ring-2 ring-offset-2 ring-blue-500' : ''}
                      touch-manipulation
                    `}
                  >
                    {formData.color === colorOption.value && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-6 h-6 bg-white rounded-full shadow-sm flex items-center justify-center">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        </div>
                      </div>
                    )}
                    <span className="absolute bottom-1 left-1 right-1 text-xs text-white font-medium text-center bg-black bg-opacity-30 rounded px-1 py-0.5">
                      {colorOption.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setEditingGroup(null);
                resetForm();
              }}
              className="w-full sm:w-auto min-h-[44px]"
            >
              Annuller
            </Button>
            <Button 
              onClick={handleEdit} 
              disabled={isSubmitting}
              className="w-full sm:w-auto min-h-[44px]"
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