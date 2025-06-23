import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { debugPerformance } from './lib/performance'
import { AuthProvider } from './hooks/useAuth'

// Initialize performance monitoring in development
if (import.meta.env.DEV) {
  console.log('🚀 Initializing performance monitoring...');
  debugPerformance.startMonitoring();
  
  // Log performance report every 60 seconds in development
  setInterval(() => {
    const report = debugPerformance.getReport();
    if (report.recommendations.length > 0) {
      console.group('⚠️ Performance Recommendations');
      report.recommendations.forEach(rec => {
        console.warn(`${rec.priority.toUpperCase()}: ${rec.message}`);
        if (rec.action) console.log(`💡 ${rec.action}`);
      });
      console.groupEnd();
    }
  }, 60000);
}

// Global debug functions for session management
if (typeof window !== 'undefined') {
  (window as any).debugSession = {
    checkSessions: () => {
      console.log('🔍 Current Session State:');
      console.log('Admin Token:', localStorage.getItem('admin_accessToken') ? 'Present' : 'Missing');
      console.log('Customer Token:', localStorage.getItem('customer_accessToken') ? 'Present' : 'Missing');
      console.log('Admin User:', JSON.parse(localStorage.getItem('admin_user') || 'null'));
      console.log('Customer User:', JSON.parse(localStorage.getItem('customer_user') || 'null'));
      console.log('Current Path:', window.location.pathname);
    },
    clearAdminSession: () => {
      localStorage.removeItem('admin_accessToken');
      localStorage.removeItem('admin_refreshToken');
      localStorage.removeItem('admin_user');
      console.log('✅ Admin session cleared');
      window.location.reload();
    },
    clearCustomerSession: () => {
      localStorage.removeItem('customer_accessToken');
      localStorage.removeItem('customer_refreshToken');
      localStorage.removeItem('customer_user');
      console.log('✅ Customer session cleared');
      window.location.reload();
    },
    clearAllSessions: () => {
      localStorage.clear();
      console.log('✅ All sessions cleared');
      window.location.reload();
    }
  };
  
  console.log('🛠️ Session debug functions available:');
  console.log('- window.debugSession.checkSessions() - Check current sessions');
  console.log('- window.debugSession.clearAdminSession() - Clear admin session');
  console.log('- window.debugSession.clearCustomerSession() - Clear customer session');
  console.log('- window.debugSession.clearAllSessions() - Clear all sessions');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
)
