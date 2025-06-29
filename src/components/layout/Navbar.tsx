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
const transformProductForSearch = (product: Product, isAuthenticated: boolean) => ({
  id: product._id,
  name: product.produktnavn,
  image: product.billeder?.find(img => img.isPrimary)?.url || 
         product.billeder?.[0]?.url || 
         '/placeholder.svg',
  category: product.kategori?.navn || 'Ukendt kategori',
  // Only include price for authenticated customers
  // Use the correct customerPricing.price which includes all discount hierarchy
  ...(isAuthenticated && product.customerPricing?.price !== undefined && {
    price: product.customerPricing.price
  })
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
          const transformedResults = products.map(product => 
            transformProductForSearch(product, isCustomerAuthenticated)
          );
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

  // **HANDLE ENTER KEY IN SEARCH INPUT - Show results instead of navigating**
  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Just ensure results are visible, don't navigate
      if (searchValue.trim() && searchResults.length > 0) {
        setShowResults(true);
      }
    }
  };

  // **HANDLE RESULT CLICK - Clear search and close dropdown**
  const handleResultClick = () => {
    setShowResults(false);
    setSearchValue('');
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
          {/* Desktop Search */}
          <div className={cn(
            "relative hidden md:flex items-center transition-all duration-300",
            searchActive || searchValue ? "w-60 lg:w-80" : "w-60 lg:w-80"
          )}>
            <input 
              type="text" 
              placeholder="Søg efter produkter..." 
              className="border border-gray-200 px-4 py-2 rounded-md w-full bg-gray-50 focus:ring-2 focus:ring-green-200 focus:border-brand-primary transition-all"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onFocus={() => {
                setSearchActive(true);
                setShowResults(true);
              }}
              onBlur={() => {
                setTimeout(() => {
                  setShowResults(false);
                }, 200);
              }}
              onKeyDown={handleSearchKeyPress}
            />
            <SearchResults 
              results={searchResults}
              isVisible={showResults && (searchResults.length > 0 || isSearching)}
              isLoading={isSearching}
              onResultClick={handleResultClick}
              onViewAllResults={() => handleSearchSubmit()}
              searchQuery={searchValue}
              isAuthenticated={isCustomerAuthenticated}
            />
          </div>
          
          {/* Mobile Search - Integrated into mobile menu */}
          {isMobile && (
            <div className="relative flex flex-1 max-w-xs">
              <input 
                type="text" 
                placeholder="Søg..." 
                className="border border-gray-200 px-3 py-2 pr-10 rounded-md w-full bg-gray-50 focus:ring-2 focus:ring-green-200 focus:border-brand-primary transition-all text-sm"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onFocus={() => setShowResults(true)}
                onBlur={() => {
                  setTimeout(() => {
                    setShowResults(false);
                  }, 200);
                }}
                onKeyDown={handleSearchKeyPress}
              />
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
              <SearchResults 
                results={searchResults}
                isVisible={showResults && (searchResults.length > 0 || isSearching)}
                isLoading={isSearching}
                onResultClick={handleResultClick}
                onViewAllResults={() => handleSearchSubmit()}
                searchQuery={searchValue}
                isAuthenticated={isCustomerAuthenticated}
              />
            </div>
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
              <span className="absolute -top-1 -right-1 bg-brand-gray-1000 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                0
              </span>
            </Button>
          </Link>

          {/* Customer Profile or Login Button - Hidden on mobile */}
          <div className="hidden sm:block">
            {isCustomerAuthenticated && customerUser ? (
              <UserProfile variant="dropdown" />
            ) : (
              <Link to="/login">
                <Button 
                  variant="outline" 
                  className="gap-2 hover:bg-brand-gray-100 hover:text-brand-primary-dark transition-all border-brand-gray-200"
                >
                  <User className="h-4 w-4" />
                  <span>Log ind</span>
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button 
            variant="default" 
            size="icon" 
            className={cn(
              "md:hidden hover:bg-brand-primary-hover transition-all",
              isMobile ? "h-9 w-9" : "h-10 w-10"
            )}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      <div className={cn(
        "md:hidden bg-white w-full shadow-md overflow-hidden transition-all duration-300 ease-in-out",
        isMenuOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
      )}>
        <div className="page-container flex flex-col space-y-2 py-4">
          {/* Bliv kunde CTA - Mobile - Only show when not logged in as customer */}
          {!isCustomerAuthenticated && (
            <Link 
              to="/apply" 
              className="bg-brand-primary hover:bg-brand-primary-hover text-white py-3 px-4 rounded-lg font-semibold flex items-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02] mb-2"
              onClick={() => setIsMenuOpen(false)}
            >
              <UserPlus className="h-5 w-5" />
              Bliv kunde
            </Link>
          )}
          
          <Link 
            to="/products" 
            className="text-gray-700 py-3 border-b border-gray-100 font-medium flex items-center hover:pl-2 hover:text-brand-primary transition-all duration-200"
            onClick={() => setIsMenuOpen(false)}
          >
            Produkter
          </Link>
          <Link 
            to="/about" 
            className="text-gray-700 py-3 border-b border-gray-100 font-medium flex items-center hover:pl-2 hover:text-brand-primary transition-all duration-200"
            onClick={() => setIsMenuOpen(false)}
          >
            Om os
          </Link>
          <Link 
            to="/faq" 
            className="text-gray-700 py-3 border-b border-gray-100 font-medium flex items-center hover:pl-2 hover:text-brand-primary transition-all duration-200"
            onClick={() => setIsMenuOpen(false)}
          >
            FAQ
          </Link>
          <Link 
            to="/contact" 
            className="text-gray-700 py-3 border-b border-gray-100 font-medium flex items-center hover:pl-2 hover:text-brand-primary transition-all duration-200"
            onClick={() => setIsMenuOpen(false)}
          >
            Kontakt
          </Link>
          
          {/* Customer Profile or Login - Mobile */}
          {isCustomerAuthenticated && customerUser ? (
            <div className="py-3 border-b border-gray-100">
              <UserProfile variant="card" />
            </div>
          ) : (
            <Link 
              to="/login" 
              className="text-gray-700 py-3 border-b border-gray-100 flex items-center gap-2 font-medium hover:pl-2 hover:text-brand-primary transition-all duration-200"
              onClick={() => setIsMenuOpen(false)}
            >
              <User className="h-4 w-4" />
              Log ind som kunde
            </Link>
          )}
          
          {/* Mobile Admin Access - Only show when PWA is installed */}
          {isInstalled && (
            <div className="pt-2 border-t border-gray-200">
              <div className="text-xs text-gray-500 mb-2 px-2">Admin adgang</div>
              <Link 
                to="/super/admin" 
                className="text-gray-700 py-3 flex items-center gap-2 font-medium hover:pl-2 hover:text-brand-primary transition-all duration-200 bg-brand-gray-100/50 rounded-md px-2"
                onClick={() => setIsMenuOpen(false)}
              >
                <Shield className="h-4 w-4 text-brand-primary" />
                <div className="flex flex-col">
                  <span className="text-sm">Admin Login</span>
                  <span className="text-xs text-gray-500">System administration</span>
                </div>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
