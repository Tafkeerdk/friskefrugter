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
        {/* Enhanced Hero Section with Parallax Effect - FULL WIDTH */}
        <div className="relative h-[50vh] overflow-hidden full-width-section">
          <div 
            className="absolute inset-0 bg-cover bg-center transform scale-110 transition-transform duration-1000"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?auto=format&fit=crop&w=2000&q=80')",
              transform: "translateZ(0)"
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-green-900/80 to-green-600/60" />
          <div className="page-container h-full flex items-center relative">
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

        {/* Mission Section with Enhanced Design - CONTAINED WIDTH */}
        <div className="page-container py-24">
          <div className="content-width">
            <div className="max-w-3xl mx-auto text-center mb-20">
              <div className="inline-block">
                <h2 className="text-4xl font-bold mb-6 text-green-800 relative">
                  Vores Mission
                  <div className="absolute -bottom-3 left-0 w-full h-1 bg-green-500 rounded-full transform scale-x-0 animate-scale-in" style={{ animationDelay: '0.5s', animationFillMode: 'forwards' }}></div>
                </h2>
              </div>
              <p className="text-xl text-gray-600 leading-relaxed animate-fade-slide-up-delay-1">
                Hos Multi Grønt stræber vi efter at revolutionere måden professionelle køkkener får deres råvarer på. 
                Vi kombinerer års erfaring inden for fødevarebranchen med moderne teknologi for at sikre den bedste 
                kvalitet og service til vores kunder.
              </p>
            </div>

            {/* Enhanced Values Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
              <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 group">
                <div className="text-green-600 mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Leaf className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">Friskhed</h3>
                <p className="text-gray-600 text-center leading-relaxed">
                  Vi leverer kun de friskeste råvarer direkte fra vores leverandører til din dør.
                </p>
              </div>

              <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 group">
                <div className="text-blue-600 mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Truck className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">Hurtig levering</h3>
                <p className="text-gray-600 text-center leading-relaxed">
                  Levering til hele Danmark med fokus på hastighed og pålidelighed.
                </p>
              </div>

              <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 group">
                <div className="text-purple-600 mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Clock className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">24/7 Support</h3>
                <p className="text-gray-600 text-center leading-relaxed">
                  Vores team er altid klar til at hjælpe dig med dine behov.
                </p>
              </div>

              <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 group">
                <div className="text-orange-600 mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Shield className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">Kvalitet</h3>
                <p className="text-gray-600 text-center leading-relaxed">
                  Høj kvalitet og sporbarhed i alle vores produkter og processer.
                </p>
              </div>
            </div>

            {/* Statistics Section */}
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
        </div>
      </main>
      <Footer />
    </div>
  );
}
