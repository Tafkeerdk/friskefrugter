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
import { useIsMobile } from "@/hooks/use-mobile";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const isMobile = useIsMobile();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Login attempt with:", { email, password });
    window.location.href = "/dashboard";
  };

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      <Navbar />
      
      <main className="relative flex-grow flex items-center justify-center py-6 px-4 md:py-12">
        <div className="container max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 items-start">
            <div className="w-full max-w-md mx-auto order-2 lg:order-1">
              <Card className="border border-gray-100 shadow-sm rounded-xl overflow-hidden bg-white">
                <div className="bg-white rounded-lg overflow-hidden">
                  <CardHeader className="space-y-1 pb-6">
                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-green-50 mx-auto flex items-center justify-center mb-2 shadow-sm">
                      <User className="h-7 w-7 md:h-8 md:w-8 text-green-600" />
                    </div>
                    <CardTitle className="text-xl md:text-2xl font-bold text-center text-gray-800">
                      Log ind
                    </CardTitle>
                    <CardDescription className="text-center text-sm md:text-base">
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
                            className="pl-4 py-5 md:py-6 transition-all duration-300 rounded-xl bg-white border-gray-200 text-base"
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
                            className="pl-4 py-5 md:py-6 transition-all duration-300 rounded-xl bg-white border-gray-200 text-base"
                          />
                        </div>
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full bg-green-600 hover:bg-green-700 text-white
                                 transition-all duration-300 py-5 md:py-6 rounded-xl text-base"
                      >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                          Log ind
                          <ArrowRight className="h-5 w-5" />
                        </span>
                      </Button>
                    </form>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-4 pb-6">
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

            <div className="lg:block order-1 lg:order-2">
              <div className="bg-white border border-gray-100 rounded-xl p-6 md:p-8 shadow-sm">
                <h3 className="font-semibold text-gray-900 text-lg md:text-xl mb-6 flex items-center gap-3">
                  <Users className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
                  <span className="text-gray-800">
                    Kun for B2B-kunder
                  </span>
                </h3>
                
                <div className="space-y-4 md:space-y-6">
                  <div className="group">
                    <div className="flex items-start gap-3 md:gap-4 p-3 md:p-4 rounded-xl hover:bg-gray-50 transition-all duration-300">
                      <div className="mt-1 h-7 w-7 md:h-8 md:w-8 rounded-lg bg-green-50 flex items-center justify-center">
                        <ArrowRight className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 text-sm md:text-base">Nem bestilling</h4>
                        <p className="text-gray-600 mt-1 text-sm">Bestil hurtigt og nemt med kundespecifikke priser</p>
                      </div>
                    </div>
                  </div>

                  <div className="group">
                    <div className="flex items-start gap-3 md:gap-4 p-3 md:p-4 rounded-xl hover:bg-gray-50 transition-all duration-300">
                      <div className="mt-1 h-7 w-7 md:h-8 md:w-8 rounded-lg bg-green-50 flex items-center justify-center">
                        <ArrowRight className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 text-sm md:text-base">Betaling via faktura</h4>
                        <p className="text-gray-600 mt-1 text-sm">Ingen online betaling - bare betal via faktura</p>
                      </div>
                    </div>
                  </div>

                  <div className="group">
                    <div className="flex items-start gap-3 md:gap-4 p-3 md:p-4 rounded-xl hover:bg-gray-50 transition-all duration-300">
                      <div className="mt-1 h-7 w-7 md:h-8 md:w-8 rounded-lg bg-green-50 flex items-center justify-center">
                        <ArrowRight className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 text-sm md:text-base">Kontakt os for at oprette konto</h4>
                        <p className="text-gray-600 mt-1 text-sm">Send os en forespørgsel, så kontakter vi dig for at oprette din konto</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 md:mt-8">
                  <Link to="/contact">
                    <Button variant="outline" className="w-full gap-2 border-green-200 hover:bg-green-50 text-gray-800 transition-all duration-300 py-5 md:py-6 rounded-xl text-sm md:text-base">
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
