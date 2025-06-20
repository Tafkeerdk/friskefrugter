import React, { useState, useCallback, useMemo } from 'react';
import { Dialog, DialogContent } from './dialog';
import { Button } from './button';
import { X, ZoomIn, ZoomOut, RotateCw, Download, Maximize2 } from 'lucide-react';

interface ImageViewerProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title?: string;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({
  isOpen,
  onClose,
  imageUrl,
  title = 'Billede'
}) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Generate high-resolution Imgix URL
  const getHighResUrl = useCallback((baseUrl: string, width = 1200, height = 1200) => {
    if (!baseUrl) return '';
    
    // If it's already an Imgix URL, modify the parameters
    if (baseUrl.includes('imgix') || baseUrl.includes('?')) {
      try {
        const url = new URL(baseUrl);
        url.searchParams.set('w', width.toString());
        url.searchParams.set('h', height.toString());
        url.searchParams.set('fit', 'max');
        url.searchParams.set('q', '90');
        url.searchParams.set('auto', 'format');
        return url.toString();
      } catch {
        return baseUrl;
      }
    }
    
    // If it's a Google Cloud Storage URL, add Imgix parameters
    return `${baseUrl}?w=${width}&h=${height}&fit=max&q=90&auto=format`;
  }, []);

  const getDownloadUrl = useCallback((baseUrl: string) => {
    if (!baseUrl) return '';
    
    // For download, we want the original size with high quality
    if (baseUrl.includes('imgix') || baseUrl.includes('?')) {
      try {
        const url = new URL(baseUrl);
        url.searchParams.set('q', '95');
        url.searchParams.set('auto', 'format');
        url.searchParams.delete('w');
        url.searchParams.delete('h');
        return url.toString();
      } catch {
        return baseUrl;
      }
    }
    
    return `${baseUrl}?q=95&auto=format`;
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev * 1.5, 5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev / 1.5, 0.5));
  }, []);

  const handleRotate = useCallback(() => {
    setRotation(prev => (prev + 90) % 360);
  }, []);

  const handleReset = useCallback(() => {
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  }, [zoom, position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      e.preventDefault();
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  }, [isDragging, zoom, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDownload = useCallback(() => {
    const link = document.createElement('a');
    link.href = getDownloadUrl(imageUrl);
    link.download = `${title.toLowerCase().replace(/\s+/g, '-')}.jpg`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [imageUrl, title, getDownloadUrl]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.5, Math.min(5, prev * delta)));
  }, []);

  React.useEffect(() => {
    if (isOpen) {
      // Reset state when opening
      handleReset();
    }
  }, [isOpen, handleReset]);

  const highResImageUrl = useMemo(() => getHighResUrl(imageUrl), [imageUrl, getHighResUrl]);

  // Memoize image transform style
  const imageTransformStyle = useMemo(() => ({
    transform: `translate(${position.x}px, ${position.y}px) scale(${zoom}) rotate(${rotation}deg)`,
    maxHeight: zoom === 1 ? '90%' : 'none',
    maxWidth: zoom === 1 ? '90%' : 'none',
    transition: isDragging ? 'none' : 'transform 0.2s ease'
  }), [position, zoom, rotation, isDragging]);

  const cursorStyle = useMemo(() => {
    if (zoom > 1) {
      return isDragging ? 'grabbing' : 'grab';
    }
    return 'default';
  }, [zoom, isDragging]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black border-0" aria-describedby="image-viewer-description">
        {/* Visually hidden title for accessibility */}
        <div className="sr-only">
          <h2>{title}</h2>
          <div id="image-viewer-description">
            Billedviser. Brug zoom knapper eller scroll for at zoome. Træk for at flytte billedet når zoomet ind. Tryk ESC for at lukke.
          </div>
        </div>

        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-black bg-opacity-75 p-4 flex justify-between items-center">
          <h3 className="text-white font-medium truncate max-w-md">{title}</h3>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomOut}
              className="text-white hover:bg-white hover:bg-opacity-20 border-0"
              disabled={zoom <= 0.5}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-white text-sm min-w-[60px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomIn}
              className="text-white hover:bg-white hover:bg-opacity-20 border-0"
              disabled={zoom >= 5}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRotate}
              className="text-white hover:bg-white hover:bg-opacity-20 border-0"
            >
              <RotateCw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-white hover:bg-white hover:bg-opacity-20 border-0"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              className="text-white hover:bg-white hover:bg-opacity-20 border-0"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 border-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Image Container */}
        <div 
          className="w-full h-[95vh] flex items-center justify-center overflow-hidden select-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          style={{ 
            cursor: cursorStyle,
            touchAction: 'none'
          }}
        >
          {highResImageUrl && (
            <img
              src={highResImageUrl}
              alt={title}
              className="max-w-none pointer-events-none"
              style={imageTransformStyle}
              draggable={false}
              loading="eager"
            />
          )}
        </div>

        {/* Instructions */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white text-sm px-4 py-2 rounded-lg pointer-events-none">
          <div className="flex items-center gap-4 text-xs">
            <span className="text-white">🖱️ Træk for at flytte</span>
            <span className="text-white">🔍 Scroll for at zoome</span>
            <span className="text-white">⌨️ ESC for at lukke</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Hook for keyboard shortcuts
export const useImageViewerKeyboard = (onClose: () => void) => {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);
}; 