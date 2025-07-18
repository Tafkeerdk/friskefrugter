import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
// Removed Select components - using native HTML select to prevent recursion
import { useToast } from '@/hooks/use-toast';
import { authService } from '@/lib/auth';
import { cn } from '@/lib/utils';
import {
  Star,
  Search,
  Package,
  Building2,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Calendar,
  DollarSign,
  Users,
  Filter,
  X,
  Infinity
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
    _id?: string;
    id?: string;
    name: string;
    discountPercentage?: number;
  };
}

interface Category {
  _id: string;
  navn: string;
}

interface DiscountGroup {
  _id: string;
  id?: string;
  name: string;
  discountPercentage: number;
}

interface UniqueOfferWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preselectedProduct?: Product;
}

type WizardStep = 'product' | 'customer' | 'details' | 'confirmation';

interface OfferData {
  productId: string;
  customerId: string;
  fixedPrice: string;
  description: string;
  validFrom: string;
  validTo: string;
  isUnlimited: boolean;
}

const UniqueOfferWizard: React.FC<UniqueOfferWizardProps> = ({
  isOpen,
  onClose,
  onSuccess,
  preselectedProduct
}) => {
  const { toast } = useToast();
  const loadingRef = useRef({
    products: false,
    customers: false,
    categories: false,
    discountGroups: false
  });
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState<WizardStep>('product');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Data state - STABLE REFERENCES
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [discountGroups, setDiscountGroups] = useState<DiscountGroup[]>([]);
  
  // Loading states - STABLE REFERENCES
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  
  // Filter states - STABLE REFERENCES
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedDiscountGroup, setSelectedDiscountGroup] = useState<string>('');
  
  // Form data
  const [offerData, setOfferData] = useState<OfferData>({
    productId: preselectedProduct?._id || '',
    customerId: '',
    fixedPrice: '',
    description: '',
    validFrom: new Date().toISOString().split('T')[0],
    validTo: '',
    isUnlimited: false
  });

  // BULLETPROOF DATA LOADING - NO RECURSION POSSIBLE
  const loadAllData = useCallback(async () => {
    if (!isOpen) return;

    // Prevent multiple simultaneous loads
    if (Object.values(loadingRef.current).some(loading => loading)) {
      return;
    }

    try {
      // Mark all as loading
      loadingRef.current = {
        products: true,
        customers: true,
        categories: true,
        discountGroups: true
      };

      setLoadingProducts(true);
      setLoadingCustomers(true);
      setLoadingCategories(true);

      // Load all data in parallel - NO DEPENDENCIES
      const [productsResponse, customersResponse, categoriesResponse, discountGroupsResponse] = await Promise.allSettled([
        // Products
        authService.apiClient.get('/.netlify/functions/products?limit=500&aktiv=true'),
        // Customers
        authService.getAllCustomers(),
        // Categories
        authService.apiClient.get('/.netlify/functions/categories'),
        // Discount Groups
        authService.getDiscountGroups()
      ]);

      // Process products
      if (productsResponse.status === 'fulfilled') {
        const productsData = await productsResponse.value.json();
        if (productsData.success && productsData.data) {
          const productsArray = Array.isArray(productsData.data) ? productsData.data : productsData.data.products || [];
          const activeProducts = productsArray.filter((p: Product) => p.aktiv);
          setProducts(activeProducts);
        }
      }

      // Process customers
      if (customersResponse.status === 'fulfilled') {
        const customersData = customersResponse.value;
        if (customersData.success) {
          const customerList = customersData.customers?.filter((c: Customer) => c.isActive) || [];
          setCustomers(customerList);
        }
      }

      // Process categories
      if (categoriesResponse.status === 'fulfilled') {
        const categoriesData = await categoriesResponse.value.json();
        if (categoriesData.success && categoriesData.data) {
          const categoriesArray = Array.isArray(categoriesData.data) ? categoriesData.data : (categoriesData.data.categories || []);
          setCategories(categoriesArray);
        }
      }

      // Process discount groups
      if (discountGroupsResponse.status === 'fulfilled') {
        const discountGroupsData = discountGroupsResponse.value;
        if (discountGroupsData.success) {
          const groups = (discountGroupsData.discountGroups as DiscountGroup[]) || [];
          setDiscountGroups(groups);
        }
      }

    } catch (error) {
      console.error('Error loading data:', error);
      // Silent error handling to prevent recursion
    } finally {
      // Reset loading states
      loadingRef.current = {
        products: false,
        customers: false,
        categories: false,
        discountGroups: false
      };

      setLoadingProducts(false);
      setLoadingCustomers(false);
      setLoadingCategories(false);
    }
  }, [isOpen]);

  // SINGLE EFFECT - LOADS EVERYTHING ONCE
  useEffect(() => {
    if (isOpen) {
      // Set initial step
      setCurrentStep(preselectedProduct ? 'customer' : 'product');
      
      // Load all data once
      loadAllData();
    } else {
      // Reset when closed
      setCurrentStep(preselectedProduct ? 'customer' : 'product');
      setProductSearch('');
      setCustomerSearch('');
      setSelectedCategory('');
      setSelectedDiscountGroup('');
    }
  }, [isOpen, preselectedProduct, loadAllData]);



  const handleNext = () => {
    const steps: WizardStep[] = ['product', 'customer', 'details', 'confirmation'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      const nextStep = steps[currentIndex + 1];
      
      // Auto-populate fixed price with customer's discounted price when moving to details step
      if (nextStep === 'details' && !offerData.fixedPrice) {
        const currentPricing = getCustomerPricing();
        if (currentPricing.price > 0) {
          setOfferData(prev => ({ 
            ...prev, 
            fixedPrice: currentPricing.price.toFixed(2)
          }));
        }
      }
      
      setCurrentStep(nextStep);
    }
  };

  const handleBack = () => {
    const steps: WizardStep[] = ['product', 'customer', 'details', 'confirmation'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      const submitData = {
        productId: offerData.productId,
        customerId: offerData.customerId,
        fixedPrice: parseFloat(offerData.fixedPrice),
        description: offerData.description,
        validFrom: offerData.validFrom,
        isUnlimited: offerData.isUnlimited,
        ...((!offerData.isUnlimited && offerData.validTo) && { validTo: offerData.validTo })
      };

      const response = await authService.createUniqueOffer(submitData);
      
      if (response.success) {
        toast({
          title: 'Succes!',
          description: 'Unikt tilbud oprettet succesfuldt',
          variant: 'default'
        });
        onSuccess();
        onClose();
        resetForm();
      } else {
        // Handle different error types
        if (response.error?.includes('eksisterer allerede') || response.message?.includes('already exists') || response.message?.includes('combination')) {
          toast({
            title: 'Tilbud findes allerede',
            description: `Der eksisterer allerede et aktivt tilbud for denne kunde og dette produkt. Du kan kun have ét aktivt tilbud per kunde per produkt.`,
            variant: 'destructive'
          });
        } else if (response.error?.includes('Ugyldig pris') || response.message?.includes('INVALID_PRICE')) {
          toast({
            title: 'Ugyldig pris',
            description: 'Prisen skal være mellem 0,01 og 100.000 DKK',
            variant: 'destructive'
          });
        } else if (response.error?.includes('For mange tilbud')) {
          toast({
            title: 'For mange tilbud',
            description: 'Der er for mange tilbud for denne kombination. Slet nogle inaktive tilbud først.',
            variant: 'destructive'
          });
        } else if (response.error?.includes('Startdato kan ikke være i fortiden') || response.message?.includes('past')) {
          toast({
            title: 'Ugyldig startdato',
            description: 'Startdato kan ikke være i fortiden. Vælg i dag eller en fremtidig dato.',
            variant: 'destructive'
          });
        } else if (response.error?.includes('Slutdato skal være efter startdato') || response.message?.includes('after')) {
          toast({
            title: 'Ugyldig slutdato',
            description: 'Slutdato skal være efter startdato.',
            variant: 'destructive'
          });
        } else if (response.error?.includes('mindst i morgen') || response.message?.includes('tomorrow')) {
          toast({
            title: 'Ugyldig slutdato',
            description: 'Hvis tilbuddet starter i dag, skal slutdato være mindst i morgen.',
            variant: 'destructive'
          });
        } else {
          toast({
            title: 'Fejl',
            description: response.error || response.message || 'Kunne ikke oprette tilbud',
            variant: 'destructive'
          });
        }
      }
    } catch (error) {
      console.error('Error creating offer:', error);
      toast({
        title: 'Fejl',
        description: 'Der opstod en fejl ved oprettelse af tilbud',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setOfferData({
      productId: preselectedProduct?._id || '',
      customerId: '',
      fixedPrice: '',
      description: '',
      validFrom: new Date().toISOString().split('T')[0],
      validTo: '',
      isUnlimited: false
    });
    setCurrentStep(preselectedProduct ? 'customer' : 'product');
    setProductSearch('');
    setCustomerSearch('');
    setSelectedCategory('');
    setSelectedDiscountGroup('');
  };

  const getSelectedProduct = () => {
    if (preselectedProduct) return preselectedProduct;
    return products.find(p => p._id === offerData.productId);
  };

  const getSelectedCustomer = () => {
    return customers.find(c => {
      const customerId = c._id || c.id;
      return customerId === offerData.customerId;
    });
  };

  // State for customer pricing
  const [customerPricing, setCustomerPricing] = useState<{
    price: number;
    label: string;
    hasDiscount: boolean;
    originalPrice?: number;
    discountPercentage?: number;
  }>({
    price: 0,
    label: 'standard pris',
    hasDiscount: false
  });

  // Calculate customer's actual price based on their discount group using backend API
  const calculateCustomerPrice = useCallback(async () => {
    const product = getSelectedProduct();
    const customer = getSelectedCustomer();
    
    if (!product || !customer) {
      setCustomerPricing({
        price: 0,
        label: 'standard pris',
        hasDiscount: false
      });
      return {
        price: 0,
        label: 'standard pris',
        hasDiscount: false
      };
    }

    try {
      // Use backend API to get accurate customer pricing
      const response = await authService.getCustomerPricing({
        customerId: customer._id || (customer as any).id,
        productIds: [product._id]
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
        
        setCustomerPricing(result);
        return result;
      }
    } catch (error) {
      console.error('Error calculating customer price:', error);
    }

    // Fallback to base price
    const fallback = {
      price: product.basispris,
      label: 'standard pris',
      hasDiscount: false
    };
    setCustomerPricing(fallback);
    return fallback;
  }, [getSelectedProduct, getSelectedCustomer]);

  // Sync version for immediate use
  const getCustomerPricing = () => customerPricing;

  // Calculate pricing when customer or product changes
  useEffect(() => {
    if (offerData.customerId && offerData.productId) {
      calculateCustomerPrice();
    }
  }, [offerData.customerId, offerData.productId, calculateCustomerPrice]);

  // SAFE MEMOIZED FILTERING - STABLE DEPENDENCIES
  const filteredProducts = useMemo(() => {
    if (!products.length) return [];
    
    return products.filter(product => {
      const matchesSearch = !productSearch || 
        product.produktnavn.toLowerCase().includes(productSearch.toLowerCase()) ||
        (product.varenummer && product.varenummer.toLowerCase().includes(productSearch.toLowerCase()));
      
      const matchesCategory = !selectedCategory || 
        selectedCategory === 'all' || 
        product.kategori?._id === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [products, productSearch, selectedCategory]);

  // Filter categories to only show those that have active products
  const categoriesWithProducts = useMemo(() => {
    if (!categories.length || !products.length) return [];
    
    // Get unique category IDs from active products
    const productCategoryIds = new Set(
      products
        .filter(product => product.aktiv && product.kategori?._id)
        .map(product => product.kategori!._id)
    );
    
    // Return only categories that have products
    return categories.filter(category => productCategoryIds.has(category._id));
  }, [categories, products]);

  const filteredCustomers = useMemo(() => {
    if (!customers.length) return [];
    
    const filtered = customers.filter(customer => {
      const matchesSearch = !customerSearch ||
        customer.companyName.toLowerCase().includes(customerSearch.toLowerCase()) ||
        customer.contactPersonName.toLowerCase().includes(customerSearch.toLowerCase());
      
      // Fix: Handle the actual discount group structure from backend and potential cache issues
      const matchesGroup = !selectedDiscountGroup || 
        selectedDiscountGroup === 'all' || 
        (customer.discountGroup && (
          // Try matching by ID first
          customer.discountGroup._id === selectedDiscountGroup || 
          customer.discountGroup.id === selectedDiscountGroup ||
          // Fallback: Try matching by name (in case dropdown sends name due to cache issues)
          customer.discountGroup.name === selectedDiscountGroup
        ));
      
      return matchesSearch && matchesGroup;
    });

    // Sort customers by discount group, then by company name
    return filtered.sort((a, b) => {
      // First, sort by discount group presence (customers with discount groups first)
      const aHasGroup = !!a.discountGroup;
      const bHasGroup = !!b.discountGroup;
      
      if (aHasGroup && !bHasGroup) return -1;
      if (!aHasGroup && bHasGroup) return 1;
      
      // If both have groups, sort by discount group name
      if (aHasGroup && bHasGroup) {
        const groupCompare = (a.discountGroup?.name || '').localeCompare(b.discountGroup?.name || '');
        if (groupCompare !== 0) return groupCompare;
      }
      
      // Finally, sort by company name
      return a.companyName.localeCompare(b.companyName);
    });
  }, [customers, customerSearch, selectedDiscountGroup]);

  const canProceedFromStep = (step: WizardStep): boolean => {
    switch (step) {
      case 'product':
        return !!offerData.productId;
      case 'customer':
        return !!offerData.customerId;
      case 'details':
        return !!offerData.fixedPrice && parseFloat(offerData.fixedPrice) > 0;
      case 'confirmation':
        return true;
      default:
        return false;
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-6">
      <div className="flex items-center space-x-2">
        {(['product', 'customer', 'details', 'confirmation'] as WizardStep[]).map((step, index) => {
          const stepNames = {
            product: 'Produkt',
            customer: 'Kunde',
            details: 'Detaljer',
            confirmation: 'Bekræft'
          };
          
          const isActive = currentStep === step;
          const isCompleted = (['product', 'customer', 'details', 'confirmation'] as WizardStep[]).indexOf(currentStep) > index;
          
          return (
            <React.Fragment key={step}>
              <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors",
                isActive ? "bg-brand-primary text-white" :
                isCompleted ? "bg-brand-success text-white" :
                "bg-brand-gray-200 text-brand-gray-600"
              )}>
                {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
              </div>
              <span className={cn(
                "text-sm font-medium",
                isActive ? "text-brand-primary" :
                isCompleted ? "text-brand-success" :
                "text-brand-gray-500"
              )}>
                {stepNames[step]}
              </span>
              {index < 3 && (
                <div className={cn(
                  "w-8 h-0.5 mx-2",
                  isCompleted ? "bg-brand-success" : "bg-brand-gray-200"
                )} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );

  const renderProductStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Package className="h-12 w-12 text-brand-primary mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-brand-gray-900 mb-2">Vælg Produkt</h3>
        <p className="text-brand-gray-600">Vælg det produkt du vil oprette et unikt tilbud for</p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-brand-gray-400" />
          <Input
            placeholder="Søg produktnavn eller varenummer..."
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="relative">
          <select
            value={selectedCategory || "all"}
            onChange={(e) => {
              const value = e.target.value;
              setSelectedCategory(value === "all" ? "" : value);
            }}
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
            disabled={loadingCategories}
          >
            <option value="all">Alle kategorier</option>
            {loadingCategories ? (
              <option value="loading" disabled>Indlæser kategorier...</option>
            ) : categoriesWithProducts.length > 0 ? (
              categoriesWithProducts.map(category => (
                <option key={category._id} value={category._id}>
                  {category.navn}
                </option>
              ))
            ) : (
              <option value="no-categories" disabled>Ingen kategorier tilgængelige</option>
            )}
          </select>
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <svg className="h-4 w-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-h-[400px] overflow-y-auto border border-brand-gray-200 rounded-lg">
        {loadingProducts ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-primary"></div>
            <span className="ml-2">Indlæser produkter...</span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-8 text-center text-brand-gray-500">
            <Package className="h-12 w-12 mx-auto mb-3 text-brand-gray-300" />
            <p>Ingen produkter fundet</p>
            <p className="text-sm">Prøv at justere dine filtre</p>
          </div>
        ) : (
          <div className="divide-y divide-brand-gray-100">
            {filteredProducts.map(product => (
              <button
                key={product._id}
                type="button"
                onClick={() => setOfferData(prev => ({ ...prev, productId: product._id }))}
                className={cn(
                  "w-full p-4 text-left hover:bg-brand-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary/20",
                  offerData.productId === product._id && "bg-brand-primary/10 border-l-4 border-brand-primary"
                )}
              >
                <div className="flex items-center gap-4">
                  {/* Product Image with Fallback */}
                  <div className="w-16 h-16 flex-shrink-0 rounded-lg border border-brand-gray-200 overflow-hidden bg-brand-gray-100 relative">
                    {product.billeder && product.billeder.length > 0 ? (
                      <>
                        <img
                          src={product.billeder.find(img => img.isPrimary)?.url || product.billeder[0]?.url}
                          alt={product.produktnavn}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Replace broken image with placeholder
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
                        {/* Fallback placeholder for broken images */}
                        <div 
                          className="image-placeholder absolute inset-0 w-full h-full flex items-center justify-center bg-brand-gray-100 text-brand-gray-400"
                          style={{ display: 'none' }}
                        >
                          <Package className="w-6 h-6" />
                        </div>
                      </>
                    ) : (
                      /* Default placeholder for products without images */
                      <div className="w-full h-full flex items-center justify-center bg-brand-gray-100 text-brand-gray-400">
                        <Package className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-brand-gray-900 truncate">
                      {product.produktnavn}
                    </div>
                    <div className="text-sm text-brand-gray-500 flex items-center gap-2 mt-1">
                      <span>{product.varenummer}</span>
                      <span>•</span>
                      <span className="font-medium text-brand-primary">
                        {new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK' }).format(product.basispris)}
                      </span>
                    </div>
                    {product.kategori && (
                      <Badge variant="outline" className="mt-2 text-xs">
                        {product.kategori.navn}
                      </Badge>
                    )}
                  </div>
                  {offerData.productId === product._id && (
                    <CheckCircle2 className="h-5 w-5 text-brand-primary" />
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderCustomerStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Building2 className="h-12 w-12 text-brand-primary mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-brand-gray-900 mb-2">Vælg Kunde</h3>
        <p className="text-brand-gray-600">Vælg den kunde der skal have det unikke tilbud</p>
      </div>

      {/* Selected Product Display */}
      {getSelectedProduct() && (
        <Card className="bg-brand-gray-50 border-brand-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              {/* Selected Product Image */}
              <div className="w-12 h-12 flex-shrink-0 rounded-lg border border-brand-gray-200 overflow-hidden bg-brand-gray-100 relative">
                {getSelectedProduct()?.billeder && getSelectedProduct()!.billeder!.length > 0 ? (
                  <>
                    <img
                      src={getSelectedProduct()!.billeder!.find(img => img.isPrimary)?.url || getSelectedProduct()!.billeder![0]?.url}
                      alt={getSelectedProduct()?.produktnavn}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Replace broken image with placeholder
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
                    {/* Fallback placeholder for broken images */}
                    <div 
                      className="image-placeholder absolute inset-0 w-full h-full flex items-center justify-center bg-brand-primary text-white"
                      style={{ display: 'none' }}
                    >
                      <Package className="w-4 h-4" />
                    </div>
                  </>
                ) : (
                  /* Default placeholder for products without images */
                  <div className="w-full h-full flex items-center justify-center bg-brand-primary text-white">
                    <Package className="w-4 h-4" />
                  </div>
                )}
              </div>
              <div>
                <h4 className="font-medium text-brand-gray-900">{getSelectedProduct()?.produktnavn}</h4>
                <div className="text-sm text-brand-gray-600">
                  {(() => {
                    const currentPricing = getCustomerPricing();
                    if (currentPricing.price > 0) {
                      return (
                        <>
                          {currentPricing.hasDiscount ? (
                            <>
                              <span className="line-through text-brand-gray-400 mr-2">
                                {new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK' }).format(currentPricing.originalPrice || 0)}
                              </span>
                              <span className="font-medium text-brand-primary">
                                {new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK' }).format(currentPricing.price)}
                              </span>
                            </>
                          ) : (
                            <span className="font-medium text-brand-primary">
                              {new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK' }).format(currentPricing.price)}
                            </span>
                          )}
                          <span className="ml-1">({currentPricing.label})</span>
                        </>
                      );
                    }
                    return <span>Valgt produkt</span>;
                  })()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-brand-gray-400" />
          <Input
            placeholder="Søg firmanavn eller kontaktperson..."
            value={customerSearch}
            onChange={(e) => setCustomerSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="relative">
          <select
            value={selectedDiscountGroup || "all"}
            onChange={(e) => {
              const value = e.target.value;
              setSelectedDiscountGroup(value === "all" ? "" : value);
            }}
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
          >
            <option value="all">Alle rabatgrupper</option>
            {discountGroups.length > 0 ? discountGroups.map(group => {
              const groupId = group._id || group.id;
              return (
                <option key={groupId} value={groupId}>
                  {group.name}
                </option>
              );
            }) : (
              <option value="loading" disabled>Indlæser rabatgrupper...</option>
            )}
          </select>
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <svg className="h-4 w-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Customers List */}
      <div className="max-h-[400px] overflow-y-auto border border-brand-gray-200 rounded-lg">
        {loadingCustomers ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-primary"></div>
            <span className="ml-2">Indlæser kunder...</span>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-8 text-center text-brand-gray-500">
            <Users className="h-12 w-12 mx-auto mb-3 text-brand-gray-300" />
            <p>Ingen kunder fundet</p>
            <p className="text-sm">Prøv at justere dine filtre</p>
          </div>
        ) : (
          <div className="divide-y divide-brand-gray-100">
            {filteredCustomers.map(customer => (
              <button
                key={customer._id}
                type="button"
                onClick={() => {
                  const customerId = customer._id || customer.id;
                  setOfferData(prev => ({ ...prev, customerId }));
                  
                  // If already in details step and price is empty or standard price, update with customer price
                  if (currentStep === 'details') {
                    const product = getSelectedProduct();
                    if (product) {
                      const selectedCustomer = customers.find(c => {
                        const cId = c._id || c.id;
                        return cId === customerId;
                      });
                      if (selectedCustomer?.discountGroup) {
                        const discountGroupId = selectedCustomer.discountGroup._id || selectedCustomer.discountGroup.id;
                        const discountGroup = discountGroups.find(g => (g._id || g.id) === discountGroupId);
                        if (discountGroup && discountGroup.discountPercentage > 0) {
                          const discountAmount = (product.basispris * discountGroup.discountPercentage) / 100;
                          const discountedPrice = product.basispris - discountAmount;
                          
                          // Update price if it's empty or if it's the standard price
                          const currentPrice = parseFloat(offerData.fixedPrice);
                          if (!offerData.fixedPrice || Math.abs(currentPrice - product.basispris) < 0.01) {
                            setOfferData(prevData => ({ 
                              ...prevData, 
                              fixedPrice: discountedPrice.toFixed(2)
                            }));
                          }
                        }
                      }
                    }
                  }
                }}
                className={cn(
                  "w-full p-4 text-left hover:bg-brand-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary/20",
                  offerData.customerId === (customer._id || customer.id) && "bg-brand-primary/10 border-l-4 border-brand-primary"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "p-3 rounded-lg",
                    offerData.customerId === (customer._id || customer.id) ? "bg-brand-primary text-white" : "bg-brand-gray-100 text-brand-gray-600"
                  )}>
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-brand-gray-900 truncate">
                      {customer.companyName}
                    </div>
                    <div className="text-sm text-brand-gray-500 truncate mt-1">
                      {customer.contactPersonName}
                    </div>
                    {customer.discountGroup && (
                      <Badge variant="outline" className="mt-2 text-xs">
                        {customer.discountGroup.name}
                      </Badge>
                    )}
                  </div>
                  {offerData.customerId === (customer._id || customer.id) && (
                    <CheckCircle2 className="h-5 w-5 text-brand-primary" />
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderDetailsStep = () => (
    <div className="space-y-10">
      <div className="text-center">
        <div className="h-12 w-12 text-brand-primary mx-auto mb-6 flex items-center justify-center bg-brand-primary/10 rounded-full">
          <Calendar className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-semibold text-brand-gray-900 mb-3">Tilbudsdetaljer</h3>
        <p className="text-brand-gray-600">Angiv pris og gyldighedsperiode for tilbuddet</p>
      </div>

      {/* Selected Items Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="bg-brand-gray-50 border-brand-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              {/* Product Image */}
              <div className="w-12 h-12 flex-shrink-0 rounded-lg border border-brand-gray-200 overflow-hidden bg-brand-gray-100 relative">
                {getSelectedProduct()?.billeder && getSelectedProduct()!.billeder!.length > 0 ? (
                  <>
                    <img
                      src={getSelectedProduct()!.billeder!.find(img => img.isPrimary)?.url || getSelectedProduct()!.billeder![0]?.url}
                      alt={getSelectedProduct()?.produktnavn}
                      className="w-full h-full object-cover"
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
                      className="image-placeholder absolute inset-0 w-full h-full flex items-center justify-center bg-brand-primary text-white"
                      style={{ display: 'none' }}
                    >
                      <Package className="w-4 h-4" />
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-brand-primary text-white">
                    <Package className="w-4 h-4" />
                  </div>
                )}
              </div>
              <div>
                <h4 className="font-medium text-brand-gray-900">{getSelectedProduct()?.produktnavn}</h4>
                <div className="text-sm text-brand-gray-600">
                  {(() => {
                    const currentPricing = getCustomerPricing();
                    return (
                      <>
                        {currentPricing.hasDiscount ? (
                          <>
                            <span className="line-through text-brand-gray-400 mr-2">
                              {new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK' }).format(currentPricing.originalPrice || 0)}
                            </span>
                            <span className="font-medium text-brand-primary">
                              {new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK' }).format(currentPricing.price)}
                            </span>
                          </>
                        ) : (
                          <span className="font-medium text-brand-primary">
                            {new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK' }).format(currentPricing.price)}
                          </span>
                        )}
                        <span className="ml-1">({currentPricing.label})</span>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-brand-gray-50 border-brand-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-primary text-white rounded-lg">
                <Building2 className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-medium text-brand-gray-900">{getSelectedCustomer()?.companyName}</h4>
                <p className="text-sm text-brand-gray-600">{getSelectedCustomer()?.contactPersonName}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Price Input */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Label className="text-lg font-semibold text-brand-gray-900">Unikt Tilbudspris *</Label>
          {(() => {
            const currentPricing = getCustomerPricing();
            const currentPrice = parseFloat(offerData.fixedPrice);
            const customerPrice = currentPricing.price;
            
            // Show button if customer has discount or if current price doesn't match customer price
            if (customerPrice > 0 && Math.abs(customerPrice - currentPrice) > 0.01) {
              return (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setOfferData(prev => ({ 
                    ...prev, 
                    fixedPrice: customerPrice.toFixed(2)
                  }))}
                  className="text-brand-primary border-brand-primary hover:bg-brand-primary hover:text-white text-xs"
                >
                  Brug {currentPricing.label}: {new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK' }).format(customerPrice)}
                </Button>
              );
            }
            return null;
          })()}
        </div>
        <div className="relative">
          <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-brand-gray-400 text-base font-medium">kr</span>
          <Input
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0,00"
            value={offerData.fixedPrice}
            onChange={(e) => setOfferData(prev => ({ ...prev, fixedPrice: e.target.value }))}
            className="pl-12 pr-16 h-16 text-xl border-2 focus:border-brand-primary rounded-lg"
          />
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-brand-gray-500 text-base font-medium">
            DKK
          </div>
        </div>
        {offerData.fixedPrice && getSelectedProduct() && (
          <div className="text-base text-brand-gray-600 bg-brand-gray-50 p-4 rounded-lg border">
            {(() => {
              const currentPricing = getCustomerPricing();
              const customerPrice = currentPricing.price;
              const offerPrice = parseFloat(offerData.fixedPrice);
              const savings = customerPrice - offerPrice;
              const savingsPercentage = Math.round((savings / customerPrice) * 100);
              
              return (
                <>
                  <strong>Besparelse fra {currentPricing.label}:</strong> {new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK' }).format(savings)} ({savingsPercentage}%)
                  {currentPricing.hasDiscount && (
                    <div className="text-sm text-brand-gray-500 mt-1">
                      Samlet besparelse fra standard pris: {new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK' }).format(
                        (currentPricing.originalPrice || 0) - offerPrice
                      )} ({Math.round(((currentPricing.originalPrice || 0) - offerPrice) / (currentPricing.originalPrice || 1) * 100)}%)
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </div>

      {/* Description */}
      <div className="space-y-6">
        <Label className="text-lg font-semibold text-brand-gray-900">Beskrivelse (valgfri)</Label>
        <Textarea
          placeholder="Beskrivelse af tilbuddet..."
          value={offerData.description}
          onChange={(e) => setOfferData(prev => ({ ...prev, description: e.target.value }))}
          rows={4}
          className="resize-none text-base p-4 border-2 focus:border-brand-primary rounded-lg"
        />
      </div>

      {/* Validity Period */}
      <div className="space-y-6">
        <Label className="text-lg font-semibold text-brand-gray-900">Gyldighedsperiode</Label>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="validFrom" className="text-base font-medium text-brand-gray-700">Gyldig fra</Label>
            <Input
              id="validFrom"
              type="date"
              value={offerData.validFrom}
              min={new Date().toISOString().split('T')[0]} // Prevent past dates
              onChange={(e) => {
                const newValidFrom = e.target.value;
                setOfferData(prev => {
                  // If validTo is set and is before or equal to new validFrom, clear it
                  const validToDate = prev.validTo ? new Date(prev.validTo) : null;
                  const validFromDate = new Date(newValidFrom);
                  
                  if (validToDate && validToDate <= validFromDate) {
                    return { ...prev, validFrom: newValidFrom, validTo: '' };
                  }
                  
                  return { ...prev, validFrom: newValidFrom };
                });
              }}
              className="h-12 text-base border-2 focus:border-brand-primary"
            />
          </div>
          
          {!offerData.isUnlimited && (
            <div className="space-y-2">
              <Label htmlFor="validTo" className="text-base font-medium text-brand-gray-700">Gyldig til</Label>
              <Input
                id="validTo"
                type="date"
                value={offerData.validTo}
                min={(() => {
                  if (!offerData.validFrom) return new Date().toISOString().split('T')[0];
                  
                  const validFromDate = new Date(offerData.validFrom);
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
                onChange={(e) => setOfferData(prev => ({ ...prev, validTo: e.target.value }))}
                className="h-12 text-base border-2 focus:border-brand-primary"
              />
              {offerData.validFrom && (
                <p className="text-xs text-brand-gray-500">
                  {(() => {
                    const validFromDate = new Date(offerData.validFrom);
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
          )}
        </div>
        
        {/* Unlimited Toggle */}
        <div className="flex items-center space-x-4 p-6 bg-brand-gray-50 rounded-lg border border-brand-gray-200">
          <Switch
            id="unlimited-toggle"
            checked={offerData.isUnlimited}
            onCheckedChange={(checked) => setOfferData(prev => ({ 
              ...prev, 
              isUnlimited: checked,
              validTo: checked ? '' : prev.validTo
            }))}
          />
          <div className="flex items-center gap-2">
            <Infinity className="h-4 w-4 text-brand-primary" />
            <div>
              <Label htmlFor="unlimited-toggle" className="text-sm font-medium text-brand-gray-900">
                Tidsubegrænset tilbud
              </Label>
              <p className="text-xs text-brand-gray-500">Tilbuddet udløber aldrig</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderConfirmationStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <CheckCircle2 className="h-12 w-12 text-brand-primary mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-brand-gray-900 mb-2">Bekræft Tilbud</h3>
        <p className="text-brand-gray-600">Gennemgå og bekræft dit unikke tilbud</p>
      </div>

      {/* Summary */}
      <Card className="border-2 border-brand-primary/20">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-medium text-brand-gray-700">Produkt:</span>
            <span className="font-semibold text-brand-gray-900">{getSelectedProduct()?.produktnavn}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="font-medium text-brand-gray-700">Kunde:</span>
            <span className="font-semibold text-brand-gray-900">{getSelectedCustomer()?.companyName}</span>
          </div>
          
          {(() => {
            const currentPricing = getCustomerPricing();
            return (
              <>
                {currentPricing.hasDiscount && (
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-brand-gray-700">Standard pris:</span>
                    <span className="text-brand-gray-400 line-through">
                      {new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK' }).format(currentPricing.originalPrice || 0)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="font-medium text-brand-gray-700">{currentPricing.label}:</span>
                  <span className="text-brand-gray-600 line-through">
                    {new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK' }).format(currentPricing.price)}
                  </span>
                </div>
              </>
            );
          })()}
          
          <div className="flex items-center justify-between">
            <span className="font-medium text-brand-gray-700">Tilbudspris:</span>
            <span className="font-bold text-2xl text-brand-primary">
              {new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK' }).format(parseFloat(offerData.fixedPrice))}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="font-medium text-brand-gray-700">Besparelse:</span>
            <span className="font-semibold text-brand-success">
              {(() => {
                const currentPricing = getCustomerPricing();
                const savings = currentPricing.price - parseFloat(offerData.fixedPrice);
                const savingsPercentage = Math.round((savings / currentPricing.price) * 100);
                return `${new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK' }).format(savings)} (${savingsPercentage}%)`;
              })()}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="font-medium text-brand-gray-700">Gyldig fra:</span>
            <span className="text-brand-gray-900">{new Date(offerData.validFrom).toLocaleDateString('da-DK')}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="font-medium text-brand-gray-700">Gyldig til:</span>
            <span className="text-brand-gray-900">
              {offerData.isUnlimited ? (
                <Badge variant="outline" className="text-brand-primary border-brand-primary">
                  <Infinity className="h-3 w-3 mr-1" />
                  Tidsubegrænset
                </Badge>
              ) : (
                offerData.validTo ? new Date(offerData.validTo).toLocaleDateString('da-DK') : 'Ikke angivet'
              )}
            </span>
          </div>
          
          {offerData.description && (
            <div className="pt-2 border-t border-brand-gray-200">
              <span className="font-medium text-brand-gray-700">Beskrivelse:</span>
              <p className="text-brand-gray-900 mt-1">{offerData.description}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'product':
        return renderProductStep();
      case 'customer':
        return renderCustomerStep();
      case 'details':
        return renderDetailsStep();
      case 'confirmation':
        return renderConfirmationStep();
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-brand-primary" />
            Opret Unikt Tilbud
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto">
          {renderStepIndicator()}
          {renderCurrentStep()}
        </div>
        
        <div className="flex-shrink-0 flex justify-between pt-4 border-t border-brand-gray-200">
          <Button
            variant="outline"
            onClick={currentStep === 'product' && !preselectedProduct ? onClose : handleBack}
            disabled={isSubmitting}
            className="flex items-center gap-2"
          >
            {currentStep === 'product' && !preselectedProduct ? (
              <>
                <X className="h-4 w-4" />
                Annuller
              </>
            ) : (
              <>
                <ArrowLeft className="h-4 w-4" />
                Tilbage
              </>
            )}
          </Button>
          
          <Button
            onClick={currentStep === 'confirmation' ? handleSubmit : handleNext}
            disabled={!canProceedFromStep(currentStep) || isSubmitting}
            className="btn-brand-primary flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Opretter...
              </>
            ) : currentStep === 'confirmation' ? (
              <>
                <Star className="h-4 w-4" />
                Opret Tilbud
              </>
            ) : (
              <>
                Næste
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UniqueOfferWizard; 