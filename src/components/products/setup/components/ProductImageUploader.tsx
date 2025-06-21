import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { 
  Upload, 
  X, 
  Eye, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  ImagePlus,
  Star
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

// Types
export interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  cdnUrl?: string;
  uploadStatus: 'uploading' | 'completed' | 'error';
  uploadProgress: number;
  error?: string;
  isPrimary: boolean;
}

export interface ProductImageUploaderProps {
  images: UploadedImage[];
  onImagesChange: (images: UploadedImage[]) => void;
  maxImages?: number;
  maxFileSize?: number; // in bytes
  disabled?: boolean;
  className?: string;
}

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.DEV ? 'http://localhost:3001' : 'https://famous-dragon-b033ac.netlify.app');

// Upload single image to backend
const uploadImageToBackend = async (file: File): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    const formData = new FormData();
    formData.append('image', file);

    // Get auth token
    const token = localStorage.getItem('accessToken');
    const headers: HeadersInit = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/upload/image`, {
      method: 'POST',
      body: formData,
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success && data.data?.url) {
      // Convert relative URL to absolute if needed
      const cdnUrl = data.data.url.startsWith('http') 
        ? data.data.url 
        : `${API_BASE_URL}${data.data.url}`;
      
      return { success: true, url: cdnUrl };
    } else {
      throw new Error(data.error || 'Upload failed');
    }
  } catch (error) {
    console.error('Image upload error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Upload failed' 
    };
  }
};

export const ProductImageUploader: React.FC<ProductImageUploaderProps> = ({
  images,
  onImagesChange,
  maxImages = 3,
  maxFileSize = 5 * 1024 * 1024, // 5MB default
  disabled = false,
  className
}) => {
  const { toast } = useToast();
  const [dragCounter, setDragCounter] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file drop
  const onDrop = useCallback(async (acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const rejectionMessages = rejectedFiles.map(rejection => {
        const errors = rejection.errors.map((error: any) => {
          switch (error.code) {
            case 'file-too-large':
              return `${rejection.file.name} er for stor (${(rejection.file.size / 1024 / 1024).toFixed(1)}MB)`;
            case 'file-invalid-type':
              return `${rejection.file.name} har et ugyldigt format`;
            case 'too-many-files':
              return 'For mange filer valgt';
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

    // Check if we can add more images
    const availableSlots = maxImages - images.length;
    if (acceptedFiles.length > availableSlots) {
      toast({
        title: 'For mange billeder',
        description: `Du kan kun tilføje ${availableSlots} flere billede${availableSlots !== 1 ? 'r' : ''}. Du har valgt ${acceptedFiles.length} billeder.`,
        variant: 'destructive',
        duration: 4000,
      });
      acceptedFiles = acceptedFiles.slice(0, availableSlots);
    }

    if (acceptedFiles.length === 0) return;

    // Create initial image objects
    const newImages: UploadedImage[] = acceptedFiles.map((file, index) => ({
      id: `${Date.now()}-${index}`,
      file,
      preview: URL.createObjectURL(file),
      uploadStatus: 'uploading' as const,
      uploadProgress: 0,
      isPrimary: images.length === 0 && index === 0, // First image is primary if no existing images
    }));

    // Update images list immediately to show uploading state
    const updatedImages = [...images, ...newImages];
    onImagesChange(updatedImages);

    // Upload each image
    for (let i = 0; i < newImages.length; i++) {
      const imageToUpload = newImages[i];
      
      try {
        // Simulate progress updates
        const progressInterval = setInterval(() => {
          onImagesChange(prevImages => 
            prevImages.map(img => 
              img.id === imageToUpload.id && img.uploadProgress < 90
                ? { ...img, uploadProgress: Math.min(img.uploadProgress + 10, 90) }
                : img
            )
          );
        }, 200);

        // Upload to backend
        const uploadResult = await uploadImageToBackend(imageToUpload.file);
        
        clearInterval(progressInterval);

        // Update image with result
        onImagesChange(prevImages => 
          prevImages.map(img => 
            img.id === imageToUpload.id
              ? uploadResult.success
                ? { 
                    ...img, 
                    uploadStatus: 'completed' as const, 
                    uploadProgress: 100,
                    cdnUrl: uploadResult.url 
                  }
                : { 
                    ...img, 
                    uploadStatus: 'error' as const, 
                    uploadProgress: 0,
                    error: uploadResult.error 
                  }
              : img
          )
        );

        if (uploadResult.success) {
          toast({
            title: 'Billede uploadet',
            description: `${imageToUpload.file.name} blev uploadet succesfuldt.`,
            duration: 3000,
          });
        } else {
          toast({
            title: 'Upload fejlede',
            description: `${imageToUpload.file.name}: ${uploadResult.error}`,
            variant: 'destructive',
            duration: 5000,
          });
        }
      } catch (error) {
        console.error('Upload error:', error);
        onImagesChange(prevImages => 
          prevImages.map(img => 
            img.id === imageToUpload.id
              ? { 
                  ...img, 
                  uploadStatus: 'error' as const, 
                  uploadProgress: 0,
                  error: 'Upload fejlede uventet' 
                }
              : img
          )
        );
        
        toast({
          title: 'Upload fejlede',
          description: `${imageToUpload.file.name}: Upload fejlede uventet`,
          variant: 'destructive',
          duration: 5000,
        });
      }
    }
  }, [images, maxImages, onImagesChange, toast]);

  // Setup dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp']
    },
    maxFiles: maxImages,
    maxSize: maxFileSize,
    multiple: true,
    disabled: disabled || images.length >= maxImages,
    onDragEnter: () => setDragCounter(prev => prev + 1),
    onDragLeave: () => setDragCounter(prev => prev - 1),
    onDropAccepted: () => setDragCounter(0),
    onDropRejected: () => setDragCounter(0),
  });

  // Remove image
  const removeImage = useCallback((imageId: string) => {
    const imageToRemove = images.find(img => img.id === imageId);
    if (imageToRemove) {
      // Revoke object URL to prevent memory leaks
      URL.revokeObjectURL(imageToRemove.preview);
      
      const remainingImages = images.filter(img => img.id !== imageId);
      
      // If we removed the primary image, make the first remaining image primary
      if (imageToRemove.isPrimary && remainingImages.length > 0) {
        remainingImages[0].isPrimary = true;
      }
      
      onImagesChange(remainingImages);
      
      toast({
        title: 'Billede fjernet',
        description: 'Billedet blev fjernet fra listen.',
        duration: 2000,
      });
    }
  }, [images, onImagesChange, toast]);

  // Set primary image
  const setPrimaryImage = useCallback((imageId: string) => {
    onImagesChange(images.map(img => ({
      ...img,
      isPrimary: img.id === imageId
    })));
    
    toast({
      title: 'Primært billede ændret',
      description: 'Det primære billede blev opdateret.',
      duration: 2000,
    });
  }, [images, onImagesChange, toast]);

  // Preview image in new tab
  const previewImage = useCallback((image: UploadedImage) => {
    const urlToOpen = image.cdnUrl || image.preview;
    window.open(urlToOpen, '_blank');
  }, []);

  // Retry failed upload
  const retryUpload = useCallback(async (imageId: string) => {
    const imageToRetry = images.find(img => img.id === imageId);
    if (!imageToRetry) return;

    // Reset upload state
    onImagesChange(prevImages => 
      prevImages.map(img => 
        img.id === imageId
          ? { ...img, uploadStatus: 'uploading' as const, uploadProgress: 0, error: undefined }
          : img
      )
    );

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        onImagesChange(prevImages => 
          prevImages.map(img => 
            img.id === imageId && img.uploadProgress < 90
              ? { ...img, uploadProgress: Math.min(img.uploadProgress + 10, 90) }
              : img
          )
        );
      }, 200);

      const uploadResult = await uploadImageToBackend(imageToRetry.file);
      clearInterval(progressInterval);

      onImagesChange(prevImages => 
        prevImages.map(img => 
          img.id === imageId
            ? uploadResult.success
              ? { 
                  ...img, 
                  uploadStatus: 'completed' as const, 
                  uploadProgress: 100,
                  cdnUrl: uploadResult.url 
                }
              : { 
                  ...img, 
                  uploadStatus: 'error' as const, 
                  uploadProgress: 0,
                  error: uploadResult.error 
                }
            : img
        )
      );

      if (uploadResult.success) {
        toast({
          title: 'Upload gennemført',
          description: 'Billedet blev uploadet succesfuldt.',
          duration: 3000,
        });
      } else {
        toast({
          title: 'Upload fejlede igen',
          description: uploadResult.error || 'Upload fejlede',
          variant: 'destructive',
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Retry upload error:', error);
      onImagesChange(prevImages => 
        prevImages.map(img => 
          img.id === imageId
            ? { ...img, uploadStatus: 'error' as const, uploadProgress: 0, error: 'Upload fejlede uventet' }
            : img
        )
      );
    }
  }, [images, onImagesChange, toast]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      images.forEach(image => {
        if (image.preview) {
          URL.revokeObjectURL(image.preview);
        }
      });
    };
  }, []);

  const canAddMore = images.length < maxImages && !disabled;
  const completedImages = images.filter(img => img.uploadStatus === 'completed').length;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={cn(
          'relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300',
          'hover:bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
          isDragActive || dragCounter > 0
            ? 'border-blue-500 bg-blue-50 scale-[1.02] shadow-lg'
            : canAddMore
              ? 'border-gray-300 hover:border-blue-400'
              : 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60',
          disabled && 'pointer-events-none'
        )}
      >
        <input {...getInputProps()} ref={fileInputRef} />
        
        <div className="flex flex-col items-center gap-4">
          <motion.div
            className={cn(
              'p-4 rounded-full transition-colors duration-300',
              isDragActive || dragCounter > 0 
                ? 'bg-blue-100' 
                : canAddMore 
                  ? 'bg-gray-100' 
                  : 'bg-gray-200'
            )}
            animate={{
              scale: isDragActive || dragCounter > 0 ? 1.1 : 1,
              rotate: isDragActive || dragCounter > 0 ? 5 : 0
            }}
            transition={{ duration: 0.2 }}
          >
            <Upload className={cn(
              'h-8 w-8 transition-colors duration-300',
              isDragActive || dragCounter > 0 
                ? 'text-blue-600' 
                : canAddMore 
                  ? 'text-gray-500' 
                  : 'text-gray-400'
            )} />
          </motion.div>

          {isDragActive || dragCounter > 0 ? (
            <div className="space-y-2">
              <p className="text-lg font-semibold text-blue-700">
                Slip billederne her nu!
              </p>
              <p className="text-sm text-blue-600">
                Billederne vil blive uploadet automatisk
              </p>
            </div>
          ) : !canAddMore ? (
            <div className="space-y-2">
              <p className="text-gray-500 font-medium">
                {images.length >= maxImages 
                  ? `Maksimalt ${maxImages} billeder nået`
                  : 'Upload deaktiveret'
                }
              </p>
              <p className="text-xs text-gray-400">
                {images.length >= maxImages 
                  ? `Du har allerede uploadet ${maxImages} billeder`
                  : 'Upload er midlertidigt deaktiveret'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-lg font-semibold text-gray-700">
                Træk og slip billeder her
              </p>
              <p className="text-sm text-gray-600">
                eller klik for at vælge filer
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-gray-500">
                <Badge variant="outline" className="text-xs">
                  JPEG, PNG, WebP
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Maks. {(maxFileSize / 1024 / 1024).toFixed(0)}MB
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {maxImages - images.length} tilbage
                </Badge>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image Count & Status */}
      {images.length > 0 && (
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {completedImages}/{images.length} billeder
            </Badge>
            {completedImages > 0 && (
              <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {completedImages} uploadet
              </Badge>
            )}
            {images.some(img => img.uploadStatus === 'error') && (
              <Badge variant="outline" className="text-xs text-red-600 border-red-200">
                <AlertCircle className="h-3 w-3 mr-1" />
                {images.filter(img => img.uploadStatus === 'error').length} fejlet
              </Badge>
            )}
          </div>
          <p className="text-gray-500">
            Det første billede er primært
          </p>
        </div>
      )}

      {/* Image Preview Grid */}
      <AnimatePresence mode="popLayout">
        {images.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {images.map((image, index) => (
              <motion.div
                key={image.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="relative group"
              >
                {/* Image Container */}
                <div className={cn(
                  'aspect-[4/3] rounded-xl overflow-hidden border-2 bg-gray-50 shadow-sm transition-all duration-300',
                  'group-hover:shadow-lg',
                  image.uploadStatus === 'completed' 
                    ? 'border-green-200 bg-green-50/30' 
                    : image.uploadStatus === 'error'
                      ? 'border-red-200 bg-red-50/30'
                      : 'border-blue-200 bg-blue-50/30'
                )}>
                  <img
                    src={image.cdnUrl || image.preview}
                    alt={`Produktbillede ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const container = target.parentElement!;
                      container.innerHTML = `
                        <div class="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                          <div class="text-center">
                            <svg class="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
                            </svg>
                            <p class="text-xs">Billede ikke tilgængeligt</p>
                          </div>
                        </div>
                      `;
                    }}
                  />

                  {/* Upload Progress Overlay */}
                  {image.uploadStatus === 'uploading' && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                      <div className="text-center text-white">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                        <p className="text-sm font-medium">Uploader...</p>
                        <div className="w-24 h-2 bg-white/20 rounded-full mt-2">
                          <div 
                            className="h-full bg-white rounded-full transition-all duration-300"
                            style={{ width: `${image.uploadProgress}%` }}
                          />
                        </div>
                        <p className="text-xs mt-1 opacity-80">{image.uploadProgress}%</p>
                      </div>
                    </div>
                  )}

                  {/* Error Overlay */}
                  {image.uploadStatus === 'error' && (
                    <div className="absolute inset-0 bg-red-500/80 backdrop-blur-sm flex items-center justify-center">
                      <div className="text-center text-white p-4">
                        <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-sm font-medium mb-1">Upload fejlede</p>
                        <p className="text-xs opacity-90 mb-3">{image.error}</p>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => retryUpload(image.id)}
                          className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                        >
                          Prøv igen
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons Overlay */}
                {image.uploadStatus === 'completed' && (
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 rounded-xl flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <Button
                      size="sm"
                      variant="secondary" 
                      onClick={() => previewImage(image)}
                      className="bg-white/90 text-gray-900 hover:bg-white shadow-lg backdrop-blur-sm"
                      title="Forhåndsvis billede"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {!image.isPrimary && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setPrimaryImage(image.id)}
                        className="bg-yellow-500/90 text-white hover:bg-yellow-600 shadow-lg backdrop-blur-sm"
                        title="Sæt som primært billede"
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => removeImage(image.id)}
                      className="bg-red-500/90 hover:bg-red-600 shadow-lg backdrop-blur-sm"
                      title="Fjern billede"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* Primary Badge */}
                {image.isPrimary && (
                  <Badge 
                    className="absolute top-3 left-3 bg-blue-600 hover:bg-blue-700 text-white shadow-lg backdrop-blur-sm z-10"
                  >
                    <Star className="h-3 w-3 mr-1 fill-current" />
                    Primær
                  </Badge>
                )}

                {/* Status Badge */}
                <div className="absolute bottom-3 right-3 z-10">
                  {image.uploadStatus === 'completed' && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200 shadow-sm">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Klar
                    </Badge>
                  )}
                  {image.uploadStatus === 'uploading' && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200 shadow-sm">
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Upload
                    </Badge>
                  )}
                  {image.uploadStatus === 'error' && (
                    <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200 shadow-sm">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Fejl
                    </Badge>
                  )}
                </div>

                {/* Image Info */}
                <div className="absolute bottom-3 left-3 bg-black/70 text-white text-xs px-2 py-1 rounded backdrop-blur-sm z-10">
                  {index + 1}/{images.length}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instructions */}
      {images.length === 0 && (
        <div className="text-center py-4 text-sm text-gray-500 border-t">
          <p>Upload 1-3 højkvalitetsbilleder af dit produkt.</p>
          <p>Det første billede vil automatisk blive markeret som primært.</p>
        </div>
      )}
    </div>
  );
};

export default ProductImageUploader; 