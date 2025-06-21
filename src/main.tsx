import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { debugPerformance } from './lib/performance'

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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
