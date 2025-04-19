
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

interface ProductCardProps {
  id: string;
  name: string;
  image: string;
  category: string;
  isLoggedIn?: boolean;
  price?: number;
}

export function ProductCard({ id, name, image, category, isLoggedIn = false, price }: ProductCardProps) {
  const [quantity, setQuantity] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const increaseQuantity = () => {
    setQuantity(prev => prev + 1);
  };

  const decreaseQuantity = () => {
    setQuantity(prev => (prev > 0 ? prev - 1 : 0));
  };

  return (
    <Card 
      className="overflow-hidden transition-all duration-500 shadow-card rounded-[1.2rem] transform group hover:scale-[1.02]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link to={`/products/${id}`}>
        <div className="aspect-square overflow-hidden bg-gray-100 relative">
          <img 
            src={image} 
            alt={name} 
            className={`h-full w-full object-cover transition-all duration-500 ${isHovered ? 'scale-110 blur-[1px]' : 'scale-100'}`}
          />
          <div className={`absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity duration-300 ${isHovered ? 'opacity-100' : ''}`} />
          <div className={`absolute bottom-4 left-4 text-white transition-all duration-300 ${isHovered ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            <span className="text-xs font-medium uppercase bg-green-600 px-2 py-1 rounded-full">{category}</span>
          </div>
        </div>
      </Link>
      <CardContent className="p-4 bg-gradient-card rounded-b-[1.2rem]">
        <Link to={`/products/${id}`}>
          <h3 className="font-medium text-gray-900 hover:text-green-600 transition-colors text-lg">{name}</h3>
        </Link>
        {isLoggedIn && price && (
          <p className="mt-1 text-gray-700 font-medium">{price.toFixed(2)} kr</p>
        )}
        {!isLoggedIn && (
          <p className="mt-1 text-sm text-gray-500">Log ind for at se priser</p>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between items-center bg-gradient-card">
        {isLoggedIn ? (
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              className={`h-8 w-8 rounded-full transition-all duration-300 ${quantity === 0 ? 'opacity-50' : 'hover:bg-green-100 hover:text-green-700'}`}
              onClick={decreaseQuantity}
              disabled={quantity === 0}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="w-8 text-center font-medium">{quantity}</span>
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8 rounded-full transition-all duration-300 hover:bg-green-100 hover:text-green-700"
              onClick={increaseQuantity}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <div></div>
        )}
        {isLoggedIn && (
          <Button 
            size="sm" 
            className={`h-8 rounded-full gap-1 transition-all duration-300 ${quantity === 0 ? 'opacity-50' : 'bg-green-600 hover:bg-green-700 btn-scale'}`} 
            disabled={quantity === 0}
          >
            <ShoppingCart className="h-4 w-4 mr-1" />
            Tilføj
          </Button>
        )}
        {!isLoggedIn && (
          <Link to="/login">
            <Button size="sm" className="rounded-full py-5 px-6 bg-green-600 hover:bg-green-700 transition-all duration-300 btn-scale shadow-soft">
              Log ind
            </Button>
          </Link>
        )}
      </CardFooter>
    </Card>
  );
}
