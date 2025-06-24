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
  Eye
} from 'lucide-react';

interface UniqueOffer {
  _id: string;
  product: {
    _id: string;
    produktnavn: string;
    varenummer: string;
    basispris: number;
    billeder?: string[];
    aktiv: boolean;
  };
  customer: {
    _id: string;
    companyName: string;
    contactPersonName: string;
    email: string;
  };
  fixedPrice: number;
  description?: string;
  validFrom: string;
  validTo?: string;
  isActive: boolean;
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

interface Product {
  _id: string;
  produktnavn: string;
  varenummer: string;
  basispris: number;
  billeder?: string[];
  aktiv: boolean;
}

interface Customer {
  _id: string;
  companyName: string;
  contactPersonName: string;
  email: string;
  isActive: boolean;
}

interface CreateOfferFormData {
  productId: string;
  customerId: string;
  fixedPrice: string;
  description: string;
  validFrom: string;
  validTo: string;
}

const DashboardUniqueOffers: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // State management
  const [offers, setOffers] = useState<UniqueOffer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  // Dialog states
  const [isCreateWizardOpen, setIsCreateWizardOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<UniqueOffer | null>(null);

  // Load data
  useEffect(() => {
    loadData();
  }, [currentPage, searchTerm]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const params = {
        page: currentPage,
        limit: 20,
        ...(searchTerm && { search: searchTerm })
      };
      
      const [offersResponse, productsResponse, customersResponse] = await Promise.all([
        authService.getUniqueOffers(params),
        authService.apiClient.get('/.netlify/functions/products?limit=1000&aktiv=true'),
        authService.getAllCustomers()
      ]);
      
      console.log('🔍 API Responses:', {
        offers: offersResponse,
        products: productsResponse,
        customers: customersResponse
      });
      
      if (offersResponse.success) {
        setOffers(offersResponse.offers || []);
        setTotalPages(offersResponse.pagination?.totalPages || 1);
        setTotalCount(offersResponse.pagination?.totalCount || 0);
      }
      
      if (productsResponse.ok) {
        const productsData = await productsResponse.json();
        console.log('📦 Products data:', productsData);
        if (productsData.success && productsData.data) {
          // Handle both paginated and direct array formats
          const productsArray = Array.isArray(productsData.data) 
            ? productsData.data 
            : productsData.data.products || [];
          const activeProducts = productsArray.filter((p: Product) => p.aktiv !== false);
          setProducts(activeProducts);
          console.log('✅ Set products:', activeProducts.length);
        }
      }
      
      if (customersResponse.success) {
        setCustomers(customersResponse.customers?.filter((c: Customer) => c.isActive) || []);
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
    
    return <Badge variant="secondary" className="text-xs">Inaktiv</Badge>;
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

            {/* Search */}
            <Card>
              <CardContent className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-brand-gray-400" />
                  <Input
                    placeholder="Søg i tilbud, produkter eller kunder..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Offers List */}
            {offers.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Star className="h-12 w-12 text-brand-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-brand-gray-900 mb-2">
                    Ingen unikke tilbud fundet
                  </h3>
                  <p className="text-brand-gray-600 mb-4">
                    {searchTerm
                      ? 'Prøv at justere dine søgekriterier.'
                      : 'Opret dit første unikke tilbud for at komme i gang.'
                    }
                  </p>
                  {!searchTerm && (
                    <Button 
                      onClick={() => setIsCreateWizardOpen(true)}
                      className="btn-brand-primary"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Opret Første Tilbud
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  {offers.map((offer) => (
                    <Card key={offer._id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                          {/* Product Info */}
                          <div className="flex items-center gap-3 flex-1">
                            <div className="h-12 w-12 rounded-lg bg-brand-gray-100 flex items-center justify-center shrink-0">
                              {offer.product.billeder && offer.product.billeder[0] ? (
                                <img
                                  src={offer.product.billeder[0]}
                                  alt={offer.product.produktnavn}
                                  className="h-10 w-10 rounded object-cover"
                                />
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
                            </div>
                          </div>

                          {/* Price & Status */}
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="flex items-center gap-2">
                                <span className="text-lg font-bold text-brand-primary">
                                  {formatPrice(offer.fixedPrice)}
                                </span>
                                {getOfferStatusBadge(offer)}
                              </div>
                              <p className="text-xs text-brand-gray-500">
                                {formatDate(offer.validFrom)}
                                {offer.validTo && ` - ${formatDate(offer.validTo)}`}
                              </p>
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
                  ))}
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
    </DashboardLayout>
  );
};

export default DashboardUniqueOffers; 