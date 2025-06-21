import React, { useState } from 'react';
import ProductImageUploader, { UploadedImage } from './ProductImageUploader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

/**
 * Example component demonstrating how to use ProductImageUploader
 * This shows the basic integration pattern for any form that needs image upload
 */
export const ProductImageUploaderExample: React.FC = () => {
  const [images, setImages] = useState<UploadedImage[]>([]);

  const handleImagesChange = (newImages: UploadedImage[]) => {
    setImages(newImages);
    console.log('Images updated:', newImages);
  };

  const handleSubmit = () => {
    const completedImages = images.filter(img => img.uploadStatus === 'completed');
    
    if (completedImages.length === 0) {
      alert('Ingen billeder uploadet endnu!');
      return;
    }

    console.log('Submitting with images:', completedImages);
    alert(`Submitting ${completedImages.length} billeder!`);
  };

  const handleReset = () => {
    setImages([]);
  };

  const completedCount = images.filter(img => img.uploadStatus === 'completed').length;
  const uploadingCount = images.filter(img => img.uploadStatus === 'uploading').length;
  const errorCount = images.filter(img => img.uploadStatus === 'error').length;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>ProductImageUploader Example</CardTitle>
          <CardDescription>
            Demonstration of the ProductImageUploader component with real upload functionality
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Status Overview */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-sm">
              <span className="font-medium">Status:</span>
            </div>
            <Badge variant="secondary">
              {images.length} total
            </Badge>
            {completedCount > 0 && (
              <Badge variant="default" className="bg-green-600">
                {completedCount} completed
              </Badge>
            )}
            {uploadingCount > 0 && (
              <Badge variant="default" className="bg-blue-600">
                {uploadingCount} uploading
              </Badge>
            )}
            {errorCount > 0 && (
              <Badge variant="destructive">
                {errorCount} errors
              </Badge>
            )}
          </div>

          {/* Image Uploader */}
          <ProductImageUploader
            images={images}
            onImagesChange={handleImagesChange}
            maxImages={3}
            maxFileSize={5 * 1024 * 1024} // 5MB
            disabled={false}
          />

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={handleReset}
              disabled={images.length === 0}
            >
              Reset
            </Button>
            
            <Button 
              onClick={handleSubmit}
              disabled={completedCount === 0}
            >
              Submit ({completedCount} billeder)
            </Button>
          </div>

          {/* Debug Info */}
          {images.length > 0 && (
            <details className="mt-6">
              <summary className="cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-800">
                Debug Information
              </summary>
              <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto">
                {JSON.stringify(images.map(img => ({
                  id: img.id,
                  fileName: img.file.name,
                  fileSize: `${(img.file.size / 1024 / 1024).toFixed(2)}MB`,
                  uploadStatus: img.uploadStatus,
                  uploadProgress: img.uploadProgress,
                  isPrimary: img.isPrimary,
                  cdnUrl: img.cdnUrl,
                  error: img.error
                })), null, 2)}
              </pre>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductImageUploaderExample; 