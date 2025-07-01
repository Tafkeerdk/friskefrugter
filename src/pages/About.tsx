import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Leaf, Truck, Clock, Shield, ChevronRight, Users, Star, Award, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function About() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        {/* Hero Section - FULL WIDTH */}
        <section className="relative full-width-section">
          <div className="h-[400px] md:h-[500px] bg-cover bg-center relative overflow-hidden">
            <img 
              src="https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?auto=format&fit=crop&w=2000&q=80" 
              alt="Fresh organic vegetables for wholesale" 
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/30 z-10" />
            <div className="absolute inset-0 page-container h-full flex items-center z-20">
              <div className="content-width">
                <div className="max-w-2xl">
                  <h1 className="text-3xl md:text-5xl font-bold text-white mb-6">
                    Din pålidelige partner i friske råvarer
                  </h1>
                  <p className="text-lg md:text-xl text-white/90 mb-8 leading-relaxed">
                    Multi Grønt leverer friske grøntsager og frugter til professionelle køkkener, restauranter og cateringvirksomheder i hele Danmark.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Link to="/contact">
                      <Button className="btn-brand-hero">
                        Kontakt os <ChevronRight className="ml-2 h-5 w-5" />
                      </Button>
                    </Link>
                    <Link to="/apply">
                      <Button variant="outline" className="bg-white text-brand-primary hover:bg-brand-gray-100 hover:text-brand-primary-dark border-white">
                        Bliv kunde
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Company Overview - CONTAINED WIDTH */}
        <section className="py-16">
          <div className="page-container">
            <div className="content-width">
              <div className="max-w-3xl mx-auto text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-brand-primary-dark mb-6">
                  Om Multi Grønt
                </h2>
                <p className="text-lg text-brand-gray-600 leading-relaxed">
                  Vi er en moderne grossistvirksomhed, der specialiserer sig i levering af friske, 
                  høj kvalitets grøntsager og frugter til professionelle køkkener. Med års erfaring 
                  og et stærkt fokus på kvalitet og service, er vi din pålidelige partner i hverdagen.
                </p>
              </div>

              {/* Key Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                <div className="text-center bg-brand-gray-50 rounded-xl p-8">
                  <div className="text-4xl font-bold text-brand-primary mb-2">500+</div>
                  <div className="text-brand-gray-600">Kunder i Danmark</div>
                </div>
                <div className="text-center bg-brand-gray-50 rounded-xl p-8">
                  <div className="text-4xl font-bold text-brand-primary mb-2">98%</div>
                  <div className="text-brand-gray-600">Leveringspræcision</div>
                </div>
                <div className="text-center bg-brand-gray-50 rounded-xl p-8">
                  <div className="text-4xl font-bold text-brand-primary mb-2">24/7</div>
                  <div className="text-brand-gray-600">Kundeservice</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Our Values - CONTAINED WIDTH */}
        <section className="py-16 bg-white">
          <div className="page-container">
            <div className="content-width">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-brand-primary-dark mb-4">
                  Vores værdier
                </h2>
                <p className="text-lg text-brand-gray-600 max-w-2xl mx-auto">
                  Disse grundlæggende værdier driver vores arbejde og sikrer den bedste service til vores kunder.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <Card className="card-brand border-brand-gray-200 hover:shadow-lg transition-all duration-300">
                  <CardHeader className="text-center">
                    <div className="mx-auto mb-4 p-3 bg-brand-primary/10 rounded-full w-fit">
                      <Leaf className="h-8 w-8 text-brand-primary" />
                    </div>
                    <CardTitle className="text-xl text-brand-gray-900">Friskhed</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-brand-gray-600">
                      Vi leverer kun de friskeste råvarer direkte fra producenter til din virksomhed.
                    </p>
                  </CardContent>
                </Card>

                <Card className="card-brand border-brand-gray-200 hover:shadow-lg transition-all duration-300">
                  <CardHeader className="text-center">
                    <div className="mx-auto mb-4 p-3 bg-brand-primary/10 rounded-full w-fit">
                      <Truck className="h-8 w-8 text-brand-primary" />
                    </div>
                    <CardTitle className="text-xl text-brand-gray-900">Hurtig levering</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-brand-gray-600">
                      Pålidelig levering til hele Danmark med fokus på hastighed og præcision.
                    </p>
                  </CardContent>
                </Card>

                <Card className="card-brand border-brand-gray-200 hover:shadow-lg transition-all duration-300">
                  <CardHeader className="text-center">
                    <div className="mx-auto mb-4 p-3 bg-brand-primary/10 rounded-full w-fit">
                      <Shield className="h-8 w-8 text-brand-primary" />
                    </div>
                    <CardTitle className="text-xl text-brand-gray-900">Kvalitet</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-brand-gray-600">
                      Høj kvalitet og fuld sporbarhed i alle vores produkter og processer.
                    </p>
                  </CardContent>
                </Card>

                <Card className="card-brand border-brand-gray-200 hover:shadow-lg transition-all duration-300">
                  <CardHeader className="text-center">
                    <div className="mx-auto mb-4 p-3 bg-brand-primary/10 rounded-full w-fit">
                      <Users className="h-8 w-8 text-brand-primary" />
                    </div>
                    <CardTitle className="text-xl text-brand-gray-900">Samarbejde</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-brand-gray-600">
                      Vi bygger langvarige partnerskaber baseret på tillid og gensidig respekt.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Our Mission - CONTAINED WIDTH */}
        <section className="py-16 bg-brand-gray-50">
          <div className="page-container">
            <div className="content-width">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-3xl font-bold text-brand-primary-dark mb-6">
                    Vores mission
                  </h2>
                  <div className="space-y-6">
                    <p className="text-lg text-brand-gray-600 leading-relaxed">
                      Hos Multi Grønt arbejder vi for at revolutionere måden professionelle køkkener 
                      får deres råvarer på. Vi kombinerer traditionel grossist-ekspertise med moderne 
                      teknologi for at sikre den bedste kvalitet og service.
                    </p>
                    <p className="text-lg text-brand-gray-600 leading-relaxed">
                      Vores mål er at være den mest pålidelige partner for restauranter, hoteller, 
                      catering-virksomheder og andre professionelle køkkener i Danmark.
                    </p>
                    <div className="flex items-center gap-3 pt-4">
                      <Target className="h-6 w-6 text-brand-primary" />
                      <span className="text-brand-primary font-semibold">
                        At levere kvalitet, troværdighed og service hver dag
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <img 
                    src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=800&q=80" 
                    alt="Fresh vegetables and fruits for professional kitchens" 
                    className="rounded-xl shadow-lg w-full h-auto"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose Us - CONTAINED WIDTH */}
        <section className="py-16">
          <div className="page-container">
            <div className="content-width">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-brand-primary-dark mb-4">
                  Hvorfor vælge Multi Grønt?
                </h2>
                <p className="text-lg text-brand-gray-600 max-w-2xl mx-auto">
                  Vi tilbyder mere end bare friske råvarer - vi tilbyder et komplet partnerskab.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <Star className="h-6 w-6 text-brand-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-brand-gray-900 mb-2">
                        Specialiseret B2B-service
                      </h3>
                      <p className="text-brand-gray-600">
                        Vi forstår professionelle køkkeneres unikke behov og tilbyder skræddersyede løsninger.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <Clock className="h-6 w-6 text-brand-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-brand-gray-900 mb-2">
                        Fleksible leveringsmuligheder
                      </h3>
                      <p className="text-brand-gray-600">
                        Fra daglige leveringer til planlagte leverancer - vi tilpasser os dit behov.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <Award className="h-6 w-6 text-brand-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-brand-gray-900 mb-2">
                        Konkurrencedygtige priser
                      </h3>
                      <p className="text-brand-gray-600">
                        Få adgang til grossistpriser og specialtilbud kun for vores B2B-kunder.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <Users className="h-6 w-6 text-brand-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-brand-gray-900 mb-2">
                        Dedikeret kundeservice
                      </h3>
                      <p className="text-brand-gray-600">
                        Vores erfarne team er altid klar til at hjælpe med råd og vejledning.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <Shield className="h-6 w-6 text-brand-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-brand-gray-900 mb-2">
                        Kvalitetssikring
                      </h3>
                      <p className="text-brand-gray-600">
                        Alle produkter gennemgår streng kvalitetskontrol før levering.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <Truck className="h-6 w-6 text-brand-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-brand-gray-900 mb-2">
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

        {/* Call to Action - CONTAINED WIDTH */}
        <section className="py-16 bg-brand-primary">
          <div className="page-container">
            <div className="content-width">
              <div className="text-center text-white">
                <h2 className="text-3xl font-bold mb-6">
                  Klar til at blive en del af Multi Grønt familien?
                </h2>
                <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
                  Få adgang til vores B2B-webshop og oplev forskellen med kvalitetsråvarer 
                  leveret direkte til din virksomhed.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link to="/apply">
                    <Button className="bg-white text-brand-primary hover:bg-brand-gray-100 hover:text-brand-primary-dark px-8 py-3">
                      Ansøg om adgang
                    </Button>
                  </Link>
                  <Link to="/contact">
                    <Button variant="outline" className="border-white text-white hover:bg-white hover:text-brand-primary px-8 py-3">
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
