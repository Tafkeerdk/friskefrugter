import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, ArrowLeft, Mail, Clock, Phone } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const ContactSuccess = () => {
  const location = useLocation();
  const contactData = location.state?.contactData;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow py-12">
        <div className="page-container">
          <div className="content-width">
            <Card className="shadow-lg border-0 max-w-2xl mx-auto">
              <CardContent className="pt-8 pb-8">
                <div className="text-center">
                  <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-brand-primary/10 mb-6">
                    <CheckCircle className="h-10 w-10 text-brand-primary" />
                  </div>
                  
                  <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    Tak for din henvendelse!
                  </h1>
                  
                  <p className="text-lg text-gray-600 mb-6 max-w-md mx-auto">
                    Vi har modtaget din besked og vil kontakte dig hurtigst muligt.
                  </p>

                  {contactData && (
                    <div className="bg-brand-gray-50 rounded-lg p-6 mb-6 text-left">
                      <h3 className="font-semibold text-gray-900 mb-3">Dine oplysninger:</h3>
                      <div className="space-y-2 text-sm">
                        <p><span className="font-medium">Navn:</span> {contactData.firstName} {contactData.lastName}</p>
                        <p><span className="font-medium">Virksomhed:</span> {contactData.companyName}</p>
                        <p><span className="font-medium">Email:</span> {contactData.email}</p>
                        <p><span className="font-medium">Telefon:</span> {contactData.phone}</p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="text-center p-4">
                      <Mail className="h-6 w-6 text-brand-primary mx-auto mb-2" />
                      <h4 className="font-medium text-gray-900 mb-1">Bekræftelse sendt</h4>
                      <p className="text-sm text-gray-600">Du vil modtage en bekræftelse på email</p>
                    </div>
                    
                    <div className="text-center p-4">
                      <Clock className="h-6 w-6 text-brand-primary mx-auto mb-2" />
                      <h4 className="font-medium text-gray-900 mb-1">Hurtig respons</h4>
                      <p className="text-sm text-gray-600">Vi svarer inden for 24 timer</p>
                    </div>
                    
                    <div className="text-center p-4">
                      <Phone className="h-6 w-6 text-brand-primary mx-auto mb-2" />
                      <h4 className="font-medium text-gray-900 mb-1">Direkte kontakt</h4>
                      <p className="text-sm text-gray-600">Ring til os på +45 12 34 56 78</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link to="/contact">
                      <Button variant="outline" className="w-full sm:w-auto">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Send en ny besked
                      </Button>
                    </Link>
                    
                    <Link to="/">
                      <Button className="btn-brand-primary w-full sm:w-auto">
                        Tilbage til forsiden
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Additional information section */}
            <div className="mt-12 bg-brand-gray-100 rounded-lg p-8 max-w-4xl mx-auto">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">Hvad sker der nu?</h2>
                <p className="text-gray-600">Sådan håndterer vi din henvendelse</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="bg-brand-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                    <span className="text-brand-primary font-bold text-lg">1</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Modtagelse</h3>
                  <p className="text-sm text-gray-600">
                    Din besked er modtaget og videresendt til vores team
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="bg-brand-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                    <span className="text-brand-primary font-bold text-lg">2</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Behandling</h3>
                  <p className="text-sm text-gray-600">
                    Vi gennemgår din henvendelse og forbereder et svar
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="bg-brand-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                    <span className="text-brand-primary font-bold text-lg">3</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Opfølgning</h3>
                  <p className="text-sm text-gray-600">
                    Vi kontakter dig på din foretrukne kontaktmetode
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ContactSuccess; 