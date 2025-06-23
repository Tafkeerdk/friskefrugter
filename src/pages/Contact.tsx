
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Phone, MapPin, CheckCircle, ArrowRight } from "lucide-react";
import { useState } from "react";

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
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, industry: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    setIsSubmitted(true);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Kontakt os</h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Har du spørgsmål eller ønsker du at blive kunde? Vi er klar til at hjælpe dig.
              </p>
            </div>

            {isSubmitted ? (
              <Card className="shadow-md border-0">
                <CardContent className="pt-6 pb-8">
                  <div className="text-center">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-4">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Tak for din henvendelse!</h2>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                      Vi har modtaget din besked og vil kontakte dig hurtigst muligt på den angivne email eller telefonnummer.
                    </p>
                    <Button 
                      onClick={() => setIsSubmitted(false)} 
                      variant="outline"
                      className="mx-auto"
                    >
                      Send en ny henvendelse
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1">
                  <Card className="h-full">
                    <CardHeader>
                      <CardTitle className="text-xl">Kontaktinfo</CardTitle>
                      <CardDescription>Vores kontaktoplysninger</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-start">
                        <MapPin className="h-5 w-5 text-green-600 mt-0.5 mr-3" />
                        <div>
                          <h3 className="font-medium text-gray-900">Adresse</h3>
                          <p className="text-gray-600">Grøntvej 123</p>
                          <p className="text-gray-600">2300 København</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <Phone className="h-5 w-5 text-green-600 mt-0.5 mr-3" />
                        <div>
                          <h3 className="font-medium text-gray-900">Telefon</h3>
                          <p className="text-gray-600">+45 12 34 56 78</p>
                          <p className="text-gray-600 text-sm">Man-fre: 8:00-16:00</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <Mail className="h-5 w-5 text-green-600 mt-0.5 mr-3" />
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
                            placeholder="Fortæl os om dine behov og hvordan vi kan hjælpe dig"
                            className="min-h-[120px]"
                            value={formData.message}
                            onChange={handleChange}
                            required 
                          />
                        </div>
                        <Button type="submit" className="w-full md:w-auto">
                          Send besked
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* B2B Info */}
            <div className="mt-12 bg-green-50 rounded-lg p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">Bliv B2B-kunde hos Multi Grønt</h2>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  Vi leverer friske frugt, grønt og mejeriprodukter til virksomheder i hele landet
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="text-green-600 mb-4">
                    <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Kvalitet og friskhed</h3>
                  <p className="text-gray-600 mb-4">Vi samarbejder med lokale producenter for at sikre dig de bedste og friskeste råvarer.</p>
                  <div className="flex items-center text-green-600 text-sm">
                    <span>Læs mere</span>
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="text-green-600 mb-4">
                    <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Nem bestilling</h3>
                  <p className="text-gray-600 mb-4">Bestil nemt og hurtigt gennem vores webshop. Lagerstatus opdateres i realtid.</p>
                  <div className="flex items-center text-green-600 text-sm">
                    <span>Læs mere</span>
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="text-green-600 mb-4">
                    <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Fakturabetaling</h3>
                  <p className="text-gray-600 mb-4">Betal nemt via faktura. Vi tilbyder integration med din virksomheds økonomisystem.</p>
                  <div className="flex items-center text-green-600 text-sm">
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
