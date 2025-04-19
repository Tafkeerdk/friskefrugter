
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
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] blob-shape bg-green-100/50 blur-3xl opacity-50 animate-float"></div>
        <div className="absolute top-1/2 -right-60 w-[600px] h-[600px] organic-shape bg-green-50/60 blur-3xl opacity-40 animate-float-reverse"></div>
        <div className="absolute bottom-20 left-1/3 w-[300px] h-[300px] fluid-shape bg-green-100/30 blur-2xl opacity-30 animate-float"></div>
      </div>

      <main className="relative flex-grow flex items-center justify-center py-12 px-4">
        <div className="container max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Login Form */}
            <div className="w-full max-w-md mx-auto">
              <Card className="border-0 shadow-soft rounded-[2rem] overflow-hidden backdrop-blur-sm bg-white/80 p-2 animate-fade-slide-up">
                <div className="bg-gradient-soft rounded-[1.8rem] overflow-hidden">
                  <CardHeader className="space-y-1 pb-6">
                    <div className="w-16 h-16 rounded-full bg-gradient-green mx-auto flex items-center justify-center mb-2 shadow-soft animate-bounce-soft">
                      <User className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-center text-gradient">
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
                            className="pl-4 py-6 transition-all duration-300 rounded-xl input-focus-effect bg-white/50"
                          />
                          <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-green-500 transition-all duration-500 group-hover:w-full"></div>
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
                            className="pl-4 py-6 transition-all duration-300 rounded-xl input-focus-effect bg-white/50"
                          />
                          <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-green-500 transition-all duration-500 group-hover:w-full"></div>
                        </div>
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full bg-gradient-green hover:from-green-700 hover:to-green-800 
                                 transition-all duration-300 transform btn-lift py-6 rounded-xl overflow-hidden btn-effect"
                      >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                          Log ind
                          <ArrowRight className="h-5 w-5 animate-fade-slide-left-delay-1" />
                        </span>
                      </Button>
                    </form>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-4">
                    <div className="text-center text-sm text-gray-600">
                      <span>Har du ikke en konto? </span>
                      <Link 
                        to="/contact" 
                        className="font-medium text-green-600 hover:text-green-800 transition-colors relative after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-0.5 after:bottom-0 after:left-0 after:bg-green-600 after:origin-bottom-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-bottom-left"
                      >
                        Kontakt os for at blive kunde
                      </Link>
                    </div>
                  </CardFooter>
                </div>
              </Card>
            </div>

            {/* Info Section */}
            <div className="lg:block">
              <div className="bg-white/80 backdrop-blur-sm rounded-[2rem] p-8 shadow-soft animate-fade-slide-right glass-card">
                <h3 className="font-semibold text-gray-900 text-xl mb-6 flex items-center gap-3">
                  <Users className="h-6 w-6 text-green-600" />
                  <span className="text-gradient">
                    Kun for B2B-kunder
                  </span>
                </h3>
                
                <div className="space-y-6">
                  <div className="group">
                    <div className="flex items-start gap-4 p-4 rounded-xl transition-all duration-300 hover:bg-green-50/50 shadow-soft hover:shadow-card">
                      <div className="mt-1 h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                        <ArrowRight className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 group-hover:text-green-700 transition-colors">Nem bestilling</h4>
                        <p className="text-gray-600 mt-1">Bestil hurtigt og nemt med kundespecifikke priser</p>
                      </div>
                    </div>
                  </div>

                  <div className="group animate-fade-slide-right-delay-1">
                    <div className="flex items-start gap-4 p-4 rounded-xl transition-all duration-300 hover:bg-green-50/50 shadow-soft hover:shadow-card">
                      <div className="mt-1 h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                        <ArrowRight className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 group-hover:text-green-700 transition-colors">Betaling via faktura</h4>
                        <p className="text-gray-600 mt-1">Ingen online betaling - bare betal via faktura</p>
                      </div>
                    </div>
                  </div>

                  <div className="group animate-fade-slide-right-delay-2">
                    <div className="flex items-start gap-4 p-4 rounded-xl transition-all duration-300 hover:bg-green-50/50 shadow-soft hover:shadow-card">
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
                    <Button variant="outline" className="w-full gap-2 border-green-200 hover:bg-green-50 hover:border-green-300 transition-all duration-300 py-6 rounded-xl btn-scale overflow-hidden shadow-soft hover:shadow-card">
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
