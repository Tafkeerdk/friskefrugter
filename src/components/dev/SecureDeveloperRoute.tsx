import React, { useState, useEffect } from 'react';
import { PerformanceDashboard } from '../dashboard/PerformanceDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Loader2, Shield, AlertTriangle, Eye, EyeOff } from 'lucide-react';

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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [serverMetrics, setServerMetrics] = useState<ServerMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);

  const validateAccess = async (inputToken: string) => {
    // Client-side token validation
    if (!inputToken || inputToken !== SECURE_TOKEN) {
      console.warn('🚨 Invalid developer token provided');
      setError('Invalid developer token');
      setAttemptCount(prev => prev + 1);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Server-side validation and metrics fetch
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
        (import.meta.env.DEV ? 'http://localhost:3001' : 'https://famous-dragon-b033ac.netlify.app');
      
      const response = await fetch(`${API_BASE_URL}/api/auth/dev/performance-metrics?token=${encodeURIComponent(inputToken)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 403) {
        console.warn('🚨 Server rejected developer token');
        setError('Access denied by server - invalid token');
        setAttemptCount(prev => prev + 1);
        return;
      }

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data: DevMetricsResponse = await response.json();
      
      if (data.success) {
        console.log('🔓 Developer access authorized');
        setIsAuthenticated(true);
        setServerMetrics(data.serverMetrics);
        setToken(''); // Clear token from memory
      } else {
        setError('Invalid server response');
        setAttemptCount(prev => prev + 1);
      }

    } catch (err) {
      console.error('❌ Developer route error:', err);
      setError(err instanceof Error ? err.message : 'Connection error');
      setAttemptCount(prev => prev + 1);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (token.trim()) {
      validateAccess(token.trim());
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

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Developer Access</CardTitle>
            <p className="text-muted-foreground">
              Enter your developer token to access performance metrics
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="token">Developer Token</Label>
                <div className="relative">
                  <Input
                    id="token"
                    type={showToken ? "text" : "password"}
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Enter your secure developer token"
                    className="pr-10"
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowToken(!showToken)}
                    disabled={isLoading}
                  >
                    {showToken ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {attemptCount > 0 && (
                <div className="text-sm text-muted-foreground">
                  Failed attempts: {attemptCount}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || !token.trim()}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  'Access Dashboard'
                )}
              </Button>
            </form>

            <div className="pt-4 border-t">
              <div className="text-xs text-muted-foreground space-y-1">
                <p><strong>Security Notice:</strong></p>
                <p>• This endpoint is for authorized developers only</p>
                <p>• All access attempts are logged with IP addresses</p>
                <p>• Unauthorized access is prohibited</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show dashboard if authenticated
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Developer Header */}
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-green-800">Developer Performance Dashboard</CardTitle>
                  <p className="text-green-600 text-sm">Secure access granted • Internal use only</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsAuthenticated(false);
                  setServerMetrics(null);
                  setToken('');
                  setError(null);
                  setAttemptCount(0);
                }}
                className="border-green-300 text-green-700 hover:bg-green-100"
              >
                Logout
              </Button>
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
              <p><strong>Authentication:</strong> Secure token-based access</p>
              <p><strong>Security:</strong> Server-side validation • IP logging • Developer only</p>
              <p><strong>Session:</strong> {new Date().toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}; 