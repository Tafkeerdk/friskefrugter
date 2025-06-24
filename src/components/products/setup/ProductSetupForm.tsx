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
  Star,
  Phone,
  Calculator
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

import { ProductFormData, ProductSetupFormProps, ProductImage, Unit } from '@/types/product';
import { productSetupSchema, productEditSchema } from './validation/productSchema';
import { EANInput } from './components/EANInput';
import { VarenummerInput } from './components/VarenummerInput';
import { CurrencyInput } from './components/CurrencyInput';
import { RabatGruppePreview } from './components/RabatGruppePreview';
import { api, productFormDataToFormData, handleApiError } from '@/lib/api';

// Units will be loaded dynamically from the API

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
  }, [image.preview, image.url]);

  // For existing images, use the url; for new uploads, use the preview (blob URL)
  const imageUrl = image.isExisting ? image.url : (image.preview || image.url);

  if (hasError || !imageUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
        <div className="text-center p-2">
          <ImageIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p className="text-xs">
            {image.isExisting ? 'Kunne ikke indlæse eksisterende billede' : 'Kunne ikke vise billede'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={altText}
      className="w-full h-full object-contain bg-white"
      onError={() => {
        console.warn(`Could not load image: ${altText}`, { 
          imageUrl, 
          isExisting: image.isExisting,
          preview: image.preview,
          url: image.url 
        });
        setHasError(true);
      }}
    />
  );
};

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
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newUnitName, setNewUnitName] = useState('');
  const [newUnitValue, setNewUnitValue] = useState('');
  const [isCreatingUnit, setIsCreatingUnit] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingUnits, setLoadingUnits] = useState(true);
  const [uploadingImages, setUploadingImages] = useState<Set<string>>(new Set());
  const [imageToPreview, setImageToPreview] = useState<ProductImage | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false); // Prevent multiple submissions
  const [deletedImageIds, setDeletedImageIds] = useState<string[]>([]); // Track deleted existing images
  
  // Nielsen's Heuristics: System Status and User Control for Unit Creation
  const [isCreatingUnitLoading, setIsCreatingUnitLoading] = useState(false);
  const [unitCreationStatus, setUnitCreationStatus] = useState<'idle' | 'creating' | 'success' | 'error'>('idle');
  const [unitCreationError, setUnitCreationError] = useState<string | null>(null);

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

  const { watch, setValue, formState: { errors, isValid, isDirty }, reset } = form;
  const lagerstyringEnabled = watch('lagerstyring.enabled');
  const aktivStatus = watch('aktiv');
  const watchedKategori = watch('kategori');

  // Helper function to format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency: 'DKK',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

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

  // Load categories and units on component mount
  React.useEffect(() => {
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

  const removeImage = async (index: number) => {
    const currentImages = form.getValues('billeder') || [];
    const imageToRemove = currentImages[index];
    
    // If it's an existing image, add to deleted list and potentially delete from server
    if (imageToRemove.isExisting && imageToRemove._id) {
      if (mode === 'edit' && productId) {
        try {
          // Delete from server immediately for edit mode
          await api.deleteProductImage(productId, imageToRemove._id);
          toast({
            title: 'Billede slettet',
            description: 'Billedet blev fjernet fra serveren.',
            duration: 2000,
          });
        } catch (error) {
          console.error('Failed to delete image:', error);
          toast({
            title: 'Fejl ved sletning',
            description: 'Kunne ikke slette billedet fra serveren.',
            variant: 'destructive',
            duration: 3000,
          });
          return; // Don't remove from UI if server deletion failed
        }
      } else {
        // For edit mode without immediate server deletion, track for later
        setDeletedImageIds(prev => [...prev, imageToRemove._id!]);
      }
    }
    
    // Revoke object URL to prevent memory leaks (for new uploads)
    if (imageToRemove.preview && !imageToRemove.isExisting) {
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
      description: imageToRemove.isExisting 
        ? 'Eksisterende billede blev fjernet fra produktet.' 
        : 'Nyt billede blev fjernet fra upload.',
      duration: 2000,
    });
  };

  const setPrimaryImage = async (index: number) => {
    const currentImages = form.getValues('billeder') || [];
    const selectedImage = currentImages[index];
    
    console.log('🌟 Setting primary image:', {
      selectedIndex: index,
      totalImages: currentImages.length,
      currentPrimary: currentImages.findIndex(img => img.isPrimary),
      selectedImage: {
        _id: selectedImage._id,
        filename: selectedImage.filename || 'new upload',
        isExisting: selectedImage.isExisting
      }
    });
    
    // If we're in edit mode and this is an existing image, call the API
    if (mode === 'edit' && productId && selectedImage.isExisting && selectedImage._id) {
      try {
        await api.setPrimaryProductImage(productId, selectedImage._id);
        toast({
          title: 'Primært billede opdateret',
          description: 'Primærbilledet blev opdateret på serveren.',
          duration: 3000,
        });
      } catch (error) {
        console.error('Failed to set primary image:', error);
        toast({
          title: 'Fejl ved opdatering',
          description: 'Kunne ikke opdatere primærbilledet på serveren.',
          variant: 'destructive',
          duration: 3000,
        });
        return; // Don't update UI if server update failed
      }
    }
    
    // Update all images to set the selected one as primary
    const updatedImages = currentImages.map((img, i) => ({
      ...img,
      isPrimary: i === index
    }));
    
    console.log('🌟 Updated images after primary change:', updatedImages.map((img, i) => ({
      index: i,
      _id: img._id,
      filename: img.filename || 'new upload',
      isPrimary: img.isPrimary,
      isExisting: img.isExisting
    })));
    
    form.setValue('billeder', updatedImages, { shouldValidate: true });
    
    // Show feedback for local changes
    if (!selectedImage.isExisting) {
      toast({
        title: 'Primært billede ændret',
        description: `Billede ${index + 1} er nu det primære produktbillede.`,
        duration: 3000,
      });
    }
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

  // Handle form submission with protection against multiple requests
  const handleSubmit = async (data: ProductFormData) => {
    // Prevent multiple submissions (Nielsen's usability heuristics)
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
      
      console.log('🔍 Form submit debug:', {
        mode,
        totalImages: data.billeder?.length || 0,
        newUploads: newUploads.length,
        existingImages: existingImages.length,
        existingImagesData: existingImages.map(img => ({
          _id: img._id,
          filename: img.filename,
          isPrimary: img.isPrimary,
          isExisting: img.isExisting
        }))
      });
      
      // Convert form data to FormData for API
      const images = newUploads.map(img => img.file!);
      const formData = productFormDataToFormData(data, images, existingImages, deletedImageIds);
      
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

  // Handle unit creation
  // Nielsen's Heuristic #1: Visibility of System Status & #3: User Control and Freedom
  const handleCreateUnit = async () => {
    // Prevent multiple submissions (Heuristic #3: User Control and Freedom)
    if (isCreatingUnitLoading) {
      toast({
        title: 'Vent venligst',
        description: 'Enheden bliver allerede oprettet...',
        variant: 'default',
        duration: 2000,
      });
      return;
    }

    if (!newUnitName.trim() || !newUnitValue.trim()) {
      setUnitCreationError('Både kort værdi og fuldt navn skal udfyldes');
      return;
    }

    try {
      // Heuristic #1: Visibility of System Status - Show loading state
      setIsCreatingUnitLoading(true);
      setUnitCreationStatus('creating');
      setUnitCreationError(null);
      
      console.log('🔄 Creating unit:', { value: newUnitValue.trim(), label: newUnitName.trim() });
      
      const response = await api.createUnit({
        value: newUnitValue.trim(),
        label: newUnitName.trim(),
        description: `Brugerdefineret enhed: ${newUnitName.trim()}`,
        sortOrder: 999 // Put custom units at the end
      });
      
      console.log('✅ Unit creation response:', response);
      
      if (response.success && response.data) {
        const newUnit = response.data as Unit;
        console.log('✅ New unit created:', newUnit);
        
        // Heuristic #1: Show success status
        setUnitCreationStatus('success');
        
        setUnits([...units, newUnit]);
        setValue('enhed', newUnit._id);
        setNewUnitName('');
        setNewUnitValue('');
        
        // Brief success indication before closing (Nielsen's Heuristic #1: Feedback)
        setTimeout(() => {
          setIsCreatingUnit(false);
          setUnitCreationStatus('idle');
          setIsCreatingUnitLoading(false);
        }, 1500);
        
        toast({
          title: '✅ Enhed oprettet',
          description: `Enheden "${newUnit.label}" er blevet oprettet succesfuldt.`,
          duration: 3000,
        });
      } else {
        throw new Error(response.error || 'Enheden blev ikke oprettet korrekt');
      }
    } catch (error: any) {
      console.error('❌ Unit creation error:', error);
      
      // Heuristic #1: Show error status with helpful message
      setUnitCreationStatus('error');
      setUnitCreationError(error.message || 'Kunne ikke oprette enheden. Prøv igen.');
      
      toast({
        title: '❌ Fejl ved oprettelse',
        description: error.message || 'Kunne ikke oprette enheden. Prøv igen.',
        variant: 'destructive',
        duration: 4000,
      });
    } finally {
      setIsCreatingUnitLoading(false);
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

                {/* Varenummer */}
                <FormField
                  control={form.control}
                  name="varenummer"
                  render={({ field }) => (
                    <VarenummerInput
                      value={field.value}
                      onChange={field.onChange}
                      error={errors.varenummer?.message}
                      disabled={isLoading}
                      productId={productId}
                    />
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
              <CardContent className="space-y-6">
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
                        label="Nuværende pris"
                        description="Den aktuelle salgspris for produktet"
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
                          {isCreatingUnit && (
                            <Badge variant="secondary" className="ml-2">
                              Opretter ny enhed
                            </Badge>
                          )}
                        </FormLabel>
                        <Select
                          onValueChange={(value) => {
                            if (value === 'create-new') {
                              setIsCreatingUnit(true);
                              // Clear the current unit selection when creating new
                              setValue('enhed', '');
                            } else {
                              field.onChange(value);
                            }
                          }}
                          value={isCreatingUnit ? 'create-new' : field.value}
                          disabled={isLoading || isCreatingUnit}
                        >
                          <FormControl>
                            <SelectTrigger className={cn(
                              isCreatingUnit && "border-green-300 bg-green-50"
                            )}>
                              <SelectValue placeholder="Vælg enhed">
                                {isCreatingUnit 
                                  ? "Opretter ny enhed..." 
                                  : (units.find(u => u._id === field.value)?.label || 'Vælg enhed')
                                }
                              </SelectValue>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {loadingUnits ? (
                              <SelectItem value="loading" disabled>
                                Indlæser enheder...
                              </SelectItem>
                            ) : (
                              <>
                                {units.map((unit) => (
                                  <SelectItem key={unit._id} value={unit._id}>
                                    {unit.label}
                                  </SelectItem>
                                ))}
                                <Separator />
                                <SelectItem value="create-new">
                                  + Opret ny enhed
                                </SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>

                        {/* Create new unit - Nielsen's Heuristics Implementation */}
                        {isCreatingUnit && (
                          <div className={cn(
                            "border rounded-lg p-4 mt-3 transition-all duration-300",
                            unitCreationStatus === 'creating' && "bg-blue-50 border-blue-200",
                            unitCreationStatus === 'success' && "bg-green-50 border-green-200",
                            unitCreationStatus === 'error' && "bg-red-50 border-red-200",
                            unitCreationStatus === 'idle' && "bg-green-50 border-green-200"
                          )}>
                            <div className="flex items-center gap-2 mb-3">
                              {/* Nielsen's Heuristic #1: System Status Indicator */}
                              {unitCreationStatus === 'creating' && (
                                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                              )}
                              {unitCreationStatus === 'success' && (
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                              )}
                              {unitCreationStatus === 'error' && (
                                <AlertTriangle className="w-4 h-4 text-red-600" />
                              )}
                              {unitCreationStatus === 'idle' && (
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              )}
                              
                              <span className={cn(
                                "text-sm font-medium",
                                unitCreationStatus === 'creating' && "text-blue-700",
                                unitCreationStatus === 'success' && "text-green-700",
                                unitCreationStatus === 'error' && "text-red-700",
                                unitCreationStatus === 'idle' && "text-green-700"
                              )}>
                                {unitCreationStatus === 'creating' && "Opretter enhed..."}
                                {unitCreationStatus === 'success' && "✅ Enhed oprettet succesfuldt!"}
                                {unitCreationStatus === 'error' && "❌ Fejl ved oprettelse"}
                                {unitCreationStatus === 'idle' && "Opret ny enhed"}
                              </span>
                            </div>
                            <div className="space-y-3">
                              {/* Nielsen's Heuristic #9: Error Recognition and Recovery */}
                              {unitCreationError && (
                                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                                  <div className="flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4 text-red-600" />
                                    <span className="text-sm font-medium text-red-800">Fejl</span>
                                  </div>
                                  <p className="text-sm text-red-700 mt-1">{unitCreationError}</p>
                                  <p className="text-xs text-red-600 mt-2">
                                    💡 <strong>Løsning:</strong> Kontroller at begge felter er udfyldt korrekt og prøv igen.
                                  </p>
                                </div>
                              )}
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <Input
                                  placeholder="Kort værdi (f.eks. ml, cl, dl)"
                                  value={newUnitValue}
                                  onChange={(e) => {
                                    setNewUnitValue(e.target.value.toLowerCase());
                                    if (unitCreationError) setUnitCreationError(null); // Clear error on change
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      if (newUnitName.trim() && newUnitValue.trim() && !isCreatingUnitLoading) {
                                        handleCreateUnit();
                                      }
                                    }
                                    if (e.key === 'Escape') {
                                      setIsCreatingUnit(false);
                                      setNewUnitName('');
                                      setNewUnitValue('');
                                      setUnitCreationError(null);
                                      setUnitCreationStatus('idle');
                                    }
                                  }}
                                  className={cn(
                                    "flex-1",
                                    unitCreationError && "border-red-500 focus:border-red-500"
                                  )}
                                  maxLength={10}
                                  disabled={isCreatingUnitLoading || unitCreationStatus === 'success'}
                                />
                                <Input
                                  placeholder="Fuldt navn (f.eks. Milliliter (ml))"
                                  value={newUnitName}
                                  onChange={(e) => {
                                    setNewUnitName(e.target.value);
                                    if (unitCreationError) setUnitCreationError(null); // Clear error on change
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      if (newUnitName.trim() && newUnitValue.trim() && !isCreatingUnitLoading) {
                                        handleCreateUnit();
                                      }
                                    }
                                    if (e.key === 'Escape') {
                                      setIsCreatingUnit(false);
                                      setNewUnitName('');
                                      setNewUnitValue('');
                                      setUnitCreationError(null);
                                      setUnitCreationStatus('idle');
                                    }
                                  }}
                                  className={cn(
                                    "flex-1",
                                    unitCreationError && "border-red-500 focus:border-red-500"
                                  )}
                                  maxLength={50}
                                  disabled={isCreatingUnitLoading || unitCreationStatus === 'success'}
                                />
                              </div>
                              {/* Nielsen's Heuristic #3: User Control and Freedom - Clear Actions */}
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={handleCreateUnit}
                                  disabled={
                                    !newUnitName.trim() || 
                                    !newUnitValue.trim() || 
                                    isCreatingUnitLoading || 
                                    unitCreationStatus === 'success'
                                  }
                                  className={cn(
                                    "min-w-[100px] transition-all duration-200",
                                    unitCreationStatus === 'success' 
                                      ? "bg-green-600 hover:bg-green-700" 
                                      : "bg-brand-primary hover:bg-brand-primary-hover"
                                  )}
                                >
                                  {isCreatingUnitLoading ? (
                                    <div className="flex items-center gap-2">
                                      <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                                      <span>Opretter...</span>
                                    </div>
                                  ) : unitCreationStatus === 'success' ? (
                                    <div className="flex items-center gap-2">
                                      <CheckCircle2 className="w-3 h-3" />
                                      <span>Oprettet!</span>
                                    </div>
                                  ) : (
                                    'Opret enhed'
                                  )}
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setIsCreatingUnit(false);
                                    setNewUnitName('');
                                    setNewUnitValue('');
                                    setUnitCreationError(null);
                                    setUnitCreationStatus('idle');
                                  }}
                                  disabled={isCreatingUnitLoading}
                                  className="min-w-[80px]"
                                >
                                  {isCreatingUnitLoading ? 'Vent...' : 'Annuller'}
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}

                        <FormDescription>
                          {isCreatingUnit ? (
                            <div className="space-y-1">
                              {unitCreationStatus === 'idle' && (
                                <span>Indtast kort værdi (f.eks. ml) og fuldt navn (f.eks. Milliliter (ml))</span>
                              )}
                              {unitCreationStatus === 'creating' && (
                                <div className="flex items-center gap-2 text-blue-600">
                                  <div className="w-3 h-3 border border-blue-500 border-t-transparent rounded-full animate-spin" />
                                  <span>Opretter enheden i systemet...</span>
                                </div>
                              )}
                              {unitCreationStatus === 'success' && (
                                <div className="flex items-center gap-2 text-green-600">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Enheden blev oprettet og er klar til brug!</span>
                                </div>
                              )}
                              {unitCreationStatus === 'error' && (
                                <div className="flex items-center gap-2 text-red-600">
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>Der opstod en fejl. Prøv venligst igen.</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            "Vælg salgsenheden for produktet eller opret en ny"
                          )}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Enhanced Discount Section */}
                <div className="border-t pt-6">
                  <div className="space-y-6">
                    {/* Discount Toggle */}
                    <FormField
                      control={form.control}
                      name="discount.enabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Aktivér produktrabat
                            </FormLabel>
                            <FormDescription>
                              Vis produktet med rabatpris og før/efter priser. 
                              <strong className="text-orange-600"> Bemærk:</strong> Hvis du angiver en før-pris, vil rabatgrupper ikke få yderligere rabat for at undgå dobbelt rabat.
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

                    {/* Discount Configuration */}
                    {form.watch('discount.enabled') && (
                      <div className="space-y-6 pl-4 border-l-2 border-brand-primary">
                        {/* Price Configuration Section */}
                        <div className="space-y-4">
                          <h4 className="font-medium text-brand-primary-dark flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            Priskonfiguration
                          </h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Current Price Display */}
                            <div className="bg-brand-gray-50 border border-brand-gray-200 rounded-lg p-4">
                              <FormLabel className="text-sm text-brand-primary-dark font-medium">
                                Nuværende pris
                              </FormLabel>
                              <div className="mt-1">
                                <span className="text-2xl font-bold text-brand-primary">
                                  {formatCurrency(form.watch('basispris') || 0)}
                                </span>
                              </div>
                              <FormDescription className="text-xs mt-1">
                                Dette er den pris kunden betaler
                              </FormDescription>
                            </div>

                            {/* Before Price Input */}
                            <FormField
                              control={form.control}
                              name="discount.beforePrice"
                              render={({ field }) => (
                                <CurrencyInput
                                  value={field.value || 0}
                                  onChange={field.onChange}
                                  error={errors.discount?.beforePrice?.message}
                                  disabled={isLoading}
                                  label="Før-pris (valgfrit)"
                                  description="Oprindelig pris før rabat - skal være højere end nuværende pris"
                                  placeholder="0,00"
                                  min={0}
                                />
                              )}
                            />
                          </div>

                          {/* Automatic Calculation Display */}
                          {form.watch('discount.beforePrice') && form.watch('basispris') && 
                           form.watch('discount.beforePrice') > form.watch('basispris') && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <Calculator className="h-4 w-4 text-green-600" />
                                <span className="text-sm font-medium text-green-800">Automatisk beregning</span>
                              </div>
                              <div className="text-xs text-green-700">
                                <p>Rabat: {formatCurrency((form.watch('discount.beforePrice') || 0) - (form.watch('basispris') || 0))}</p>
                                <p>Rabat procent: {Math.round(((form.watch('discount.beforePrice') || 0) - (form.watch('basispris') || 0)) / (form.watch('discount.beforePrice') || 1) * 100)}%</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Display Options */}
                        <div className="space-y-4">
                          <h4 className="font-medium text-brand-primary-dark flex items-center gap-2">
                            <Eye className="h-4 w-4" />
                            Visningsindstillinger
                          </h4>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Discount Label */}
                            <FormField
                              control={form.control}
                              name="discount.discountLabel"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Rabat label</FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      placeholder="Tilbud"
                                      disabled={isLoading}
                                      maxLength={50}
                                    />
                                  </FormControl>
                                  <FormDescription>
                                    Tekst der vises på rabat-badge (maks 50 tegn)
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {/* Show Strikethrough Toggle */}
                            <FormField
                              control={form.control}
                              name="discount.showStrikethrough"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                  <div className="space-y-0.5">
                                    <FormLabel className="text-sm font-medium">
                                      Vis gennemstregning
                                    </FormLabel>
                                    <FormDescription className="text-xs">
                                      Vis før-prisen med gennemstregning
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
                          </div>
                        </div>

                        {/* Rabat Gruppe Conflict Warning */}
                        {form.watch('discount.beforePrice') && form.watch('discount.beforePrice') > 0 && (
                          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertTriangle className="h-4 w-4 text-orange-600" />
                              <span className="text-sm font-medium text-orange-800">Rabatgruppe information</span>
                            </div>
                            <p className="text-xs text-orange-700 mb-2">
                              Da du har angivet en før-pris, vil rabatgrupper <strong>ikke</strong> få yderligere rabat oveni denne produktrabat. 
                              Dette forhindrer dobbelt rabat og sikrer korrekt prisfastsættelse.
                            </p>
                            <div className="text-xs text-orange-600">
                              <p>✓ Rabatgrupper vil se den nuværende pris som deres rabatpris</p>
                              <p>✓ Før-prisen vises med gennemstregning (hvis aktiveret)</p>
                              <p>✓ Ingen yderligere rabat beregnes</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rabat Gruppe Preview */}
            <RabatGruppePreview 
              basispris={form.watch('basispris')}
              discount={form.watch('discount')}
              produktnavn={form.watch('produktnavn')}
              isLoading={isLoading}
            />

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

                {/* Disabled Inventory Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-60">
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      Antal på lager
                      <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        min="0"
                        disabled={true}
                        className="bg-gray-100"
                      />
                    </FormControl>
                    <FormDescription>
                      Nuværende antal på lager (kræver tilkøb)
                    </FormDescription>
                  </FormItem>

                  <FormItem>
                    <FormLabel>Minimumslager (valgfrit)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        min="0"
                        disabled={true}
                        className="bg-gray-100"
                      />
                    </FormControl>
                    <FormDescription>
                      Advarsel når lageret er lavt (kræver tilkøb)
                    </FormDescription>
                  </FormItem>
                </div>

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
                      
                      {/* Professional Dropzone */}
                      <div
                        {...getRootProps()}
                        className={cn(
                          "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300",
                          isDragActive 
                            ? "border-brand-primary bg-brand-primary/10 scale-[1.02] shadow-xl shadow-brand-primary/20" 
                            : "border-gray-300 hover:border-brand-primary/60 hover:bg-brand-primary/5",
                          field.value?.length >= 3 && "opacity-50 cursor-not-allowed border-gray-200"
                        )}
                      >
                        <input {...getInputProps()} disabled={field.value?.length >= 3} />
                        <div className="flex flex-col items-center gap-3">
                          <div className={cn(
                            "p-4 rounded-full transition-all duration-300",
                            isDragActive ? "bg-brand-primary/20 scale-110" : "bg-gray-100"
                          )}>
                            <Upload className={cn(
                              "h-8 w-8 transition-all duration-300",
                              isDragActive ? "text-brand-primary scale-110" : "text-gray-400"
                            )} />
                          </div>
                          {isDragActive ? (
                            <div className="space-y-2">
                              <p className="text-brand-primary font-semibold text-lg">Slip billederne her nu!</p>
                              <p className="text-sm text-brand-primary/80">Billederne vil blive tilføjet til produktet</p>
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

                      {/* Professional Image Preview Grid */}
                      {field.value && field.value.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                          {field.value.map((image, index) => (
                            <div key={index} className="relative group">
                              {/* Professional Image Container */}
                              <div className={cn(
                                "aspect-[4/3] rounded-xl overflow-hidden border-2 bg-gradient-to-br from-gray-50 to-gray-100 shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]",
                                image.isPrimary 
                                  ? "border-brand-primary ring-4 ring-brand-primary/20 shadow-xl shadow-brand-primary/20" 
                                  : "border-gray-200 hover:border-brand-primary/50"
                              )}>
                                <ImagePreview
                                  image={image}
                                  altText={`Produktbillede ${index + 1}`}
                                />
                              </div>
                              
                              {/* Professional Image Actions Overlay */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-xl flex items-center justify-center gap-3">
                                <DialogTrigger asChild>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => {
                                      // Preview image in modal
                                      setImageToPreview(image);
                                    }}
                                    className="bg-white/95 text-gray-900 hover:bg-white shadow-xl backdrop-blur-md border border-white/20 hover:scale-105 transition-transform"
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
                                    className="bg-brand-primary/95 hover:bg-brand-primary shadow-xl backdrop-blur-md text-white border border-white/20 hover:scale-105 transition-transform"
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
                                  className="bg-red-500/95 hover:bg-red-600 shadow-xl backdrop-blur-md border border-white/20 hover:scale-105 transition-transform"
                                  title="Fjern billede"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                              
                              {/* Professional Primary Badge */}
                              {image.isPrimary && (
                                <Badge 
                                  variant="default" 
                                  className="absolute top-3 left-3 text-xs bg-brand-primary hover:bg-brand-primary-hover shadow-lg flex items-center gap-1 border border-white/20 backdrop-blur-sm"
                                >
                                  <Star className="h-3 w-3 fill-current" />
                                  Primær
                                </Badge>
                              )}
                              
                              {/* Professional Image Info Badge */}
                              <div className="absolute bottom-3 right-3 bg-black/80 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-md border border-white/20 font-medium">
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

                      <FormDescription className="text-sm">
                        <div className="flex items-start gap-2">
                          <Star className="h-4 w-4 text-brand-primary mt-0.5 flex-shrink-0" />
                          <div>
                            <strong>Billede tips:</strong> Klik på stjerne-ikonet for at ændre hvilket billede der er primært. 
                            Det primære billede vises først i produktkataloget og får en blå ramme. Du kan uploade op til 3 billeder i høj kvalitet (JPEG, PNG, WebP).
                          </div>
                        </div>
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
                  disabled={!isValid || isLoading || isSubmitting}
                  className="min-w-[120px]"
                  onClick={() => {
                    // Debug form state
                    console.log('🔍 Form Debug Info:', {
                      isValid,
                      errors,
                      formValues: form.getValues(),
                      isDirty,
                      isLoading,
                      isSubmitting
                    });
                  }}
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