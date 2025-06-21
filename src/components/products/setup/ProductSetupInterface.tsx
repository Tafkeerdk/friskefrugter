import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProductSetupForm } from './ProductSetupForm';
import { ProductFormData } from '@/types/product';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Edit } from 'lucide-react';

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
            setInitialData({
              produktnavn: product.produktnavn,
              beskrivelse: product.beskrivelse,
              eanNummer: product.eanNummer,
              enhed: product.enhed,
              basispris: product.basispris,
              kategori: { 
                id: product.kategori._id, 
                navn: product.kategori.navn, 
                isNew: false 
              },
              lagerstyring: product.lagerstyring,
              billeder: [], // Convert URLs to File objects would be complex
              aktiv: product.aktiv
            });
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
      navigate('/dashboard/products');
      
    } catch (error) {
      console.error('Error in submit handler:', error);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate('/dashboard/products');
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
          <Button variant="outline" size="sm" onClick={handleCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tilbage til produkter
          </Button>
        </div>

        {/* Main Form */}
        <ProductSetupForm
          initialData={initialData}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          mode={isEditMode ? 'edit' : 'create'}
          isLoading={isLoading}
        />
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