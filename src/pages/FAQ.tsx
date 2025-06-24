import React, { useState } from 'react';
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ChevronDown, ChevronUp, Smartphone, Download, Share, CheckCircle, AlertTriangle, HelpCircle, Globe, Lock, Mail, Key, Shield, Clock, RefreshCw, Star, Phone } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePWA } from "@/hooks/usePWA";
import { cn } from "@/lib/utils";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Link } from "react-router-dom";

interface FAQItem {
  id: string;
  question: string;
  answer: React.ReactNode;
  category: 'pwa' | 'general' | 'account' | 'orders' | 'technical';
  featured?: boolean;
}

const FAQ = () => {
  const isMobile = useIsMobile();
  const { platformInstructions, isIOSInstallable, needsManualInstall } = usePWA();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(['pwa-installation']));
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Handle both anchor links (e.g., #pwa-installation) and query parameters (e.g., ?section=pwa-installation)
  React.useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    const urlParams = new URLSearchParams(window.location.search);
    const section = urlParams.get('section');
    
    // Determine which section to expand
    const targetSection = section || hash;
    
    if (targetSection) {
      // Expand the item if it exists
      setExpandedItems(prev => new Set(prev).add(targetSection));
      
      // Set the category filter if it's a PWA installation request
      if (targetSection === 'pwa-installation') {
        setSelectedCategory('pwa');
      }
      
      // Scroll to the element after a brief delay to ensure it's rendered
      setTimeout(() => {
        const element = document.getElementById(targetSection);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 200);
    }
  }, []);

  const toggleItem = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const categories = [
    { id: 'all', name: 'Alle', icon: HelpCircle },
    { id: 'pwa', name: 'App Installation', icon: Smartphone },
    { id: 'account', name: 'Konto & Login', icon: CheckCircle },
    { id: 'orders', name: 'Bestillinger', icon: Download },
    { id: 'technical', name: 'Teknisk Support', icon: AlertTriangle },
  ];

  const renderIOSInstallationSteps = () => (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Smartphone className="h-5 w-5 text-blue-600" />
          <h4 className="font-semibold text-blue-800">iOS Safari Installation</h4>
        </div>
        <p className="text-sm text-blue-700 mb-3">
          Følg disse trin for at installere Multi Grønt som app på din iPhone eller iPad:
        </p>
      </div>

      {/* Step 1 */}
      <div className="bg-white border-2 border-brand-gray-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="bg-brand-primary text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0">
            1
          </div>
          <div className="flex-1">
            <h5 className="font-semibold text-gray-900 mb-2">Åbn Safari og gå til multigroent.dk</h5>
            <div className="bg-gray-50 rounded-lg p-3 mb-2">
              <p className="text-sm text-gray-700">📱 Sørg for at du bruger Safari browser (ikke Chrome eller Firefox)</p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">multigroent.dk</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Step 2 */}
      <div className="bg-white border-2 border-brand-gray-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="bg-brand-primary text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0">
            2
          </div>
          <div className="flex-1">
            <h5 className="font-semibold text-gray-900 mb-2">Tryk på Del-knappen</h5>
            <div className="bg-blue-50 rounded-lg p-4 mb-2">
              <div className="text-center">
                <div className="bg-blue-600 text-white rounded-lg p-3 inline-flex items-center gap-2 mb-2">
                  <Share className="h-5 w-5" />
                  <span className="text-sm font-medium">Del</span>
                </div>
                <p className="text-xs text-blue-700">Find del-knappen nederst på skærmen i Safari</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-700">💡 Del-knappen ser ud som en firkant med en pil der peger opad</p>
            </div>
          </div>
        </div>
      </div>

      {/* Step 3 */}
      <div className="bg-white border-2 border-brand-gray-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="bg-brand-primary text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0">
            3
          </div>
          <div className="flex-1">
            <h5 className="font-semibold text-gray-900 mb-2">Find "Føj til hjemmeskærm"</h5>
            <div className="bg-brand-gray-100 rounded-lg p-4 mb-2">
              <div className="text-center">
                <div className="bg-gray-100 rounded-lg p-3 mb-2">
                  <p className="text-sm font-medium text-gray-800">⬇ Scroll ned ⬇</p>
                </div>
                <div className="bg-brand-primary text-white rounded-lg p-3 inline-flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  <span className="text-sm font-medium">Føj til hjemmeskærm</span>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-700">📋 Du skal måske scrolle ned i menuen for at finde muligheden</p>
            </div>
          </div>
        </div>
      </div>

      {/* Step 4 */}
      <div className="bg-white border-2 border-brand-gray-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="bg-brand-primary text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0">
            4
          </div>
          <div className="flex-1">
            <h5 className="font-semibold text-gray-900 mb-2">Bekræft installationen</h5>
            <div className="bg-brand-gray-100 rounded-lg p-4 mb-2">
              <div className="text-center space-y-2">
                <div className="bg-white border-2 border-brand-gray-300 rounded-lg p-3">
                  <p className="text-sm font-semibold text-brand-primary-dark">Multi Grønt</p>
                  <p className="text-xs text-gray-600">Vil blive tilføjet til hjemmeskærmen</p>
                </div>
                <Button className="bg-brand-primary hover:bg-brand-primary-hover text-white text-sm">
                  Tilføj
                </Button>
              </div>
            </div>
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-sm text-blue-700">✅ Efter installation finder du Multi Grønt appen på din hjemmeskærm!</p>
            </div>
          </div>
        </div>
      </div>

      {/* Success Message */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-brand-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-6 w-6 text-brand-primary" />
          <div>
            <h4 className="font-semibold text-brand-primary-dark">Tillykke! 🎉</h4>
            <p className="text-sm text-brand-primary-dark">Multi Grønt er nu installeret som app og åbner uden browser-interface</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAndroidInstallationSteps = () => (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Smartphone className="h-5 w-5 text-blue-600" />
          <h4 className="font-semibold text-blue-800">Android Chrome Installation</h4>
        </div>
        <p className="text-sm text-blue-700 mb-3">
          Android Chrome kan automatisk foreslå installation:
        </p>
      </div>

      <div className="bg-white border-2 border-brand-gray-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="bg-brand-primary text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0">
            1
          </div>
          <div className="flex-1">
            <h5 className="font-semibold text-gray-900 mb-2">Automatisk prompt</h5>
            <div className="bg-blue-50 rounded-lg p-4 mb-2">
              <p className="text-sm text-blue-700">Chrome vil ofte automatisk vise en "Installér app" besked</p>
            </div>
            <div className="bg-brand-gray-100 rounded-lg p-3">
              <Button className="bg-brand-primary hover:bg-brand-primary-hover text-white text-sm">
                <Download className="h-4 w-4 mr-2" />
                Installér
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-2 border-brand-gray-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="bg-brand-primary text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0">
            2
          </div>
          <div className="flex-1">
            <h5 className="font-semibold text-gray-900 mb-2">Manuel installation</h5>
            <div className="bg-gray-50 rounded-lg p-3 mb-2">
              <p className="text-sm text-gray-700">Hvis der ikke kommer automatisk prompt:</p>
            </div>
            <ol className="space-y-1 text-sm text-gray-700">
              <li>• Tryk på menu-knappen (⋮) i Chrome</li>
              <li>• Vælg "Installér app" eller "Tilføj til hjemmeskærm"</li>
              <li>• Tryk "Installér" for at bekræfte</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );

  const faqItems: FAQItem[] = [
    {
      id: 'pwa-installation',
      question: '📱 Hvordan installerer jeg Multi Grønt som app?',
      category: 'pwa',
      featured: true,
      answer: (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Multi Grønt kan installeres som app! 🚀</h3>
            <p className="text-blue-800 text-sm">
              Få hurtigere adgang, offline funktionalitet og en app-lignende oplevelse ved at installere 
              Multi Grønt direkte på din enhed.
            </p>
          </div>

          {/* Platform Detection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={cn(
              "border-2 rounded-lg p-4",
              isIOSInstallable ? "border-brand-gray-300 bg-brand-gray-100" : "border-gray-200 bg-gray-50"
            )}>
              <div className="flex items-center gap-2 mb-2">
                <Smartphone className="h-5 w-5 text-blue-600" />
                <span className="font-medium">iOS (iPhone/iPad)</span>
                {isIOSInstallable && <CheckCircle className="h-4 w-4 text-brand-primary" />}
              </div>
              <p className="text-sm text-gray-700">Safari browser påkrævet</p>
            </div>
            
            <div className="border-2 border-gray-200 bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Smartphone className="h-5 w-5 text-brand-primary" />
                <span className="font-medium">Android</span>
              </div>
              <p className="text-sm text-gray-700">Chrome browser anbefalet</p>
            </div>
          </div>

          {/* iOS Instructions */}
          {isIOSInstallable && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                📱 iOS Installation Guide
                <span className="bg-brand-gray-100 text-brand-primary-dark text-xs px-2 py-1 rounded-full">Din enhed</span>
              </h3>
              {renderIOSInstallationSteps()}
            </div>
          )}

          {/* Android Instructions */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              🤖 Android Installation Guide
            </h3>
            {renderAndroidInstallationSteps()}
          </div>

          {/* Benefits */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-brand-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-brand-primary-dark mb-3">Fordele ved app-installation:</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-brand-primary" />
                <span className="text-sm text-brand-primary-dark">Hurtigere adgang</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-brand-primary" />
                <span className="text-sm text-brand-primary-dark">Offline funktionalitet</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-brand-primary" />
                <span className="text-sm text-brand-primary-dark">Ingen browser-interface</span>
              </div>
            </div>
          </div>

          {/* Troubleshooting */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h4 className="font-semibold text-orange-800 mb-2">Problemer med installation?</h4>
            <ul className="space-y-1 text-sm text-orange-700">
              <li>• Sørg for at du bruger Safari på iOS eller Chrome på Android</li>
              <li>• Check at du har den nyeste browser-version</li>
              <li>• Prøv at genindlæse siden hvis install-knappen ikke vises</li>
              <li>• Kontakt support hvis problemet fortsætter</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'password-reset-guide',
      question: '🔐 Hvordan nulstiller jeg mit password?',
      category: 'account',
      answer: (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Komplet guide til password nulstilling
            </h3>
            <p className="text-blue-800 text-sm">
              Følg denne detaljerede guide for at nulstille dit password sikkert og nemt.
            </p>
          </div>

          {/* Step 1: Request Reset */}
          <div className="bg-white border-2 border-brand-gray-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="bg-brand-primary text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0">
                1
              </div>
              <div className="flex-1">
                <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-brand-primary" />
                  Anmod om nulstilling
                </h5>
                <div className="space-y-3">
                  <div className="bg-brand-gray-100 rounded-lg p-3">
                    <p className="text-sm text-brand-primary-dark mb-2">
                      <strong>Gå til nulstillingssiden:</strong>
                    </p>
                    <ul className="text-sm text-brand-primary-dark space-y-1">
                      <li>• Gå til <strong>multigroent.dk/password-reset</strong></li>
                      <li>• Eller klik "Glemt password?" på login-siden</li>
                    </ul>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-sm text-blue-800 mb-2">
                      <strong>Indtast din email:</strong>
                    </p>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Brug den email du er registreret med</li>
                      <li>• Sørg for korrekt stavning</li>
                      <li>• Klik "Send nulstillingskode"</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: Check Email */}
          <div className="bg-white border-2 border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0">
                2
              </div>
              <div className="flex-1">
                <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-blue-600" />
                  Check din email
                </h5>
                <div className="space-y-3">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-800">Modtag 6-cifret kode</span>
                    </div>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>• Email ankommer normalt inden for 1-2 minutter</li>
                      <li>• Check spam/junk mappen hvis ikke modtaget</li>
                      <li>• Koden er gyldig i 15 minutter</li>
                    </ul>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-700">
                      <strong>Email eksempel:</strong> "Din nulstillingskode er: <span className="bg-gray-200 px-2 py-1 rounded font-mono">123456</span>"
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3: Enter Code */}
          <div className="bg-white border-2 border-purple-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0">
                3
              </div>
              <div className="flex-1">
                <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Key className="h-4 w-4 text-purple-600" />
                  Indtast kode og nyt password
                </h5>
                <div className="space-y-3">
                  <div className="bg-purple-50 rounded-lg p-3">
                    <p className="text-sm text-purple-800 mb-2">
                      <strong>Indtast 6-cifret kode:</strong>
                    </p>
                    <ul className="text-sm text-purple-700 space-y-1">
                      <li>• Skriv koden præcist som modtaget</li>
                      <li>• Ingen mellemrum eller bindestreger</li>
                      <li>• Koden er case-sensitive</li>
                    </ul>
                  </div>
                  <div className="bg-brand-gray-100 rounded-lg p-3">
                    <p className="text-sm text-brand-primary-dark mb-2">
                      <strong>Opret nyt password:</strong>
                    </p>
                    <ul className="text-sm text-brand-primary-dark space-y-1">
                      <li>• Mindst 8 tegn langt</li>
                      <li>• Kombination af bogstaver og tal anbefalet</li>
                      <li>• Undgå almindelige passwords</li>
                      <li>• Bekræft password ved at skrive det igen</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Security Tips */}
          <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-4">
            <h4 className="font-semibold text-orange-800 mb-3 flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Sikkerhedstips
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-orange-800">✅ Gør dette:</h5>
                <ul className="text-sm text-orange-700 space-y-1">
                  <li>• Brug et unikt password</li>
                  <li>• Inkluder tal og bogstaver</li>
                  <li>• Gem password sikkert</li>
                  <li>• Log ud fra offentlige computere</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-red-800">❌ Undgå dette:</h5>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• Del aldrig din kode med andre</li>
                  <li>• Brug ikke samme password overalt</li>
                  <li>• Gem ikke password i browseren på delte computere</li>
                  <li>• Ignorer ikke sikkerhedsadvarsler</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Troubleshooting */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Problemer? Løsninger her:
            </h4>
            <div className="space-y-3">
              <details className="bg-white rounded-lg p-3 border">
                <summary className="font-medium text-gray-800 cursor-pointer">
                  📧 Modtager ikke email med kode
                </summary>
                <div className="mt-2 text-sm text-gray-600 space-y-1">
                  <p>• Check spam/junk mappen</p>
                  <p>• Vent op til 5 minutter</p>
                  <p>• Verificer email-stavning er korrekt</p>
                  <p>• Prøv at anmode om ny kode</p>
                </div>
              </details>
              
              <details className="bg-white rounded-lg p-3 border">
                <summary className="font-medium text-gray-800 cursor-pointer">
                  ⏰ Koden er udløbet
                </summary>
                <div className="mt-2 text-sm text-gray-600 space-y-1">
                  <p>• Koder er gyldige i 15 minutter</p>
                  <p>• Gå tilbage til trin 1 og anmod om ny kode</p>
                  <p>• Den gamle kode bliver automatisk ugyldig</p>
                </div>
              </details>
              
              <details className="bg-white rounded-lg p-3 border">
                <summary className="font-medium text-gray-800 cursor-pointer">
                  🔢 Koden virker ikke
                </summary>
                <div className="mt-2 text-sm text-gray-600 space-y-1">
                  <p>• Sørg for ingen mellemrum før/efter koden</p>
                  <p>• Check for tastefejl (0 vs O, 1 vs l)</p>
                  <p>• Kopier/indsæt direkte fra email</p>
                  <p>• Anmod om ny kode hvis problemet fortsætter</p>
                </div>
              </details>
              
              <details className="bg-white rounded-lg p-3 border">
                <summary className="font-medium text-gray-800 cursor-pointer">
                  🔒 Kan ikke oprette nyt password
                </summary>
                <div className="mt-2 text-sm text-gray-600 space-y-1">
                  <p>• Sørg for password er mindst 8 tegn</p>
                  <p>• Check at begge password-felter matcher</p>
                  <p>• Prøv at refreshe siden og start forfra</p>
                  <p>• Kontakt support hvis problemet fortsætter</p>
                </div>
              </details>
            </div>
          </div>

          {/* Success Message */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-brand-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-brand-primary" />
              <div>
                <h4 className="font-semibold text-brand-primary-dark">Success! 🎉</h4>
                <p className="text-sm text-brand-primary-dark">Efter succesfuld nulstilling kan du logge ind med dit nye password på <strong>multigroent.dk/login</strong></p>
              </div>
            </div>
          </div>

          {/* Contact Support */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <h4 className="font-semibold text-blue-800 mb-2">Stadig problemer?</h4>
            <p className="text-sm text-blue-700 mb-3">
              Hvis du stadig har problemer med password nulstilling, er vores support team klar til at hjælpe.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100">
                📧 Email Support
              </Button>
              <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100">
                📞 Ring til Support
              </Button>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'account-creation',
      question: 'Hvordan opretter jeg en erhvervskonto?',
      category: 'account',
      answer: (
        <div className="space-y-4">
          <p>Multi Grønt er kun for erhvervskunder. For at oprette en konto:</p>
          <ol className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="bg-brand-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">1</span>
              <span>Gå til "B2B Ansøgning" siden</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-brand-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">2</span>
              <span>Udfyld ansøgningsformularen med virksomhedsoplysninger</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-brand-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">3</span>
              <span>Vent på godkendelse fra vores team</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-brand-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">4</span>
              <span>Modtag login-oplysninger via email</span>
            </li>
          </ol>
        </div>
      )
    },
    {
      id: 'payment-methods',
      question: 'Hvilke betalingsmuligheder tilbyder I?',
      category: 'orders',
      answer: (
        <div className="space-y-4">
          <p>Vi tilbyder følgende betalingsmuligheder for erhvervskunder:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-brand-gray-100 border border-brand-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-brand-primary-dark mb-2">Faktura</h4>
              <p className="text-sm text-brand-primary-dark">Betaling via faktura med 30 dages betalingsfrist</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">e-conomic Integration</h4>
              <p className="text-sm text-blue-700">Automatisk integration til dit regnskabssystem</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'delivery-times',
      question: 'Hvor hurtigt leverer I?',
      category: 'orders',
      answer: (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">Standard levering</h4>
            <p className="text-sm text-blue-700">Bestil inden kl. 14:00 - modtag varer næste hverdag</p>
          </div>
          <p className="text-sm text-gray-600">
            Vi leverer til hele Danmark og sørger for at dine varer ankommer friske og i høj kvalitet.
          </p>
        </div>
      )
    },
    {
      id: 'image-loading-issues',
      question: 'Hvorfor loader billeder ikke i appen?',
      category: 'technical',
      answer: (
        <div className="space-y-4">
          <p>Hvis billeder ikke loader korrekt i den installerede app:</p>
          <ol className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">1</span>
              <span>Luk appen fuldstændigt og åbn den igen</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">2</span>
              <span>Check din internetforbindelse</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">3</span>
              <span>Appen opdaterer automatisk - vent et øjeblik</span>
            </li>
          </ol>
          <div className="bg-brand-gray-100 border border-brand-gray-200 rounded-lg p-3">
            <p className="text-sm text-brand-primary-dark">
              💡 <strong>Tip:</strong> Billeder gemmes i cache efter første load for hurtigere visning næste gang.
            </p>
          </div>
        </div>
      )
    }
  ];

  const filteredItems = selectedCategory === 'all' 
    ? faqItems 
    : faqItems.filter(item => item.category === selectedCategory);

  const featuredItem = faqItems.find(item => item.featured);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-grow bg-gray-50">
        {/* Header - FULL WIDTH */}
        <section className="bg-brand-primary text-white py-12 full-width-section" style={{background: 'linear-gradient(135deg, hsl(var(--brand-primary)) 0%, hsl(var(--brand-secondary)) 100%)'}}>
          <div className="page-container text-center">
            <h1 className={cn(
              "font-bold text-white mb-4",
              isMobile ? "text-2xl" : "text-4xl"
            )}>
              Ofte Stillede Spørgsmål
            </h1>
            <p className={cn(
              "text-white/90 max-w-2xl mx-auto",
              isMobile ? "text-sm" : "text-lg"
            )}>
              Find svar på de mest almindelige spørgsmål om Multi Grønt
            </p>
          </div>
        </section>

        <div className="page-container py-8">
          <div className="content-width">
            {/* Featured FAQ */}
            <div className="mb-8">
              <Card className="border-brand-gray-200 bg-brand-gray-100">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-brand-primary" />
                    <CardTitle className="text-brand-primary-dark">Mest stillede spørgsmål</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible>
                    <AccordionItem value="featured-1">
                      <AccordionTrigger className="text-left">
                        Hvordan ansøger jeg om B2B adgang til Multi Grønt?
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="text-gray-700 leading-relaxed">
                          Du kan ansøge om B2B adgang ved at udfylde vores ansøgningsformular på siden "Ansøg om adgang". 
                          Du skal angive virksomhedsoplysninger, CVR-nummer og kontaktinformation. Vi behandler alle 
                          ansøgninger inden for 24 timer og sender dig en bekræftelse via email.
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </div>

            {/* Category Filter */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Kategorier</h2>
              <div className={cn(
                "grid gap-2",
                isMobile ? "grid-cols-2" : "grid-cols-3 md:grid-cols-5"
              )}>
                {categories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? "default" : "outline"}
                      onClick={() => setSelectedCategory(category.id)}
                      className={cn(
                        "justify-start gap-2",
                        isMobile ? "text-xs px-2 py-2" : "text-sm",
                        selectedCategory === category.id 
                          ? "bg-brand-primary hover:bg-brand-primary-hover text-white" 
                          : "border-gray-200 hover:bg-gray-50"
                      )}
                    >
                      <Icon className={cn(isMobile ? "h-3 w-3" : "h-4 w-4")} />
                      {category.name}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* FAQ Items */}
            <div className="space-y-4">
              {filteredItems.map((item) => (
                <Card key={item.id} className="shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-0">
                    <button
                      onClick={() => toggleItem(item.id)}
                      className="w-full text-left p-6 group"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className={cn(
                          "font-medium text-gray-900 group-hover:text-brand-primary transition-colors",
                          isMobile ? "text-sm pr-4" : "text-base"
                        )}>
                          {item.question}
                        </h3>
                        {expandedItems.has(item.id) ? (
                          <ChevronUp className="h-5 w-5 text-brand-primary flex-shrink-0" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-500 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                    
                    {expandedItems.has(item.id) && (
                      <div className="px-6 pb-6 pt-0 border-t border-gray-100">
                        <div className="mt-4">
                          {item.answer}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Contact CTA */}
            <Card className="mt-8 bg-gradient-to-r from-green-50 to-emerald-50 border-brand-gray-200">
              <CardContent className={cn(
                "text-center",
                isMobile ? "p-6" : "p-8"
              )}>
                <div className={cn(
                  "w-16 h-16 bg-brand-gray-100 rounded-full flex items-center justify-center mx-auto mb-4",
                  isMobile ? "w-12 h-12" : "w-16 h-16"
                )}>
                  <HelpCircle className={cn(
                    "text-brand-primary",
                    isMobile ? "h-6 w-6" : "h-8 w-8"
                  )} />
                </div>
                <h3 className={cn(
                  "font-bold text-gray-900 mb-2",
                  isMobile ? "text-lg" : "text-xl"
                )}>
                  Kunne du ikke finde svar på dit spørgsmål?
                </h3>
                <p className={cn(
                  "text-gray-600 mb-6",
                  isMobile ? "text-sm" : "text-base"
                )}>
                  Vores team er klar til at hjælpe dig. Kontakt os direkte for personlig assistance.
                </p>
                <div className={cn(
                  "flex gap-3 justify-center",
                  isMobile ? "flex-col" : "flex-row"
                )}>
                  <Link to="/contact">
                    <Button className={cn(
                      "bg-brand-primary hover:bg-brand-primary-hover",
                      isMobile ? "w-full" : ""
                    )}>
                      <Mail className="h-4 w-4 mr-2" />
                      Kontakt os
                    </Button>
                  </Link>
                  <Button variant="outline" className={cn(
                    "border-brand-gray-300 text-brand-primary-dark hover:bg-brand-gray-100",
                    isMobile ? "w-full" : ""
                  )}>
                    <Phone className="h-4 w-4 mr-2" />
                    Ring til os
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default FAQ;