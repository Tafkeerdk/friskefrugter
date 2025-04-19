
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Mail, Lock, User, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { ContactOverlay } from "@/components/layout/ContactOverlay";

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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white relative overflow-hidden">
      <Navbar />
      
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-green-100 rounded-full blur-3xl opacity-50 animate-float"></div>
        <div className="absolute top-1/2 -right-48 w-96 h-96 bg-green-50 rounded-full blur-3xl opacity-40 animate-float"></div>
      </div>

      <main className="relative flex-grow flex items-center justify-center py-12 px-4">
        <div className="container max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Login Form */}
            <div className="w-full max-w-md mx-auto">
              <Card className="border-0 shadow-soft backdrop-blur-sm bg-white/80">
                <CardHeader className="space-y-1 pb-6">
                  <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
                    Log ind
                  </CardTitle>
                  <CardDescription className="text-center">
                    Indtast dine oplysninger for at få adgang til din konto
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input 
                          id="email" 
                          type="email" 
                          placeholder="din@virksomhed.dk" 
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="pl-10 transition-all duration-300 border-gray-200 focus:border-green-500 hover:border-gray-300"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password" className="text-sm font-medium">Adgangskode</Label>
                        <Link 
                          to="/forgot-password" 
                          className="text-sm font-medium text-green-600 hover:text-green-800 transition-colors"
                        >
                          Glemt adgangskode?
                        </Link>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input 
                          id="password" 
                          type="password" 
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="pl-10 transition-all duration-300 border-gray-200 focus:border-green-500 hover:border-gray-300"
                        />
                      </div>
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] animate-fade-slide-up"
                    >
                      Log ind
                    </Button>
                  </form>
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                  <div className="text-center text-sm text-gray-600">
                    <span>Har du ikke en konto? </span>
                    <Link 
                      to="/contact" 
                      className="font-medium text-green-600 hover:text-green-800 transition-colors"
                    >
                      Kontakt os for at blive kunde
                    </Link>
                  </div>
                </CardFooter>
              </Card>
            </div>

            {/* Info Section */}
            <div className="lg:block">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-soft animate-fade-slide-up">
                <h3 className="font-semibold text-gray-900 text-xl mb-6 flex items-center gap-3">
                  <Users className="h-6 w-6 text-green-600" />
                  <span className="bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
                    Kun for B2B-kunder
                  </span>
                </h3>
                
                <div className="space-y-6">
                  <div className="group">
                    <div className="flex items-start gap-4 p-4 rounded-xl transition-all duration-300 hover:bg-green-50/50">
                      <div className="mt-1 h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                        <ArrowRight className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 group-hover:text-green-700 transition-colors">Nem bestilling</h4>
                        <p className="text-gray-600 mt-1">Bestil hurtigt og nemt med kundespecifikke priser</p>
                      </div>
                    </div>
                  </div>

                  <div className="group">
                    <div className="flex items-start gap-4 p-4 rounded-xl transition-all duration-300 hover:bg-green-50/50">
                      <div className="mt-1 h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                        <ArrowRight className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 group-hover:text-green-700 transition-colors">Betaling via faktura</h4>
                        <p className="text-gray-600 mt-1">Ingen online betaling - bare betal via faktura</p>
                      </div>
                    </div>
                  </div>

                  <div className="group">
                    <div className="flex items-start gap-4 p-4 rounded-xl transition-all duration-300 hover:bg-green-50/50">
                      <div className="mt-1 h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                        <ArrowRight className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 group-hover:text-green-700 transition-colors">Kontakt os for at oprette konto</h4>
                        <p className="text-gray-600 mt-1">Send os en forespørgsel, så kontakter vi dig for at oprette din konto</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <Link to="/contact">
                    <Button variant="outline" className="w-full gap-2 border-green-200 hover:bg-green-50 hover:border-green-300 transition-all duration-300">
                      <Mail className="h-4 w-4" />
                      Kontakt os for at blive kunde
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <ContactOverlay />
      <Footer />
    </div>
  );
};

export default Login;
