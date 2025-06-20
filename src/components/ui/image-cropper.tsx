import React, { useState, useRef, useCallback, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';
import { Button } from './button';
import { Slider } from './slider';
import { RotateCw, ZoomIn, ZoomOut, Crop, X } from 'lucide-react';

interface ImageCropperProps {
  isOpen: boolean;
  onClose: () => void;
  onCrop: (croppedFile: File) => void;
  imageFile: File | null;
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const ImageCropper: React.FC<ImageCropperProps> = ({
  isOpen,
  onClose,
  onCrop,
  imageFile
}) => {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [cropArea, setCropArea] = useState<CropArea>({ x: 0, y: 0, width: 200, height: 200 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setImageUrl(url);
      
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [imageFile]);

  const handleImageLoad = useCallback(() => {
    if (imageRef.current && containerRef.current) {
      const img = imageRef.current;
      const container = containerRef.current;
      
      // Calculate the display size to fit container
      const containerWidth = container.clientWidth - 40; // padding
      const containerHeight = container.clientHeight - 40;
      
      const aspectRatio = img.naturalWidth / img.naturalHeight;
      let displayWidth, displayHeight;
      
      if (aspectRatio > containerWidth / containerHeight) {
        displayWidth = Math.min(containerWidth, img.naturalWidth);
        displayHeight = displayWidth / aspectRatio;
      } else {
        displayHeight = Math.min(containerHeight, img.naturalHeight);
        displayWidth = displayHeight * aspectRatio;
      }
      
      setImageSize({ width: displayWidth, height: displayHeight });
      
      // Center the crop area
      const cropSize = Math.min(200, displayWidth * 0.8, displayHeight * 0.8);
      setCropArea({
        x: (displayWidth - cropSize) / 2,
        y: (displayHeight - cropSize) / 2,
        width: cropSize,
        height: cropSize
      });
    }
  }, []);

  // Optimize mouse events with useCallback
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check if click is inside crop area
    if (
      x >= cropArea.x && 
      x <= cropArea.x + cropArea.width &&
      y >= cropArea.y && 
      y <= cropArea.y + cropArea.height
    ) {
      setIsDragging(true);
      setDragStart({ x: x - cropArea.x, y: y - cropArea.y });
    }
  }, [cropArea]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    e.preventDefault(); // Prevent default behavior
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - dragStart.x;
    const y = e.clientY - rect.top - dragStart.y;
    
    // Keep crop area within image bounds
    const maxX = imageSize.width - cropArea.width;
    const maxY = imageSize.height - cropArea.height;
    
    setCropArea(prev => ({
      ...prev,
      x: Math.max(0, Math.min(x, maxX)),
      y: Math.max(0, Math.min(y, maxY))
    }));
  }, [isDragging, dragStart, imageSize, cropArea.width, cropArea.height]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleCrop = useCallback(async () => {
    if (!imageRef.current || !canvasRef.current || !imageFile) return;

    setIsProcessing(true);
    
    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = imageRef.current;
      
      // Set canvas size to crop area
      canvas.width = cropArea.width;
      canvas.height = cropArea.height;
      
      // Calculate scaling factors
      const scaleX = img.naturalWidth / imageSize.width;
      const scaleY = img.naturalHeight / imageSize.height;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Apply transformations
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(scale, scale);
      
      // Draw the cropped portion
      ctx.drawImage(
        img,
        cropArea.x * scaleX,
        cropArea.y * scaleY,
        cropArea.width * scaleX,
        cropArea.height * scaleY,
        -cropArea.width / 2,
        -cropArea.height / 2,
        cropArea.width,
        cropArea.height
      );
      
      ctx.restore();
      
      // Convert canvas to blob with higher quality
      canvas.toBlob((blob) => {
        if (blob) {
          const croppedFile = new File([blob], imageFile.name, {
            type: imageFile.type,
            lastModified: Date.now()
          });
          onCrop(croppedFile);
        }
        setIsProcessing(false);
      }, imageFile.type, 0.95); // Higher quality
      
    } catch (error) {
      console.error('Crop error:', error);
      setIsProcessing(false);
    }
  }, [imageRef, canvasRef, imageFile, cropArea, imageSize, rotation, scale, onCrop]);

  const resetTransforms = useCallback(() => {
    setScale(1);
    setRotation(0);
    if (imageSize.width && imageSize.height) {
      const cropSize = Math.min(200, imageSize.width * 0.8, imageSize.height * 0.8);
      setCropArea({
        x: (imageSize.width - cropSize) / 2,
        y: (imageSize.height - cropSize) / 2,
        width: cropSize,
        height: cropSize
      });
    }
  }, [imageSize]);

  // Memoize transform style to prevent unnecessary re-renders
  const imageTransformStyle = useMemo(() => ({
    width: imageSize.width,
    height: imageSize.height,
    transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotation}deg)`,
    transition: isDragging ? 'none' : 'transform 0.2s ease'
  }), [imageSize, scale, rotation, isDragging]);

  // Memoize crop area style
  const cropAreaStyle = useMemo(() => ({
    left: cropArea.x,
    top: cropArea.y,
    width: cropArea.width,
    height: cropArea.height,
    cursor: isDragging ? 'grabbing' : 'grab'
  }), [cropArea, isDragging]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0" aria-describedby="crop-description">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Crop className="h-5 w-5" />
            Tilpas profilbillede
          </DialogTitle>
          <div id="crop-description" className="sr-only">
            Brug værktøjerne nedenfor til at beskære og tilpasse dit profilbillede. Du kan zoome, rotere og flytte beskæringsområdet.
          </div>
        </DialogHeader>
        
        <div className="flex flex-col h-[70vh]">
          {/* Image Editor Area */}
          <div 
            ref={containerRef}
            className="flex-1 relative bg-gray-100 m-6 rounded-lg overflow-hidden select-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ touchAction: 'none' }} // Prevent touch scrolling
          >
            {imageUrl && (
              <>
                <img
                  ref={imageRef}
                  src={imageUrl}
                  alt="Crop preview"
                  className="absolute top-1/2 left-1/2 pointer-events-none"
                  style={imageTransformStyle}
                  onLoad={handleImageLoad}
                  draggable={false}
                />
                
                {/* Crop Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-50 pointer-events-none" />
                
                {/* Crop Area */}
                <div
                  className="absolute border-2 border-white shadow-lg bg-transparent"
                  style={cropAreaStyle}
                >
                  <div className="absolute inset-0 border border-white opacity-50" />
                  {/* Corner handles */}
                  <div className="absolute -top-1 -left-1 w-3 h-3 bg-white border border-gray-300 rounded-full" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-white border border-gray-300 rounded-full" />
                  <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-white border border-gray-300 rounded-full" />
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-white border border-gray-300 rounded-full" />
                </div>
              </>
            )}
          </div>
          
          {/* Controls */}
          <div className="p-6 pt-0 space-y-4 border-t">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Zoom Control */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <ZoomIn className="h-4 w-4" />
                  Zoom: {Math.round(scale * 100)}%
                </label>
                <Slider
                  value={[scale]}
                  onValueChange={(value) => setScale(value[0])}
                  min={0.5}
                  max={3}
                  step={0.1}
                  className="w-full"
                />
              </div>
              
              {/* Rotation Control */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <RotateCw className="h-4 w-4" />
                  Rotation: {rotation}°
                </label>
                <Slider
                  value={[rotation]}
                  onValueChange={(value) => setRotation(value[0])}
                  min={-180}
                  max={180}
                  step={15}
                  className="w-full"
                />
              </div>
              
              {/* Size Control */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Størrelse: {cropArea.width}x{cropArea.height}px
                </label>
                <Slider
                  value={[cropArea.width]}
                  onValueChange={(value) => {
                    const newSize = value[0];
                    setCropArea(prev => ({
                      ...prev,
                      width: newSize,
                      height: newSize,
                      x: Math.max(0, Math.min(prev.x, imageSize.width - newSize)),
                      y: Math.max(0, Math.min(prev.y, imageSize.height - newSize))
                    }));
                  }}
                  min={100}
                  max={Math.min(imageSize.width, imageSize.height)}
                  step={10}
                  className="w-full"
                />
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-between items-center">
              <Button variant="outline" onClick={resetTransforms} disabled={isProcessing}>
                Nulstil
              </Button>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose} disabled={isProcessing}>
                  <X className="mr-2 h-4 w-4" />
                  Annuller
                </Button>
                <Button onClick={handleCrop} disabled={isProcessing}>
                  {isProcessing ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Behandler...
                    </>
                  ) : (
                    <>
                      <Crop className="mr-2 h-4 w-4" />
                      Anvend beskæring
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Hidden canvas for processing */}
        <canvas ref={canvasRef} className="hidden" />
      </DialogContent>
    </Dialog>
  );
}; 