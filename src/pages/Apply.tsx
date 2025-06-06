import React from 'react';
import { CustomerApplicationForm } from '../components/auth/CustomerApplicationForm';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { ArrowLeft } from 'lucide-react';

const Apply: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Tilbage
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">
                B2B Ansøgning
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => navigate('/login')}
              >
                Har du allerede en konto? Log ind
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ansøg om B2B adgang
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Få adgang til vores B2B platform med kundespecifikke priser, 
            rabatter og professionelle indkøbsværktøjer.
          </p>
        </div>

        <CustomerApplicationForm 
          onSuccess={() => {
            // Could add additional success handling here
          }}
        />
      </main>
    </div>
  );
};

export default Apply; 