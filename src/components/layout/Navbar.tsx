
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingCart, User, Menu } from "lucide-react";
import { useState } from "react";

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center">
            <span className="text-2xl font-bold text-green-600">GreenEngros</span>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/products" className="text-gray-700 hover:text-green-600 transition-colors font-medium">
              Produkter
            </Link>
            <Link to="/about" className="text-gray-700 hover:text-green-600 transition-colors font-medium">
              Om os
            </Link>
            <Link to="/contact" className="text-gray-700 hover:text-green-600 transition-colors font-medium">
              Kontakt
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <Link to="/cart" className="relative hidden sm:flex">
            <Button variant="ghost" size="icon" aria-label="Shopping cart">
              <ShoppingCart className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                0
              </span>
            </Button>
          </Link>
          <Link to="/login" className="hidden sm:block">
            <Button variant="outline" className="gap-2">
              <User className="h-4 w-4" />
              <span>Log ind</span>
            </Button>
          </Link>
          <Button 
            variant="default" 
            size="icon" 
            className="md:hidden" 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white w-full shadow-md animate-fade-in">
          <div className="container mx-auto p-4 flex flex-col space-y-3">
            <Link to="/products" className="text-gray-700 py-2 border-b border-gray-100 font-medium">
              Produkter
            </Link>
            <Link to="/about" className="text-gray-700 py-2 border-b border-gray-100 font-medium">
              Om os
            </Link>
            <Link to="/contact" className="text-gray-700 py-2 border-b border-gray-100 font-medium">
              Kontakt
            </Link>
            <Link to="/login" className="text-gray-700 py-2 border-b border-gray-100 font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              Log ind
            </Link>
            <Link to="/cart" className="text-gray-700 py-2 flex items-center gap-2 font-medium">
              <ShoppingCart className="h-4 w-4" />
              Kurv (0)
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
