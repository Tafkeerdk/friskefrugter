
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Leaf, Truck, Clock, Shield, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function About() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        {/* Enhanced Hero Section with Parallax Effect */}
        <div className="relative h-[50vh] overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center transform scale-110 transition-transform duration-1000"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?auto=format&fit=crop&w=2000&q=80')",
              transform: "translateZ(0)"
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-green-900/80 to-green-600/60" />
          <div className="container mx-auto px-4 h-full flex items-center relative">
            <div className="max-w-2xl">
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 animate-fade-slide-up">
                Din partner i friske råvarer
              </h1>
              <p className="text-xl md:text-2xl text-white/90 animate-fade-slide-up-delay-1 leading-relaxed">
                Vi leverer kvalitet og friskhed direkte til din virksomhed, hver dag.
              </p>
              <div className="mt-8 flex gap-4 animate-fade-slide-up-delay-2">
                <Link to="/contact">
                  <Button size="lg" className="bg-white text-green-700 hover:bg-green-50">
                    Kontakt os <ChevronRight className="ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Mission Section with Enhanced Design */}
        <div className="container mx-auto px-4 py-24">
          <div className="max-w-3xl mx-auto text-center mb-20">
            <div className="inline-block">
              <h2 className="text-4xl font-bold mb-6 text-green-800 relative">
                Vores Mission
                <div className="absolute -bottom-3 left-0 w-full h-1 bg-green-500 rounded-full transform scale-x-0 animate-scale-in" style={{ animationDelay: '0.5s', animationFillMode: 'forwards' }}></div>
              </h2>
            </div>
            <p className="text-xl text-gray-600 leading-relaxed animate-fade-slide-up-delay-1">
              Hos FriskeFrugter stræber vi efter at revolutionere måden professionelle køkkener får deres råvarer på. 
              Vi kombinerer års erfaring inden for fødevarebranchen med moderne teknologi for at sikre den bedste 
              kvalitet og service til vores kunder.
            </p>
          </div>

          {/* Enhanced Values Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
            <Card className="transform hover:-translate-y-2 transition-all duration-300 bg-white/50 border-none shadow-lg hover:shadow-xl">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-6 transform transition-transform duration-500 hover:rotate-12">
                    <Leaf className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-green-800">Friskhed</h3>
                  <p className="text-gray-600">
                    Vi garanterer de friskeste råvarer leveret direkte fra producenter
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="transform hover:-translate-y-2 transition-all duration-300 bg-white/50 border-none shadow-lg hover:shadow-xl">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-6 transform transition-transform duration-500 hover:rotate-12">
                    <Truck className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-green-800">Levering</h3>
                  <p className="text-gray-600">
                    Pålidelig levering til din dør, når du har brug for det
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="transform hover:-translate-y-2 transition-all duration-300 bg-white/50 border-none shadow-lg hover:shadow-xl">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-6 transform transition-transform duration-500 hover:rotate-12">
                    <Clock className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-green-800">Effektivitet</h3>
                  <p className="text-gray-600">
                    Hurtig og præcis ordrehåndtering gennem vores digitale platform
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="transform hover:-translate-y-2 transition-all duration-300 bg-white/50 border-none shadow-lg hover:shadow-xl">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-6 transform transition-transform duration-500 hover:rotate-12">
                    <Shield className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-green-800">Kvalitet</h3>
                  <p className="text-gray-600">
                    Højeste kvalitetsstandarder og fødevaresikkerhed
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Statistics Section */}
          <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-2xl shadow-lg p-12 transform hover:scale-[1.02] transition-transform duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="text-center transform hover:-translate-y-2 transition-all duration-300">
                <div className="text-5xl font-bold text-green-600 mb-3 animate-count-up">1000+</div>
                <div className="text-lg text-gray-600">Tilfredse kunder</div>
              </div>
              <div className="text-center transform hover:-translate-y-2 transition-all duration-300">
                <div className="text-5xl font-bold text-green-600 mb-3">24/7</div>
                <div className="text-lg text-gray-600">Support</div>
              </div>
              <div className="text-center transform hover:-translate-y-2 transition-all duration-300">
                <div className="text-5xl font-bold text-green-600 mb-3">98%</div>
                <div className="text-lg text-gray-600">Leveringspræcision</div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
