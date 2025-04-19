
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Mail, User, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, would handle login logic here
    console.log("Login attempt with:", { email, password });
    // For prototype, just redirect to dashboard
    window.location.href = "/dashboard";
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow flex items-center justify-center py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <Card className="border-0 shadow-md">
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold text-center">Log ind</CardTitle>
                <CardDescription className="text-center">
                  Indtast dine oplysninger for at få adgang til din konto
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="din@virksomhed.dk" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Adgangskode</Label>
                      <Link 
                        to="/forgot-password" 
                        className="text-sm font-medium text-green-600 hover:text-green-800"
                      >
                        Glemt adgangskode?
                      </Link>
                    </div>
                    <Input 
                      id="password" 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">Log ind</Button>
                </form>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <div className="text-center text-sm text-gray-600">
                  <span>Har du ikke en konto? </span>
                  <Link 
                    to="/contact" 
                    className="font-medium text-green-600 hover:text-green-800"
                  >
                    Kontakt os for at blive kunde
                  </Link>
                </div>
              </CardFooter>
            </Card>

            {/* B2B Info */}
            <div className="mt-8 bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 text-lg mb-3 flex items-center">
                <Users className="h-5 w-5 mr-2 text-green-600" />
                Kun for B2B-kunder
              </h3>
              <p className="text-gray-600 mb-4">
                GreenEngros er en B2B-webshop, der kun er tilgængelig for registrerede erhvervskunder.
              </p>
              <div className="flex flex-col space-y-3">
                <div className="flex items-start">
                  <ArrowRight className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-gray-900">Nem bestilling</h4>
                    <p className="text-sm text-gray-600">Bestil hurtigt og nemt med kundespecifikke priser</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <ArrowRight className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-gray-900">Betaling via faktura</h4>
                    <p className="text-sm text-gray-600">Ingen online betaling - bare betal via faktura</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <ArrowRight className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-gray-900">Kontakt os for at oprette konto</h4>
                    <p className="text-sm text-gray-600">Send os en forespørgsel, så kontakter vi dig for at oprette din konto</p>
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <Link to="/contact">
                  <Button variant="outline" className="w-full gap-2">
                    <Mail className="h-4 w-4" />
                    Kontakt os for at blive kunde
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Login;
