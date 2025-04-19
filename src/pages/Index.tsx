
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ProductCard } from "@/components/products/ProductCard";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle } from "lucide-react";

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
        {/* Hero Section */}
        <section className="relative">
          <div className="bg-green-500/10 w-full h-[500px] md:h-[600px] overflow-hidden relative">
            <img 
              src="https://images.unsplash.com/photo-1506976785307-8732e854ad03?auto=format&fit=crop&q=80&w=2000" 
              alt="Friske grøntsager" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/25" />
            <div className="absolute inset-0 flex flex-col justify-center container mx-auto px-4">
              <div className="max-w-lg text-white">
                <h1 className="text-4xl md:text-5xl font-bold mb-4">Friske råvarer til professionelle</h1>
                <p className="text-xl md:text-2xl mb-8">Nemt og hurtigt – direkte til din virksomhed</p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link to="/products">
                    <Button className="text-lg py-6 px-8 bg-green-600 hover:bg-green-700">
                      Se produkter
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button variant="outline" className="text-lg py-6 px-8 bg-white text-gray-900 hover:bg-gray-100 border-0">
                      Log ind
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* B2B Info Section */}
        <section className="bg-green-50 py-10">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <h2 className="text-xl md:text-2xl font-semibold text-center text-gray-900 mb-6">
                  Velkommen til GreenEngros - Professionel frugt- og grøntleverandør
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-medium text-gray-900">Kun for erhvervskunder</h3>
                        <p className="text-gray-600 text-sm">Vores webshop er udelukkende for professionelle indkøbere og erhvervskunder.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-medium text-gray-900">Betaling via faktura</h3>
                        <p className="text-gray-600 text-sm">Vi tilbyder nemme betalingsvilkår med faktura og integration til e-conomic.</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-medium text-gray-900">Friske kvalitetsvarer</h3>
                        <p className="text-gray-600 text-sm">Vi håndplukker de bedste råvarer til din virksomhed med fokus på kvalitet og friskhed.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-medium text-gray-900">Hurtig og pålidelig levering</h3>
                        <p className="text-gray-600 text-sm">Bestil nemt online og få leveret direkte til din virksomheds adresse.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Udvalgte produkter</h2>
              <Link to="/products" className="text-green-600 hover:text-green-800 flex items-center">
                <span className="mr-1">Se alle</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-green-600 py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-white mb-6">Klar til at blive kunde?</h2>
            <p className="text-white text-lg max-w-2xl mx-auto mb-8">
              Opret en B2B-konto og få adgang til vores fulde sortiment, kundespecifikke priser og nemme bestillingsmuligheder.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/contact">
                <Button className="text-lg bg-white text-green-600 hover:bg-gray-100 hover:text-green-700">
                  Kontakt os
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" className="text-lg border-white text-white hover:bg-white/10">
                  Log ind
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
