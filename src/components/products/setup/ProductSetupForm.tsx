import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { 
  Save, 
  X, 
  CheckCircle2,
  AlertTriangle,
  Warehouse,
  Phone,
  Star
} from 'lucide-react';
import { cn } from '@/lib/utils';

import { ProductFormData, ProductSetupFormProps, Unit } from '@/types/product';
import { productSetupSchema, productEditSchema } from './validation/productSchema';
import { RabatGruppePreview } from './components/RabatGruppePreview';
import { api, productFormDataToFormData, handleApiError } from '@/lib/api';
import { authService } from '@/lib/auth';

// Import section components
import { 
  BasicInformationSection, 
  PricingSection, 
  CategorySection, 
  ImageUploadSection 
} from './sections';
import { UniqueOfferDialog } from './dialogs/UniqueOfferDialog';

// Category interface for API responses
interface Category {
  _id: string;
  navn: string;
  beskrivelse?: string;
  aktiv: boolean;
  productCount?: number;
}

export const ProductSetupForm: React.FC<ProductSetupFormProps> = ({
  initialData,
  productId,
  onSubmit,
  onCancel,
  mode = 'create',
  isLoading = false
}) => {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingUnits, setLoadingUnits] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Unique Offers Integration States
  const [showUniqueOfferDialog, setShowUniqueOfferDialog] = useState(false);
  const [createdProduct, setCreatedProduct] = useState<any>(null);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(mode === 'edit' ? productEditSchema : productSetupSchema),
    defaultValues: {
      produktnavn: initialData?.produktnavn || '',
      varenummer: initialData?.varenummer || '',
      beskrivelse: initialData?.beskrivelse || '',
      eanNummer: initialData?.eanNummer || '',
      enhed: initialData?.enhed || '',
      basispris: initialData?.basispris || 0,
      discount: {
        enabled: initialData?.discount?.enabled || false,
        beforePrice: initialData?.discount?.beforePrice,
        discountPercentage: initialData?.discount?.discountPercentage,
        discountAmount: initialData?.discount?.discountAmount,
        eligibleDiscountGroups: initialData?.discount?.eligibleDiscountGroups || [],
        eligibleCustomers: initialData?.discount?.eligibleCustomers || [],
        showStrikethrough: initialData?.discount?.showStrikethrough !== undefined ? initialData.discount.showStrikethrough : true,
        discountLabel: initialData?.discount?.discountLabel || 'Tilbud',
        validFrom: initialData?.discount?.validFrom,
        validTo: initialData?.discount?.validTo
      },
      kategori: initialData?.kategori || { navn: '', isNew: false },
      lagerstyring: {
        enabled: initialData?.lagerstyring?.enabled || false,
        antalPaaLager: initialData?.lagerstyring?.antalPaaLager,
        minimumslager: initialData?.lagerstyring?.minimumslager
      },
      billeder: initialData?.billeder || [],
      aktiv: initialData?.aktiv !== undefined ? initialData.aktiv : true
    },
    mode: 'onChange'
  });

  const { watch, formState: { errors, isValid, isDirty } } = form;
  const aktivStatus = watch('aktiv');
  const watchedKategori = watch('kategori');

  // Check if form has meaningful changes
  const hasMeaningfulChanges = React.useMemo(() => {
    if (!isDirty) return false;
    
    const currentValues = form.getValues();
    const hasProductChanges = 
      currentValues.produktnavn !== '' ||
      currentValues.beskrivelse !== '' ||
      currentValues.eanNummer !== '' ||
      currentValues.basispris > 0 ||
      (currentValues.kategori?.navn && currentValues.kategori.navn !== '') ||
      currentValues.lagerstyring.enabled ||
      currentValues.billeder.length > 0;
    
    return hasProductChanges;
  }, [isDirty, form]);

  // Load categories and units on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingCategories(true);
        setLoadingUnits(true);

        // Load categories and units in parallel
        const [categoriesResponse, unitsResponse] = await Promise.all([
          api.getCategories({ activeOnly: true }),
          api.getUnits()
        ]);

        if (categoriesResponse.success && categoriesResponse.data) {
          setCategories(categoriesResponse.data as Category[]);
        }

        if (unitsResponse.success && unitsResponse.data) {
          setUnits(unitsResponse.data as Unit[]);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
        toast({
          title: 'Fejl',
          description: 'Kunne ikke indlæse data',
          variant: 'destructive',
          duration: 3000,
        });
      } finally {
        setLoadingCategories(false);
        setLoadingUnits(false);
      }
    };

    loadData();
  }, [toast]);

  // Handle form submission with protection against multiple requests
  const handleSubmit = async (data: ProductFormData) => {
    if (isSubmitting) {
      toast({
        title: 'Vent venligst',
        description: 'Produktet bliver allerede gemt...',
        variant: 'default',
        duration: 2000,
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Separate new uploads from existing images
      const newUploads = data.billeder?.filter(img => !img.isExisting && img.file) || [];
      const existingImages = data.billeder?.filter(img => img.isExisting) || [];
      
      // Convert form data to FormData for API
      const images = newUploads.map(img => img.file!);
      const formData = productFormDataToFormData(data, images, existingImages, []);
      
      let response;
      if (mode === 'create') {
        response = await api.createProduct(formData);
      } else if (mode === 'edit' && productId) {
        response = await api.updateProduct(productId, formData);
      } else {
        throw new Error('Edit mode requires product ID');
      }
      
      if (response.success) {
        toast({
          title: mode === 'create' ? 'Produkt oprettet' : 'Produkt opdateret',
          description: `${data.produktnavn} blev ${mode === 'create' ? 'oprettet' : 'opdateret'} succesfuldt.`,
          duration: 5000,
        });
        
        // Show unique offer dialog only for new products (create mode)
        if (mode === 'create' && response.data) {
          setCreatedProduct(response.data);
          setShowUniqueOfferDialog(true);
        }
        
        onSubmit(data); // Call the parent callback
      } else {
        throw new Error(response.error || 'Unknown error');
      }
    } catch (error: any) {
      const apiError = handleApiError(error);
      toast({
        title: 'Fejl',
        description: apiError.message,
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle unique offer wizard success
  const handleUniqueOfferSuccess = () => {
    setShowUniqueOfferDialog(false);
    setCreatedProduct(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {mode === 'create' ? 'Opret nyt produkt' : 'Rediger produkt'}
          </h1>
          <p className="text-muted-foreground">
            {mode === 'create' 
              ? 'Udfyld formularen for at tilføje et nyt produkt til kataloget' 
              : 'Rediger produktoplysningerne nedenfor'
            }
          </p>
        </div>
        <Badge variant={aktivStatus ? 'default' : 'secondary'}>
          {aktivStatus ? 'Aktiv' : 'Inaktiv'}
        </Badge>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Basic Information Section */}
          <BasicInformationSection 
            form={form}
            isLoading={isLoading}
            productId={productId}
          />

          {/* Pricing and Unit Section */}
          <PricingSection 
            form={form}
            isLoading={isLoading}
            units={units}
            setUnits={setUnits}
            loadingUnits={loadingUnits}
          />

          {/* Rabat Gruppe Preview */}
          <RabatGruppePreview 
            basispris={watch('basispris')}
            discount={watch('discount')}
            produktnavn={watch('produktnavn')}
            isLoading={isLoading}
          />

          {/* Category Section */}
          <CategorySection 
            form={form}
            isLoading={isLoading}
            categories={categories}
            setCategories={setCategories}
            watchedKategori={watchedKategori}
          />

          {/* Inventory Management - Enhanced Add-on Section */}
          <Card>
            <CardHeader>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Warehouse className="h-5 w-5" />
                      Lagerstyring
                    </CardTitle>
                    <CardDescription>
                      Professionel lagerstyring med automatiske advarsler og rapporter
                    </CardDescription>
                  </div>
                </div>
                
                {/* Enhanced Lagerstyring Add-on Banner */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Warehouse className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-blue-900 mb-1">
                        🎯 Tilkøbsfunktion: Avanceret Lagerstyring
                      </h4>
                      <p className="text-xs text-blue-700 mb-2">
                        Denne funktion kræver tilkøb og er ikke aktiv som standard. Få automatiske advarsler ved lavt lager, 
                        detaljerede lagerrapporter og integration til dit økonomisystem.
                      </p>
                      <div className="flex items-center gap-4 text-xs text-blue-600">
                        <span>✓ Automatiske lageradvarsler</span>
                        <span>✓ Lagerrapporter og analytics</span>
                        <span>✓ Økonomisystem integration</span>
                      </div>
                    </div>
                    <div className="flex-shrink-0 flex flex-col gap-2">
                      <Badge variant="outline" className="text-blue-700 border-blue-300 bg-blue-100">
                        Tilkøb
                      </Badge>
                      <Badge variant="outline" className="text-orange-700 border-orange-300 bg-orange-100 text-xs">
                        Under udvikling
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Disabled Lagerstyring Toggle */}
              <FormField
                control={form.control}
                name="lagerstyring.enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-gray-50">
                    <div className="space-y-0.5 opacity-60">
                      <FormLabel className="text-base">
                        Aktivér lagerstyring
                      </FormLabel>
                      <FormDescription>
                        <strong>Denne funktion kræver tilkøb.</strong> Kontakt os for at aktivere professionel lagerstyring.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={false}
                        onCheckedChange={() => {}}
                        disabled={true}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Contact Information */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Phone className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Interesseret i lagerstyring?</span>
                </div>
                <p className="text-xs text-blue-700 mb-2">
                  Kontakt os for at høre mere om vores avancerede lagerstyringsfunktioner og priser.
                </p>
                <div className="flex items-center gap-4 text-xs text-blue-600">
                  <span>📧 support@multigrønt.dk</span>
                  <span>📞 +45 12 34 56 78</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Product Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Produktstatus
              </CardTitle>
              <CardDescription>
                Kontroller produktets synlighed og tilgængelighed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="aktiv"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Produkt aktiv
                      </FormLabel>
                      <FormDescription>
                        Kun aktive produkter vises i kataloget for kunder
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isLoading}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Image Upload Section */}
          <ImageUploadSection 
            form={form}
            isLoading={isLoading}
            mode={mode}
            productId={productId}
          />

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-6 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {hasMeaningfulChanges && (
                <>
                  <AlertTriangle className="h-4 w-4" />
                  Du har ugemte ændringer
                </>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              {/* Create Unique Offer button for edit mode */}
              {mode === 'edit' && productId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={async () => {
                    const productData = form.getValues();
                    setCreatedProduct({ 
                      _id: productId, 
                      produktnavn: productData.produktnavn,
                      ...productData 
                    });
                    setShowUniqueOfferDialog(true);
                  }}
                  disabled={isLoading}
                  className="text-brand-primary hover:text-brand-primary-hover border-brand-primary/30 hover:border-brand-primary"
                >
                  <Star className="h-4 w-4 mr-2" />
                  Opret Unikt Tilbud
                </Button>
              )}
              
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
              >
                <X className="h-4 w-4 mr-2" />
                Annuller
              </Button>
              
              <Button
                type="submit"
                disabled={!isValid || isLoading || isSubmitting}
                className="min-w-[120px]"
              >
                {isLoading || isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {isSubmitting ? 'Gemmer...' : 'Indlæser...'}
                  </div>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {mode === 'create' ? 'Opret produkt' : 'Gem ændringer'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </Form>

      {/* Unique Offer Creation Dialog */}
      <UniqueOfferDialog
        open={showUniqueOfferDialog}
        onOpenChange={setShowUniqueOfferDialog}
        createdProduct={createdProduct}
        onSuccess={handleUniqueOfferSuccess}
      />
    </div>
  );
}; 