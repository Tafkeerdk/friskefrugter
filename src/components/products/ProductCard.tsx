
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

  const increaseQuantity = () => {
    setQuantity(prev => prev + 1);
  };

  const decreaseQuantity = () => {
    setQuantity(prev => (prev > 0 ? prev - 1 : 0));
  };

  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-md">
      <Link to={`/products/${id}`}>
        <div className="aspect-square overflow-hidden bg-gray-100">
          <img 
            src={image} 
            alt={name} 
            className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
          />
        </div>
      </Link>
      <CardContent className="p-4">
        <div className="mb-1">
          <span className="text-xs font-medium text-green-600 uppercase">{category}</span>
        </div>
        <Link to={`/products/${id}`}>
          <h3 className="font-medium text-gray-900 hover:text-green-600 transition-colors">{name}</h3>
        </Link>
        {isLoggedIn && price && (
          <p className="mt-1 text-gray-700 font-medium">{price.toFixed(2)} kr</p>
        )}
        {!isLoggedIn && (
          <p className="mt-1 text-sm text-gray-500">Log ind for at se priser</p>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        {isLoggedIn ? (
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8" 
              onClick={decreaseQuantity}
              disabled={quantity === 0}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="w-8 text-center">{quantity}</span>
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8" 
              onClick={increaseQuantity}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <div></div>
        )}
        {isLoggedIn && (
          <Button size="sm" className="h-8" disabled={quantity === 0}>
            <ShoppingCart className="h-4 w-4 mr-1" />
            Tilføj
          </Button>
        )}
        {!isLoggedIn && (
          <Link to="/login">
            <Button size="sm">
              Log ind
            </Button>
          </Link>
        )}
      </CardFooter>
    </Card>
  );
}
