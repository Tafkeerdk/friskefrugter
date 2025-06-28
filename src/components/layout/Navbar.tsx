import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingCart, User, Menu, Search, Shield, UserPlus } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { SearchResults } from "../search/SearchResults";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePWA } from "@/hooks/usePWA";
import { useAuth } from "@/hooks/useAuth";
import { UserProfile } from "@/components/auth/UserProfile";
import { api } from "@/lib/api";

// Types for real product data
interface Product {
  _id: string;
  produktnavn: string;
  billeder?: Array<{
    _id: string;
    url: string;
    filename: string;
    isPrimary: boolean;
  }>;
  kategori: {
    _id: string;
    navn: string;
  };
  basispris: number;
  customerPricing?: any;
}

// Transform API product to SearchResults format
const transformProductForSearch = (product: Product) => ({
  id: product._id,
  name: product.produktnavn,
  image: product.billeder?.find(img => img.isPrimary)?.url || 
         product.billeder?.[0]?.url || 
         '/placeholder.svg',
  category: product.kategori?.navn || 'Ukendt kategori',
  price: product.customerPricing?.customerPrice || product.basispris || 0,
});

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const isMobile = useIsMobile();
  const { isInstalled } = usePWA();
  const { isCustomerAuthenticated, customerUser } = useAuth();
  const navigate = useNavigate();
  
  // Refs for debouncing and managing async requests
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const searchAbortRef = useRef<AbortController>();

  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      if (offset > 80) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // **REAL API SEARCH WITH DEBOUNCING**
  useEffect(() => {
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Cancel previous request
    if (searchAbortRef.current) {
      searchAbortRef.current.abort();
    }

    if (searchValue.trim() === "") {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    // **DEBOUNCE SEARCH - WAIT 400MS BEFORE SEARCHING**
    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      
      try {
        // Create new abort controller for this request
        searchAbortRef.current = new AbortController();
        
        const params = {
          search: searchValue.trim(),
          limit: 6, // Limit results for navbar dropdown
          aktiv: true
        };

        let response;
        
        // Use customer or public endpoint based on authentication
        if (isCustomerAuthenticated) {
          response = await api.getCustomerProducts(params);
        } else {
          response = await api.getPublicProducts(params);
        }

        // Only process if request wasn't aborted
        if (!searchAbortRef.current?.signal.aborted && response.success && response.data) {
          const products = response.data.products || [];
          const transformedResults = products.map(transformProductForSearch);
          setSearchResults(transformedResults);
        }
      } catch (error) {
        // Ignore aborted requests
        if (error.name !== 'AbortError') {
          console.warn('Search error:', error);
          setSearchResults([]);
        }
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (searchAbortRef.current) {
        searchAbortRef.current.abort();
      }
    };
  }, [searchValue, isCustomerAuthenticated]);

  // **HANDLE SEARCH FORM SUBMISSION**
  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    if (searchValue.trim()) {
      // Navigate to products page with search query
      navigate(`/products?search=${encodeURIComponent(searchValue.trim())}`);
      setShowResults(false);
      setSearchValue('');
    }
  };

  // **HANDLE ENTER KEY IN SEARCH INPUT**
  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearchSubmit();
    }
  };

  // **CLEANUP ON UNMOUNT**
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (searchAbortRef.current) {
        searchAbortRef.current.abort();
      }
    };
  }, []);

  return (
    <header 
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled 
          ? "bg-white/95 backdrop-blur-sm shadow-md py-2" 
          : "bg-white shadow-sm py-3"
      )}
    >
      <div className="page-container flex items-center justify-between">
        <div className="flex items-center gap-4 md:gap-8">
          <Link to="/" className="flex items-center group">
            <span className={cn(
              "font-bold text-brand-primary transition-all duration-300 group-hover:text-brand-primary-dark",
              isMobile ? "text-xl" : "text-2xl"
            )}>
              Multi Grønt
            </span>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-1">
            <Link 
              to="/products" 
              className="px-4 py-2 rounded-md text-gray-700 hover:text-brand-primary hover:bg-brand-gray-100 transition-all duration-200 font-medium"
            >
              Produkter
            </Link>
            <Link 
              to="/about" 
              className="px-4 py-2 rounded-md text-gray-700 hover:text-brand-primary hover:bg-brand-gray-100 transition-all duration-200 font-medium"
            >
              Om os
            </Link>
            <Link 
              to="/faq" 
              className="px-4 py-2 rounded-md text-gray-700 hover:text-brand-primary hover:bg-brand-gray-100 transition-all duration-200 font-medium"
            >
              FAQ
            </Link>
            <Link 
              to="/contact" 
              className="px-4 py-2 rounded-md text-gray-700 hover:text-brand-primary hover:bg-brand-gray-100 transition-all duration-200 font-medium"
            >
              Kontakt
            </Link>
            
            {/* Bliv kunde CTA - Only show when not logged in as customer */}
            {!isCustomerAuthenticated && (
              <Link 
                to="/apply" 
                className="ml-2 px-4 py-2 rounded-md bg-brand-primary hover:bg-brand-primary-hover text-white transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:scale-105"
              >
                Bliv kunde
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          {/* **FUNCTIONAL DESKTOP SEARCH** */}
          <form 
            onSubmit={handleSearchSubmit}
            className={cn(
              "relative hidden md:flex items-center transition-all duration-300",
              searchActive || searchValue ? "w-60 lg:w-80" : "w-60 lg:w-80"
            )}
          >
            <input 
              type="text" 
              placeholder="Søg efter produkter..." 
              className="border border-gray-200 px-4 py-2 pr-10 rounded-md w-full bg-gray-50 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              onFocus={() => {
                setSearchActive(true);
                setShowResults(true);
              }}
              onBlur={() => {
                setTimeout(() => {
                  setShowResults(false);
                  setSearchActive(false);
                }, 200);
              }}
            />
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1 h-8 w-8 p-0 hover:bg-brand-primary/10"
              disabled={!searchValue.trim() || isSearching}
            >
              <Search className="h-4 w-4 text-brand-primary" />
            </Button>
            
            {/* **REAL SEARCH RESULTS DROPDOWN** */}
            <SearchResults 
              results={searchResults}
              isVisible={showResults && (searchResults.length > 0 || isSearching)}
              isLoading={isSearching}
              onResultClick={() => {
                setShowResults(false);
                setSearchValue('');
              }}
              onViewAllResults={() => handleSearchSubmit()}
              searchQuery={searchValue}
            />
          </form>
          
          {/* **FUNCTIONAL MOBILE SEARCH** */}
          {isMobile && (
            <form 
              onSubmit={handleSearchSubmit}
              className="relative flex flex-1 max-w-xs"
            >
              <input 
                type="text" 
                placeholder="Søg..." 
                className="border border-gray-200 px-3 py-2 pr-10 rounded-md w-full bg-gray-50 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-sm"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                onFocus={() => setShowResults(true)}
                onBlur={() => {
                  setTimeout(() => {
                    setShowResults(false);
                  }, 200);
                }}
              />
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1 h-6 w-6 p-0"
                disabled={!searchValue.trim() || isSearching}
              >
                <Search className="h-3 w-3 text-brand-primary" />
              </Button>
              
              {/* **MOBILE SEARCH RESULTS** */}
              <SearchResults 
                results={searchResults}
                isVisible={showResults && (searchResults.length > 0 || isSearching)}
                isLoading={isSearching}
                onResultClick={() => {
                  setShowResults(false);
                  setSearchValue('');
                }}
                onViewAllResults={() => handleSearchSubmit()}
                searchQuery={searchValue}
              />
            </form>
          )}
          
          {/* Cart Button - Always visible */}
          <Link to="/cart" className="relative">
            <Button 
              variant="ghost" 
              size="icon" 
              className={cn(
                "hover:bg-brand-gray-100 hover:text-brand-primary transition-all",
                isMobile ? "h-9 w-9" : "h-10 w-10"
              )}
              aria-label="Shopping cart"
            >
              <ShoppingCart className={cn(isMobile ? "h-4 w-4" : "h-5 w-5")} />
              <span className="absolute -top-1 -right-1 bg-brand-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                0
              </span>
            </Button>
          </Link>

          {/* User Menu */}
          <div className="relative">
            {isCustomerAuthenticated ? (
              <UserProfile />
            ) : (
              <div className="flex items-center gap-2">
                {!isMobile && (
                  <Link to="/apply">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white transition-all"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Bliv kunde
                    </Button>
                  </Link>
                )}
                
                <Link to="/login">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className={cn(
                      "hover:bg-brand-gray-100 hover:text-brand-primary transition-all",
                      isMobile ? "h-9 w-9" : "h-10 w-10"
                    )}
                    aria-label="Log ind"
                  >
                    <User className={cn(isMobile ? "h-4 w-4" : "h-5 w-5")} />
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 hover:bg-brand-gray-100"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Menu"
            >
              <Menu className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobile && isMenuOpen && (
        <div className="md:hidden bg-white border-t shadow-lg">
          <div className="page-container py-4">
            <nav className="flex flex-col space-y-3">
              <Link 
                to="/products" 
                className="px-4 py-3 rounded-md text-gray-700 hover:text-brand-primary hover:bg-brand-gray-100 transition-all font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Produkter
              </Link>
              <Link 
                to="/about" 
                className="px-4 py-3 rounded-md text-gray-700 hover:text-brand-primary hover:bg-brand-gray-100 transition-all font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Om os
              </Link>
              <Link 
                to="/faq" 
                className="px-4 py-3 rounded-md text-gray-700 hover:text-brand-primary hover:bg-brand-gray-100 transition-all font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                FAQ
              </Link>
              <Link 
                to="/contact" 
                className="px-4 py-3 rounded-md text-gray-700 hover:text-brand-primary hover:bg-brand-gray-100 transition-all font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Kontakt
              </Link>
              
              {!isCustomerAuthenticated && (
                <Link 
                  to="/apply" 
                  className="px-4 py-3 rounded-md bg-brand-primary text-white font-semibold transition-all"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Bliv kunde
                </Link>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
