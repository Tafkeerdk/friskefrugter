import React from 'react';
import { CustomerApplicationForm } from '../components/auth/CustomerApplicationForm';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { ArrowLeft, Smartphone, CheckCircle, Shield } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

const Apply: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Mobile-First Main Content */}
      <main className="page-container py-6 md:py-8">
        <div className="content-width">
          {/* Back Button */}
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className={cn(
                "flex items-center",
                isMobile ? "px-2" : "px-3"
              )}
              size={isMobile ? "sm" : "default"}
            >
              <ArrowLeft className={cn(isMobile ? "w-4 h-4 mr-1" : "w-4 h-4 mr-2")} />
              {isMobile ? "Tilbage" : "Tilbage til forsiden"}
            </Button>
          </div>
          
          {/* Mobile-Optimized Hero Section */}
          <div className={cn(
            "text-center mb-8",
            isMobile ? "mb-6" : "mb-8"
          )}>
            <h2 className={cn(
              "font-bold text-gray-900 mb-4",
              isMobile ? "text-2xl" : "text-3xl"
            )}>
              Ansøg om B2B adgang
            </h2>
            <p className={cn(
              "text-gray-600 mx-auto",
              isMobile 
                ? "text-base max-w-full px-2" 
                : "text-lg max-w-2xl"
            )}>
              Få adgang til vores B2B platform med kundespecifikke priser, 
              rabatter og professionelle indkøbsværktøjer.
            </p>
            
            {/* Login Button */}
            <div className="mt-6">
              <Button
                variant="outline"
                onClick={() => navigate('/login')}
                className="text-sm"
              >
                Har du allerede en konto? Log ind
              </Button>
            </div>
          </div>

          {/* Mobile-Friendly Benefits Section */}
          {isMobile && (
            <div className="grid grid-cols-1 gap-3 mb-6">
              <div className="flex items-center space-x-3 bg-white p-3 rounded-lg border">
                                      <div className="flex-shrink-0 w-8 h-8 bg-brand-gray-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-brand-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">Kundespecifikke priser</p>
                  <p className="text-xs text-gray-500">Få dine personlige B2B priser</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 bg-white p-3 rounded-lg border">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Shield className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">Sikker platform</p>
                  <p className="text-xs text-gray-500">Professionelle indkøbsværktøjer</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 bg-white p-3 rounded-lg border">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <Smartphone className="w-4 h-4 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">Mobil venlig</p>
                  <p className="text-xs text-gray-500">Administrer din forretning på farten</p>
                </div>
              </div>
            </div>
          )}

          {/* Application Form */}
          <CustomerApplicationForm 
            onSuccess={() => {
              // Could add additional success handling here
            }}
          />

          {/* Mobile-Specific Help Section */}
          {isMobile && (
            <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="text-sm font-medium text-blue-900 mb-2">Brug for hjælp?</h3>
              <p className="text-xs text-blue-800 mb-3">
                Vi behandler din ansøgning inden for 24 timer. Du vil modtage en bekræftelsesmail.
              </p>
              <div className="flex flex-col space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/contact')}
                  className="text-xs border-blue-300 text-blue-700 hover:bg-blue-100"
                >
                  Kontakt support
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/faq')}
                  className="text-xs text-blue-700 hover:bg-blue-100"
                >
                  Se ofte stillede spørgsmål
                </Button>
              </div>
            </div>
          )}

{/* Desktop login link removed - now in hero section */}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Apply; 