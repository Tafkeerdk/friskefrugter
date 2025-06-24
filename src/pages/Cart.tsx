
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Minus, Plus, ShoppingCart, Trash2, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

// Sample cart items
const cartItems = [
  {
    id: "1",
    name: "Økologiske Æbler",
    image: "https://images.unsplash.com/photo-1570913149827-d2ac84ab3f9a?auto=format&fit=crop&q=80&w=200",
    price: 29.95,
    quantity: 2,
    packaging: "Kasse, 5 kg",
  },
  {
    id: "5",
    name: "Økologiske Tomater",
    image: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=200",
    price: 24.95,
    quantity: 3,
    packaging: "Bakke, 2 kg",
  },
  {
    id: "7",
    name: "Økologisk Ost",
    image: "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&q=80&w=200",
    price: 59.95,
    quantity: 1,
    packaging: "Stk, 500 g",
  },
];

const Cart = () => {
  const [items, setItems] = useState(cartItems);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [comment, setComment] = useState("");
  const [isOrderComplete, setIsOrderComplete] = useState(false);

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setItems(items.map(item => 
      item.id === id ? { ...item, quantity: newQuantity } : item
    ));
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const shipping = 79;
    return subtotal + shipping;
  };

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Order submitted:", { items, deliveryDate, comment });
    setIsOrderComplete(true);
  };

  if (isOrderComplete) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow py-12 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-md mx-auto text-center">
              <div className="bg-brand-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <Check className="h-10 w-10 text-brand-primary" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Tak for din ordre!</h1>
              <p className="text-gray-600 mb-6">
                Din ordre er blevet registreret og vil blive behandlet hurtigst muligt.
                Faktura sendes separat til din virksomhedsmail.
              </p>
              <div className="flex flex-col gap-4">
                <Link to="/products">
                  <Button className="w-full">
                    Fortsæt shopping
                  </Button>
                </Link>
                <Link to="/dashboard">
                  <Button variant="outline" className="w-full">
                    Se dine ordrer
                  </Button>
                </Link>
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
      <main className="flex-grow py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 flex items-center">
            <ShoppingCart className="mr-2 h-6 w-6" />
            Din indkøbskurv
          </h1>

          {items.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">Produkter</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="hidden md:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[80px]"></TableHead>
                            <TableHead>Produkt</TableHead>
                            <TableHead className="text-right">Pris</TableHead>
                            <TableHead className="text-center">Antal</TableHead>
                            <TableHead className="text-right">Subtotal</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell className="p-2">
                                <img 
                                  src={item.image} 
                                  alt={item.name} 
                                  className="w-16 h-16 object-cover rounded-md"
                                />
                              </TableCell>
                              <TableCell>
                                <div>
                                  <Link to={`/products/${item.id}`} className="font-medium text-gray-900 hover:text-brand-primary">
                                    {item.name}
                                  </Link>
                                  <p className="text-sm text-gray-500">{item.packaging}</p>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">{item.price.toFixed(2)} kr</TableCell>
                              <TableCell>
                                <div className="flex items-center justify-center gap-1">
                                  <Button 
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <span className="w-10 text-center">{item.quantity}</span>
                                  <Button 
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {(item.price * item.quantity).toFixed(2)} kr
                              </TableCell>
                              <TableCell>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="text-gray-500 hover:text-red-500"
                                  onClick={() => removeItem(item.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Mobile Cart View */}
                    <div className="md:hidden space-y-4">
                      {items.map((item) => (
                        <div key={item.id} className="flex gap-4 pb-4 border-b">
                          <img 
                            src={item.image} 
                            alt={item.name} 
                            className="w-20 h-20 object-cover rounded-md"
                          />
                          <div className="flex-1">
                            <div className="flex justify-between">
                              <Link to={`/products/${item.id}`} className="font-medium text-gray-900">
                                {item.name}
                              </Link>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-gray-500"
                                onClick={() => removeItem(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <p className="text-sm text-gray-500">{item.packaging}</p>
                            <p className="text-sm mb-2">{item.price.toFixed(2)} kr</p>
                            <div className="flex items-center gap-1">
                              <Button 
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center">{item.quantity}</span>
                              <Button 
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                              <span className="ml-auto font-medium">
                                {(item.price * item.quantity).toFixed(2)} kr
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Link to="/products">
                      <Button variant="outline">Fortsæt shopping</Button>
                    </Link>
                  </CardFooter>
                </Card>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">Ordredetaljer</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmitOrder} className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-gray-600">Subtotal</span>
                          <span className="font-medium">{calculateSubtotal().toFixed(2)} kr</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-gray-600">Levering</span>
                          <span className="font-medium">79,00 kr</span>
                        </div>
                        <div className="flex justify-between py-2 text-lg font-bold">
                          <span>Total</span>
                          <span>{calculateTotal().toFixed(2)} kr</span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="delivery-date" className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-brand-primary" /> 
                            Leveringsdato
                          </Label>
                          <Input 
                            id="delivery-date" 
                            type="date" 
                            value={deliveryDate}
                            onChange={(e) => setDeliveryDate(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="comment">Bemærkninger til ordren</Label>
                          <Textarea 
                            id="comment" 
                            placeholder="Specielle instruktioner eller bemærkninger" 
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="min-h-[100px]"
                          />
                        </div>
                      </div>

                      <Button type="submit" className="w-full">
                        Afgiv ordre
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              <ShoppingCart className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h2 className="text-2xl font-medium text-gray-900 mb-2">Din kurv er tom</h2>
              <p className="text-gray-600 mb-6">Du har ingen produkter i din indkøbskurv endnu.</p>
              <Link to="/products">
                <Button>
                  Gå til produkter
                </Button>
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Cart;
