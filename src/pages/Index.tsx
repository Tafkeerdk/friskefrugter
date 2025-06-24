import React, { useState } from 'react';
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ContactOverlay } from "@/components/layout/ContactOverlay";
import { ProductCard } from "@/components/products/ProductCard";
import PWAInstallBanner from "@/components/ui/pwa-install-banner";
import { ArrowRight, CheckCircle, ChevronRight, Truck, CreditCard, Clock, User } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePWA } from "@/hooks/usePWA";
import { cn } from "@/lib/utils";

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
  const isMobile = useIsMobile();
  const { canInstall } = usePWA();
  const [showPWABanner, setShowPWABanner] = useState(true);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      {/* PWA Install Banner */}
      {canInstall && showPWABanner && (
        <div className={cn(
          "sticky top-16 z-40",
          isMobile ? "px-3 py-2" : "px-4 py-3"
        )}>
          <PWAInstallBanner 
            compact={isMobile}
            onDismiss={() => setShowPWABanner(false)}
          />
        </div>
      )}

      <main className="flex-grow">
        {/* Hero Section with enhanced mobile design */}
        <section className="relative">
          <div className={cn(
            "bg-brand-primary/10 w-full overflow-hidden relative",
            isMobile ? "h-[400px]" : "h-[500px] md:h-[700px]"
          )}>
            <img 
              src="https://images.unsplash.com/photo-1518843875459-f738682238a6?auto=format&fit=crop&q=80&w=2000" 
              alt="Fresh organic vegetables" 
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-black/20" />
            <div className={cn(
              "absolute inset-0 flex flex-col justify-center hero-container",
              isMobile ? "" : ""
            )}>
              <div className={cn(
                "text-white",
                isMobile ? "max-w-full text-center" : "max-w-lg"
              )}>
                <h1 className={cn(
                  "font-bold mb-4 leading-tight",
                  isMobile ? "text-2xl" : "text-4xl md:text-6xl"
                )}>
                  Friske råvarer til professionelle
                </h1>
                <p className={cn(
                  "mb-6 text-gray-100",
                  isMobile ? "text-base" : "text-xl md:text-2xl mb-8"
                )}>
                  Nemt og hurtigt – direkte til din virksomhed
                </p>
                <div className={cn(
                  "flex gap-3",
                  isMobile ? "flex-col space-y-3" : "flex-col sm:flex-row gap-4"
                )}>
                  <Link to="/products">
                    <Button className={cn(
                      "btn-brand-hero shadow-lg transition-all duration-200 active:scale-95",
                      isMobile ? "w-full py-3 px-6 text-base" : "text-lg py-6 px-8"
                    )}>
                      Se produkter <ChevronRight className={cn(isMobile ? "ml-1 h-4 w-4" : "ml-1 h-5 w-5")} />
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button 
                      variant="outline" 
                      className={cn(
                        "bg-white text-brand-primary hover:bg-brand-gray-100 hover:text-brand-primary-dark border-white shadow-lg transition-all duration-200 active:scale-95",
                        isMobile ? "w-full py-3 px-6 text-base" : "text-lg py-6 px-8"
                      )}
                    >
                      Log ind
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Bar with mobile optimization */}
        <section className="bg-white border-b py-4 md:py-6">
          <div className="page-container">
            <div className={cn(
              "grid gap-4",
              isMobile ? "grid-cols-1 space-y-2" : "grid-cols-1 md:grid-cols-3"
            )}>
              <div className={cn(
                "flex items-center gap-3",
                isMobile ? "justify-start bg-brand-gray-100 p-3 rounded-lg" : "justify-center"
              )}>
                <Truck className={cn("text-brand-primary", isMobile ? "h-5 w-5" : "h-6 w-6")} />
                <span className={cn(
                  "text-gray-700 font-medium",
                  isMobile ? "text-sm" : "text-base"
                )}>
                  Levering til hele Danmark
                </span>
              </div>
              <div className={cn(
                "flex items-center gap-3",
                isMobile ? "justify-start bg-brand-gray-100 p-3 rounded-lg" : "justify-center"
              )}>
                <CreditCard className={cn("text-brand-primary", isMobile ? "h-5 w-5" : "h-6 w-6")} />
                <span className={cn(
                  "text-gray-700 font-medium",
                  isMobile ? "text-sm" : "text-base"
                )}>
                  Betaling via faktura
                </span>
              </div>
              <div className={cn(
                "flex items-center gap-3",
                isMobile ? "justify-start bg-brand-gray-100 p-3 rounded-lg" : "justify-center"
              )}>
                <Clock className={cn("text-brand-primary", isMobile ? "h-5 w-5" : "h-6 w-6")} />
                <span className={cn(
                  "text-gray-700 font-medium",
                  isMobile ? "text-sm" : "text-base"
                )}>
                  {isMobile ? "Bestil inden 14:00" : "Bestil inden kl. 14 - levering næste dag"}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* B2B Info Section with mobile improvements */}
        <section className="bg-gradient-to-b from-brand-gray-100 to-white py-12 md:py-16">
          <div className="page-container">
            <div className="content-width">
              <div className={cn(
                "bg-white border border-gray-200 rounded-xl shadow-sm transition-all duration-300 hover:shadow-md",
                isMobile ? "p-6" : "p-8"
              )}>
                <h2 className={cn(
                  "font-semibold text-center text-gray-900 mb-6 relative",
                  isMobile ? "text-lg" : "text-xl md:text-2xl mb-8"
                )}>
                  <span className="relative">
                    Velkommen til <span className="text-brand-primary">Multi Grønt</span> 
                    {!isMobile && " - Professionel frugt- og grøntleverandør"}
                    <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 h-1 w-16 bg-brand-primary rounded-full"></div>
                  </span>
                </h2>
                <div className={cn(
                  "grid gap-6",
                  isMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 gap-8"
                )}>
                  <div className="flex flex-col gap-4">
                    <div className="flex items-start gap-3 group">
                      <div className={cn(
                        "mt-0.5 bg-brand-gray-100 rounded-lg group-hover:bg-brand-gray-200 transition-colors",
                        isMobile ? "p-1.5" : "p-2"
                      )}>
                        <CheckCircle className={cn(
                          "text-brand-primary flex-shrink-0",
                          isMobile ? "h-5 w-5" : "h-6 w-6"
                        )} />
                      </div>
                      <div>
                        <h3 className={cn(
                          "font-medium text-gray-900 group-hover:text-brand-primary-dark transition-colors",
                          isMobile ? "text-sm" : "text-base"
                        )}>
                          Kun for erhvervskunder
                        </h3>
                        <p className={cn(
                          "text-gray-600 mt-1",
                          isMobile ? "text-xs" : "text-sm"
                        )}>
                          Vores webshop er udelukkende for professionelle indkøbere og erhvervskunder.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 group">
                      <div className={cn(
                        "mt-0.5 bg-brand-gray-100 rounded-lg group-hover:bg-brand-gray-200 transition-colors",
                        isMobile ? "p-1.5" : "p-2"
                      )}>
                        <CheckCircle className={cn(
                          "text-brand-primary flex-shrink-0",
                          isMobile ? "h-5 w-5" : "h-6 w-6"
                        )} />
                      </div>
                      <div>
                        <h3 className={cn(
                          "font-medium text-gray-900 group-hover:text-brand-primary-dark transition-colors",
                          isMobile ? "text-sm" : "text-base"
                        )}>
                          Betaling via faktura
                        </h3>
                        <p className={cn(
                          "text-gray-600 mt-1",
                          isMobile ? "text-xs" : "text-sm"
                        )}>
                          Vi tilbyder nemme betalingsvilkår med faktura og integration til e-conomic.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-4">
                    <div className="flex items-start gap-3 group">
                      <div className={cn(
                        "mt-0.5 bg-brand-gray-100 rounded-lg group-hover:bg-brand-gray-200 transition-colors",
                        isMobile ? "p-1.5" : "p-2"
                      )}>
                        <CheckCircle className={cn(
                          "text-brand-primary flex-shrink-0",
                          isMobile ? "h-5 w-5" : "h-6 w-6"
                        )} />
                      </div>
                      <div>
                        <h3 className={cn(
                          "font-medium text-gray-900 group-hover:text-brand-primary-dark transition-colors",
                          isMobile ? "text-sm" : "text-base"
                        )}>
                          Friske kvalitetsvarer
                        </h3>
                        <p className={cn(
                          "text-gray-600 mt-1",
                          isMobile ? "text-xs" : "text-sm"
                        )}>
                          Vi håndplukker de bedste råvarer til din virksomhed med fokus på kvalitet og friskhed.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 group">
                      <div className={cn(
                        "mt-0.5 bg-brand-gray-100 rounded-lg group-hover:bg-brand-gray-200 transition-colors",
                        isMobile ? "p-1.5" : "p-2"
                      )}>
                        <CheckCircle className={cn(
                          "text-brand-primary flex-shrink-0",
                          isMobile ? "h-5 w-5" : "h-6 w-6"
                        )} />
                      </div>
                      <div>
                        <h3 className={cn(
                          "font-medium text-gray-900 group-hover:text-brand-primary-dark transition-colors",
                          isMobile ? "text-sm" : "text-base"
                        )}>
                          Hurtig og pålidelig levering
                        </h3>
                        <p className={cn(
                          "text-gray-600 mt-1",
                          isMobile ? "text-xs" : "text-sm"
                        )}>
                          Bestil nemt online og få leveret direkte til din virksomheds adresse.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className={cn("text-center", isMobile ? "mt-6" : "mt-8")}>
                  <Link to="/about">
                    <Button 
                      variant="outline" 
                      className="btn-brand-outline"
                    >
                      Læs mere om os <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Products with mobile optimization */}
        <section className="py-12 md:py-16 bg-gray-50">
          <div className="page-container">
            <div className={cn("text-center", isMobile ? "mb-8" : "mb-12")}>
              <h2 className={cn(
                "font-bold text-gray-900 mb-4 relative inline-block",
                isMobile ? "text-2xl" : "text-3xl md:text-4xl"
              )}>
                Udvalgte produkter
                <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 h-1 w-16 bg-brand-primary rounded-full"></div>
              </h2>
              <p className={cn(
                "text-gray-600 max-w-2xl mx-auto",
                isMobile ? "text-sm px-4" : "text-base"
              )}>
                Se et udvalg af vores mest populære produkter til din virksomhed.
              </p>
            </div>
            <div className={cn(
              "grid gap-6",
              isMobile 
                ? "grid-cols-2" 
                : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
            )}>
              {featuredProducts.map((product, index) => (
                <div key={product.id}>
                  <ProductCard {...product} />
                </div>
              ))}
            </div>
            <div className={cn("text-center flex justify-center", isMobile ? "mt-8" : "mt-12")}>
              <Link to="/products">
                <Button className={cn(
                  "btn-brand-hero shadow-md flex items-center transition-all duration-200 active:scale-95",
                  isMobile ? "w-full py-3 px-6" : "px-8 py-6 text-lg"
                )}>
                  <span>Se alle produkter</span>
                  <ArrowRight className={cn("ml-2", isMobile ? "h-4 w-4" : "h-5 w-5")} />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Section with mobile optimization */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img 
              src="https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&q=80&w=2000" 
              alt="Friske grøntsager baggrund" 
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {/* Enhanced dark overlay for better text readability */}
            <div className="absolute inset-0 bg-black/60"></div>
            <div className="absolute inset-0 bg-brand-primary-dark/70"></div>
          </div>
          <div className={cn(
            "hero-container relative z-10",
            isMobile ? "py-12" : "py-20"
          )}>
            <div className="content-width text-center">
              <h2 className={cn(
                "font-bold text-white mb-6 drop-shadow-lg",
                isMobile ? "text-2xl" : "text-3xl md:text-4xl"
              )}>
                Klar til at blive kunde?
              </h2>
              <p className={cn(
                "text-white/95 max-w-2xl mx-auto mb-8 drop-shadow-md",
                isMobile ? "text-sm px-4" : "text-lg md:text-xl mb-10"
              )}>
                Opret en B2B-konto og få adgang til vores fulde sortiment, kundespecifikke priser og nemme bestillingsmuligheder.
              </p>
              <div className={cn(
                "flex gap-3 justify-center",
                isMobile ? "flex-col space-y-3" : "flex-col sm:flex-row gap-4"
              )}>
                <Link to="/apply">
                  <Button className={cn(
                    "btn-brand-primary shadow-lg",
                    isMobile ? "w-full py-3 px-6" : "text-lg py-6 px-8"
                  )}>
                    Ansøg adgang
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button 
                    variant="outline" 
                    className={cn(
                      "bg-white text-brand-primary hover:bg-brand-gray-100 hover:text-brand-primary-dark border-white shadow-lg transition-all duration-200 active:scale-95",
                      isMobile ? "w-full py-3 px-6" : "text-lg py-6 px-8"
                    )}
                  >
                    Kontakt os
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
