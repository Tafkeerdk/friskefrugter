import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ContactOverlay } from "@/components/layout/ContactOverlay";
import { ProductCard } from "@/components/products/ProductCard";
import {
  ArrowRight,
  CheckCircle,
  ChevronRight,
  Truck,
  CreditCard,
  Clock,
  Leaf,
  ShieldCheck,
  Users,
  ThumbsUp
} from "lucide-react";

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
        <section className="relative min-h-screen flex items-center">
          <div className="absolute inset-0 overflow-hidden">
            <video 
              autoPlay 
              loop 
              muted 
              playsInline
              className="w-full h-full object-cover"
              style={{ filter: 'brightness(0.7)' }}
            >
              <source src="https://cdn.coverr.co/videos/coverr-fresh-vegetables-being-washed-2683/1080p.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/40" />
          </div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl">
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 animate-fade-slide-up leading-tight">
                Friske råvarer direkte til din virksomhed
              </h1>
              <p className="text-xl md:text-2xl text-white/90 mb-8 animate-fade-slide-up-delay-1">
                Kvalitet, pålidelighed og effektivitet - alt samlet ét sted for professionelle køkkener
              </p>
              <div className="flex flex-col sm:flex-row gap-4 animate-fade-slide-up-delay-2">
                <Link to="/products">
                  <Button variant="heroOutline" size="lg" className="text-lg py-6 px-8 btn-scale">
                    Udforsk produkter <ChevronRight className="ml-2" />
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button 
                    variant="heroOutline" 
                    size="lg"
                    className="text-lg py-6 px-8 btn-scale"
                  >
                    Kontakt os
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          
          <div className="absolute bottom-10 left-0 right-0 z-10">
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/10 backdrop-blur-md p-6 rounded-lg border border-white/20 transform hover:-translate-y-2 transition-all duration-300">
                  <Leaf className="h-8 w-8 text-green-400 mb-4" />
                  <h3 className="text-white text-lg font-semibold mb-2">100% Friske råvarer</h3>
                  <p className="text-white/80">Håndplukkede råvarer leveret direkte fra producenter</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md p-6 rounded-lg border border-white/20 transform hover:-translate-y-2 transition-all duration-300">
                  <ShieldCheck className="h-8 w-8 text-green-400 mb-4" />
                  <h3 className="text-white text-lg font-semibold mb-2">Kvalitetsgaranti</h3>
                  <p className="text-white/80">Vi står inde for kvaliteten af alle vores produkter</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md p-6 rounded-lg border border-white/20 transform hover:-translate-y-2 transition-all duration-300">
                  <Truck className="h-8 w-8 text-green-400 mb-4" />
                  <h3 className="text-white text-lg font-semibold mb-2">Hurtig levering</h3>
                  <p className="text-white/80">Bestil inden kl. 14 og få levering næste dag</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-gradient-to-b from-green-50 to-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Hvorfor vælge os?
              </h2>
              <div className="w-20 h-1 bg-green-500 mx-auto rounded-full mb-6"></div>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Vi leverer mere end bare råvarer - vi leverer en komplet løsning til din virksomhed
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  icon: <Users className="h-10 w-10 text-green-600" />,
                  title: "Dedikeret support",
                  description: "Personlig service og support til alle vores kunder"
                },
                {
                  icon: <ThumbsUp className="h-10 w-10 text-green-600" />,
                  title: "Nem bestilling",
                  description: "Intuitivt online bestillingssystem"
                },
                {
                  icon: <CreditCard className="h-10 w-10 text-green-600" />,
                  title: "Fleksibel betaling",
                  description: "Forskellige betalingsmuligheder tilpasset din virksomhed"
                },
                {
                  icon: <Clock className="h-10 w-10 text-green-600" />,
                  title: "Pålidelig levering",
                  description: "Fast og præcis leveringstid"
                }
              ].map((feature, index) => (
                <div 
                  key={index}
                  className="bg-white p-8 rounded-xl shadow-soft hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
                >
                  <div className="bg-green-50 p-4 rounded-full inline-block mb-6">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-end mb-12">
              <div>
                <h2 className="text-4xl font-bold text-gray-900 mb-4">Udvalgte produkter</h2>
                <p className="text-xl text-gray-600">Opdateres dagligt baseret på sæson og tilgængelighed</p>
              </div>
              <Link to="/products">
                <Button variant="outline" className="group">
                  Se alle produkter
                  <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
          </div>
        </section>

        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0">
            <img 
              src="https://images.unsplash.com/photo-1550989460-0adf9ea622e2?auto=format&fit=crop&q=80&w=2000"
              alt="Fresh vegetables"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-green-900/90 to-green-800/80" />
          </div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center text-white">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Klar til at starte samarbejdet?
              </h2>
              <p className="text-xl mb-8 text-white/90">
                Tilmeld dig i dag og få adgang til vores komplette sortiment af friske råvarer
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/contact">
                  <Button size="lg" className="text-lg py-6 px-8 bg-white text-green-700 hover:bg-green-50 shadow-lg btn-scale">
                    Start nu <ChevronRight className="ml-2" />
                  </Button>
                </Link>
                <Link to="/products">
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="text-lg py-6 px-8 text-white border-white hover:bg-white/10 btn-scale"
                  >
                    Se produkter
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
