import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';

import { 
  Save, 
  X, 
  Eye, 
  EyeOff, 
  Package, 
  Tags, 
  DollarSign, 
  Warehouse,
  CheckCircle2,
  AlertTriangle,
  Banknote,
  ImagePlus,
  Upload,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';

import { ProductFormData, ProductSetupFormProps, ProductImage } from '@/types/product';
import { productSetupSchema } from './validation/productSchema';
import { EANInput } from './components/EANInput';
import { CurrencyInput } from './components/CurrencyInput';
import ProductImageUploader, { UploadedImage } from './components/ProductImageUploader';
import { api, productFormDataToFormData, handleApiError } from '@/lib/api';

// Unit options with Danish labels
const unitOptions = [
  { value: 'kg', label: 'Kilogram (kg)' },
  { value: 'stk', label: 'Stykker (stk)' },
  { value: 'bakke', label: 'Bakke' },
  { value: 'kasse', label: 'Kasse' }
] as const;

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
  onSubmit,
  onCancel,
  mode = 'create',
  isLoading = false
}) => {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSetupSchema),
    defaultValues: {
      produktnavn: initialData?.produktnavn || '',
      beskrivelse: initialData?.beskrivelse || '',
      eanNummer: initialData?.eanNummer || '',
      enhed: initialData?.enhed || 'kg',
      basispris: initialData?.basispris || 0,
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

  const { watch, setValue, formState: { errors, isValid, isDirty }, reset } = form;
  const lagerstyringEnabled = watch('lagerstyring.enabled');
  const aktivStatus = watch('aktiv');
  const watchedKategori = watch('kategori');

  // Check if form has meaningful changes (not just category creation state changes)
  const hasMeaningfulChanges = React.useMemo(() => {
    if (!isDirty) return false;
    
    // If we're just creating a category, don't consider form dirty
    if (isCreatingCategory && !newCategoryName.trim()) return false;
    
    // Check if any actual product fields have changed
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
  }, [isDirty, isCreatingCategory, newCategoryName, form]);

  // Load categories on component mount
  React.useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoadingCategories(true);
        const response = await api.getCategories({ activeOnly: true });
        if (response.success && response.data) {
          setCategories(response.data as Category[]);
        }
      } catch (error) {
        console.error('Failed to load categories:', error);
        toast({
          title: 'Fejl',
          description: 'Kunne ikke indlæse kategorier',
          variant: 'destructive',
          duration: 3000,
        });
      } finally {
        setLoadingCategories(false);
      }
    };

    loadCategories();
  }, [toast]);

  // Handle uploaded images change
  const handleImagesChange = useCallback((newImages: UploadedImage[]) => {
    setUploadedImages(newImages);
    
    // Convert UploadedImage[] to ProductImage[] for form
    const productImages: ProductImage[] = newImages
      .filter(img => img.uploadStatus === 'completed')
      .map(img => ({
        file: img.file,
        preview: img.cdnUrl || img.preview,
        compressed: false,
        id: img.id
      }));
    
    form.setValue('billeder', productImages);
  }, [form]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      uploadedImages.forEach(image => {
        if (image.preview) {
          URL.revokeObjectURL(image.preview);
        }
      });
    };
  }, [uploadedImages]);

  // Handle form submission
  const handleSubmit = async (data: ProductFormData) => {
    try {
      // Get completed uploads only
      const completedImages = uploadedImages.filter(img => img.uploadStatus === 'completed');
      
      // Check if we have at least one image
      if (completedImages.length === 0) {
        toast({
          title: 'Manglende billeder',
          description: 'Du skal uploade mindst ét billede før du kan oprette produktet.',
          variant: 'destructive',
          duration: 5000,
        });
        return;
      }
      
      // Convert uploaded images to files for API
      const images = completedImages.map(img => img.file);
      const formData = productFormDataToFormData(data, images);
      
      let response;
      if (mode === 'create') {
        response = await api.createProduct(formData);
      } else {
        // For edit mode, we'd need the product ID
        throw new Error('Edit mode not implemented yet');
      }
      
      if (response.success) {
        toast({
          title: mode === 'create' ? 'Produkt oprettet' : 'Produkt opdateret',
          description: `${data.produktnavn} blev ${mode === 'create' ? 'oprettet' : 'opdateret'} succesfuldt.`,
          duration: 5000,
        });
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
    }
  };

  // Handle category creation
  const handleCreateCategory = async () => {
    if (newCategoryName.trim()) {
      try {
        console.log('🔄 Creating category:', newCategoryName.trim());
        
        const response = await api.createCategory({
          navn: newCategoryName.trim(),
          aktiv: true
        });
        
        console.log('✅ Category creation response:', response);
        
        if (response.success && response.data) {
          const newCategory = response.data as Category;
          console.log('✅ New category created:', newCategory);
          
          setCategories([...categories, newCategory]);
          setValue('kategori', { id: newCategory._id, navn: newCategory.navn, isNew: true });
          setNewCategoryName('');
          setIsCreatingCategory(false);
          
          toast({
            title: 'Kategori oprettet',
            description: `Kategorien "${newCategory.navn}" er blevet oprettet.`,
            duration: 3000,
          });
        } else {
          console.error('❌ Category creation failed - no data in response:', response);
          toast({
            title: 'Fejl',
            description: 'Kategorien blev ikke oprettet korrekt. Prøv igen.',
            variant: 'destructive',
            duration: 3000,
          });
        }
      } catch (error) {
        console.error('❌ Category creation error:', error);
        toast({
          title: 'Fejl',
          description: 'Kunne ikke oprette kategorien. Prøv igen.',
          variant: 'destructive',
          duration: 3000,
        });
      }
    }
  };

  // Character counter component
  const CharacterCounter: React.FC<{ current: number; max: number }> = ({ current, max }) => (
    <div className={cn(
      'text-xs text-right',
      current > max * 0.8 ? 'text-amber-600' : 'text-muted-foreground',
      current > max && 'text-red-600'
    )}>
      {current}/{max}
    </div>
  );

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
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Grundlæggende oplysninger
              </CardTitle>
              <CardDescription>
                Produktnavn, beskrivelse og identifikation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Product Name */}
              <FormField
                control={form.control}
                name="produktnavn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      Produktnavn
                      <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="f.eks. Økologiske æbler"
                        disabled={isLoading}
                        className={cn(errors.produktnavn && 'border-red-500')}
                      />
                    </FormControl>
                    <div className="flex justify-between items-center">
                      <FormDescription>
                        Kort og beskrivende navn på produktet
                      </FormDescription>
                      <CharacterCounter current={field.value?.length || 0} max={100} />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="beskrivelse"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Beskrivelse (valgfrit)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Detaljeret beskrivelse af produktet..."
                        disabled={isLoading}
                        className="min-h-[100px] resize-y"
                      />
                    </FormControl>
                    <div className="flex justify-between items-center">
                      <FormDescription>
                        Uddybende beskrivelse af produktet
                      </FormDescription>
                      <CharacterCounter current={field.value?.length || 0} max={1000} />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* EAN Number */}
              <FormField
                control={form.control}
                name="eanNummer"
                render={({ field }) => (
                  <EANInput
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.eanNummer?.message}
                    disabled={isLoading}
                  />
                )}
              />
            </CardContent>
          </Card>

          {/* Pricing and Unit */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Banknote className="h-5 w-5" />
                Priser og enheder
              </CardTitle>
              <CardDescription>
                Prissætning og salgsenheder
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Base Price */}
                <FormField
                  control={form.control}
                  name="basispris"
                  render={({ field }) => (
                    <CurrencyInput
                      value={field.value}
                      onChange={field.onChange}
                      error={errors.basispris?.message}
                      disabled={isLoading}
                    />
                  )}
                />

                {/* Unit */}
                <FormField
                  control={form.control}
                  name="enhed"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        Enhed
                        <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Vælg enhed" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {unitOptions.map((unit) => (
                            <SelectItem key={unit.value} value={unit.value}>
                              {unit.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Salgsenheden for produktet
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Category */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tags className="h-5 w-5" />
                Kategori
              </CardTitle>
              <CardDescription>
                Produktkategori og klassificering
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="kategori.navn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      Kategori
                      <span className="text-red-500">*</span>
                      {isCreatingCategory && (
                        <Badge variant="secondary" className="ml-2">
                          Opretter ny kategori
                        </Badge>
                      )}
                    </FormLabel>
                    <div className="flex gap-2">
                      <Select
                        onValueChange={(value) => {
                          if (value === 'create-new') {
                            setIsCreatingCategory(true);
                            // Clear the current category selection when creating new
                            setValue('kategori', { navn: '', isNew: true });
                          } else {
                            const category = categories.find(c => c._id === value);
                            if (category) {
                              setValue('kategori', { id: category._id, navn: category.navn, isNew: false });
                            }
                          }
                        }}
                        value={isCreatingCategory ? 'create-new' : (watchedKategori?.id || '')}
                        disabled={isLoading || isCreatingCategory}
                      >
                        <FormControl>
                          <SelectTrigger className={cn(
                            "flex-1",
                            isCreatingCategory && "border-blue-300 bg-blue-50"
                          )}>
                            <SelectValue placeholder="Vælg kategori">
                              {isCreatingCategory 
                                ? "Opretter ny kategori..." 
                                : (watchedKategori?.navn || 'Vælg kategori')
                              }
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category._id} value={category._id}>
                              {category.navn}
                            </SelectItem>
                          ))}
                          <Separator />
                          <SelectItem value="create-new">
                            + Opret ny kategori
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Create new category */}
                    {isCreatingCategory && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-3">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-sm font-medium text-blue-700">
                            Opret ny kategori
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Indtast kategori navn (f.eks. Grøntsager, Frugt, Krydderier)"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleCreateCategory();
                              }
                              if (e.key === 'Escape') {
                                setIsCreatingCategory(false);
                                setNewCategoryName('');
                                setValue('kategori', { navn: '', isNew: false });
                              }
                            }}
                            className="flex-1"
                            autoFocus
                          />
                          <Button
                            type="button"
                            size="sm"
                            onClick={handleCreateCategory}
                            disabled={!newCategoryName.trim()}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            Opret
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setIsCreatingCategory(false);
                              setNewCategoryName('');
                              setValue('kategori', { navn: '', isNew: false });
                            }}
                          >
                            Annuller
                          </Button>
                        </div>
                      </div>
                    )}

                    <FormDescription>
                      {isCreatingCategory 
                        ? "Indtast navnet på den nye kategori og tryk 'Opret'" 
                        : "Vælg en eksisterende kategori eller opret en ny"
                      }
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Inventory Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Warehouse className="h-5 w-5" />
                Lagerstyring
              </CardTitle>
              <CardDescription>
                Aktivér lagerstyring for at spore beholdning
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="lagerstyring.enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Aktivér lagerstyring
                      </FormLabel>
                      <FormDescription>
                        Spor antal på lager og modtag advarsler ved lavt lager
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

              {/* Inventory fields - only show when enabled */}
              {lagerstyringEnabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4 border-l-2 border-muted">
                  <FormField
                    control={form.control}
                    name="lagerstyring.antalPaaLager"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          Antal på lager
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            placeholder="0"
                            min="0"
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormDescription>
                          Nuværende antal på lager
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lagerstyring.minimumslager"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimumslager (valgfrit)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                            placeholder="0"
                            min="0"
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormDescription>
                          Advarsel når lageret kommer under dette niveau
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
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

          {/* Image Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImagePlus className="h-5 w-5" />
                Produktbilleder
              </CardTitle>
              <CardDescription>
                Upload 1-3 billeder af produktet (JPEG, PNG, WebP - maks. 5MB hver)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="billeder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      Billeder
                      <span className="text-red-500">*</span>
                    </FormLabel>
                    
                    <ProductImageUploader
                      images={uploadedImages}
                      onImagesChange={handleImagesChange}
                      maxImages={3}
                      maxFileSize={5 * 1024 * 1024}
                      disabled={isLoading}
                    />

                    <FormDescription>
                      Det første billede vil blive brugt som primært produktbillede. 
                      Du kan uploade op til 3 billeder.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

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
                disabled={!isValid || isLoading}
                className="min-w-[120px]"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Gemmer...
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
    </div>
  );
}; 