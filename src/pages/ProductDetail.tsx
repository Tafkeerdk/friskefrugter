
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Minus, Plus, ShoppingCart, Info, Truck, CalendarCheck } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useState } from "react";
import { ProductCard } from "@/components/products/ProductCard";

// Sample product data
const product = {
  id: "1",
  name: "Økologiske Æbler",
  image: "https://images.unsplash.com/photo-1570913149827-d2ac84ab3f9a?auto=format&fit=crop&q=80&w=800",
  category: "Frugt",
  price: 29.95,
  description: "Vores økologiske æbler kommer fra udvalgte danske frugtavlere, der arbejder med bæredygtige dyrkningsmetoder. Æblerne er søde, saftige og perfekte til både madlavning og som en sund snack.",
  origin: "Danmark",
  packaging: "Kasse med 5 kg",
  stock: 47,
  isLoggedIn: false
};

// Sample related products
const relatedProducts = [
  {
    id: "3",
    name: "Friske Jordbær",
    image: "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&q=80&w=800",
    category: "Bær",
    isLoggedIn: false,
  },
  {
    id: "9",
    name: "Bananer",
    image: "https://images.unsplash.com/photo-1543218024-57a70143c369?auto=format&fit=crop&q=80&w=800",
    category: "Frugt",
    isLoggedIn: false,
  },
  {
    id: "12",
    name: "Økologiske Appelsiner",
    image: "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab12?auto=format&fit=crop&q=80&w=800",
    category: "Frugt",
    isLoggedIn: false,
  },
];

const ProductDetail = () => {
  const { id } = useParams();
  const [quantity, setQuantity] = useState(1);

  const increaseQuantity = () => {
    setQuantity(prev => prev + 1);
  };

  const decreaseQuantity = () => {
    setQuantity(prev => (prev > 1 ? prev - 1 : 1));
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8">
          {/* Back Button */}
          <div className="mb-6">
            <Link to="/products" className="text-green-600 hover:text-green-800 flex items-center">
              <ArrowLeft className="h-4 w-4 mr-1" />
              <span>Tilbage til produkter</span>
            </Link>
          </div>

          {/* Product Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Product Image */}
            <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
              <img 
                src={product.image} 
                alt={product.name} 
                className="w-full h-auto object-cover"
              />
            </div>

            {/* Product Info */}
            <div className="flex flex-col">
              <span className="text-sm font-medium text-green-600 uppercase">{product.category}</span>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>
              
              {product.isLoggedIn ? (
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-2xl font-bold text-gray-900">{product.price.toFixed(2)} kr</span>
                  <span className="text-sm text-gray-500">Per {product.packaging.split(' ')[2]} {product.packaging.split(' ')[3]}</span>
                </div>
              ) : (
                <div className="p-4 mb-4 bg-gray-50 rounded-md border border-gray-200">
                  <p className="text-gray-700 flex items-center">
                    <Info className="h-5 w-5 text-gray-500 mr-2" />
                    Log ind for at se priser og foretage bestillinger
                  </p>
                </div>
              )}

              <p className="text-gray-700 mb-6">{product.description}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md">
                  <Truck className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">Oprindelse</p>
                    <p className="text-gray-500 text-sm">{product.origin}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md">
                  <CalendarCheck className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">Leveringstid</p>
                    <p className="text-gray-500 text-sm">1-2 arbejdsdage</p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-2">Emballageinfo</h3>
                <p className="text-gray-700">{product.packaging}</p>
              </div>

              {product.isLoggedIn ? (
                <div className="flex items-center gap-4 mt-auto">
                  <div className="flex items-center border border-gray-300 rounded-md">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-10 w-10 rounded-none" 
                      onClick={decreaseQuantity}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-10 text-center font-medium">{quantity}</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-10 w-10 rounded-none" 
                      onClick={increaseQuantity}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  <Button className="px-6">
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Tilføj til kurv
                  </Button>
                </div>
              ) : (
                <div className="mt-auto">
                  <Link to="/login">
                    <Button className="w-full sm:w-auto">
                      Log ind for at bestille
                    </Button>
                  </Link>
                </div>
              )}

              {/* Product Status */}
              <div className="mt-6">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-green-500"></span>
                  <span className="text-gray-700 text-sm">På lager: {product.stock} enheder</span>
                </div>
              </div>
            </div>
          </div>

          {/* Related Products Section */}
          <div className="border-t border-gray-200 pt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Relaterede produkter</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard key={relatedProduct.id} {...relatedProduct} />
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetail;
