import React, { useState, useCallback, useEffect } from 'react';
import { FormField, FormItem, FormLabel, FormDescription, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ImagePlus, Upload, Eye, Star, Trash2, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UseFormReturn } from 'react-hook-form';
import { ProductFormData, ProductImage } from '@/types/product';
import { useDropzone } from 'react-dropzone';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/lib/api';

interface ImageUploadSectionProps {
  form: UseFormReturn<ProductFormData>;
  isLoading: boolean;
  mode: 'create' | 'edit';
  productId?: string;
}

// Fixed DialogTrigger component with proper React hierarchy
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

export const ImageUploadSection: React.FC<ImageUploadSectionProps> = ({
  form,
  isLoading,
  mode,
  productId
}) => {
  const { toast } = useToast();
  const [uploadingImages, setUploadingImages] = useState<Set<string>>(new Set());
  const [imageToPreview, setImageToPreview] = useState<ProductImage | null>(null);
  const [deletedImageIds, setDeletedImageIds] = useState<string[]>([]);

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
  useEffect(() => {
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

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImagePlus className="h-5 w-5" />
            Produktbilleder
          </CardTitle>
          <CardDescription>
            Upload 1-3 billeder af produktet (valgfrit - JPEG, PNG, WebP - maks. 5MB hver)
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
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                onClick={() => {
                                  setImageToPreview(image);
                                }}
                                className="bg-white/95 text-gray-900 hover:bg-white shadow-xl backdrop-blur-md border border-white/20 hover:scale-105 transition-transform"
                                title="Forhåndsvis billede"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
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
                                    src={imageToPreview.isExisting ? imageToPreview.url : imageToPreview.preview}
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
                          </Dialog>
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
    </>
  );
}; 