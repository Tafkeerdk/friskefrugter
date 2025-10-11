import React, { useState, useEffect } from 'react';
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, ShoppingCart, Trash2, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { cn } from "@/lib/utils";

interface CustomerPricing {
  price: number;
  originalPrice: number;
  discountType: string;
  discountLabel: string;
  discountPercentage: number;
  showStrikethrough: boolean;
  groupDetails?: {
    groupName?: string;
    groupColor?: string;
  };
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
    enhed: {
      label: string;
    };
  };
  customerPricing: CustomerPricing;
}

export default function CustomerFavorites() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const { isCustomerAuthenticated } = useAuth();
  const { addToCart } = useCart();

  useEffect(() => {
    if (isCustomerAuthenticated) {
      loadFavorites();
    }
  }, [isCustomerAuthenticated]);

  const loadFavorites = async () => {
    try {
      setIsLoading(true);
      
      const token = localStorage.getItem('customerAccessToken');
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

      const token = localStorage.getItem('customerAccessToken');
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

  const handleAddToCart = async (product: Favorite['product']) => {
    try {
      const success = await addToCart(product._id, 1);

      if (success) {
        toast({
          title: 'Tilføjet til kurv',
          description: `${product.produktnavn} er tilføjet til din kurv`,
          className: 'bg-brand-success text-white border-brand-success'
        });
      } else {
        throw new Error('Failed to add to cart');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        variant: 'destructive',
        title: 'Fejl',
        description: 'Kunne ikke tilføje til kurv. Prøv igen.'
      });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency: 'DKK'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('da-DK', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
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

            {/* Loading State */}
            {isLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <Skeleton className="h-48 w-full mb-4" />
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
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
                <div className="mb-4 text-sm text-gray-600">
                  {favorites.length} {favorites.length === 1 ? 'favorit' : 'favoritter'}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {favorites.map((favorite) => {
                    const product = favorite.product;
                    const pricing = favorite.customerPricing;
                    const primaryImage = product.billeder.find(img => img.isPrimary) || product.billeder[0];
                    const isRemoving = removingIds.has(product._id);

                    return (
                      <Card 
                        key={favorite._id}
                        className={cn(
                          "card-brand overflow-hidden transition-all duration-300 hover:shadow-lg",
                          isRemoving && "opacity-50"
                        )}
                      >
                        <CardContent className="p-0">
                          {/* Product Image */}
                          <Link to={`/products/${product._id}`}>
                            <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                              <img 
                                src={primaryImage?.url || '/placeholder.svg'}
                                alt={product.produktnavn}
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                              />
                              {/* Discount Badge */}
                              {pricing.discountType !== 'standard' && pricing.discountLabel && (
                                <Badge 
                                  className="absolute top-2 right-2 text-xs font-medium px-2 py-1 text-white shadow-lg"
                                  style={{
                                    backgroundColor: pricing.discountType === 'unique_offer' 
                                      ? '#9333EA'
                                      : pricing.discountType === 'fast_udsalgspris'
                                        ? '#DC2626'
                                        : pricing.groupDetails?.groupColor || '#F59E0B'
                                  }}
                                >
                                  {pricing.discountLabel}
                                </Badge>
                              )}
                            </div>
                          </Link>

                          {/* Product Info */}
                          <div className="p-4">
                            <Link to={`/products/${product._id}`}>
                              <h3 className="font-bold text-gray-900 mb-1 hover:text-brand-primary transition-colors line-clamp-2">
                                {product.produktnavn}
                              </h3>
                            </Link>
                            
                            <div className="flex items-center gap-2 mb-3">
                              <Badge variant="secondary" className="text-xs">
                                {product.kategori.navn}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                Tilføjet {formatDate(favorite.addedAt)}
                              </span>
                            </div>

                            {/* Price Display */}
                            <div className="mb-4">
                              <div className="flex items-center gap-2">
                                {pricing.showStrikethrough && pricing.originalPrice > pricing.price && (
                                  <span className="text-sm text-gray-400 line-through">
                                    {formatPrice(pricing.originalPrice)}
                                  </span>
                                )}
                                <span className="text-xl font-bold text-brand-primary">
                                  {formatPrice(pricing.price)}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                per {product.enhed.label}
                              </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                              <Button
                                className="btn-brand-primary flex-1"
                                onClick={() => handleAddToCart(product)}
                              >
                                <ShoppingCart className="h-4 w-4 mr-2" />
                                Læg i kurv
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                className="border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600"
                                onClick={() => handleRemoveFavorite(product._id)}
                                disabled={isRemoving}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
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

