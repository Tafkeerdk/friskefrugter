import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProductSetupForm } from './ProductSetupForm';
import { ProductFormData, ProductImage } from '@/types/product';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Edit, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ProductSetupInterfaceProps {
  productId?: string; // If provided, we're in edit mode
  onSuccess?: (product: ProductFormData) => void;
  onCancel?: () => void;
}

export const ProductSetupInterface: React.FC<ProductSetupInterfaceProps> = ({
  productId,
  onSuccess,
  onCancel
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [initialData, setInitialData] = useState<Partial<ProductFormData> | undefined>();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productName, setProductName] = useState<string>('');

  const isEditMode = Boolean(productId);

  // Fetch product data for edit mode
  React.useEffect(() => {
    if (isEditMode && productId) {
      const fetchProductData = async () => {
        setIsLoading(true);
        try {
          const response = await api.getProduct(productId);
          if (response.success && response.data) {
            const product = response.data as any;
            
            // Convert existing images to ProductImage format
            const existingImages: ProductImage[] = product.billeder?.map((img: any, index: number) => ({
              _id: img._id,
              url: img.url,
              filename: img.filename,
              originalname: img.originalname,
              size: img.size,
              uploadedAt: img.uploadedAt,
              isExisting: true,
              isPrimary: img.isPrimary || (index === 0 && !product.billeder.some((i: any) => i.isPrimary)), // Use actual isPrimary from DB, fallback to first if none set
              preview: img.url // Use the actual URL as preview for existing images
            })) || [];
            
            setInitialData({
              produktnavn: product.produktnavn,
              varenummer: product.varenummer,
              beskrivelse: product.beskrivelse,
              eanNummer: product.eanNummer,
              enhed: product.enhed._id, // Use the ID, not the object
              basispris: product.basispris,
              kategori: { 
                id: product.kategori._id, 
                navn: product.kategori.navn, 
                isNew: false 
              },
              lagerstyring: product.lagerstyring,
              billeder: existingImages,
              aktiv: product.aktiv
            });
            
            // Set product name for delete dialog
            setProductName(product.produktnavn);
          }
        } catch (error) {
          console.error('Failed to fetch product:', error);
          toast({
            title: 'Fejl',
            description: 'Kunne ikke hente produktdata',
            variant: 'destructive',
            duration: 5000,
          });
        } finally {
          setIsLoading(false);
        }
      };

      fetchProductData();
    }
  }, [isEditMode, productId, toast]);

  const handleSubmit = async (data: ProductFormData) => {
    // The actual API call is now handled in ProductSetupForm
    // This is just for the success callback and navigation
    try {
      // Call success callback if provided
      onSuccess?.(data);
      
      // Navigate back to products list
      navigate('/admin/products');
      
    } catch (error) {
      console.error('Error in submit handler:', error);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate('/admin/products');
    }
  };

  const handleDeleteProduct = async () => {
    if (!productId) return;
    
    try {
      const response = await api.deleteProduct(productId);
      
      if (response.success) {
        toast({
          title: 'Produkt slettet',
          description: `Produktet "${productName}" blev slettet succesfuldt.`,
          duration: 3000,
        });
        
        setIsDeleteDialogOpen(false);
        navigate('/admin/products');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: 'Fejl',
        description: 'Der opstod en fejl ved sletning af produktet.',
        variant: 'destructive',
        duration: 5000,
      });
    }
  };

  // Loading state while fetching data in edit mode
  if (isEditMode && isLoading && !initialData) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handleCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tilbage
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Indlæser produkt...</h1>
            <p className="text-muted-foreground">
              Henter produktdata fra serveren
            </p>
          </div>
        </div>
        
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6">
        {/* Navigation */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={handleCancel}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Tilbage til produkter
            </Button>
            
            {/* Delete button for edit mode */}
            {isEditMode && (
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Slet produkt
              </Button>
            )}
          </div>
        </div>

        {/* Main Form */}
        <ProductSetupForm
          initialData={initialData}
          productId={productId}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          mode={isEditMode ? 'edit' : 'create'}
          isLoading={isLoading}
        />
        
        {/* Delete Product Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Slet produkt</DialogTitle>
              <DialogDescription>
                Er du sikker på, at du vil slette produktet "{productName}"?
                Denne handling kan ikke fortrydes.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Annuller
              </Button>
              <Button variant="destructive" onClick={handleDeleteProduct}>
                Slet produkt
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

// Example usage in a route component
export const CreateProductPage: React.FC = () => {
  return (
    <ProductSetupInterface
      onSuccess={(product) => {
        console.log('Product created successfully:', product);
      }}
    />
  );
};

export const EditProductPage: React.FC<{ productId: string }> = ({ productId }) => {
  return (
    <ProductSetupInterface
      productId={productId}
      onSuccess={(product) => {
        console.log('Product updated successfully:', product);
      }}
    />
  );
};

// Example integration with dashboard
export const DashboardProductSetup: React.FC = () => {
  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list');
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>();

  if (mode === 'create') {
    return (
      <ProductSetupInterface
        onSuccess={() => setMode('list')}
        onCancel={() => setMode('list')}
      />
    );
  }

  if (mode === 'edit' && selectedProductId) {
    return (
      <ProductSetupInterface
        productId={selectedProductId}
        onSuccess={() => setMode('list')}
        onCancel={() => setMode('list')}
      />
    );
  }

  // Product list view
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Produkter</h2>
          <p className="text-muted-foreground">
            Administrer dine produkter, kategorier og lager.
          </p>
        </div>
        <Button onClick={() => setMode('create')} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Tilføj produkt
        </Button>
      </div>

      {/* Product list would go here */}
      <Card>
        <CardHeader>
          <CardTitle>Produktliste</CardTitle>
          <CardDescription>
            Klik "Rediger" for at redigere et eksisterende produkt
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 border rounded">
              <span>Økologiske æbler</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedProductId('1');
                  setMode('edit');
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Rediger
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 