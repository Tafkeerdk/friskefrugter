
import { Phone, Mail, MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

export function ContactOverlay() {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <>
      <Button
        variant="default"
        size="icon"
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed shadow-lg animate-fade-in hover:scale-105 transition-all duration-300",
          isMobile 
            ? "bottom-4 right-4 h-14 w-14 rounded-full bg-green-600 hover:bg-green-700" 
            : "bottom-8 right-8 h-16 w-16 rounded-full bg-green-600 hover:bg-green-700"
        )}
        aria-label="Kontakt os"
      >
        <Phone className="h-6 w-6 text-white" />
      </Button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fade-in">
          <div className={cn(
            "bg-white rounded-lg shadow-xl",
            isMobile 
              ? "w-full h-[85vh] fixed bottom-0 animate-slide-up p-6" 
              : "max-w-md w-full fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-scale-up p-8"
          )}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">Kontakt os</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="hover:bg-green-50 hover:text-green-600"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="space-y-6">
              <div className="group">
                <a 
                  href="tel:+4512345678" 
                  className="flex items-center gap-4 p-4 rounded-lg hover:bg-green-50 transition-all duration-300"
                >
                  <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition-colors">
                    <Phone className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 group-hover:text-green-600 transition-colors">Ring til os</p>
                    <p className="text-gray-500">+45 12 34 56 78</p>
                  </div>
                </a>
              </div>

              <div className="group">
                <a 
                  href="mailto:info@firma.dk" 
                  className="flex items-center gap-4 p-4 rounded-lg hover:bg-green-50 transition-all duration-300"
                >
                  <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition-colors">
                    <Mail className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 group-hover:text-green-600 transition-colors">Send en mail</p>
                    <p className="text-gray-500">info@firma.dk</p>
                  </div>
                </a>
              </div>

              <div className="group">
                <div className="flex items-center gap-4 p-4 rounded-lg hover:bg-green-50 transition-all duration-300">
                  <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition-colors">
                    <MapPin className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 group-hover:text-green-600 transition-colors">Besøg os</p>
                    <p className="text-gray-500">Grøntvej 123, 2300 København</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center text-sm text-gray-500">
              <p>Vi svarer normalt inden for 24 timer på hverdage</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
