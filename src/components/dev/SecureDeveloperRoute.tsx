import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PerformanceDashboard } from '../dashboard/PerformanceDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, Shield, AlertTriangle } from 'lucide-react';

// DEVELOPER ONLY - DO NOT SHARE
const SECURE_TOKEN = "Q3v7$1pL!eR9dTz#XpRk29!eDdL92v@aMzFw8k";

interface ServerMetrics {
  timestamp: string;
  uptime: number;
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
  cpuUsage: {
    user: number;
    system: number;
  };
  environment: string;
  nodeVersion: string;
  platform: string;
  arch: string;
}

interface DevMetricsResponse {
  success: boolean;
  serverMetrics: ServerMetrics;
  performanceReport: any;
  endpoints: {
    health: string;
    performance: string;
  };
}

export const SecureDeveloperRoute: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [serverMetrics, setServerMetrics] = useState<ServerMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    validateAccess();
  }, [searchParams]);

  const validateAccess = async () => {
    const token = searchParams.get('token');
    
    // Client-side token validation
    if (!token || token !== SECURE_TOKEN) {
      console.warn('🚨 Invalid or missing developer token');
      setIsAuthorized(false);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // Server-side validation and metrics fetch
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
        (import.meta.env.DEV ? 'http://localhost:3001' : 'https://famous-dragon-b033ac.netlify.app');
      
      const response = await fetch(`${API_BASE_URL}/api/auth/dev/performance-metrics?token=${encodeURIComponent(token)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 403) {
        console.warn('🚨 Server rejected developer token');
        setIsAuthorized(false);
        setError('Access denied by server');
        return;
      }

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data: DevMetricsResponse = await response.json();
      
      if (data.success) {
        console.log('🔓 Developer access authorized');
        setIsAuthorized(true);
        setServerMetrics(data.serverMetrics);
      } else {
        setIsAuthorized(false);
        setError('Invalid server response');
      }

    } catch (err) {
      console.error('❌ Developer route error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIsAuthorized(false);
    } finally {
      setIsLoading(false);
    }
  };

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatBytes = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Validating Developer Access</h2>
          <p className="text-muted-foreground">Authenticating secure token...</p>
        </div>
      </div>
    );
  }

  if (isAuthorized === false) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-red-600">Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <Alert variant="destructive">
              <AlertDescription>
                {error || 'Invalid or missing developer token. This endpoint is restricted to authorized developers only.'}
              </AlertDescription>
            </Alert>
            <div className="mt-4 text-sm text-muted-foreground">
              <p>Required: Valid developer token</p>
              <p>Status: HTTP 403 Forbidden</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Developer Header */}
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <Shield className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-green-800">Developer Performance Dashboard</CardTitle>
                <p className="text-green-600 text-sm">Secure access granted • Internal use only</p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Server Metrics */}
        {serverMetrics && (
          <Card>
            <CardHeader>
              <CardTitle>Server Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{formatUptime(serverMetrics.uptime)}</div>
                  <div className="text-sm text-muted-foreground">Uptime</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{formatBytes(serverMetrics.memory.heapUsed)}</div>
                  <div className="text-sm text-muted-foreground">Memory Used</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{serverMetrics.environment}</div>
                  <div className="text-sm text-muted-foreground">Environment</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">{serverMetrics.nodeVersion}</div>
                  <div className="text-sm text-muted-foreground">Node.js</div>
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <strong>Platform:</strong> {serverMetrics.platform}
                </div>
                <div>
                  <strong>Architecture:</strong> {serverMetrics.arch}
                </div>
                <div>
                  <strong>Total Memory:</strong> {formatBytes(serverMetrics.memory.heapTotal)}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Performance Dashboard */}
        <PerformanceDashboard />

        {/* Developer Info */}
        <Card className="border-gray-200 bg-gray-50">
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground space-y-1">
              <p><strong>Access URL:</strong> /dev-dashboard/metrics-access-9e8d7f4a9c1b3e09d6f2a1bc2a7e/</p>
              <p><strong>Token Required:</strong> Q3v7$1pL!eR9dTz#XpRk29!eDdL92v@aMzFw8k</p>
              <p><strong>Security:</strong> Server-side validation • IP logging • Developer only</p>
              <p><strong>Last Update:</strong> {new Date().toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}; 