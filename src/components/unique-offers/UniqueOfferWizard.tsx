import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  companyName: string;
  contactPersonName: string;
  email: string;
  isActive: boolean;
  discountGroup?: {
    _id: string;
    name: string;
  };
}

interface Category {
  _id: string;
  navn: string;
}

interface DiscountGroup {
  _id: string;
  name: string;
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

// COMPLETELY ISOLATED CATEGORY SYSTEM - NO RECURSION POSSIBLE
const SAFE_CATEGORIES_CACHE = new Map<string, Category[]>();
const SAFE_PRODUCTS_CACHE = new Map<string, Product[]>();
const SAFE_CUSTOMERS_CACHE = new Map<string, Customer[]>();
const SAFE_DISCOUNT_GROUPS_CACHE = new Map<string, DiscountGroup[]>();

let CATEGORIES_LOADED = false;
let PRODUCTS_LOADED = false;
let CUSTOMERS_LOADED = false;
let DISCOUNT_GROUPS_LOADED = false;

const UniqueOfferWizard: React.FC<UniqueOfferWizardProps> = ({
  isOpen,
  onClose,
  onSuccess,
  preselectedProduct
}) => {
  const { toast } = useToast();
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState<WizardStep>('product');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Data state
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [discountGroups, setDiscountGroups] = useState<DiscountGroup[]>([]);
  
  // Loading states
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  
  // Filter states
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

  // Load initial data
  useEffect(() => {
    if (isOpen) {
      if (!preselectedProduct) {
        loadProducts();
      }
      loadCustomers();
      loadDiscountGroups();
      
      // Set initial step based on preselected product
      setCurrentStep(preselectedProduct ? 'customer' : 'product');
    }
  }, [isOpen, preselectedProduct]);

  // NUCLEAR SAFE CATEGORY LOADING - NO RECURSION POSSIBLE
  const loadCategoriesSafe = useCallback(async () => {
    if (CATEGORIES_LOADED && SAFE_CATEGORIES_CACHE.has('categories')) {
      setCategories(SAFE_CATEGORIES_CACHE.get('categories') || []);
      return;
    }

    if (loadingCategories) return;

    try {
      setLoadingCategories(true);
      const response = await authService.apiClient.get('/.netlify/functions/categories');
      const data = await response.json();
      
      if (data.success && data.data) {
        const categoriesArray = Array.isArray(data.data) ? data.data : (data.data.categories || []);
        SAFE_CATEGORIES_CACHE.set('categories', categoriesArray);
        setCategories(categoriesArray);
        CATEGORIES_LOADED = true;
      }
    } catch (error) {
      // Silent error handling to prevent recursion
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  }, [loadingCategories]);

  // SAFE PRODUCT LOADING WITH CACHING
  const loadProducts = useCallback(async () => {
    if (PRODUCTS_LOADED && SAFE_PRODUCTS_CACHE.has('products')) {
      setProducts(SAFE_PRODUCTS_CACHE.get('products') || []);
      return;
    }

    if (loadingProducts) return;

    try {
      setLoadingProducts(true);
      const response = await authService.apiClient.get('/.netlify/functions/products?limit=500&aktiv=true');
      const data = await response.json();
      
      if (data.success && data.data) {
        const productsArray = Array.isArray(data.data) ? data.data : data.data.products || [];
        const activeProducts = productsArray.filter((p: Product) => p.aktiv);
        SAFE_PRODUCTS_CACHE.set('products', activeProducts);
        setProducts(activeProducts);
        PRODUCTS_LOADED = true;
      }
    } catch (error) {
      // Silent error handling to prevent recursion
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  }, [loadingProducts]);

  // SAFE CUSTOMER LOADING WITH CACHING
  const loadCustomers = useCallback(async () => {
    if (CUSTOMERS_LOADED && SAFE_CUSTOMERS_CACHE.has('customers')) {
      setCustomers(SAFE_CUSTOMERS_CACHE.get('customers') || []);
      return;
    }

    if (loadingCustomers) return;

    try {
      setLoadingCustomers(true);
      const response = await authService.getAllCustomers();
      if (response.success) {
        const customerList = response.customers?.filter((c: Customer) => c.isActive) || [];
        SAFE_CUSTOMERS_CACHE.set('customers', customerList);
        setCustomers(customerList);
        CUSTOMERS_LOADED = true;
      }
    } catch (error) {
      // Silent error handling to prevent recursion
      setCustomers([]);
    } finally {
      setLoadingCustomers(false);
    }
  }, [loadingCustomers]);

  // SAFE DISCOUNT GROUPS LOADING WITH CACHING
  const loadDiscountGroups = useCallback(async () => {
    if (DISCOUNT_GROUPS_LOADED && SAFE_DISCOUNT_GROUPS_CACHE.has('discountGroups')) {
      setDiscountGroups(SAFE_DISCOUNT_GROUPS_CACHE.get('discountGroups') || []);
      return;
    }

    try {
      const response = await authService.getDiscountGroups();
      if (response.success) {
        const groups = (response.discountGroups as DiscountGroup[]) || [];
        SAFE_DISCOUNT_GROUPS_CACHE.set('discountGroups', groups);
        setDiscountGroups(groups);
        DISCOUNT_GROUPS_LOADED = true;
      }
    } catch (error) {
      // Silent error handling to prevent recursion
      setDiscountGroups([]);
    }
  }, []);

  // SINGLE LOAD EFFECT - NO RECURSION - DEBOUNCED
  useEffect(() => {
    if (isOpen) {
      // Debounce the loading to prevent excessive API calls
      const timeoutId = setTimeout(() => {
        loadCategoriesSafe();
        loadProducts();
        loadCustomers();
        loadDiscountGroups();
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [isOpen]);

  const handleNext = () => {
    const steps: WizardStep[] = ['product', 'customer', 'details', 'confirmation'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
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
        toast({
          title: 'Fejl',
          description: response.message || 'Kunne ikke oprette tilbud',
          variant: 'destructive'
        });
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
    return customers.find(c => (c._id || (c as any).id) === offerData.customerId);
  };

  // Memoized filtered arrays to prevent infinite re-renders
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.produktnavn.toLowerCase().includes(productSearch.toLowerCase()) ||
                           product.varenummer?.toLowerCase().includes(productSearch.toLowerCase());
      const matchesCategory = !selectedCategory || selectedCategory === 'all' || product.kategori?._id === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, productSearch, selectedCategory]);

  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => {
      const matchesSearch = customer.companyName.toLowerCase().includes(customerSearch.toLowerCase()) ||
                           customer.contactPersonName.toLowerCase().includes(customerSearch.toLowerCase());
      const matchesGroup = !selectedDiscountGroup || selectedDiscountGroup === 'all' || customer.discountGroup?._id === selectedDiscountGroup;
      return matchesSearch && matchesGroup;
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
        <Select 
          value={selectedCategory || "all"} 
          onValueChange={(value) => {
            setSelectedCategory(value === "all" ? "" : value);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Vælg kategori">
              {selectedCategory ? 
                categories.find(c => c._id === selectedCategory)?.navn || "Alle kategorier" : 
                "Alle kategorier"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle kategorier</SelectItem>
            {loadingCategories ? (
              <SelectItem value="loading" disabled>Indlæser kategorier...</SelectItem>
            ) : categories && categories.length > 0 ? (
              categories.map(category => (
                <SelectItem key={category._id} value={category._id}>
                  {category.navn}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="no-categories" disabled>Ingen kategorier tilgængelige</SelectItem>
            )}
          </SelectContent>
        </Select>
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
                            target.style.display = 'none';
                            const placeholder = target.parentElement?.querySelector('.image-placeholder') as HTMLElement;
                            if (placeholder) {
                              placeholder.style.display = 'flex';
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
                        target.style.display = 'none';
                        const placeholder = target.parentElement?.querySelector('.image-placeholder') as HTMLElement;
                        if (placeholder) {
                          placeholder.style.display = 'flex';
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
                <p className="text-sm text-brand-gray-600">Valgt produkt</p>
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
        <Select 
          value={selectedDiscountGroup || "all"} 
          onValueChange={(value) => {
            setSelectedDiscountGroup(value === "all" ? "" : value);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Vælg rabatgruppe">
              {selectedDiscountGroup ? 
                discountGroups.find(g => g._id === selectedDiscountGroup)?.name || "Alle rabatgrupper" : 
                "Alle rabatgrupper"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle rabatgrupper</SelectItem>
            {discountGroups && discountGroups.length > 0 ? discountGroups.map(group => (
              <SelectItem key={group._id} value={group._id}>
                {group.name}
              </SelectItem>
            )) : (
              <SelectItem value="loading" disabled>Indlæser rabatgrupper...</SelectItem>
            )}
          </SelectContent>
        </Select>
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
                  const customerId = customer._id || (customer as any).id;
                  setOfferData(prev => ({ ...prev, customerId }));
                }}
                className={cn(
                  "w-full p-4 text-left hover:bg-brand-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary/20",
                  offerData.customerId === (customer._id || (customer as any).id) && "bg-brand-primary/10 border-l-4 border-brand-primary"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "p-3 rounded-lg",
                    offerData.customerId === (customer._id || (customer as any).id) ? "bg-brand-primary text-white" : "bg-brand-gray-100 text-brand-gray-600"
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
                  {offerData.customerId === (customer._id || (customer as any).id) && (
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
                        target.style.display = 'none';
                        const placeholder = target.parentElement?.querySelector('.image-placeholder') as HTMLElement;
                        if (placeholder) placeholder.style.display = 'flex';
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
                  {new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK' }).format(getSelectedProduct()?.basispris || 0)}
                  {getSelectedCustomer()?.discountGroup ? (
                    <span className="ml-1">({getSelectedCustomer()!.discountGroup!.name} pris)</span>
                  ) : (
                    <span className="ml-1">(standard pris)</span>
                  )}
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
        <Label className="text-lg font-semibold text-brand-gray-900">Unikt Tilbudspris *</Label>
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
            <strong>Besparelse:</strong> {new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK' }).format(
              getSelectedProduct()!.basispris - parseFloat(offerData.fixedPrice)
            )} ({Math.round(((getSelectedProduct()!.basispris - parseFloat(offerData.fixedPrice)) / getSelectedProduct()!.basispris) * 100)}%)
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
              onChange={(e) => setOfferData(prev => ({ ...prev, validFrom: e.target.value }))}
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
                onChange={(e) => setOfferData(prev => ({ ...prev, validTo: e.target.value }))}
                className="h-12 text-base border-2 focus:border-brand-primary"
              />
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
          
          <div className="flex items-center justify-between">
            <span className="font-medium text-brand-gray-700">Normal pris:</span>
            <span className="text-brand-gray-600 line-through">
              {new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK' }).format(getSelectedProduct()?.basispris || 0)}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="font-medium text-brand-gray-700">Tilbudspris:</span>
            <span className="font-bold text-2xl text-brand-primary">
              {new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK' }).format(parseFloat(offerData.fixedPrice))}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="font-medium text-brand-gray-700">Besparelse:</span>
            <span className="font-semibold text-brand-success">
              {new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK' }).format(
                (getSelectedProduct()?.basispris || 0) - parseFloat(offerData.fixedPrice)
              )} ({Math.round((((getSelectedProduct()?.basispris || 0) - parseFloat(offerData.fixedPrice)) / (getSelectedProduct()?.basispris || 1)) * 100)}%)
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