import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingCart, User, Menu, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchActive, setSearchActive] = useState(false);

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

  return (
    <header 
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled 
          ? "bg-white/95 backdrop-blur-sm shadow-md py-2" 
          : "bg-white shadow-sm py-3"
      )}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center group">
            <span className="text-2xl font-bold text-green-600 transition-all duration-300 group-hover:text-green-700">
              FriskeFrugter
            </span>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-1">
            <Link 
              to="/products" 
              className="px-4 py-2 rounded-md text-gray-700 hover:text-green-600 hover:bg-green-50 transition-all duration-200 font-medium"
            >
              Produkter
            </Link>
            <Link 
              to="/about" 
              className="px-4 py-2 rounded-md text-gray-700 hover:text-green-600 hover:bg-green-50 transition-all duration-200 font-medium"
            >
              Om os
            </Link>
            <Link 
              to="/contact" 
              className="px-4 py-2 rounded-md text-gray-700 hover:text-green-600 hover:bg-green-50 transition-all duration-200 font-medium"
            >
              Kontakt
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className={cn(
            "hidden md:flex items-center transition-all duration-300 overflow-hidden",
            searchActive ? "w-60" : "w-0"
          )}>
            <input 
              type="text" 
              placeholder="Søg efter produkter..." 
              className="border border-gray-200 px-4 py-2 rounded-md w-full bg-gray-50 focus:ring-2 focus:ring-green-200 focus:border-green-500 transition-all"
            />
          </div>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="hidden md:flex hover:bg-green-50 hover:text-green-600 transition-all"
            onClick={() => setSearchActive(!searchActive)}
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </Button>
          
          <Link to="/cart" className="relative hidden sm:flex">
            <Button 
              variant="ghost" 
              size="icon" 
              className="hover:bg-green-50 hover:text-green-600 transition-all"
              aria-label="Shopping cart"
            >
              <ShoppingCart className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                0
              </span>
            </Button>
          </Link>
          <Link to="/login" className="hidden sm:block">
            <Button 
              variant="outline" 
              className="gap-2 hover:bg-green-50 hover:text-green-700 transition-all border-green-100"
            >
              <User className="h-4 w-4" />
              <span>Log ind</span>
            </Button>
          </Link>
          <Button 
            variant="default" 
            size="icon" 
            className="md:hidden hover:bg-green-700 transition-all" 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      <div className={cn(
        "md:hidden bg-white w-full shadow-md overflow-hidden transition-all duration-300 ease-in-out",
        isMenuOpen ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
      )}>
        <div className="container mx-auto p-4 flex flex-col space-y-3">
          <div className="relative mb-2">
            <input 
              type="text" 
              placeholder="Søg efter produkter..." 
              className="w-full border border-gray-200 px-4 py-3 rounded-md bg-gray-50 focus:ring-2 focus:ring-green-200 focus:border-green-500 transition-all"
            />
            <Search className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
          </div>
          
          <Link 
            to="/products" 
            className="text-gray-700 py-3 border-b border-gray-100 font-medium flex items-center hover:pl-2 hover:text-green-600 transition-all duration-200"
          >
            Produkter
          </Link>
          <Link 
            to="/about" 
            className="text-gray-700 py-3 border-b border-gray-100 font-medium flex items-center hover:pl-2 hover:text-green-600 transition-all duration-200"
          >
            Om os
          </Link>
          <Link 
            to="/contact" 
            className="text-gray-700 py-3 border-b border-gray-100 font-medium flex items-center hover:pl-2 hover:text-green-600 transition-all duration-200"
          >
            Kontakt
          </Link>
          <Link 
            to="/login" 
            className="text-gray-700 py-3 border-b border-gray-100 font-medium flex items-center gap-2 hover:pl-2 hover:text-green-600 transition-all duration-200"
          >
            <User className="h-4 w-4" />
            Log ind
          </Link>
          <Link 
            to="/cart" 
            className="text-gray-700 py-3 flex items-center gap-2 font-medium hover:pl-2 hover:text-green-600 transition-all duration-200"
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="flex-1">Kurv</span>
            <span className="bg-green-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              0
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
