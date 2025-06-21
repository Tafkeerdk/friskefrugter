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
import { useDropzone } from 'react-dropzone';
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
  const [uploadingImages, setUploadingImages] = useState<Set<string>>(new Set());

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

  // Image upload handlers
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const currentImages = form.getValues('billeder') || [];
    
    if (currentImages.length + acceptedFiles.length > 3) {
      toast({
        title: 'For mange billeder',
        description: 'Du kan maksimalt uploade 3 billeder per produkt.',
        variant: 'destructive',
        duration: 3000,
      });
      return;
    }

    const newImages: ProductImage[] = acceptedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      compressed: false,
    }));

    form.setValue('billeder', [...currentImages, ...newImages]);
  }, [form, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp']
    },
    maxFiles: 3,
    maxSize: 5 * 1024 * 1024 // 5MB
  });

  const removeImage = (index: number) => {
    const currentImages = form.getValues('billeder') || [];
    const imageToRemove = currentImages[index];
    
    // Revoke object URL to prevent memory leaks
    if (imageToRemove.preview) {
      URL.revokeObjectURL(imageToRemove.preview);
    }
    
    const newImages = currentImages.filter((_, i) => i !== index);
    form.setValue('billeder', newImages);
  };

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      const images = form.getValues('billeder') || [];
      images.forEach(image => {
        if (image.preview) {
          URL.revokeObjectURL(image.preview);
        }
      });
    };
  }, [form]);

  // Handle form submission
  const handleSubmit = async (data: ProductFormData) => {
    try {
      // Convert form data to FormData for API
      const images = data.billeder?.map(b => b.file).filter(Boolean) || [];
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
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="billeder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      Billeder
                      <span className="text-red-500">*</span>
                      <Badge variant="outline" className="ml-2">
                        {field.value?.length || 0}/3
                      </Badge>
                    </FormLabel>
                    
                    {/* Dropzone */}
                    <div
                      {...getRootProps()}
                      className={cn(
                        "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                        isDragActive 
                          ? "border-blue-400 bg-blue-50" 
                          : "border-gray-300 hover:border-gray-400",
                        field.value?.length >= 3 && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <input {...getInputProps()} disabled={field.value?.length >= 3} />
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="h-8 w-8 text-gray-400" />
                        {isDragActive ? (
                          <p className="text-blue-600">Slip billederne her...</p>
                        ) : (
                          <div className="space-y-1">
                            <p className="text-sm font-medium">
                              Træk og slip billeder her, eller klik for at vælge
                            </p>
                            <p className="text-xs text-gray-500">
                              JPEG, PNG, WebP - maks. 5MB per billede
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Image Preview Grid */}
                    {field.value && field.value.length > 0 && (
                      <div className="grid grid-cols-3 gap-4 mt-4">
                        {field.value.map((image, index) => (
                          <div key={index} className="relative group">
                            <div className="aspect-square rounded-lg overflow-hidden border bg-gray-50">
                              <img
                                src={image.preview}
                                alt={`Produktbillede ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            
                            {/* Image Actions */}
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                onClick={() => {
                                  // Preview image in modal
                                  window.open(image.preview, '_blank');
                                }}
                                className="bg-white text-black hover:bg-gray-100"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="destructive"
                                onClick={() => removeImage(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            {/* Primary Badge */}
                            {index === 0 && (
                              <Badge 
                                variant="default" 
                                className="absolute top-2 left-2 text-xs"
                              >
                                Primær
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

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