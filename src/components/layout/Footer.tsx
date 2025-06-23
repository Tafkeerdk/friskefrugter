import { Link } from "react-router-dom";
import { Mail, Phone, MapPin } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export function Footer() {
  const isMobile = useIsMobile();

  return (
    <footer className="bg-gradient-to-b from-gray-50 to-gray-100 border-t border-gray-200">
      <div className={cn(
        "container mx-auto",
        isMobile ? "py-6 px-4" : "py-8 md:py-12 px-6"
      )}>
        <div className={cn(
          "grid gap-6",
          isMobile 
            ? "grid-cols-1 space-y-4" 
            : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8"
        )}>
          
          {/* Brand Section */}
          <div className={cn(isMobile && "text-center")}>
            <h3 className={cn(
              "font-bold text-gray-900 mb-3",
              isMobile ? "text-xl" : "text-lg"
            )}>
              Multi Grønt
            </h3>
            <p className={cn(
              "text-gray-600 mb-4 leading-relaxed",
              isMobile ? "text-sm px-2" : "text-sm md:text-base"
            )}>
              Friske råvarer til professionelle køkkener – nemt, hurtigt og pålideligt
            </p>
            <div className={cn(
              "flex space-x-4",
              isMobile && "justify-center"
            )}>
              <a 
                href="#" 
                className={cn(
                  "text-green-600 hover:text-green-800 transition-all duration-200",
                  isMobile ? "p-2" : "p-1",
                  "rounded-lg hover:bg-green-50 active:scale-95"
                )}
                aria-label="Facebook"
              >
                <svg className={cn(isMobile ? "h-6 w-6" : "h-6 w-6")} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                </svg>
              </a>
              <a 
                href="#" 
                className={cn(
                  "text-green-600 hover:text-green-800 transition-all duration-200",
                  isMobile ? "p-2" : "p-1",
                  "rounded-lg hover:bg-green-50 active:scale-95"
                )}
                aria-label="Instagram"
              >
                <svg className={cn(isMobile ? "h-6 w-6" : "h-6 w-6")} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.045-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.08c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
          
          {/* Contact Section */}
          <div className={cn(isMobile && "text-center")}>
            <h3 className={cn(
              "font-semibold text-gray-900 mb-3",
              isMobile ? "text-lg" : "text-lg"
            )}>
              Kontakt
            </h3>
            <ul className={cn(
              "space-y-3 text-gray-600",
              isMobile ? "text-sm" : "text-sm md:text-base"
            )}>
              <li className={cn(
                "flex items-start",
                isMobile && "justify-center"
              )}>
                <MapPin className={cn(
                  "text-green-600 flex-shrink-0 mt-0.5",
                  isMobile ? "h-4 w-4 mr-2" : "h-5 w-5 mr-2"
                )} />
                <span className="leading-relaxed">Grøntvej 123, 2300 København S</span>
              </li>
              <li className={cn(
                "flex items-center",
                isMobile && "justify-center"
              )}>
                <Phone className={cn(
                  "text-green-600 flex-shrink-0",
                  isMobile ? "h-4 w-4 mr-2" : "h-5 w-5 mr-2"
                )} />
                <a 
                  href="tel:+4512345678" 
                  className="hover:text-green-600 transition-colors active:scale-95"
                >
                  +45 12 34 56 78
                </a>
              </li>
              <li className={cn(
                "flex items-center",
                isMobile && "justify-center"
              )}>
                <Mail className={cn(
                  "text-green-600 flex-shrink-0",
                  isMobile ? "h-4 w-4 mr-2" : "h-5 w-5 mr-2"
                )} />
                <a 
                  href="mailto:info@multigroent.dk" 
                  className="hover:text-green-600 transition-colors active:scale-95"
                >
                  info@multigroent.dk
                </a>
              </li>
            </ul>
          </div>
          
          {/* Information Section */}
          <div className={cn(isMobile && "text-center")}>
            <h3 className={cn(
              "font-semibold text-gray-900 mb-3",
              isMobile ? "text-lg" : "text-lg"
            )}>
              Information
            </h3>
            <ul className={cn(
              "space-y-2 text-gray-600",
              isMobile ? "text-sm" : "text-sm md:text-base"
            )}>
              <li>
                <Link 
                  to="/about" 
                  className={cn(
                    "hover:text-green-600 transition-colors inline-block",
                    isMobile ? "py-2 px-4 rounded-lg hover:bg-green-50 active:scale-95" : "py-1"
                  )}
                >
                  Om os
                </Link>
              </li>
              <li>
                <Link 
                  to="/terms" 
                  className={cn(
                    "hover:text-green-600 transition-colors inline-block",
                    isMobile ? "py-2 px-4 rounded-lg hover:bg-green-50 active:scale-95" : "py-1"
                  )}
                >
                  Vilkår og betingelser
                </Link>
              </li>
              <li>
                <Link 
                  to="/privacy" 
                  className={cn(
                    "hover:text-green-600 transition-colors inline-block",
                    isMobile ? "py-2 px-4 rounded-lg hover:bg-green-50 active:scale-95" : "py-1"
                  )}
                >
                  Privatlivspolitik
                </Link>
              </li>
              <li>
                <Link 
                  to="/contact" 
                  className={cn(
                    "hover:text-green-600 transition-colors inline-block",
                    isMobile ? "py-2 px-4 rounded-lg hover:bg-green-50 active:scale-95" : "py-1"
                  )}
                >
                  Kontakt os
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Copyright */}
        <div className={cn(
          "border-t border-gray-200 text-center text-gray-500",
          isMobile ? "mt-6 pt-4 text-xs" : "mt-8 md:mt-12 pt-6 md:pt-8 text-xs md:text-sm"
        )}>
          <p className="leading-relaxed">
            © 2025 Multi Grønt. Alle rettigheder forbeholdes.
          </p>
          {isMobile && (
            <p className="text-xs text-gray-400 mt-1">
              Designet til mobile enheder
            </p>
          )}
        </div>
      </div>
    </footer>
  );
}
