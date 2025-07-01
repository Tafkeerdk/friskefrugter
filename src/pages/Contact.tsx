import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Phone, MapPin, CheckCircle, ArrowRight, User } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { authService } from "@/lib/auth";

// Cache-busting: Force deployment with Multi Grønt branding - v2.0

const Contact = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    companyName: "",
    industry: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionTime] = useState(Date.now()); // For anti-bot verification
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, industry: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return; // Prevent double submission

    // Client-side validation
    if (formData.message.trim().length < 10) {
      toast({
        title: "Besked for kort",
        description: "Din besked skal være mindst 10 tegn lang.",
        variant: "destructive",
      });
      return;
    }

    // Validate required fields
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim() || 
        !formData.phone.trim() || !formData.companyName.trim() || !formData.industry || !formData.message.trim()) {
      toast({
        title: "Manglende information",
        description: "Udfyld venligst alle felter.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);

    try {
      console.log("📧 Submitting contact form:", {
        ...formData,
        message: formData.message.substring(0, 50) + '...'
      });

      const response = await authService.apiClient.post('/.netlify/functions/contact-create', {
        ...formData,
        submissionTime
      });

      const result = await response.json();

      if (result.success) {
        console.log("✅ Contact form submitted successfully:", result);
        
        // Navigate to success page with contact data
        navigate('/contact/success', {
          state: { contactData: formData }
        });
      } else {
        throw new Error(result.error || 'Ukendt fejl opstod');
      }
    } catch (error) {
      console.error("❌ Contact form submission failed:", error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Der opstod en fejl ved afsendelse af din besked. Prøv igen senere.';

      toast({
        title: "Fejl ved afsendelse",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow py-12">
        <div className="page-container">
          <div className="content-width">
            <div className="text-center mb-10">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Kontakt os</h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
                Har du spørgsmål om Multi Grønt eller vil du komme i kontakt med vores team? 
                Vi er klar til at hjælpe dig.
              </p>
              
              {/* Clear distinction between contact and apply */}
              <div className="bg-brand-gray-100 rounded-lg p-6 max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="text-center">
                    <Mail className="h-8 w-8 text-brand-primary mx-auto mb-3" />
                    <h3 className="font-semibold text-gray-900 mb-2">Kontakt vores team</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Stil spørgsmål, få hjælp eller kontakt os for generel information
                    </p>
                    <p className="text-xs text-gray-500">Brug formularen nedenfor</p>
                  </div>
                  <div className="text-center">
                    <User className="h-8 w-8 text-brand-primary mx-auto mb-3" />
                    <h3 className="font-semibold text-gray-900 mb-2">Ansøg om B2B-adgang</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Vil du blive kunde og få adgang til vores webshop?
                    </p>
                    <Link to="/apply">
                      <Button className="btn-brand-primary text-sm px-4 py-2">
                        Ansøg her <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>


              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1">
                  <Card className="h-full">
                    <CardHeader>
                      <CardTitle className="text-xl">Kontaktinfo</CardTitle>
                      <CardDescription>Vores kontaktoplysninger</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-start">
                        <MapPin className="h-5 w-5 text-brand-primary mt-0.5 mr-3" />
                        <div>
                          <h3 className="font-medium text-gray-900">Adresse</h3>
                          <p className="text-gray-600">Litauen Alle 13</p>
                          <p className="text-gray-600">2630 Taastrup</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <Phone className="h-5 w-5 text-brand-primary mt-0.5 mr-3" />
                        <div>
                          <h3 className="font-medium text-gray-900">Telefon</h3>
                          <p className="text-gray-600">+45 12 34 56 78</p>
                          <p className="text-gray-600 text-sm">Man-fre: 8:00-16:00</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <Mail className="h-5 w-5 text-brand-primary mt-0.5 mr-3" />
                        <div>
                          <h3 className="font-medium text-gray-900">Email</h3>
                          <p className="text-gray-600">info@multigront.dk</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="md:col-span-2">
                  <Card className="shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-xl">Send en besked</CardTitle>
                      <CardDescription>
                        Fortæl os om din virksomhed, og vi vil kontakte dig hurtigst muligt
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="firstName">Fornavn</Label>
                            <Input 
                              id="firstName" 
                              name="firstName" 
                              value={formData.firstName}
                              onChange={handleChange}
                              required 
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="lastName">Efternavn</Label>
                            <Input 
                              id="lastName" 
                              name="lastName" 
                              value={formData.lastName}
                              onChange={handleChange}
                              required 
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input 
                              id="email" 
                              name="email" 
                              type="email" 
                              value={formData.email}
                              onChange={handleChange}
                              required 
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="phone">Telefon</Label>
                            <Input 
                              id="phone" 
                              name="phone" 
                              type="tel" 
                              value={formData.phone}
                              onChange={handleChange}
                              required 
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="companyName">Virksomhedsnavn</Label>
                          <Input 
                            id="companyName" 
                            name="companyName" 
                            value={formData.companyName}
                            onChange={handleChange}
                            required 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="industry">Branche</Label>
                          <Select onValueChange={handleSelectChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Vælg din branche" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="restaurant">Restaurant</SelectItem>
                              <SelectItem value="cafe">Café</SelectItem>
                              <SelectItem value="hotel">Hotel</SelectItem>
                              <SelectItem value="catering">Catering</SelectItem>
                              <SelectItem value="retail">Detailhandel</SelectItem>
                              <SelectItem value="institution">Institution</SelectItem>
                              <SelectItem value="other">Andet</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="message">Besked</Label>
                          <Textarea 
                            id="message" 
                            name="message" 
                            placeholder="Fortæl os om dine behov og hvordan vi kan hjælpe dig (minimum 10 tegn)"
                            className={`min-h-[120px] ${
                              formData.message.length > 0 && formData.message.length < 10 
                                ? 'border-red-500 focus:border-red-500' 
                                : formData.message.length >= 10 
                                ? 'border-green-500 focus:border-green-500' 
                                : ''
                            }`}
                            value={formData.message}
                            onChange={handleChange}
                            required 
                          />
                          <div className="flex justify-between items-center text-sm">
                            <span className={`${
                              formData.message.length < 10 
                                ? 'text-red-500' 
                                : 'text-green-600'
                            }`}>
                              {formData.message.length < 10 
                                ? `Mindst ${10 - formData.message.length} tegn mere` 
                                : '✓ Besked er lang nok'
                              }
                            </span>
                            <span className="text-gray-500">
                              {formData.message.length}/2000 tegn
                            </span>
                          </div>
                        </div>
                        <Button 
                          type="submit" 
                          className="w-full md:w-auto btn-brand-primary" 
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Sender...
                            </>
                          ) : (
                            'Send besked'
                          )}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </div>
              </div>

            {/* Google Maps Section - Full Width */}
            <div className="mt-16">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">Find os her</h2>
                <p className="text-gray-600">Besøg os på vores hovedkontor i Taastrup</p>
              </div>
              
              <Card className="shadow-lg overflow-hidden">
                <CardContent className="p-0">
                  <div className="w-full h-96">
                    <iframe
                      src="https://www.google.com/maps/embed/v1/place?key=AIzaSyCRbpCfIVaGS2crcItlLIuwRMn7fcjFZ_E&q=Litauen+Alle+13,+2630+Taastrup,+Denmark&zoom=16&maptype=roadmap"
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen={true}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Multi Grønt Location - Litauen Alle 13, 2630 Taastrup"
                    ></iframe>
                  </div>
                  <div className="p-6 bg-brand-gray-50 border-t">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Multi Grønt A/S</h3>
                        <p className="text-gray-600">Litauen Alle 13, 2630 Taastrup</p>
                      </div>
                      <a 
                        href="https://www.google.com/maps/dir/?api=1&destination=Litauen+Alle+13,+2630+Taastrup,+Denmark"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-brand-primary text-white px-6 py-3 rounded-lg hover:bg-brand-primary-hover transition-colors font-medium"
                      >
                        <MapPin className="h-5 w-5" />
                        Se rute i Google Maps
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
              </div>

            {/* B2B Info */}
            <div className="mt-12 bg-brand-gray-100 rounded-lg p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">Bliv B2B-kunde hos Multi Grønt</h2>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  Vi leverer friske frugt, grønt og mejeriprodukter til virksomheder i hele landet
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="text-brand-primary mb-4">
                    <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Kvalitet og friskhed</h3>
                  <p className="text-gray-600 mb-4">Vi samarbejder med lokale producenter for at sikre dig de bedste og friskeste råvarer.</p>
                  <div className="flex items-center text-brand-primary text-sm">
                    <span>Læs mere</span>
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="text-brand-primary mb-4">
                    <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Nem bestilling</h3>
                  <p className="text-gray-600 mb-4">Bestil nemt og hurtigt gennem vores webshop. Lagerstatus opdateres i realtid.</p>
                  <div className="flex items-center text-brand-primary text-sm">
                    <span>Læs mere</span>
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="text-brand-primary mb-4">
                    <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Fakturabetaling</h3>
                  <p className="text-gray-600 mb-4">Betal nemt via faktura. Vi tilbyder integration med din virksomheds økonomisystem.</p>
                  <div className="flex items-center text-brand-primary text-sm">
                    <span>Læs mere</span>
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </div>
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

export default Contact;
