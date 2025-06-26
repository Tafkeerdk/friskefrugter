import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Input } from '../components/ui/input';
import { 
  Package, 
  Tag, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  Search,
  Percent,
  ExternalLink,
  ArrowLeft,
  Filter,
  Calendar
} from 'lucide-react';
import { authService } from '../lib/auth';
import { useToast } from '../components/ui/use-toast';
import { Link, useNavigate } from 'react-router-dom';

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

const CustomerUniqueOffers: React.FC = () => {
  const [offers, setOffers] = useState<UniqueOffer[]>([]);
  const [filteredOffers, setFilteredOffers] = useState<UniqueOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'expired'>('all');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadUniqueOffers();
  }, []);

  useEffect(() => {
    filterOffers();
  }, [offers, searchTerm, filterStatus]);

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

  const filterOffers = () => {
    let filtered = [...offers];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(offer => 
        offer.product.produktnavn.toLowerCase().includes(searchTerm.toLowerCase()) ||
        offer.product.varenummer.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(offer => {
        if (filterStatus === 'active') return offer.isCurrentlyValid;
        if (filterStatus === 'expired') return !offer.isCurrentlyValid;
        return true;
      });
    }

    setFilteredOffers(filtered);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('da-DK', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('da-DK', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
        <Badge className="bg-brand-success text-white">
          <CheckCircle className="h-3 w-3 mr-1" />
          Permanent
        </Badge>
      );
    }

    return (
      <Badge className="bg-blue-100 text-blue-800">
        <Clock className="h-3 w-3 mr-1" />
        Aktiv
      </Badge>
    );
  };

  const getProductImage = (product: UniqueOffer['product']) => {
    if (product.billeder && product.billeder.length > 0) {
      return product.billeder[0].url || product.billeder[0];
    }
    return null;
  };

  const getStatusFilterColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'expired': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow bg-gray-50">
          <div className="page-container py-6 md:py-8">
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary mx-auto mb-4"></div>
                <p className="text-brand-gray-600">Henter dine særlige tilbud...</p>
              </div>
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
        <div className="page-container py-6 md:py-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Tilbage til dashboard
            </Button>
          </div>

          <div className="text-center md:text-left mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-brand-gray-900 mb-2 flex items-center gap-2">
              <Tag className="h-6 w-6 md:h-8 md:w-8 text-brand-primary" />
              Mine særlige tilbud
            </h1>
            <p className="text-brand-gray-600">
              Oversigt over alle dine personlige tilbud og rabatter
            </p>
          </div>

          {error && (
            <Alert className="border-brand-error bg-brand-error/10 mb-6">
              <AlertCircle className="h-4 w-4 text-brand-error" />
              <AlertDescription className="text-brand-error">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-brand-gray-400" />
                    <Input
                      placeholder="Søg efter produktnavn eller varenummer..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Status Filter */}
                <div className="flex gap-2">
                  <Button
                    variant={filterStatus === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterStatus('all')}
                    className={filterStatus === 'all' ? 'btn-brand-primary' : ''}
                  >
                    Alle ({offers.length})
                  </Button>
                  <Button
                    variant={filterStatus === 'active' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterStatus('active')}
                    className={filterStatus === 'active' ? 'btn-brand-primary' : ''}
                  >
                    Aktive ({offers.filter(o => o.isCurrentlyValid).length})
                  </Button>
                  <Button
                    variant={filterStatus === 'expired' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterStatus('expired')}
                    className={filterStatus === 'expired' ? 'btn-brand-primary' : ''}
                  >
                    Udløbet ({offers.filter(o => !o.isCurrentlyValid).length})
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Offers List */}
          {filteredOffers.length === 0 ? (
            <Card>
              <CardContent className="py-16">
                <div className="text-center">
                  <Package className="h-16 w-16 text-brand-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-brand-gray-900 mb-2">
                    {searchTerm || filterStatus !== 'all' ? 'Ingen tilbud matcher dine filtre' : 'Ingen særlige tilbud'}
                  </h3>
                  <p className="text-brand-gray-600 mb-4">
                    {searchTerm || filterStatus !== 'all' 
                      ? 'Prøv at justere dine søgekriterier eller filtre'
                      : 'Kontakt din sælger for at få personlige tilbud'
                    }
                  </p>
                  {(searchTerm || filterStatus !== 'all') && (
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSearchTerm('');
                        setFilterStatus('all');
                      }}
                    >
                      Ryd filtre
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredOffers.map((offer) => (
                <Card key={offer._id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      {/* Product Image */}
                      <div className="flex-shrink-0 w-24 h-24 bg-white rounded-lg border border-brand-gray-200 flex items-center justify-center overflow-hidden">
                        {getProductImage(offer.product) ? (
                          <img 
                            src={getProductImage(offer.product)} 
                            alt={offer.product.produktnavn}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="h-8 w-8 text-brand-gray-400" />
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-brand-gray-900 mb-1">
                              {offer.product.produktnavn}
                            </h3>
                            <p className="text-brand-gray-600 mb-2">
                              Varenummer: {offer.product.varenummer}
                            </p>
                            
                            {offer.description && (
                              <p className="text-sm text-brand-gray-600 mb-3">
                                {offer.description}
                              </p>
                            )}

                            {/* Pricing */}
                            <div className="flex items-center gap-3 mb-3">
                              <span className="text-2xl font-bold text-brand-primary">
                                {offer.formattedPrice}
                              </span>
                              {offer.savings > 0 && (
                                <>
                                  <span className="text-lg text-brand-gray-400 line-through">
                                    {new Intl.NumberFormat('da-DK', {
                                      style: 'currency',
                                      currency: 'DKK'
                                    }).format(offer.product.basispris)}
                                  </span>
                                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                                    <Percent className="h-3 w-3 mr-1" />
                                    Spar {offer.savingsPercentage}%
                                  </Badge>
                                </>
                              )}
                            </div>

                            {/* Status and Validity */}
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                              {getOfferStatusBadge(offer)}
                              {!offer.isUnlimited && (
                                <div className="flex items-center gap-1 text-sm text-brand-gray-500">
                                  <Calendar className="h-3 w-3" />
                                  {offer.validTo 
                                    ? `Udløber: ${formatDate(offer.validTo)}`
                                    : `Fra: ${formatDate(offer.validFrom)}`
                                  }
                                </div>
                              )}
                            </div>

                            <p className="text-xs text-brand-gray-500">
                              Oprettet: {formatDateTime(offer.createdAt)}
                            </p>
                          </div>

                          {/* Action Button */}
                          <div className="flex-shrink-0">
                            <Button 
                              asChild
                              className="btn-brand-primary"
                              disabled={!offer.product.aktiv}
                            >
                              <Link to={`/products/${offer.product._id}`}>
                                <ExternalLink className="h-4 w-4 mr-2" />
                                {offer.product.aktiv ? 'Se produkt' : 'Produkt ikke tilgængeligt'}
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Summary */}
          {offers.length > 0 && (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="text-lg">Sammendrag</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-brand-primary">{offers.length}</div>
                    <div className="text-sm text-brand-gray-600">Totale tilbud</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {offers.filter(o => o.isCurrentlyValid).length}
                    </div>
                    <div className="text-sm text-brand-gray-600">Aktive tilbud</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-brand-primary">
                      {Math.round(offers.reduce((sum, o) => sum + o.savingsPercentage, 0) / offers.length) || 0}%
                    </div>
                    <div className="text-sm text-brand-gray-600">Gennemsnitlig besparelse</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-brand-primary">
                      {new Intl.NumberFormat('da-DK', {
                        style: 'currency',
                        currency: 'DKK',
                        maximumFractionDigits: 0
                      }).format(offers.reduce((sum, o) => sum + o.savings, 0))}
                    </div>
                    <div className="text-sm text-brand-gray-600">Total besparelse</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CustomerUniqueOffers; 