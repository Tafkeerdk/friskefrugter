import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Leaf, Truck, Clock, Shield, ChevronRight, Users, Star, Award, Target, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

export default function About() {
  const [isVisible, setIsVisible] = useState(false);
  const [counters, setCounters] = useState({ customers: 0, precision: 0, support: 0 });

  useEffect(() => {
    setIsVisible(true);
    
    // Animated counters
    const timer = setTimeout(() => {
      const animateCounter = (target: number, setter: (value: number) => void) => {
        let current = 0;
        const increment = target / 100;
        const timer = setInterval(() => {
          current += increment;
          if (current >= target) {
            setter(target);
            clearInterval(timer);
          } else {
            setter(Math.floor(current));
          }
        }, 20);
      };

      animateCounter(500, (value) => setCounters(prev => ({ ...prev, customers: value })));
      animateCounter(98, (value) => setCounters(prev => ({ ...prev, precision: value })));
      animateCounter(24, (value) => setCounters(prev => ({ ...prev, support: value })));
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        {/* Hero Section - FULL WIDTH with Enhanced Animations */}
        <section className="relative full-width-section overflow-hidden">
          <div className="h-[400px] md:h-[500px] bg-cover bg-center relative">
            <img 
              src="https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?auto=format&fit=crop&w=2000&q=80" 
              alt="Fresh organic vegetables for wholesale" 
              className="absolute inset-0 w-full h-full object-cover transform hover:scale-105 transition-transform duration-1000"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/40 z-10" />
            <div className="absolute inset-0 page-container h-full flex items-center z-20">
              <div className="content-width">
                <div className={`max-w-2xl transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
                  <h1 className="text-3xl md:text-5xl font-bold text-white mb-6 animate-pulse-subtle">
                    Din pålidelige partner i friske råvarer
              </h1>
                  <p className={`text-lg md:text-xl text-white/90 mb-8 leading-relaxed transform transition-all duration-1000 delay-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                    Multi Grønt leverer friske grøntsager og frugter til professionelle køkkener, restauranter og cateringvirksomheder i hele Danmark.
              </p>
                  <div className={`flex flex-col sm:flex-row gap-4 transform transition-all duration-1000 delay-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                <Link to="/contact">
                      <Button className="btn-brand-hero transform hover:scale-105 hover:shadow-xl transition-all duration-300 animate-bounce-subtle">
                        Kontakt os <ChevronRight className="ml-2 h-5 w-5 animate-pulse" />
                      </Button>
                    </Link>
                    <Link to="/apply">
                      <Button variant="outline" className="bg-white text-brand-primary hover:bg-brand-primary hover:text-white border-white transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
                        Bliv kunde
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
          </div>
        </section>

        {/* Company Overview - CONTAINED WIDTH with Stagger Animations */}
        <section className="py-16 overflow-hidden">
          <div className="page-container">
          <div className="content-width">
              <div className={`max-w-3xl mx-auto text-center mb-16 transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
                <h2 className="text-3xl md:text-4xl font-bold text-brand-primary-dark mb-6 relative">
                  Om Multi Grønt
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 h-1 w-20 bg-brand-primary rounded-full animate-pulse"></div>
                </h2>
                <p className="text-lg text-brand-gray-600 leading-relaxed animate-fade-in-up delay-300">
                  Vi er en moderne grossistvirksomhed, der specialiserer sig i levering af friske, 
                  høj kvalitets grøntsager og frugter til professionelle køkkener. Med års erfaring 
                  og et stærkt fokus på kvalitet og service, er vi din pålidelige partner i hverdagen.
                </p>
              </div>

              {/* Key Stats with Animated Counters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                <div className={`text-center bg-brand-gray-50 rounded-xl p-8 transform hover:scale-105 hover:shadow-lg transition-all duration-500 hover:-translate-y-2 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
                  <div className="text-4xl font-bold text-brand-primary mb-2 animate-pulse-subtle">
                    {counters.customers}+
                  </div>
                  <div className="text-brand-gray-600">Kunder i Danmark</div>
                </div>
                <div className={`text-center bg-brand-gray-50 rounded-xl p-8 transform hover:scale-105 hover:shadow-lg transition-all duration-500 hover:-translate-y-2 delay-200 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
                  <div className="text-4xl font-bold text-brand-primary mb-2 animate-pulse-subtle">
                    {counters.precision}%
                  </div>
                  <div className="text-brand-gray-600">Leveringspræcision</div>
                </div>
                <div className={`text-center bg-brand-gray-50 rounded-xl p-8 transform hover:scale-105 hover:shadow-lg transition-all duration-500 hover:-translate-y-2 delay-400 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
                  <div className="text-4xl font-bold text-brand-primary mb-2 animate-pulse-subtle">
                    {counters.support}/7
            </div>
                  <div className="text-brand-gray-600">Kundeservice</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Our Values - CONTAINED WIDTH with Card Animations */}
        <section className="py-16 bg-white overflow-hidden">
          <div className="page-container">
            <div className="content-width">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-brand-primary-dark mb-4 animate-fade-in-up">
                  Vores værdier
                </h2>
                <p className="text-lg text-brand-gray-600 max-w-2xl mx-auto animate-fade-in-up delay-200">
                  Disse grundlæggende værdier driver vores arbejde og sikrer den bedste service til vores kunder.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <Card className="card-brand border-brand-gray-200 hover:shadow-xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-4 group animate-fade-in-up delay-100">
                  <CardHeader className="text-center">
                    <div className="mx-auto mb-4 p-3 bg-brand-primary/10 rounded-full w-fit group-hover:bg-brand-primary/20 transition-all duration-300 group-hover:rotate-12">
                      <Leaf className="h-8 w-8 text-brand-primary group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <CardTitle className="text-xl text-brand-gray-900 group-hover:text-brand-primary transition-colors duration-300">Friskhed</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-brand-gray-600 group-hover:text-brand-gray-700 transition-colors duration-300">
                      Vi leverer kun de friskeste råvarer direkte fra producenter til din virksomhed.
                    </p>
                  </CardContent>
                </Card>

                <Card className="card-brand border-brand-gray-200 hover:shadow-xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-4 group animate-fade-in-up delay-200">
                  <CardHeader className="text-center">
                    <div className="mx-auto mb-4 p-3 bg-brand-primary/10 rounded-full w-fit group-hover:bg-brand-primary/20 transition-all duration-300 group-hover:rotate-12">
                      <Truck className="h-8 w-8 text-brand-primary group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <CardTitle className="text-xl text-brand-gray-900 group-hover:text-brand-primary transition-colors duration-300">Hurtig levering</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-brand-gray-600 group-hover:text-brand-gray-700 transition-colors duration-300">
                      Pålidelig levering til hele Danmark med fokus på hastighed og præcision.
                    </p>
                  </CardContent>
                </Card>

                <Card className="card-brand border-brand-gray-200 hover:shadow-xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-4 group animate-fade-in-up delay-300">
                  <CardHeader className="text-center">
                    <div className="mx-auto mb-4 p-3 bg-brand-primary/10 rounded-full w-fit group-hover:bg-brand-primary/20 transition-all duration-300 group-hover:rotate-12">
                      <Shield className="h-8 w-8 text-brand-primary group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <CardTitle className="text-xl text-brand-gray-900 group-hover:text-brand-primary transition-colors duration-300">Kvalitet</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-brand-gray-600 group-hover:text-brand-gray-700 transition-colors duration-300">
                      Høj kvalitet og fuld sporbarhed i alle vores produkter og processer.
                    </p>
                  </CardContent>
                </Card>

                <Card className="card-brand border-brand-gray-200 hover:shadow-xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-4 group animate-fade-in-up delay-400">
                  <CardHeader className="text-center">
                    <div className="mx-auto mb-4 p-3 bg-brand-primary/10 rounded-full w-fit group-hover:bg-brand-primary/20 transition-all duration-300 group-hover:rotate-12">
                      <Users className="h-8 w-8 text-brand-primary group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <CardTitle className="text-xl text-brand-gray-900 group-hover:text-brand-primary transition-colors duration-300">Samarbejde</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-brand-gray-600 group-hover:text-brand-gray-700 transition-colors duration-300">
                      Vi bygger langvarige partnerskaber baseret på tillid og gensidig respekt.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Our Mission - CONTAINED WIDTH with Parallax Effect */}
        <section className="py-16 bg-brand-gray-50 overflow-hidden">
          <div className="page-container">
            <div className="content-width">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="animate-fade-in-left">
                  <h2 className="text-3xl font-bold text-brand-primary-dark mb-6">
                    Vores mission
                  </h2>
                  <div className="space-y-6">
                    <p className="text-lg text-brand-gray-600 leading-relaxed animate-fade-in-up delay-100">
                      Hos Multi Grønt arbejder vi for at revolutionere måden professionelle køkkener 
                      får deres råvarer på. Vi kombinerer traditionel grossist-ekspertise med moderne 
                      teknologi for at sikre den bedste kvalitet og service.
                    </p>
                    <p className="text-lg text-brand-gray-600 leading-relaxed animate-fade-in-up delay-200">
                      Vores mål er at være den mest pålidelige partner for restauranter, hoteller, 
                      catering-virksomheder og andre professionelle køkkener i Danmark.
                    </p>
                    <div className="flex items-center gap-3 pt-4 animate-fade-in-up delay-300">
                      <Target className="h-6 w-6 text-brand-primary animate-pulse" />
                      <span className="text-brand-primary font-semibold">
                        At levere kvalitet, troværdighed og service hver dag
                      </span>
                    </div>
                  </div>
                </div>
                <div className="animate-fade-in-right">
                  <img 
                    src="https://images.unsplash.com/photo-1506976785307-8732e854ad03?auto=format&fit=crop&w=800&q=80" 
                    alt="Fresh vegetables in delivery box for professional kitchens" 
                    className="rounded-xl shadow-lg w-full h-auto transform hover:scale-105 transition-transform duration-700 hover:shadow-2xl"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose Us - CONTAINED WIDTH with Stagger Animations */}
        <section className="py-16 overflow-hidden">
          <div className="page-container">
            <div className="content-width">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-brand-primary-dark mb-4 animate-fade-in-up">
                  Hvorfor vælge Multi Grønt?
                </h2>
                <p className="text-lg text-brand-gray-600 max-w-2xl mx-auto animate-fade-in-up delay-200">
                  Vi tilbyder mere end bare friske råvarer - vi tilbyder et komplet partnerskab.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="flex gap-4 group hover:bg-brand-gray-50 p-4 rounded-lg transition-all duration-300 animate-fade-in-left delay-100">
                    <div className="flex-shrink-0">
                      <Star className="h-6 w-6 text-brand-primary group-hover:scale-125 transition-transform duration-300" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-brand-gray-900 mb-2 group-hover:text-brand-primary transition-colors duration-300">
                        Specialiseret B2B-service
                      </h3>
                      <p className="text-brand-gray-600">
                        Vi forstår professionelle køkkeneres unikke behov og tilbyder skræddersyede løsninger.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 group hover:bg-brand-gray-50 p-4 rounded-lg transition-all duration-300 animate-fade-in-left delay-200">
                    <div className="flex-shrink-0">
                      <Clock className="h-6 w-6 text-brand-primary group-hover:scale-125 transition-transform duration-300" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-brand-gray-900 mb-2 group-hover:text-brand-primary transition-colors duration-300">
                        Fleksible leveringsmuligheder
                      </h3>
                      <p className="text-brand-gray-600">
                        Fra daglige leveringer til planlagte leverancer - vi tilpasser os dit behov.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 group hover:bg-brand-gray-50 p-4 rounded-lg transition-all duration-300 animate-fade-in-left delay-300">
                    <div className="flex-shrink-0">
                      <Award className="h-6 w-6 text-brand-primary group-hover:scale-125 transition-transform duration-300" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-brand-gray-900 mb-2 group-hover:text-brand-primary transition-colors duration-300">
                        Konkurrencedygtige priser
                      </h3>
                      <p className="text-brand-gray-600">
                        Få adgang til grossistpriser og specialtilbud kun for vores B2B-kunder.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex gap-4 group hover:bg-brand-gray-50 p-4 rounded-lg transition-all duration-300 animate-fade-in-right delay-100">
                    <div className="flex-shrink-0">
                      <Users className="h-6 w-6 text-brand-primary group-hover:scale-125 transition-transform duration-300" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-brand-gray-900 mb-2 group-hover:text-brand-primary transition-colors duration-300">
                        Dedikeret kundeservice
                      </h3>
                      <p className="text-brand-gray-600">
                        Vores erfarne team er altid klar til at hjælpe med råd og vejledning.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 group hover:bg-brand-gray-50 p-4 rounded-lg transition-all duration-300 animate-fade-in-right delay-200">
                    <div className="flex-shrink-0">
                      <Shield className="h-6 w-6 text-brand-primary group-hover:scale-125 transition-transform duration-300" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-brand-gray-900 mb-2 group-hover:text-brand-primary transition-colors duration-300">
                        Kvalitetssikring
                      </h3>
                      <p className="text-brand-gray-600">
                        Alle produkter gennemgår streng kvalitetskontrol før levering.
                      </p>
                    </div>
              </div>

                  <div className="flex gap-4 group hover:bg-brand-gray-50 p-4 rounded-lg transition-all duration-300 animate-fade-in-right delay-300">
                    <div className="flex-shrink-0">
                      <Truck className="h-6 w-6 text-brand-primary group-hover:scale-125 transition-transform duration-300" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-brand-gray-900 mb-2 group-hover:text-brand-primary transition-colors duration-300">
                        Moderne logistik
                      </h3>
                      <p className="text-brand-gray-600">
                        Effektiv distribution med kølet transport for optimal friskhed.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Location Section - CONTAINED WIDTH with Google Maps */}
        <section className="py-16 bg-white overflow-hidden">
          <div className="page-container">
            <div className="content-width">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-brand-primary-dark mb-4 animate-fade-in-up">
                  Find os her
                </h2>
                <p className="text-lg text-brand-gray-600 max-w-2xl mx-auto animate-fade-in-up delay-200">
                  Besøg os på vores hovedkontor i Taastrup for personlig service og rådgivning.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                <div className="animate-fade-in-left mx-auto lg:mx-0 w-full max-w-md lg:max-w-none">
                  <div className="bg-brand-gray-50 rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
                    <h3 className="text-2xl font-bold text-brand-primary-dark mb-6">
                      Multi Grønt A/S
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <MapPin className="h-6 w-6 text-brand-primary mt-1 animate-pulse-subtle" />
                        <div>
                          <h4 className="font-semibold text-brand-gray-900 mb-1">Adresse</h4>
                          <p className="text-brand-gray-600 leading-relaxed">
                            Litauen Alle 13<br />
                            2630 Taastrup<br />
                            Danmark
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Clock className="h-6 w-6 text-brand-primary mt-1" />
                        <div>
                          <h4 className="font-semibold text-brand-gray-900 mb-1">Åbningstider</h4>
                          <p className="text-brand-gray-600 leading-relaxed">
                            Mandag - Fredag: 8:00 - 16:00<br />
                            Weekend: Efter aftale
                          </p>
                        </div>
                      </div>
                      <div className="pt-4">
                        <a 
                          href="https://www.google.com/maps/dir/?api=1&destination=Litauen+Alle+13,+2630+Taastrup,+Denmark"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 bg-brand-primary text-white px-6 py-3 rounded-lg hover:bg-brand-primary-hover transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold"
                        >
                          <MapPin className="h-5 w-5" />
                          Se rute i Google Maps
                        </a>
                      </div>
              </div>
            </div>
                </div>

                <div className="animate-fade-in-right">
                  <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-brand-gray-200 hover:shadow-xl transition-shadow duration-500">
                    <div className="w-full h-80 lg:h-96">
                      <iframe
                        src="https://www.google.com/maps/embed/v1/place?key=AIzaSyCRbpCfIVaGS2crcItlLIuwRMn7fcjFZ_E&q=Litauen+Alle+13,+2630+Taastrup,+Denmark&zoom=16&maptype=roadmap"
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        allowFullScreen={true}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title="Multi Grønt A/S - Litauen Alle 13, 2630 Taastrup"
                      ></iframe>
                    </div>
                    <div className="p-4 bg-brand-gray-50 border-t">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-brand-gray-600 font-medium">Multi Grønt A/S</span>
                        <span className="text-brand-gray-500">Litauen Alle 13, 2630 Taastrup</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action - CONTAINED WIDTH with Enhanced Animation */}
        <section className="py-16 bg-brand-primary overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-primary to-brand-primary-light animate-pulse-subtle"></div>
          <div className="page-container relative z-10">
            <div className="content-width">
              <div className="text-center text-white">
                <h2 className="text-3xl font-bold mb-6 animate-fade-in-up">
                  Klar til at blive en del af Multi Grønt familien?
                </h2>
                <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto animate-fade-in-up delay-200">
                  Få adgang til vores B2B-webshop og oplev forskellen med kvalitetsråvarer 
                  leveret direkte til din virksomhed.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up delay-400">
                  <Link to="/apply">
                    <Button className="bg-white text-brand-primary hover:bg-brand-gray-100 hover:text-brand-primary-dark px-8 py-3 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold">
                      Ansøg om adgang
                    </Button>
                  </Link>
                  <Link to="/contact">
                    <Button className="border-2 border-white bg-transparent text-white hover:bg-white hover:text-brand-primary px-8 py-3 transform hover:scale-105 transition-all duration-300 font-semibold">
                      Kontakt os
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />


    </div>
  );
}
