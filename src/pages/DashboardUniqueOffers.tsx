import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../lib/auth';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { UniqueOfferWizard } from '@/components/unique-offers';
import { cn } from '@/lib/utils';
import {
  Star,
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  Building2,
  X,
  Eye,
  Filter,
  Save,
  AlertTriangle
} from 'lucide-react';

interface ProductImage {
  _id?: string;
  url: string;
  filename?: string;
  originalname?: string;
  size?: number;
  uploadedAt?: string;
  isPrimary?: boolean;
}

interface Product {
  _id: string;
  produktnavn: string;
  varenummer: string;
  basispris: number;
  billeder?: ProductImage[];
  aktiv: boolean;
  kategori?: {
    _id: string;
    navn: string;
  };
}

interface Customer {
  _id: string;
  id?: string;
  companyName: string;
  contactPersonName: string;
  email: string;
  isActive: boolean;
  discountGroup?: {
    _id: string;
    name: string;
    discountPercentage: number;
  };
}

interface Category {
  _id: string;
  navn: string;
}

interface DiscountGroup {
  _id: string;
  name: string;
  discountPercentage: number;
}

interface UniqueOffer {
  _id: string;
  product: {
    _id: string;
    produktnavn: string;
    varenummer: string;
    basispris: number;
    billeder?: ProductImage[];
    aktiv: boolean;
  };
  customer: {
    _id: string;
    companyName: string;
    contactPersonName: string;
    email: string;
    discountGroup?: {
      _id: string;
      name: string;
      discountPercentage: number;
    };
  };
  fixedPrice: number;
  description?: string;
  validFrom: string;
  validTo?: string;
  isActive: boolean;
  isUnlimited: boolean;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  isCurrentlyValid: boolean;
  formattedPrice: string;
}

interface EditOfferFormData {
  fixedPrice: string;
  description: string;
  validFrom: string;
  validTo: string;
  isActive: boolean;
  isUnlimited: boolean;
}

const DashboardUniqueOffers: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // State management
  const [offers, setOffers] = useState<UniqueOffer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [discountGroups, setDiscountGroups] = useState<DiscountGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedDiscountGroup, setSelectedDiscountGroup] = useState<string>('');
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  
  // Dialog states
  const [isCreateWizardOpen, setIsCreateWizardOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<UniqueOffer | null>(null);
  const [editFormData, setEditFormData] = useState<EditOfferFormData>({
    fixedPrice: '',
    description: '',
    validFrom: '',
    validTo: '',
    isActive: true,
    isUnlimited: false
  });
  const [isUpdating, setIsUpdating] = useState(false);

  // Load data
  useEffect(() => {
    loadData();
  }, [currentPage, searchTerm, selectedCategory, selectedDiscountGroup, showActiveOnly]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const params = {
        page: currentPage,
        limit: 20,
        showActiveOnly: showActiveOnly,
        ...(searchTerm && { search: searchTerm })
      };
      
      const [offersResponse, productsResponse, customersResponse, categoriesResponse, discountGroupsResponse] = await Promise.all([
        authService.getUniqueOffers(params),
        authService.apiClient.get('/.netlify/functions/products?limit=1000&aktiv=true'),
        authService.getAllCustomers(),
        authService.apiClient.get('/.netlify/functions/categories'),
        authService.getDiscountGroups()
      ]);
      
      if (offersResponse.success) {
        let filteredOffers = offersResponse.offers || [];
        
        // Apply client-side filters for category and discount group (backend doesn't handle these yet)
        if (selectedCategory) {
          filteredOffers = filteredOffers.filter(offer => 
            offer.product.kategori?._id === selectedCategory
          );
        }
        
        if (selectedDiscountGroup) {
          if (selectedDiscountGroup === 'standard') {
            filteredOffers = filteredOffers.filter(offer => 
              !offer.customer.discountGroup
            );
          } else {
            filteredOffers = filteredOffers.filter(offer => 
              offer.customer.discountGroup?._id === selectedDiscountGroup
            );
          }
        }
        
        // Backend now handles active/inactive filtering, so we don't need to filter here
        setOffers(filteredOffers);
        setTotalPages(offersResponse.pagination?.totalPages || 1);
        setTotalCount(filteredOffers.length);
      }
      
      if (productsResponse.ok) {
        const productsData = await productsResponse.json();
        if (productsData.success && productsData.data) {
          const productsArray = Array.isArray(productsData.data) 
            ? productsData.data 
            : productsData.data.products || [];
          const activeProducts = productsArray.filter((p: Product) => p.aktiv !== false);
          setProducts(activeProducts);
        }
      }
      
      if (customersResponse.success) {
        setCustomers(customersResponse.customers?.filter((c: Customer) => c.isActive) || []);
      }
      
      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json();
        if (categoriesData.success) {
          setCategories(categoriesData.categories || []);
        }
      }
      
      if (discountGroupsResponse.success) {
        setDiscountGroups((discountGroupsResponse.discountGroups as DiscountGroup[]) || []);
      }
      
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Fejl',
        description: 'Kunne ikke indlæse data. Prøv igen.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWizardSuccess = () => {
    loadData();
  };

  const handleEditOffer = (offer: UniqueOffer) => {
    setSelectedOffer(offer);
    setEditFormData({
      fixedPrice: offer.fixedPrice.toString(),
      description: offer.description || '',
      validFrom: offer.validFrom.split('T')[0],
      validTo: offer.validTo ? offer.validTo.split('T')[0] : '',
      isActive: offer.isActive,
      isUnlimited: offer.isUnlimited
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateOffer = async () => {
    if (!selectedOffer) return;
    
    try {
      setIsUpdating(true);
      
      const updateData = {
        fixedPrice: parseFloat(editFormData.fixedPrice),
        description: editFormData.description,
        validFrom: editFormData.validFrom,
        validTo: editFormData.isUnlimited ? undefined : editFormData.validTo,
        isActive: editFormData.isActive,
        isUnlimited: editFormData.isUnlimited
      };
      
      const response = await authService.updateUniqueOffer(selectedOffer._id, updateData);
      
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Tilbud opdateret succesfuldt',
          variant: 'default'
        });
        setIsEditDialogOpen(false);
        loadData();
      } else {
        toast({
          title: 'Fejl',
          description: response.message || 'Kunne ikke opdatere tilbud',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error updating offer:', error);
      toast({
        title: 'Fejl',
        description: 'Der opstod en fejl ved opdatering af tilbud',
        variant: 'destructive'
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteOffer = async (permanent: boolean = false) => {
    if (!selectedOffer) return;
    
    try {
      const response = await authService.deleteUniqueOffer(selectedOffer._id, permanent);
      
      if (response.success) {
        toast({
          title: 'Success',
          description: permanent ? 'Tilbud slettet permanent' : 'Tilbud deaktiveret',
          variant: 'default'
        });
        setIsDeleteDialogOpen(false);
        loadData();
      } else {
        toast({
          title: 'Fejl',
          description: response.message || 'Kunne ikke slette tilbud',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error deleting offer:', error);
      toast({
        title: 'Fejl',
        description: 'Der opstod en fejl ved sletning af tilbud',
        variant: 'destructive'
      });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency: 'DKK'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('da-DK');
  };

  const getOfferStatusBadge = (offer: UniqueOffer) => {
    if (!offer.isActive) {
      return <Badge variant="secondary" className="text-xs">Inaktiv</Badge>;
    }
    
    if (offer.isCurrentlyValid) {
      return <Badge variant="default" className="bg-brand-success text-white text-xs">Aktiv</Badge>;
    }
    
    return <Badge variant="secondary" className="text-xs">Udløbet</Badge>;
  };

  // Enhanced pricing calculation using backend API
  const [customerPricingCache, setCustomerPricingCache] = useState<Map<string, any>>(new Map());

  const calculateCustomerPrice = async (offer: UniqueOffer) => {
    const cacheKey = `${offer.customer._id}-${offer.product._id}`;
    
    // Check cache first
    if (customerPricingCache.has(cacheKey)) {
      return customerPricingCache.get(cacheKey);
    }

    try {
      // Use backend API to get accurate customer pricing
      const response = await authService.getCustomerPricing({
        customerId: offer.customer._id,
        productIds: [offer.product._id]
      });

      if (response.success && response.data && response.data.products.length > 0) {
        const productWithPricing = response.data.products[0];
        const pricing = productWithPricing.customerPricing;
        
        const result = {
          price: pricing.customerPrice,
          label: pricing.priceLabel,
          hasDiscount: pricing.hasDiscount,
          originalPrice: pricing.originalPrice,
          discountPercentage: pricing.discountPercentage
        };
        
        // Cache the result
        setCustomerPricingCache(prev => new Map(prev.set(cacheKey, result)));
        return result;
      }
    } catch (error) {
      console.error('Error calculating customer price for offer:', error);
    }

    // Fallback to base price
    const fallback = {
      price: offer.product.basispris,
      label: 'Standard pris',
      hasDiscount: false
    };
    
    setCustomerPricingCache(prev => new Map(prev.set(cacheKey, fallback)));
    return fallback;
  };

  // Enhanced pricing info with cached results
  const [pricingInfoCache, setPricingInfoCache] = useState<Map<string, any>>(new Map());

  const getPricingInfo = (offer: UniqueOffer) => {
    const cacheKey = `${offer.customer._id}-${offer.product._id}`;
    
    // Return cached pricing info if available
    if (pricingInfoCache.has(cacheKey)) {
      return pricingInfoCache.get(cacheKey);
    }

    // Calculate pricing asynchronously and cache result
    calculateCustomerPrice(offer).then(customerPricing => {
      const savings = customerPricing.price - offer.fixedPrice;
      const savingsPercentage = Math.round((savings / customerPricing.price) * 100);
      
      const pricingInfo = {
        customerPrice: customerPricing.price,
        customerLabel: customerPricing.label,
        hasCustomerDiscount: customerPricing.hasDiscount,
        offerPrice: offer.fixedPrice,
        savings,
        savingsPercentage,
        basePrice: offer.product.basispris
      };
      
      setPricingInfoCache(prev => new Map(prev.set(cacheKey, pricingInfo)));
    });

    // Return fallback pricing info while loading
    const fallbackPricing = {
      customerPrice: offer.product.basispris,
      customerLabel: 'Standard pris',
      hasCustomerDiscount: false,
      offerPrice: offer.fixedPrice,
      savings: offer.product.basispris - offer.fixedPrice,
      savingsPercentage: Math.round(((offer.product.basispris - offer.fixedPrice) / offer.product.basispris) * 100),
      basePrice: offer.product.basispris
    };

    return fallbackPricing;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="dashboard-page-container">
          <div className="content-width">
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <Skeleton className="h-8 w-48 mb-2" />
                  <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-10 w-32" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-16 w-full" />
                    </CardContent>
                  </Card>
                ))}
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
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-brand-gray-900 flex items-center gap-2">
                  <Star className="h-6 w-6 md:h-7 md:w-7 text-brand-primary" />
                  Unikke Tilbud
                </h1>
                <p className="text-brand-gray-600 mt-1">
                  Administrer kundespecifikke priser der tilsidesætter rabatgrupper
                </p>
              </div>
              
              <Button 
                className="btn-brand-primary"
                onClick={() => setIsCreateWizardOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Opret Tilbud
              </Button>
            </div>

            {/* Search and Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-brand-gray-400" />
                    <Input
                      placeholder="Søg i tilbud, produkter eller kunder..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  {/* Category Filter */}
                  <div className="relative">
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Alle kategorier</option>
                      {categories.map(category => (
                        <option key={category._id} value={category._id}>
                          {category.navn}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Customer Type Filter */}
                  <div className="relative">
                    <select
                      value={selectedDiscountGroup}
                      onChange={(e) => setSelectedDiscountGroup(e.target.value)}
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Alle kundetyper</option>
                      <option value="standard">Standard kunder</option>
                      {discountGroups.map(group => (
                        <option key={group._id} value={group._id}>
                          {group.name} kunder
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Active Filter */}
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="active-only"
                      checked={showActiveOnly}
                      onCheckedChange={setShowActiveOnly}
                    />
                    <Label htmlFor="active-only" className="text-sm">
                      Kun aktive
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Offers List */}
            {offers.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Star className="h-12 w-12 text-brand-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-brand-gray-900 mb-2">Ingen tilbud fundet</h3>
                  <p className="text-brand-gray-600 mb-4">
                    {searchTerm || selectedCategory || selectedDiscountGroup 
                      ? 'Prøv at justere dine filtre eller søgekriterier'
                      : 'Opret dit første unikke tilbud for at komme i gang'
                    }
                  </p>
                  <Button 
                    className="btn-brand-primary"
                    onClick={() => setIsCreateWizardOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Opret Tilbud
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  {offers.map((offer) => {
                    const pricingInfo = getPricingInfo(offer);
                    
                    return (
                      <Card key={offer._id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                            {/* Product Info */}
                            <div className="flex items-center gap-3 flex-1">
                              <div className="h-12 w-12 rounded-lg bg-brand-gray-100 flex items-center justify-center shrink-0 relative overflow-hidden">
                                {offer.product.billeder && offer.product.billeder.length > 0 ? (
                                  <>
                                    <img
                                      src={offer.product.billeder.find(img => img.isPrimary)?.url || offer.product.billeder[0]?.url}
                                      alt={offer.product.produktnavn}
                                      className="h-10 w-10 rounded object-cover"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        if (target) {
                                          target.style.display = 'none';
                                          const parent = target.parentElement;
                                          if (parent) {
                                            const placeholder = parent.querySelector('.image-placeholder') as HTMLElement;
                                            if (placeholder) {
                                              placeholder.style.display = 'flex';
                                            }
                                          }
                                        }
                                      }}
                                    />
                                    <div 
                                      className="image-placeholder absolute inset-0 w-full h-full flex items-center justify-center bg-brand-gray-100 text-brand-gray-400"
                                      style={{ display: 'none' }}
                                    >
                                      <Package className="h-6 w-6" />
                                    </div>
                                  </>
                                ) : (
                                  <Package className="h-6 w-6 text-brand-gray-400" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <h3 className="font-medium text-brand-gray-900 truncate">
                                  {offer.product.produktnavn}
                                </h3>
                                <p className="text-sm text-brand-gray-600">
                                  {offer.product.varenummer}
                                </p>
                              </div>
                            </div>

                            {/* Customer Info */}
                            <div className="flex items-center gap-3 flex-1">
                              <Avatar className="h-10 w-10 shrink-0">
                                <AvatarFallback className="bg-brand-primary text-white text-sm">
                                  {offer.customer.companyName.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-brand-gray-900 truncate">
                                  {offer.customer.companyName}
                                </p>
                                <p className="text-sm text-brand-gray-600 truncate">
                                  {offer.customer.contactPersonName}
                                </p>
                                {offer.customer.discountGroup && (
                                  <Badge variant="outline" className="mt-1 text-xs">
                                    {offer.customer.discountGroup.name}
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Pricing Info */}
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-lg font-bold text-brand-primary">
                                    {formatPrice(offer.fixedPrice)}
                                  </span>
                                  {getOfferStatusBadge(offer)}
                                </div>
                                
                                {/* Enhanced pricing display */}
                                <div className="text-xs text-brand-gray-500 space-y-1">
                                  {pricingInfo.hasCustomerDiscount && pricingInfo.customerPrice !== pricingInfo.basePrice && (
                                    <div>
                                      <span className="line-through text-brand-gray-400">
                                        {formatPrice(pricingInfo.basePrice)}
                                      </span>
                                      <span className="ml-1">Standard</span>
                                    </div>
                                  )}
                                  
                                  <div>
                                    <span className={cn(
                                      pricingInfo.customerPrice !== offer.fixedPrice ? "line-through text-brand-gray-400" : ""
                                    )}>
                                      {formatPrice(pricingInfo.customerPrice)}
                                    </span>
                                    <span className="ml-1">{pricingInfo.customerLabel}</span>
                                  </div>
                                  
                                  {pricingInfo.savings > 0 && (
                                    <div className="text-brand-success font-medium">
                                      Spar {formatPrice(pricingInfo.savings)} ({pricingInfo.savingsPercentage}%)
                                    </div>
                                  )}
                                </div>
                                
                                <p className="text-xs text-brand-gray-500 mt-1">
                                  {formatDate(offer.validFrom)}
                                  {offer.validTo && !offer.isUnlimited && ` - ${formatDate(offer.validTo)}`}
                                  {offer.isUnlimited && ' - Ingen udløb'}
                                </p>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedOffer(offer);
                                    setIsViewDialogOpen(true);
                                  }}
                                  className="h-8 w-8 p-0"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditOffer(offer)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedOffer(offer);
                                    setIsDeleteDialogOpen(true);
                                  }}
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>

                          {offer.description && (
                            <div className="mt-3 pt-3 border-t border-brand-gray-200">
                              <p className="text-sm text-brand-gray-600">{offer.description}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Unique Offer Wizard */}
      <UniqueOfferWizard
        isOpen={isCreateWizardOpen}
        onClose={() => setIsCreateWizardOpen(false)}
        onSuccess={handleWizardSuccess}
      />

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Rediger Tilbud</DialogTitle>
            <DialogDescription>
              Opdater tilbudsdetaljerne for {selectedOffer?.product.produktnavn}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-price">Fast Pris (DKK)</Label>
              <Input
                id="edit-price"
                type="number"
                step="0.01"
                min="0"
                value={editFormData.fixedPrice}
                onChange={(e) => setEditFormData(prev => ({
                  ...prev,
                  fixedPrice: e.target.value
                }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-description">Beskrivelse (valgfri)</Label>
              <Textarea
                id="edit-description"
                value={editFormData.description}
                onChange={(e) => setEditFormData(prev => ({
                  ...prev,
                  description: e.target.value
                }))}
                placeholder="Tilføj en note eller beskrivelse..."
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-valid-from">Gyldig fra</Label>
                <Input
                  id="edit-valid-from"
                  type="date"
                  value={editFormData.validFrom}
                  min={new Date().toISOString().split('T')[0]} // Prevent past dates
                  onChange={(e) => {
                    const newValidFrom = e.target.value;
                    setEditFormData(prev => {
                      // If validTo is set and is before or equal to new validFrom, clear it
                      const validToDate = prev.validTo ? new Date(prev.validTo) : null;
                      const validFromDate = new Date(newValidFrom);
                      
                      if (validToDate && validToDate <= validFromDate) {
                        return { ...prev, validFrom: newValidFrom, validTo: '' };
                      }
                      
                      return { ...prev, validFrom: newValidFrom };
                    });
                  }}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-valid-to">Gyldig til</Label>
                <Input
                  id="edit-valid-to"
                  type="date"
                  value={editFormData.validTo}
                  min={(() => {
                    if (!editFormData.validFrom) return new Date().toISOString().split('T')[0];
                    
                    const validFromDate = new Date(editFormData.validFrom);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    validFromDate.setHours(0, 0, 0, 0);
                    
                    // If validFrom is today, minimum validTo is tomorrow
                    if (validFromDate.getTime() === today.getTime()) {
                      const tomorrow = new Date(today);
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      return tomorrow.toISOString().split('T')[0];
                    }
                    
                    // Otherwise, minimum validTo is the day after validFrom
                    const dayAfterValidFrom = new Date(validFromDate);
                    dayAfterValidFrom.setDate(dayAfterValidFrom.getDate() + 1);
                    return dayAfterValidFrom.toISOString().split('T')[0];
                  })()}
                  onChange={(e) => setEditFormData(prev => ({
                    ...prev,
                    validTo: e.target.value
                  }))}
                  disabled={editFormData.isUnlimited}
                />
                {editFormData.validFrom && !editFormData.isUnlimited && (
                  <p className="text-xs text-brand-gray-500">
                    {(() => {
                      const validFromDate = new Date(editFormData.validFrom);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      validFromDate.setHours(0, 0, 0, 0);
                      
                      if (validFromDate.getTime() === today.getTime()) {
                        return "Da tilbuddet starter i dag, skal slutdato være mindst i morgen";
                      }
                      return "Slutdato skal være efter startdato";
                    })()}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-unlimited"
                checked={editFormData.isUnlimited}
                onCheckedChange={(checked) => setEditFormData(prev => ({
                  ...prev,
                  isUnlimited: checked,
                  validTo: checked ? '' : prev.validTo
                }))}
              />
              <Label htmlFor="edit-unlimited">Ingen udløbsdato</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-active"
                checked={editFormData.isActive}
                onCheckedChange={(checked) => setEditFormData(prev => ({
                  ...prev,
                  isActive: checked
                }))}
              />
              <Label htmlFor="edit-active">Tilbud aktivt</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isUpdating}
            >
              Annuller
            </Button>
            <Button
              onClick={handleUpdateOffer}
              disabled={isUpdating || !editFormData.fixedPrice}
            >
              {isUpdating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Opdaterer...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Gem Ændringer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Slet Tilbud
            </AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på, at du vil slette tilbuddet for{' '}
              <strong>{selectedOffer?.product.produktnavn}</strong> til{' '}
              <strong>{selectedOffer?.customer.companyName}</strong>?
              <br /><br />
              <strong>Deaktiver:</strong> Skjuler tilbuddet men bevarer data
              <br />
              <strong>Slet permanent:</strong> Fjerner tilbuddet helt (kan ikke fortrydes)
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuller</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDeleteOffer(false)}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              Deaktiver
            </AlertDialogAction>
            <AlertDialogAction
              onClick={() => handleDeleteOffer(true)}
              className="bg-red-600 hover:bg-red-700"
            >
              Slet Permanent
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Tilbudsdetaljer</DialogTitle>
          </DialogHeader>
          
          {selectedOffer && (
            <div className="space-y-4 py-4">
              {/* Product Details */}
              <div className="bg-brand-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-brand-gray-900 mb-2">Produkt</h4>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-white flex items-center justify-center relative overflow-hidden">
                    {selectedOffer.product.billeder && selectedOffer.product.billeder.length > 0 ? (
                      <>
                        <img
                          src={selectedOffer.product.billeder.find(img => img.isPrimary)?.url || selectedOffer.product.billeder[0]?.url}
                          alt={selectedOffer.product.produktnavn}
                          className="h-10 w-10 rounded object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (target) {
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                const placeholder = parent.querySelector('.image-placeholder') as HTMLElement;
                                if (placeholder) {
                                  placeholder.style.display = 'flex';
                                }
                              }
                            }
                          }}
                        />
                        <div 
                          className="image-placeholder absolute inset-0 w-full h-full flex items-center justify-center bg-white text-brand-gray-400"
                          style={{ display: 'none' }}
                        >
                          <Package className="h-6 w-6" />
                        </div>
                      </>
                    ) : (
                      <Package className="h-6 w-6 text-brand-gray-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{selectedOffer.product.produktnavn}</p>
                    <p className="text-sm text-brand-gray-600">{selectedOffer.product.varenummer}</p>
                    <p className="text-sm text-brand-gray-600">
                      Basispris: {formatPrice(selectedOffer.product.basispris)}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Customer Details */}
              <div className="bg-brand-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-brand-gray-900 mb-2">Kunde</h4>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-brand-primary text-white">
                      {selectedOffer.customer.companyName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedOffer.customer.companyName}</p>
                    <p className="text-sm text-brand-gray-600">{selectedOffer.customer.contactPersonName}</p>
                    <p className="text-sm text-brand-gray-600">{selectedOffer.customer?.email || 'N/A'}</p>
                    {selectedOffer.customer.discountGroup && (
                      <Badge variant="outline" className="mt-1">
                        {selectedOffer.customer.discountGroup.name} ({selectedOffer.customer.discountGroup.discountPercentage}% rabat)
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Offer Details */}
              <div className="bg-brand-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-brand-gray-900 mb-2">Tilbudsdetaljer</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-brand-gray-600">Fast pris</p>
                    <p className="font-bold text-lg text-brand-primary">
                      {formatPrice(selectedOffer.fixedPrice)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-brand-gray-600">Status</p>
                    {getOfferStatusBadge(selectedOffer)}
                  </div>
                  <div>
                    <p className="text-sm text-brand-gray-600">Gyldig fra</p>
                    <p className="font-medium">{formatDate(selectedOffer.validFrom)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-brand-gray-600">Gyldig til</p>
                    <p className="font-medium">
                      {selectedOffer.isUnlimited 
                        ? 'Ingen udløb'
                        : selectedOffer.validTo 
                          ? formatDate(selectedOffer.validTo)
                          : 'Ikke angivet'
                      }
                    </p>
                  </div>
                </div>
                
                {selectedOffer.description && (
                  <div className="mt-4">
                    <p className="text-sm text-brand-gray-600 mb-1">Beskrivelse</p>
                    <p className="text-sm bg-white p-2 rounded border">
                      {selectedOffer.description}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Pricing Breakdown */}
              <div className="bg-brand-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-brand-gray-900 mb-2">Prisberegning</h4>
                {(() => {
                  const pricingInfo = getPricingInfo(selectedOffer);
                  return (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Basispris:</span>
                        <span>{formatPrice(pricingInfo.basePrice)}</span>
                      </div>
                      
                      {pricingInfo.hasCustomerDiscount && (
                        <div className="flex justify-between">
                          <span>{pricingInfo.customerLabel}:</span>
                          <span>{formatPrice(pricingInfo.customerPrice)}</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between font-bold text-brand-primary">
                        <span>Tilbudspris:</span>
                        <span>{formatPrice(pricingInfo.offerPrice)}</span>
                      </div>
                      
                      {pricingInfo.savings > 0 && (
                        <div className="flex justify-between text-brand-success font-medium pt-2 border-t">
                          <span>Total besparelse:</span>
                          <span>{formatPrice(pricingInfo.savings)} ({pricingInfo.savingsPercentage}%)</span>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
              
              {/* Metadata */}
              <div className="text-xs text-brand-gray-500 space-y-1">
                <p>Oprettet af: {selectedOffer.createdBy.name} ({selectedOffer.createdBy.email})</p>
                <p>Oprettet: {formatDate(selectedOffer.createdAt)}</p>
                <p>Sidst opdateret: {formatDate(selectedOffer.updatedAt)}</p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Luk
            </Button>
            <Button onClick={() => {
              setIsViewDialogOpen(false);
              if (selectedOffer) handleEditOffer(selectedOffer);
            }}>
              <Edit className="h-4 w-4 mr-2" />
              Rediger
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default DashboardUniqueOffers; 