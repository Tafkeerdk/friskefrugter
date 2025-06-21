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
  Trash2,
  ImageIcon,
  Star
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

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

// Fixed DialogTrigger component with proper React hierarchy - 2024-12-31
const ImagePreview: React.FC<{ image: ProductImage; altText: string }> = ({ image, altText }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [image.preview]);

  if (hasError || !image.preview) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
        <div className="text-center p-2">
          <ImageIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p className="text-xs">Kunne ikke vise billede</p>
        </div>
      </div>
    );
  }

  return (
    <img
      src={image.preview}
      alt={altText}
      className="w-full h-full object-contain bg-white"
      onError={() => {
        console.warn(`Could not load preview: ${altText}`);
        setHasError(true);
      }}
    />
  );
};

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
  const [imageToPreview, setImageToPreview] = useState<ProductImage | null>(null);

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

  // Enhanced image upload handlers with better validation and feedback
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const currentImages = form.getValues('billeder') || [];
    
    // Validate total number of images
    if (currentImages.length + acceptedFiles.length > 3) {
      toast({
        title: 'For mange billeder',
        description: `Du kan maksimalt uploade 3 billeder per produkt. Du har ${currentImages.length} billeder og forsøger at tilføje ${acceptedFiles.length} mere.`,
        variant: 'destructive',
        duration: 4000,
      });
      return;
    }

    // Validate individual file sizes and types
    const validFiles: File[] = [];
    const errors: string[] = [];

    for (const file of acceptedFiles) {
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        errors.push(`${file.name} er for stor (${(file.size / 1024 / 1024).toFixed(1)}MB). Maksimum er 5MB.`);
        continue;
      }

      // Check file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        errors.push(`${file.name} har et ugyldigt format. Kun JPEG, PNG og WebP er tilladt.`);
        continue;
      }

      validFiles.push(file);
    }

    // Show errors if any
    if (errors.length > 0) {
      toast({
        title: 'Nogle billeder kunne ikke uploades',
        description: errors.join(' '),
        variant: 'destructive',
        duration: 6000,
      });
    }

    // Process valid files
    if (validFiles.length > 0) {
      const newImages: ProductImage[] = validFiles.map((file, index) => {
        const imageId = `image-${Date.now()}-${index}`;
        // Add to uploading set for loading indicator
        setUploadingImages(prev => new Set([...prev, imageId]));
        
        return {
          file,
          preview: URL.createObjectURL(file),
          compressed: false,
          id: imageId,
          isPrimary: currentImages.length === 0 && index === 0 // First image of first upload is primary
        };
      });

      form.setValue('billeder', [...currentImages, ...newImages]);
      
      // Trigger validation to update form state
      form.trigger('billeder');

      // Show success message
      toast({
        title: 'Billeder tilføjet',
        description: `${validFiles.length} billede${validFiles.length > 1 ? 'r' : ''} blev tilføjet succesfuldt.`,
        duration: 3000,
      });

      // Simulate processing time and remove from uploading set
      setTimeout(() => {
        newImages.forEach(img => {
          if (img.id) {
            setUploadingImages(prev => {
              const newSet = new Set(prev);
              newSet.delete(img.id!);
              return newSet;
            });
          }
        });
      }, 1500);
    }
  }, [form, toast, setUploadingImages]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp']
    },
    maxFiles: 3,
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: true,
    disabled: (form.getValues('billeder')?.length || 0) >= 3
  });

  // Handle file rejections
  React.useEffect(() => {
    if (fileRejections.length > 0) {
      const rejectionMessages = fileRejections.map(rejection => {
        const errors = rejection.errors.map(error => {
          switch (error.code) {
            case 'file-too-large':
              return `${rejection.file.name} er for stor (${(rejection.file.size / 1024 / 1024).toFixed(1)}MB)`;
            case 'file-invalid-type':
              return `${rejection.file.name} har et ugyldigt format`;
            case 'too-many-files':
              return `For mange filer valgt`;
            default:
              return `${rejection.file.name}: ${error.message}`;
          }
        });
        return errors.join(', ');
      });

      toast({
        title: 'Nogle filer blev afvist',
        description: rejectionMessages.join('. '),
        variant: 'destructive',
        duration: 5000,
      });
    }
  }, [fileRejections, toast]);

  const removeImage = (index: number) => {
    const currentImages = form.getValues('billeder') || [];
    const imageToRemove = currentImages[index];
    
    // Revoke object URL to prevent memory leaks
    if (imageToRemove.preview) {
      URL.revokeObjectURL(imageToRemove.preview);
    }
    
    const newImages = currentImages.filter((_, i) => i !== index);
    
    // If we're removing the primary image, make the first remaining image primary
    if (newImages.length > 0) {
      newImages.forEach((img, i) => {
        img.isPrimary = i === 0;
      });
    }
    
    form.setValue('billeder', newImages);
    
    // Trigger validation to update form state
    form.trigger('billeder');
    
    // Show feedback
    toast({
      title: 'Billede fjernet',
      description: 'Billedet blev fjernet fra produktet.',
      duration: 2000,
    });
  };

  const setPrimaryImage = (index: number) => {
    const currentImages = form.getValues('billeder') || [];
    
    // Update all images to set the selected one as primary
    const updatedImages = currentImages.map((img, i) => ({
      ...img,
      isPrimary: i === index
    }));
    
    form.setValue('billeder', updatedImages, { shouldValidate: true });
    
    // Show feedback
    toast({
      title: 'Primært billede ændret',
      description: `Billede ${index + 1} er nu det primære produktbillede.`,
      duration: 3000,
    });
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
    <Dialog open={!!imageToPreview} onOpenChange={(isOpen) => !isOpen && setImageToPreview(null)}>
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
                      
                      {/* Enhanced Dropzone */}
                      <div
                        {...getRootProps()}
                        className={cn(
                          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200",
                          isDragActive 
                            ? "border-blue-500 bg-blue-50 scale-105 shadow-lg" 
                            : "border-gray-300 hover:border-blue-400 hover:bg-gray-50",
                          field.value?.length >= 3 && "opacity-50 cursor-not-allowed border-gray-200"
                        )}
                      >
                        <input {...getInputProps()} disabled={field.value?.length >= 3} />
                        <div className="flex flex-col items-center gap-3">
                          <div className={cn(
                            "p-3 rounded-full transition-colors",
                            isDragActive ? "bg-blue-100" : "bg-gray-100"
                          )}>
                            <Upload className={cn(
                              "h-8 w-8 transition-colors",
                              isDragActive ? "text-blue-600" : "text-gray-400"
                            )} />
                          </div>
                          {isDragActive ? (
                            <div className="space-y-1">
                              <p className="text-blue-600 font-medium">Slip billederne her nu!</p>
                              <p className="text-sm text-blue-500">Billederne vil blive tilføjet til produktet</p>
                            </div>
                          ) : field.value?.length >= 3 ? (
                            <div className="space-y-1">
                              <p className="text-gray-400 font-medium">Maksimalt antal billeder nået</p>
                              <p className="text-xs text-gray-400">
                                Du har allerede uploadet 3 billeder (maksimum)
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <p className="text-sm font-medium text-gray-700">
                                Træk og slip billeder her, eller klik for at vælge
                              </p>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span>JPEG, PNG, WebP</span>
                                <span>•</span>
                                <span>Maks. 5MB per billede</span>
                                <span>•</span>
                                <span>Op til {3 - (field.value?.length || 0)} billeder tilbage</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Image Preview Grid */}
                      {field.value && field.value.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                          {field.value.map((image, index) => (
                            <div key={index} className="relative group">
                              {/* Image Container with improved aspect ratio */}
                              <div className={cn(
                                "aspect-[4/3] rounded-lg overflow-hidden border-2 bg-gray-50 shadow-sm hover:shadow-md transition-all duration-200",
                                image.isPrimary 
                                  ? "border-blue-500 ring-2 ring-blue-200 shadow-lg" 
                                  : "border-gray-200 hover:border-blue-300"
                              )}>
                                <ImagePreview
                                  image={image}
                                  altText={`Produktbillede ${index + 1}`}
                                />
                              </div>
                              
                              {/* Enhanced Image Actions Overlay */}
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 rounded-lg flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                                <DialogTrigger asChild>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => {
                                      // Preview image in modal
                                      setImageToPreview(image);
                                    }}
                                    className="bg-white/90 text-gray-900 hover:bg-white shadow-lg backdrop-blur-sm"
                                    title="Forhåndsvis billede"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                {!image.isPrimary && (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="default"
                                    onClick={() => setPrimaryImage(index)}
                                    className="bg-blue-500/90 hover:bg-blue-600 shadow-lg backdrop-blur-sm text-white"
                                    title="Sæt som primært billede"
                                  >
                                    <Star className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => removeImage(index)}
                                  className="bg-red-500/90 hover:bg-red-600 shadow-lg backdrop-blur-sm"
                                  title="Fjern billede"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                              
                              {/* Enhanced Primary Badge */}
                              {image.isPrimary && (
                                <Badge 
                                  variant="default" 
                                  className="absolute top-2 left-2 text-xs bg-blue-600 hover:bg-blue-700 shadow-md flex items-center gap-1"
                                >
                                  <Star className="h-3 w-3 fill-current" />
                                  Primær
                                </Badge>
                              )}
                              
                              {/* Image Info Badge */}
                              <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                                {index + 1}/{field.value.length}
                              </div>
                              
                              {/* Loading Indicator for Processing */}
                              {image.id && uploadingImages.has(image.id) && (
                                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-lg flex items-center justify-center">
                                  <div className="flex flex-col items-center gap-2">
                                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                    <span className="text-xs text-gray-600">Behandler...</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      <FormDescription>
                        Klik på stjerne-ikonet for at ændre hvilket billede der er primært. 
                        Det primære billede vises først i produktkataloget. Du kan uploade op til 3 billeder.
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
                  onClick={() => {
                    // Debug form state
                    console.log('🔍 Form Debug Info:', {
                      isValid,
                      errors,
                      formValues: form.getValues(),
                      isDirty,
                      isLoading
                    });
                  }}
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

        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Forhåndsvisning af Billede</DialogTitle>
            <DialogDescription>
              En større visning af det valgte produktbillede.
            </DialogDescription>
          </DialogHeader>
          {imageToPreview && (
            <div className="mt-4 flex justify-center">
              <img
                src={imageToPreview.preview}
                alt="Produktbillede forhåndsvisning"
                className="max-h-[70vh] w-auto rounded-lg object-contain"
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setImageToPreview(null)}>
              Luk
            </Button>
          </DialogFooter>
        </DialogContent>
      </div>
    </Dialog>
  );
}; 