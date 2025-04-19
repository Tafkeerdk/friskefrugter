
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
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      <Navbar />
      
      {/* Simplified decorative elements - reduced gradient opacity and size */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[300px] h-[300px] blob-shape bg-green-100/30 blur-3xl opacity-30"></div>
        <div className="absolute top-1/2 -right-60 w-[400px] h-[400px] organic-shape bg-green-50/40 blur-3xl opacity-20"></div>
        <div className="absolute bottom-20 left-1/3 w-[200px] h-[200px] fluid-shape bg-green-100/20 blur-2xl opacity-20"></div>
      </div>

      <main className="relative flex-grow flex items-center justify-center py-12 px-4">
        <div className="container max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Login Form */}
            <div className="w-full max-w-md mx-auto">
              <Card className="border border-gray-100 shadow-sm rounded-xl overflow-hidden bg-white p-2">
                <div className="bg-white rounded-lg overflow-hidden">
                  <CardHeader className="space-y-1 pb-6">
                    <div className="w-16 h-16 rounded-full bg-green-50 mx-auto flex items-center justify-center mb-2 shadow-sm">
                      <User className="h-8 w-8 text-green-600" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-center text-gray-800">
                      Log ind
                    </CardTitle>
                    <CardDescription className="text-center">
                      Indtast dine oplysninger for at få adgang til din konto
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-green-600" />
                          Email
                        </Label>
                        <div className="relative group">
                          <Input 
                            id="email" 
                            type="email" 
                            placeholder="din@virksomhed.dk" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="pl-4 py-6 transition-all duration-300 rounded-xl bg-white border-gray-200"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="password" className="text-sm font-medium flex items-center gap-1.5">
                            <Lock className="h-3.5 w-3.5 text-green-600" />
                            Adgangskode
                          </Label>
                          <Link 
                            to="/forgot-password" 
                            className="text-sm font-medium text-green-600 hover:text-green-800 transition-colors"
                          >
                            Glemt adgangskode?
                          </Link>
                        </div>
                        <div className="relative group">
                          <Input 
                            id="password" 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="pl-4 py-6 transition-all duration-300 rounded-xl bg-white border-gray-200"
                          />
                        </div>
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full bg-green-600 hover:bg-green-700 text-white
                                 transition-all duration-300 py-6 rounded-xl"
                      >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                          Log ind
                          <ArrowRight className="h-5 w-5" />
                        </span>
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
                </div>
              </Card>
            </div>

            {/* Info Section - simplified design */}
            <div className="lg:block">
              <div className="bg-white border border-gray-100 rounded-xl p-8 shadow-sm">
                <h3 className="font-semibold text-gray-900 text-xl mb-6 flex items-center gap-3">
                  <Users className="h-6 w-6 text-green-600" />
                  <span className="text-gray-800">
                    Kun for B2B-kunder
                  </span>
                </h3>
                
                <div className="space-y-6">
                  <div className="group">
                    <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 transition-all duration-300">
                      <div className="mt-1 h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center">
                        <ArrowRight className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Nem bestilling</h4>
                        <p className="text-gray-600 mt-1">Bestil hurtigt og nemt med kundespecifikke priser</p>
                      </div>
                    </div>
                  </div>

                  <div className="group">
                    <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 transition-all duration-300">
                      <div className="mt-1 h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center">
                        <ArrowRight className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Betaling via faktura</h4>
                        <p className="text-gray-600 mt-1">Ingen online betaling - bare betal via faktura</p>
                      </div>
                    </div>
                  </div>

                  <div className="group">
                    <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 transition-all duration-300">
                      <div className="mt-1 h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center">
                        <ArrowRight className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Kontakt os for at oprette konto</h4>
                        <p className="text-gray-600 mt-1">Send os en forespørgsel, så kontakter vi dig for at oprette din konto</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <Link to="/contact">
                    <Button variant="outline" className="w-full gap-2 border-green-200 hover:bg-green-50 text-gray-800 transition-all duration-300 py-6 rounded-xl">
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
