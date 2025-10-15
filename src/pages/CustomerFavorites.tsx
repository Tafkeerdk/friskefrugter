import React, { useState, useEffect } from 'react';
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, AlertCircle, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { tokenManager } from "@/lib/auth";
import { ProductCard } from "@/components/products/ProductCard";

interface CustomerPricing {
  price: number;
  originalPrice?: number;
  discountType: 'unique_offer' | 'fast_udsalgspris' | 'tilbudsgruppe' | 'rabat_gruppe' | 'none';
  discountLabel?: string;
  discountPercentage?: number;
  showStrikethrough?: boolean;
  offerDetails?: {
    description?: string;
    validFrom?: string;
    validTo?: string;
  };
  saleDetails?: {
    validFrom?: string;
    validTo?: string;
  };
  groupDetails?: {
    groupName?: string;
    groupDescription?: string;
    groupColor?: string;
  };
}

interface Unit {
  _id: string;
  value: string;
  label: string;
  description?: string;
}

interface Favorite {
  _id: string;
  addedAt: string;
  product: {
    _id: string;
    produktnavn: string;
    varenummer?: string;
    basispris: number;
    billeder: Array<{
      url: string;
      isPrimary: boolean;
    }>;
    kategori: {
      navn: string;
    };
    enhed: Unit | string;
  };
  customerPricing: CustomerPricing;
}

export default function CustomerFavorites() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const { isCustomerAuthenticated } = useAuth();

  useEffect(() => {
    if (isCustomerAuthenticated) {
      loadFavorites();
    }
  }, [isCustomerAuthenticated]);

  const loadFavorites = async () => {
    try {
      setIsLoading(true);
      
      // ✅ CRITICAL: Use tokenManager instead of localStorage
      const token = tokenManager.getAccessToken('customer');
      if (!token) {
        throw new Error('Ingen token fundet');
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'https://famous-dragon-b033ac.netlify.app'}/.netlify/functions/customer-favorites`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'X-Session-Type': 'browser',
            'X-PWA': 'false',
            'X-Display-Mode': 'browser'
          }
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setFavorites(data.favorites);
      } else {
        throw new Error(data.error || 'Kunne ikke indlæse favoritter');
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
      toast({
        variant: 'destructive',
        title: 'Fejl',
        description: 'Kunne ikke indlæse favoritter. Prøv igen.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFavorite = async (productId: string) => {
    try {
      setRemovingIds(prev => new Set(prev).add(productId));

      // ✅ CRITICAL: Use tokenManager instead of localStorage
      const token = tokenManager.getAccessToken('customer');
      if (!token) throw new Error('Ingen token fundet');

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'https://famous-dragon-b033ac.netlify.app'}/.netlify/functions/customer-favorites`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'X-Session-Type': 'browser',
            'X-PWA': 'false',
            'X-Display-Mode': 'browser'
          },
          body: JSON.stringify({ productId })
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setFavorites(prev => prev.filter(fav => fav.product._id !== productId));
        toast({
          title: 'Fjernet fra favoritter',
          description: 'Produktet er fjernet fra dine favoritter',
          className: 'bg-brand-success text-white border-brand-success'
        });
      } else {
        throw new Error(data.error || 'Kunne ikke fjerne favorit');
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
      toast({
        variant: 'destructive',
        title: 'Fejl',
        description: 'Kunne ikke fjerne favorit. Prøv igen.'
      });
    } finally {
      setRemovingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  // Helper function to get product image
  const getProductImageUrl = (favorite: Favorite) => {
    const primaryImage = favorite.product.billeder.find(img => img.isPrimary);
    return primaryImage?.url || favorite.product.billeder[0]?.url || '/placeholder.svg';
  };

  if (!isCustomerAuthenticated) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow">
          <div className="page-container py-12">
            <div className="content-width text-center">
              <AlertCircle className="h-16 w-16 text-brand-warning mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Login påkrævet</h1>
              <p className="text-gray-600 mb-6">
                Du skal være logget ind for at se dine favoritter
              </p>
              <Link to="/login">
                <Button className="btn-brand-primary">
                  Log ind
                </Button>
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-grow bg-gray-50">
        <div className="page-container py-8">
          <div className="content-width">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <Heart className="h-8 w-8 text-brand-primary fill-current" />
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                  Mine Favoritter
                </h1>
              </div>
              <p className="text-gray-600">
                Dine gemte produkter for hurtig adgang
              </p>
            </div>

            {/* Loading State - Matching Products Page Grid */}
            {isLoading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 justify-items-center">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <Card key={i} className="w-full max-w-[240px] sm:max-w-[320px]">
                    <CardContent className="p-0">
                      <Skeleton className="w-full aspect-[4/3] rounded-t-lg" />
                      <div className="p-4 space-y-3">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isLoading && favorites.length === 0 && (
              <Card className="card-brand p-12 text-center">
                <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Ingen favoritter endnu
                </h2>
                <p className="text-gray-600 mb-6">
                  Tilføj produkter til dine favoritter for hurtig adgang
                </p>
                <Link to="/products">
                  <Button className="btn-brand-primary">
                    Gå til produkter
                  </Button>
                </Link>
              </Card>
            )}

            {/* Favorites Grid */}
            {!isLoading && favorites.length > 0 && (
              <>
                <div className="mb-6 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    {favorites.length} {favorites.length === 1 ? 'favorit' : 'favoritter'}
                  </div>
                  <Badge variant="outline" className="bg-brand-primary/10 text-brand-primary border-brand-primary/20">
                    <Heart className="h-3 w-3 mr-1 fill-current" />
                    Dine favoritter
                  </Badge>
                </div>
                
                {/* Product Cards Grid - Same as Products Page */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 justify-items-center">
                  {favorites.map((favorite) => {
                    const product = favorite.product;
                    const isRemoving = removingIds.has(product._id);

                    return (
                      <div 
                        key={favorite._id}
                        className={cn(
                          "w-full transition-opacity duration-300",
                          isRemoving && "opacity-50 pointer-events-none"
                        )}
                      >
                        <ProductCard
                          id={product._id}
                          name={product.produktnavn}
                          image={getProductImageUrl(favorite)}
                          category={product.kategori.navn}
                          unit={product.enhed}
                          isLoggedIn={true}
                          userType="customer"
                          price={product.basispris}
                          customerPricing={favorite.customerPricing}
                        />
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

