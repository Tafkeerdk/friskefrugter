import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star, Search, Package, Tags, CheckCircle2, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { authService } from '@/lib/auth';
import { api } from '@/lib/api';

interface Customer {
  _id: string;
  companyName: string;
  contactPersonName: string;
  email: string;
  isActive: boolean;
}

interface Product {
  _id: string;
  produktnavn: string;
  varenummer?: string;
  basispris: number;
  kategori?: {
    navn: string;
  };
  aktiv: boolean;
}

interface UniqueOfferForm {
  customerId: string;
  productId: string;
  fixedPrice: string;
  description: string;
  validFrom: string;
  validTo: string;
  isUnlimited: boolean;
}

interface UniqueOfferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  createdProduct?: any;
  onSuccess?: () => void;
}

export const UniqueOfferDialog: React.FC<UniqueOfferDialogProps> = ({
  open,
  onOpenChange,
  createdProduct,
  onSuccess
}) => {
  const { toast } = useToast();
  
  // State for customers and products
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  
  // Form state
  const [uniqueOfferForm, setUniqueOfferForm] = useState<UniqueOfferForm>({
    customerId: '',
    productId: '',
    fixedPrice: '',
    description: '',
    validFrom: new Date().toISOString().split('T')[0],
    validTo: '',
    isUnlimited: false
  });
  
  const [isCreatingUniqueOffer, setIsCreatingUniqueOffer] = useState(false);

  // Load customers and products when dialog opens
  useEffect(() => {
    if (open) {
      loadCustomersForUniqueOffer();
      if (!createdProduct) {
        loadProductsForUniqueOffer();
      } else {
        // If we have a created product, set it as selected
        setUniqueOfferForm(prev => ({ ...prev, productId: createdProduct._id || createdProduct.id }));
      }
    }
  }, [open, createdProduct]);

  // Load customers for unique offer creation
  const loadCustomersForUniqueOffer = async () => {
    try {
      setLoadingCustomers(true);
      const response = await authService.getCustomers({ limit: 1000, isActive: true });
      
      if (response.success && response.data) {
        const responseData = response.data as any;
        const customersArray = Array.isArray(responseData) 
          ? responseData 
          : responseData.customers || [];
          
        const activeCustomers = customersArray.filter((c: any) => c.isActive !== false);
        setCustomers(activeCustomers);
      } else {
        setCustomers([]);
        toast({
          title: 'Fejl ved indlæsning',
          description: 'Kunne ikke indlæse kunder. Prøv igen.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error loading customers:', error);
      setCustomers([]);
      toast({
        title: 'Fejl ved indlæsning',
        description: 'Der opstod en fejl ved indlæsning af kunder.',
        variant: 'destructive'
      });
    } finally {
      setLoadingCustomers(false);
    }
  };

  // Load products for unique offer creation
  const loadProductsForUniqueOffer = async () => {
    try {
      setLoadingProducts(true);
      const response = await api.getProducts({ 
        limit: 1000,
        aktiv: true
      });
      
      if (response.success && response.data) {
        const responseData = response.data as any;
        const productsArray = Array.isArray(responseData) 
          ? responseData 
          : responseData.products || [];
          
        const activeProducts = productsArray.filter((p: any) => p.aktiv !== false);
        setProducts(activeProducts);
      } else {
        setProducts([]);
        toast({
          title: 'Fejl ved indlæsning',
          description: 'Kunne ikke indlæse produkter. Prøv igen.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error loading products:', error);
      setProducts([]);
      toast({
        title: 'Fejl ved indlæsning',
        description: 'Der opstod en fejl ved indlæsning af produkter.',
        variant: 'destructive'
      });
    } finally {
      setLoadingProducts(false);
    }
  };

  // Handle unique offer creation
  const handleCreateUniqueOffer = async () => {
    const productId = createdProduct?._id || createdProduct?.id || uniqueOfferForm.productId;
    
    if (!productId || !uniqueOfferForm.customerId || !uniqueOfferForm.fixedPrice) {
      toast({
        title: 'Manglende felter',
        description: 'Vælg produkt, kunde og indtast pris for at oprette tilbud.',
        variant: 'destructive'
      });
      return;
    }

    const price = parseFloat(uniqueOfferForm.fixedPrice);
    if (isNaN(price) || price <= 0) {
      toast({
        title: 'Ugyldig pris',
        description: 'Prisen skal være et positivt tal.',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsCreatingUniqueOffer(true);
      
      const offerData = {
        productId,
        customerId: uniqueOfferForm.customerId,
        fixedPrice: price,
        isUnlimited: uniqueOfferForm.isUnlimited,
        ...(uniqueOfferForm.description && { description: uniqueOfferForm.description }),
        ...(uniqueOfferForm.validFrom && { validFrom: uniqueOfferForm.validFrom }),
        ...(!uniqueOfferForm.isUnlimited && uniqueOfferForm.validTo && { validTo: uniqueOfferForm.validTo })
      };
      
      const response = await authService.createUniqueOffer(offerData);
      
      if (response.success) {
        toast({
          title: 'Unikt tilbud oprettet',
          description: 'Tilbuddet er oprettet succesfuldt og er nu aktivt.',
          variant: 'default'
        });
        
        onOpenChange(false);
        resetUniqueOfferForm();
        onSuccess?.();
      } else {
        toast({
          title: 'Fejl',
          description: response.message || 'Kunne ikke oprette tilbud.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error creating unique offer:', error);
      toast({
        title: 'Fejl',
        description: 'Der opstod en fejl. Prøv igen.',
        variant: 'destructive'
      });
    } finally {
      setIsCreatingUniqueOffer(false);
    }
  };

  // Reset unique offer form
  const resetUniqueOfferForm = () => {
    setUniqueOfferForm({
      customerId: '',
      productId: '',
      fixedPrice: '',
      description: '',
      validFrom: new Date().toISOString().split('T')[0],
      validTo: '',
      isUnlimited: false
    });
  };

  // Skip unique offer creation
  const handleSkipUniqueOffer = () => {
    onOpenChange(false);
    resetUniqueOfferForm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-brand-primary" />
            Opret Unikt Tilbud
          </DialogTitle>
          <DialogDescription>
            {createdProduct ? (
              <>Produktet "{createdProduct?.produktnavn}" er oprettet! Opret nu et specialtilbud for en specifik kunde.</>
            ) : (
              <>Opret et specialtilbud med kundespecifik pris for et produkt.</>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          {/* Product Selection - Enhanced UX */}
          {!createdProduct && (
            <div className="space-y-3">
              <Label className="text-base font-semibold text-brand-gray-900">Vælg Produkt *</Label>
              
              {/* Improved Product Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-brand-gray-400" />
                <Input
                  placeholder="Søg produktnavn eller varenummer..."
                  value={productSearchTerm}
                  onChange={(e) => setProductSearchTerm(e.target.value)}
                  className="pl-10 input-brand"
                />
              </div>

              {/* Product Grid - Better UX than dropdown */}
              <div className="border border-brand-gray-200 rounded-lg max-h-[300px] overflow-y-auto">
                {loadingProducts ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="flex items-center gap-2 text-brand-primary">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-primary"></div>
                      <span>Indlæser produkter...</span>
                    </div>
                  </div>
                ) : (
                  (() => {
                    // Filter products based on search term
                    const filteredProducts = products.filter(product => 
                      product.produktnavn.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
                      product.varenummer?.toLowerCase().includes(productSearchTerm.toLowerCase())
                    );
                    
                    if (filteredProducts.length === 0) {
                      return (
                        <div className="p-8 text-center text-brand-gray-500">
                          <Package className="h-12 w-12 mx-auto mb-3 text-brand-gray-300" />
                          <p>Ingen produkter fundet</p>
                          <p className="text-sm">Prøv at justere din søgning</p>
                        </div>
                      );
                    }
                    
                    // Group products by category
                    const groupedProducts = filteredProducts.reduce((acc: any, product: any) => {
                      const categoryName = product.kategori?.navn || 'Ingen kategori';
                      if (!acc[categoryName]) {
                        acc[categoryName] = [];
                      }
                      acc[categoryName].push(product);
                      return acc;
                    }, {});
                    
                    return (
                      <div className="divide-y divide-brand-gray-100">
                        {Object.entries(groupedProducts).map(([categoryName, categoryProducts]: [string, any]) => (
                          <div key={categoryName}>
                            {/* Category Header */}
                            <div className="sticky top-0 bg-brand-gray-50 px-4 py-2 border-b border-brand-gray-200">
                              <h4 className="text-sm font-semibold text-brand-gray-700 flex items-center gap-2">
                                <Tags className="h-4 w-4" />
                                {categoryName} ({categoryProducts.length})
                              </h4>
                            </div>
                            
                            {/* Products in Category */}
                            <div className="divide-y divide-brand-gray-50">
                              {categoryProducts.map((product: any) => (
                                <button
                                  key={product._id}
                                  type="button"
                                  onClick={() => setUniqueOfferForm(prev => ({ ...prev, productId: product._id }))}
                                  className={cn(
                                    "w-full p-4 text-left hover:bg-brand-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary/20",
                                    uniqueOfferForm.productId === product._id && "bg-brand-primary/10 border-l-4 border-brand-primary"
                                  )}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={cn(
                                      "p-2 rounded-lg",
                                      uniqueOfferForm.productId === product._id ? "bg-brand-primary text-white" : "bg-brand-gray-100 text-brand-gray-600"
                                    )}>
                                      <Package className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium text-brand-gray-900 truncate">
                                        {product.produktnavn}
                                      </div>
                                      <div className="text-sm text-brand-gray-500 flex items-center gap-2">
                                        <span>{product.varenummer}</span>
                                        <span>•</span>
                                        <span className="font-medium text-brand-primary">
                                          {new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK' }).format(product.basispris)}
                                        </span>
                                      </div>
                                    </div>
                                    {uniqueOfferForm.productId === product._id && (
                                      <div className="text-brand-primary">
                                        <CheckCircle2 className="h-5 w-5" />
                                      </div>
                                    )}
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()
                )}
              </div>
            </div>
          )}
          
          {/* Selected Product Display */}
          {(createdProduct || uniqueOfferForm.productId) && (
            <div className="bg-brand-gray-50 border border-brand-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-primary text-white rounded-lg">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-brand-gray-900">
                    {createdProduct ? createdProduct.produktnavn : products.find(p => p._id === uniqueOfferForm.productId)?.produktnavn}
                  </h4>
                  <p className="text-sm text-brand-gray-600">
                    Valgt produkt for unikt tilbud
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Customer Selection - Simplified */}
          <div className="space-y-3">
            <Label className="text-base font-semibold text-brand-gray-900">Vælg Kunde *</Label>
            <Select 
              value={uniqueOfferForm.customerId} 
              onValueChange={(value) => setUniqueOfferForm(prev => ({ ...prev, customerId: value }))}
            >
              <SelectTrigger className="h-12 input-brand">
                <SelectValue placeholder="Vælg en kunde..." />
              </SelectTrigger>
              <SelectContent className="max-h-[250px]">
                {loadingCustomers ? (
                  <div className="flex items-center justify-center p-4">
                    <div className="flex items-center gap-2 text-brand-primary">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-primary"></div>
                      <span>Indlæser kunder...</span>
                    </div>
                  </div>
                ) : (
                  customers.map(customer => (
                    <SelectItem key={customer._id} value={customer._id} className="py-2">
                      {customer.companyName} - {customer.contactPersonName}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          
          {/* Price Input - Enhanced */}
          <div className="space-y-3">
            <Label className="text-base font-semibold text-brand-gray-900">Fast Pris *</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-brand-gray-400" />
              <Input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0,00"
                value={uniqueOfferForm.fixedPrice}
                onChange={(e) => setUniqueOfferForm(prev => ({ ...prev, fixedPrice: e.target.value }))}
                className="pl-10 h-12 input-brand text-lg"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-brand-gray-500 text-sm">
                DKK
              </div>
            </div>
          </div>
          
          {/* Description */}
          <div className="space-y-3">
            <Label className="text-base font-semibold text-brand-gray-900">Beskrivelse</Label>
            <Textarea
              placeholder="Valgfri beskrivelse af tilbuddet..."
              value={uniqueOfferForm.description}
              onChange={(e) => setUniqueOfferForm(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="input-brand resize-none"
            />
          </div>
          
          {/* Validity Period - Enhanced */}
          <div className="space-y-4">
            <Label className="text-base font-semibold text-brand-gray-900">Gyldighedsperiode</Label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="unique-validFrom" className="text-sm text-brand-gray-600">Gyldig fra</Label>
                <Input
                  id="unique-validFrom"
                  type="date"
                  value={uniqueOfferForm.validFrom}
                  onChange={(e) => setUniqueOfferForm(prev => ({ ...prev, validFrom: e.target.value }))}
                  className="input-brand"
                />
              </div>
              
              {!uniqueOfferForm.isUnlimited && (
                <div>
                  <Label htmlFor="unique-validTo" className="text-sm text-brand-gray-600">Gyldig til</Label>
                  <Input
                    id="unique-validTo"
                    type="date"
                    value={uniqueOfferForm.validTo}
                    onChange={(e) => setUniqueOfferForm(prev => ({ ...prev, validTo: e.target.value }))}
                    className="input-brand"
                  />
                </div>
              )}
            </div>
            
            {/* Unlimited Toggle */}
            <div className="flex items-center space-x-3 p-3 bg-brand-gray-50 rounded-lg border border-brand-gray-200">
              <Switch
                id="unlimited-toggle"
                checked={uniqueOfferForm.isUnlimited}
                onCheckedChange={(checked) => setUniqueOfferForm(prev => ({ 
                  ...prev, 
                  isUnlimited: checked,
                  validTo: checked ? '' : prev.validTo
                }))}
              />
              <div>
                <Label htmlFor="unlimited-toggle" className="text-sm font-medium text-brand-gray-900">
                  Tidsubegrænset tilbud
                </Label>
                <p className="text-xs text-brand-gray-500">Tilbuddet udløber aldrig</p>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter className="flex-shrink-0 flex gap-3 pt-4 border-t border-brand-gray-200">
          <Button
            variant="outline"
            onClick={handleSkipUniqueOffer}
            disabled={isCreatingUniqueOffer}
            className="flex-1 h-12"
          >
            {createdProduct ? 'Spring over' : 'Annuller'}
          </Button>
          <Button
            onClick={handleCreateUniqueOffer}
            disabled={
              isCreatingUniqueOffer || 
              !uniqueOfferForm.customerId || 
              !uniqueOfferForm.fixedPrice ||
              (!createdProduct && !uniqueOfferForm.productId)
            }
            className="btn-brand-primary flex-1 h-12"
          >
            {isCreatingUniqueOffer ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Opretter...
              </div>
            ) : (
              <>
                <Star className="h-4 w-4 mr-2" />
                Opret Tilbud
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 