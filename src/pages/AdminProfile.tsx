import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { isAdmin } from '../lib/auth';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import { AdminProfile } from '../components/auth/AdminProfile';

const AdminProfilePage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  // Enhanced security check - redirect if not authenticated or not admin
  if (!isAuthenticated || !user || !isAdmin(user)) {
    return <Navigate to="/super/admin" replace />;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Profil Indstillinger</h2>
              <p className="text-blue-100 mt-1">
                Administrer dine personlige oplysninger og kontoindstillinger
              </p>
            </div>
            <div className="text-right text-sm text-blue-100">
              <p>Sikker profil administration</p>
              <p>Alle ændringer logges</p>
            </div>
          </div>
        </div>

        {/* Admin Profile Component */}
        <AdminProfile />

        {/* Security Footer */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>🔒 Sikret admin session - Alle profilændringer logges</span>
            <span>Google Cloud Storage • Imgix Optimering</span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminProfilePage; 