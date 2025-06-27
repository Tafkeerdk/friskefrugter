import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Package, 
  Tag, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  ArrowRight,
  Percent,
  ExternalLink
} from 'lucide-react';
import { authService } from '../../lib/auth';
import { useToast } from '../ui/use-toast';
import { Link } from 'react-router-dom';

interface UniqueOffer {
  _id: string;
  product: {
    _id: string;
    produktnavn: string;
    varenummer: string;
    basispris: number;
    billeder?: any[];
    aktiv: boolean;
  };
  fixedPrice: number;
  description?: string;
  validFrom: string;
  validTo?: string;
  isUnlimited: boolean;
  isCurrentlyValid: boolean;
  formattedPrice: string;
  savings: number;
  savingsPercentage: number;
  createdAt: string;
}

const UniqueOffersCard: React.FC = () => {
  const [offers, setOffers] = useState<UniqueOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadUniqueOffers();
  }, []);

  const loadUniqueOffers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authService.getMyUniqueOffers();
      
      if (response.success) {
        setOffers(response.offers || []);
      } else {
        setError(response.message || 'Kunne ikke hente særlige tilbud');
      }
    } catch (error) {
      console.error('Error loading unique offers:', error);
      setError('Der opstod en fejl ved hentning af tilbud');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('da-DK', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getOfferStatusBadge = (offer: UniqueOffer) => {
    if (!offer.isCurrentlyValid) {
      return (
        <Badge variant="outline" className="text-red-600 border-red-200">
          <Clock className="h-3 w-3 mr-1" />
          Udløbet
        </Badge>
      );
    }

    if (offer.isUnlimited) {
      return (
        <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white animate-pulse">
          <CheckCircle className="h-3 w-3 mr-1" />
          🎯 PERMANENT TILBUD
        </Badge>
      );
    }

    // Calculate days left if there's an end date
    if (offer.validTo) {
      const endDate = new Date(offer.validTo);
      const now = new Date();
      const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysLeft <= 7) {
        return (
          <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white animate-bounce">
            <Clock className="h-3 w-3 mr-1" />
            ⚡ {daysLeft} DAGE TILBAGE!
          </Badge>
        );
      }
    }

    return (
      <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
        <Clock className="h-3 w-3 mr-1" />
        🌟 EKSKLUSIVT TILBUD
      </Badge>
    );
  };

  const getProductImage = (product: UniqueOffer['product']) => {
    if (product.billeder && product.billeder.length > 0) {
      return product.billeder[0].url || product.billeder[0];
    }
    return null;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-brand-primary" />
            Særlige tilbud
          </CardTitle>
          <CardDescription>
            Dine personlige tilbud og rabatter
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-primary"></div>
            <span className="ml-2 text-brand-gray-600">Henter tilbud...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-brand-primary" />
            Særlige tilbud
          </CardTitle>
          <CardDescription>
            Dine personlige tilbud og rabatter
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="border-brand-error bg-brand-error/10">
            <AlertCircle className="h-4 w-4 text-brand-error" />
            <AlertDescription className="text-brand-error">
              {error}
            </AlertDescription>
          </Alert>
          <Button 
            onClick={loadUniqueOffers} 
            variant="outline" 
            className="mt-4 w-full"
          >
            Prøv igen
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (offers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-brand-primary" />
            Særlige tilbud
          </CardTitle>
          <CardDescription>
            Dine personlige tilbud og rabatter
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-brand-gray-400 mx-auto mb-4" />
            <p className="text-brand-gray-600 mb-2">Ingen særlige tilbud i øjeblikket</p>
            <p className="text-sm text-brand-gray-500">
              Kontakt din sælger for at få personlige tilbud
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5 text-brand-primary" />
          Særlige tilbud ({offers.filter(offer => offer.isCurrentlyValid).length})
        </CardTitle>
        <CardDescription>
          Dine personlige tilbud og rabatter
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {offers.filter(offer => offer.isCurrentlyValid).slice(0, 3).map((offer) => (
            <div 
              key={offer._id} 
              className="flex items-center gap-4 p-4 bg-brand-gray-50 rounded-lg border border-brand-gray-200 hover:border-brand-primary/20 transition-colors"
            >
              {/* Product Image */}
              <div className="flex-shrink-0 w-16 h-16 bg-white rounded-lg border border-brand-gray-200 flex items-center justify-center overflow-hidden">
                {getProductImage(offer.product) ? (
                  <img 
                    src={getProductImage(offer.product)} 
                    alt={offer.product.produktnavn}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package className="h-6 w-6 text-brand-gray-400" />
                )}
              </div>

              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-brand-gray-900 truncate">
                  {offer.product.produktnavn}
                </h4>
                <p className="text-sm text-brand-gray-600">
                  {offer.product.varenummer}
                </p>
                
                {/* Pricing */}
                <div className="flex items-center gap-2 mt-1">
                  {offer.savings > 0 && (
                    <span className="text-lg text-gray-500 line-through font-medium">
                      {new Intl.NumberFormat('da-DK', {
                        style: 'currency',
                        currency: 'DKK'
                      }).format(offer.product.basispris)}
                    </span>
                  )}
                  <span className="text-xl font-bold text-purple-600">
                    {offer.formattedPrice}
                  </span>
                  {offer.savings > 0 && (
                    <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                      <Percent className="h-3 w-3 mr-1" />
                      -{offer.savingsPercentage}%
                    </Badge>
                  )}
                </div>

                {/* Validity */}
                <div className="flex items-center gap-2 mt-2">
                  {getOfferStatusBadge(offer)}
                  {!offer.isUnlimited && offer.validTo && (
                    <span className="text-xs text-brand-gray-500">
                      Udløber: {formatDate(offer.validTo)}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="flex-shrink-0">
                <Button 
                  asChild
                  size="sm" 
                  className="btn-brand-primary"
                  disabled={!offer.product.aktiv}
                >
                  <Link to={`/products/${offer.product._id}`}>
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Se produkt
                  </Link>
                </Button>
              </div>
            </div>
          ))}

          {offers.filter(offer => offer.isCurrentlyValid).length > 3 && (
            <div className="pt-4 border-t">
              <Button 
                asChild
                variant="outline" 
                className="w-full"
              >
                <Link to="/unique-offers">
                  Se alle tilbud ({offers.filter(offer => offer.isCurrentlyValid).length})
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UniqueOffersCard; 