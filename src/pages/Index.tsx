import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ContactOverlay } from "@/components/layout/ContactOverlay";
import { ProductCard } from "@/components/products/ProductCard";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle, ChevronRight, Truck, CreditCard, Clock } from "lucide-react";

// Sample product data
const featuredProducts = [
  {
    id: "1",
    name: "Økologiske Æbler",
    image: "https://images.unsplash.com/photo-1570913149827-d2ac84ab3f9a?auto=format&fit=crop&q=80&w=800",
    category: "Frugt",
    isLoggedIn: false,
  },
  {
    id: "2",
    name: "Danske Gulerødder",
    image: "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&q=80&w=800",
    category: "Grøntsager",
    isLoggedIn: false,
  },
  {
    id: "3",
    name: "Friske Jordbær",
    image: "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&q=80&w=800",
    category: "Bær",
    isLoggedIn: false,
  },
  {
    id: "4",
    name: "Økologisk Mælk",
    image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&q=80&w=800",
    category: "Mejeri",
    isLoggedIn: false,
  }
];

const Index = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        {/* Hero Section with enhanced animations */}
        <section className="relative">
          <div className="bg-green-500/10 w-full h-[500px] md:h-[700px] overflow-hidden relative">
            <img 
              src="https://images.unsplash.com/photo-1506976785307-8732e854ad03?auto=format&fit=crop&q=80&w=2000" 
              alt="Friske grøntsager" 
              className="w-full h-full object-cover img-zoom"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-black/10" />
            <div className="absolute inset-0 flex flex-col justify-center container mx-auto px-4">
              <div className="max-w-lg text-white animate-fade-slide-up">
                <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
                  Friske råvarer til professionelle
                </h1>
                <p className="text-xl md:text-2xl mb-8 text-gray-100 animate-fade-slide-up-delay-1">
                  Nemt og hurtigt – direkte til din virksomhed
                </p>
                <div className="flex flex-col sm:flex-row gap-4 animate-fade-slide-up-delay-2">
                  <Link to="/products">
                    <Button className="text-lg py-6 px-8 bg-green-600 hover:bg-green-700 shadow-lg btn-scale">
                      Se produkter <ChevronRight className="ml-1" />
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button variant="outline" className="text-lg py-6 px-8 bg-white/90 text-gray-900 hover:bg-white border-0 shadow-lg btn-scale">
                      Log ind
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Bar */}
        <section className="bg-white border-b py-6">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-center gap-3 animate-fade-slide-up-delay-1">
                <Truck className="h-6 w-6 text-green-600" />
                <span className="text-gray-700 font-medium">Levering til hele Danmark</span>
              </div>
              <div className="flex items-center justify-center gap-3 animate-fade-slide-up-delay-2">
                <CreditCard className="h-6 w-6 text-green-600" />
                <span className="text-gray-700 font-medium">Betaling via faktura</span>
              </div>
              <div className="flex items-center justify-center gap-3 animate-fade-slide-up-delay-3">
                <Clock className="h-6 w-6 text-green-600" />
                <span className="text-gray-700 font-medium">Bestil inden kl. 14 - levering næste dag</span>
              </div>
            </div>
          </div>
        </section>

        {/* B2B Info Section with enhanced styling */}
        <section className="bg-gradient-to-b from-green-50 to-white py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-soft shadow-hover transition-all duration-300">
                <h2 className="text-xl md:text-2xl font-semibold text-center text-gray-900 mb-8 relative">
                  <span className="relative">
                    Velkommen til <span className="text-green-600">Firmanavn</span> - Professionel frugt- og grøntleverandør
                    <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 h-1 w-16 bg-green-500 rounded-full"></div>
                  </span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="flex flex-col gap-5">
                    <div className="flex items-start gap-4 group">
                      <div className="mt-0.5 bg-green-100 p-2 rounded-lg group-hover:bg-green-200 transition-colors">
                        <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 group-hover:text-green-700 transition-colors">Kun for erhvervskunder</h3>
                        <p className="text-gray-600 text-sm mt-1">Vores webshop er udelukkende for professionelle indkøbere og erhvervskunder.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 group">
                      <div className="mt-0.5 bg-green-100 p-2 rounded-lg group-hover:bg-green-200 transition-colors">
                        <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 group-hover:text-green-700 transition-colors">Betaling via faktura</h3>
                        <p className="text-gray-600 text-sm mt-1">Vi tilbyder nemme betalingsvilkår med faktura og integration til e-conomic.</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-5">
                    <div className="flex items-start gap-4 group">
                      <div className="mt-0.5 bg-green-100 p-2 rounded-lg group-hover:bg-green-200 transition-colors">
                        <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 group-hover:text-green-700 transition-colors">Friske kvalitetsvarer</h3>
                        <p className="text-gray-600 text-sm mt-1">Vi håndplukker de bedste råvarer til din virksomhed med fokus på kvalitet og friskhed.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 group">
                      <div className="mt-0.5 bg-green-100 p-2 rounded-lg group-hover:bg-green-200 transition-colors">
                        <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 group-hover:text-green-700 transition-colors">Hurtig og pålidelig levering</h3>
                        <p className="text-gray-600 text-sm mt-1">Bestil nemt online og få leveret direkte til din virksomheds adresse.</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-8 text-center">
                  <Link to="/about">
                    <Button variant="outline" className="border-green-200 text-green-700 hover:bg-green-50">
                      Læs mere om os <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Products with enhanced styling */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 relative inline-block">
                Udvalgte produkter
                <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 h-1 w-16 bg-green-500 rounded-full"></div>
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Se et udvalg af vores mest populære produkter til din virksomhed.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {featuredProducts.map((product, index) => (
                <div className={`animate-fade-slide-up-delay-${index % 3 + 1}`} key={product.id}>
                  <ProductCard {...product} />
                </div>
              ))}
            </div>
            <div className="mt-12 text-center">
              <Link to="/products">
                <Button className="px-8 py-6 text-lg bg-green-600 hover:bg-green-700 shadow-md flex items-center btn-scale">
                  <span>Se alle produkter</span>
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Section with enhanced design */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img 
              src="https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&q=80&w=2000" 
              alt="Friske grøntsager baggrund" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-green-900/80"></div>
          </div>
          <div className="container mx-auto px-4 py-20 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 animate-fade-slide-up">
                Klar til at blive kunde?
              </h2>
              <p className="text-white text-lg md:text-xl max-w-2xl mx-auto mb-10 animate-fade-slide-up-delay-1">
                Opret en B2B-konto og få adgang til vores fulde sortiment, kundespecifikke priser og nemme bestillingsmuligheder.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-slide-up-delay-2">
                <Link to="/contact">
                  <Button className="text-lg bg-white text-green-700 hover:bg-gray-100 hover:text-green-800 shadow-lg btn-scale py-6 px-8">
                    Kontakt os
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" className="text-lg border-white text-white hover:bg-white/10 btn-scale py-6 px-8">
                    Log ind
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <ContactOverlay />
    </div>
  );
};

export default Index;
