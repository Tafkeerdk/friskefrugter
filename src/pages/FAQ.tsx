import React, { useState } from 'react';
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ChevronDown, ChevronUp, Smartphone, Download, Share, CheckCircle, AlertTriangle, HelpCircle, Globe } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePWA } from "@/hooks/usePWA";
import { cn } from "@/lib/utils";

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

  // Handle anchor links (e.g., #pwa-installation)
  React.useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      // Expand the item if it exists
      setExpandedItems(prev => new Set(prev).add(hash));
      
      // Scroll to the element after a brief delay to ensure it's rendered
      setTimeout(() => {
        const element = document.getElementById(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
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
      <div className="bg-white border-2 border-green-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0">
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
      <div className="bg-white border-2 border-green-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0">
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
      <div className="bg-white border-2 border-green-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0">
            3
          </div>
          <div className="flex-1">
            <h5 className="font-semibold text-gray-900 mb-2">Find "Føj til hjemmeskærm"</h5>
            <div className="bg-green-50 rounded-lg p-4 mb-2">
              <div className="text-center">
                <div className="bg-gray-100 rounded-lg p-3 mb-2">
                  <p className="text-sm font-medium text-gray-800">⬇ Scroll ned ⬇</p>
                </div>
                <div className="bg-green-600 text-white rounded-lg p-3 inline-flex items-center gap-2">
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
      <div className="bg-white border-2 border-green-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0">
            4
          </div>
          <div className="flex-1">
            <h5 className="font-semibold text-gray-900 mb-2">Bekræft installationen</h5>
            <div className="bg-green-50 rounded-lg p-4 mb-2">
              <div className="text-center space-y-2">
                <div className="bg-white border-2 border-green-300 rounded-lg p-3">
                  <p className="text-sm font-semibold text-green-800">Multi Grønt</p>
                  <p className="text-xs text-gray-600">Vil blive tilføjet til hjemmeskærmen</p>
                </div>
                <Button className="bg-green-600 hover:bg-green-700 text-white text-sm">
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
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-6 w-6 text-green-600" />
          <div>
            <h4 className="font-semibold text-green-800">Tillykke! 🎉</h4>
            <p className="text-sm text-green-700">Multi Grønt er nu installeret som app og åbner uden browser-interface</p>
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

      <div className="bg-white border-2 border-green-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0">
            1
          </div>
          <div className="flex-1">
            <h5 className="font-semibold text-gray-900 mb-2">Automatisk prompt</h5>
            <div className="bg-blue-50 rounded-lg p-4 mb-2">
              <p className="text-sm text-blue-700">Chrome vil ofte automatisk vise en "Installér app" besked</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <Button className="bg-green-600 hover:bg-green-700 text-white text-sm">
                <Download className="h-4 w-4 mr-2" />
                Installér
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-2 border-green-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0">
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
              isIOSInstallable ? "border-green-300 bg-green-50" : "border-gray-200 bg-gray-50"
            )}>
              <div className="flex items-center gap-2 mb-2">
                <Smartphone className="h-5 w-5 text-blue-600" />
                <span className="font-medium">iOS (iPhone/iPad)</span>
                {isIOSInstallable && <CheckCircle className="h-4 w-4 text-green-600" />}
              </div>
              <p className="text-sm text-gray-700">Safari browser påkrævet</p>
            </div>
            
            <div className="border-2 border-gray-200 bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Smartphone className="h-5 w-5 text-green-600" />
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
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Din enhed</span>
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
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-800 mb-3">Fordele ved app-installation:</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-700">Hurtigere adgang</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-700">Offline funktionalitet</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-700">Ingen browser-interface</span>
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
      id: 'account-creation',
      question: 'Hvordan opretter jeg en erhvervskonto?',
      category: 'account',
      answer: (
        <div className="space-y-4">
          <p>Multi Grønt er kun for erhvervskunder. For at oprette en konto:</p>
          <ol className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="bg-green-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">1</span>
              <span>Gå til "B2B Ansøgning" siden</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-green-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">2</span>
              <span>Udfyld ansøgningsformularen med virksomhedsoplysninger</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-green-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">3</span>
              <span>Vent på godkendelse fra vores team</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-green-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">4</span>
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
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-800 mb-2">Faktura</h4>
              <p className="text-sm text-green-700">Betaling via faktura med 30 dages betalingsfrist</p>
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
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-700">
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
        {/* Header */}
        <section className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-12">
          <div className="container mx-auto px-4 text-center">
            <h1 className={cn(
              "font-bold text-white mb-4",
              isMobile ? "text-2xl" : "text-4xl"
            )}>
              Ofte Stillede Spørgsmål
            </h1>
            <p className={cn(
              "text-green-100 max-w-2xl mx-auto",
              isMobile ? "text-sm" : "text-lg"
            )}>
              Find svar på de mest almindelige spørgsmål om Multi Grønt
            </p>
          </div>
        </section>

        <div className="container mx-auto px-4 py-8">
          {/* Featured FAQ */}
          {featuredItem && (
            <div className="mb-8" id={featuredItem.id}>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-1">
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                        POPULÆRT SPØRGSMÅL
                      </div>
                    </div>
                    <button
                      onClick={() => toggleItem(featuredItem.id)}
                      className="w-full text-left group"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className={cn(
                          "font-semibold text-gray-900 group-hover:text-blue-600 transition-colors",
                          isMobile ? "text-lg" : "text-xl"
                        )}>
                          {featuredItem.question}
                        </h3>
                        {expandedItems.has(featuredItem.id) ? (
                          <ChevronUp className="h-5 w-5 text-blue-600 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-500 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                    
                    {expandedItems.has(featuredItem.id) && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        {featuredItem.answer}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

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
                        ? "bg-green-600 hover:bg-green-700 text-white" 
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
            {filteredItems.filter(item => !item.featured).map((item) => (
              <Card key={item.id} className="shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  <button
                    onClick={() => toggleItem(item.id)}
                    className="w-full text-left p-6 group"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className={cn(
                        "font-medium text-gray-900 group-hover:text-green-600 transition-colors",
                        isMobile ? "text-sm pr-4" : "text-base"
                      )}>
                        {item.question}
                      </h3>
                      {expandedItems.has(item.id) ? (
                        <ChevronUp className="h-5 w-5 text-green-600 flex-shrink-0" />
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

          {/* Contact Section */}
          <div className="mt-12 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 text-center">
            <h3 className="text-lg font-semibold text-green-900 mb-2">
              Kunne ikke finde svar på dit spørgsmål?
            </h3>
            <p className="text-green-700 mb-4 text-sm">
              Kontakt vores support team, så hjælper vi dig gerne
            </p>
            <Button className="bg-green-600 hover:bg-green-700 text-white">
              Kontakt Support
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FAQ;