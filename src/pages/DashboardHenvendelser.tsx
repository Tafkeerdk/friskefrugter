import React from 'react';
import DashboardLayout from '../components/dashboard/DashboardLayout';

const DashboardHenvendelser: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="dashboard-page-container">
        <div className="content-width">
          <h1 className="text-3xl font-bold text-brand-gray-900 mb-6">Henvendelser</h1>
          <p className="text-brand-gray-600">Administrer kontakthenvendelser og B2B ansøgninger</p>
          
          <div className="mt-8">
            <div className="bg-brand-gray-50 p-8 rounded-lg text-center">
              <h2 className="text-xl font-semibold text-brand-gray-900 mb-2">Henvendelser Dashboard</h2>
              <p className="text-brand-gray-600">Funktion under udvikling - vil snart vise alle kontakter og ansøgninger</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardHenvendelser; 