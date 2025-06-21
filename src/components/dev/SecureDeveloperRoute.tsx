import React, { useState, useEffect } from 'react';
import { PerformanceDashboard } from '../dashboard/PerformanceDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Loader2, Shield, AlertTriangle, Eye, EyeOff, Activity, Play, Square } from 'lucide-react';

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

interface ServerLog {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  source?: string;
  data?: any;
}

export const SecureDeveloperRoute: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [serverMetrics, setServerMetrics] = useState<ServerMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [showRateLimitReset, setShowRateLimitReset] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  
  // Real-time monitoring state
  const [isRealTimeMonitoring, setIsRealTimeMonitoring] = useState(false);
  const [serverLogs, setServerLogs] = useState<ServerLog[]>([]);
  const [realTimeMetrics, setRealTimeMetrics] = useState<ServerMetrics | null>(null);

  // Cleanup effect for real-time monitoring
  useEffect(() => {
    return () => {
      // Cleanup on component unmount
      if ((window as any).__serverLogsInterval) {
        clearInterval((window as any).__serverLogsInterval);
        delete (window as any).__serverLogsInterval;
      }
      if ((window as any).__metricsInterval) {
        clearInterval((window as any).__metricsInterval);
        delete (window as any).__metricsInterval;
      }
    };
  }, []);

  // Helper function to get the correct endpoint based on environment
  const getEndpoint = (path: string): string => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
      (import.meta.env.DEV ? 'http://localhost:3001' : 'https://famous-dragon-b033ac.netlify.app');
    
    // In development, use Express routes
    if (import.meta.env.DEV) {
      return `${API_BASE_URL}${path}`;
    }
    
    // In production (Netlify), route to dedicated functions
    if (path.includes('/dev/server-logs')) {
      return `${API_BASE_URL}/.netlify/functions/dev-server-logs`;
    }
    if (path.includes('/dev/performance-metrics')) {
      return `${API_BASE_URL}/.netlify/functions/dev-performance-metrics`;
    }
    if (path.includes('/dev/reset-rate-limit')) {
      return `${API_BASE_URL}/.netlify/functions/dev-rate-limit-reset`;
    }
    
    // Default: use the path as-is
    return `${API_BASE_URL}${path}`;
  };

  // Real-time monitoring function
  const startRealTimeMonitoring = () => {
    setIsRealTimeMonitoring(true);
    console.log('🚀 Starting real-time monitoring...');
    
    // Start centralized logging session
    const startLoggingSession = async () => {
      try {
        const encodedToken = encodeURIComponent(SECURE_TOKEN);
        const endpoint = getEndpoint('/api/auth/dev/server-logs');
        const response = await fetch(`${endpoint}?token=${encodedToken}&action=start`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log('✅ Monitoring session started:', data);
          
          setServerLogs(prev => [{
            timestamp: new Date().toISOString(),
            level: 'info',
            message: `🔍 ${data.message} (Session: ${data.sessionId})`,
            source: 'monitoring-session'
          }, ...prev]);
        }
      } catch (error) {
        console.error('❌ Failed to start monitoring session:', error);
      }
    };
    
    // Use polling approach for serverless compatibility
    const fetchServerLogs = async () => {
      try {
        // Fix URL encoding - ensure proper encoding of the token
        const encodedToken = encodeURIComponent(SECURE_TOKEN);
        const endpoint = getEndpoint('/api/auth/dev/server-logs');
        const response = await fetch(`${endpoint}?token=${encodedToken}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          
          if (data.success && data.logs) {
            // Add timestamp to distinguish new logs
            const newLogs = data.logs.map((log: any) => ({
              timestamp: log.timestamp,
              level: log.level,
              message: log.message,
              source: log.source,
              data: log.data
            }));
            
            setServerLogs(prev => {
              // Merge new logs with existing ones, avoiding duplicates
              const combined = [...newLogs, ...prev];
              const unique = combined.filter((log, index, arr) => 
                arr.findIndex(l => l.timestamp === log.timestamp && l.message === log.message) === index
              );
              return unique.slice(0, 200); // Keep last 200 logs
            });
          }
        } else {
          const errorText = await response.text().catch(() => 'Unknown error');
          console.error('Failed to fetch server logs:', response.status, errorText);
          setServerLogs(prev => [{
            timestamp: new Date().toISOString(),
            level: 'error',
            message: `❌ Failed to fetch server logs: ${response.status} - ${errorText}`,
            source: 'client'
          }, ...prev]);
        }
      } catch (error) {
        console.error('❌ Server logs fetch error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setServerLogs(prev => [{
          timestamp: new Date().toISOString(),
          level: 'error',
          message: `❌ Server logs connection error: ${errorMessage}`,
          source: 'client'
        }, ...prev]);
      }
    };

    // Start the logging session first
    startLoggingSession();

    // Initial fetch
    setTimeout(() => fetchServerLogs(), 2000); // Wait 2 seconds after starting session
    
    // Add connection log
    setServerLogs(prev => [{
      timestamp: new Date().toISOString(),
      level: 'info',
      message: '🔗 Real-time monitoring started (polling mode)',
      source: 'client'
    }, ...prev]);

    // Set up polling interval
    const logsInterval = setInterval(() => {
      if (!isRealTimeMonitoring) {
        clearInterval(logsInterval);
        return;
      }
      fetchServerLogs();
    }, 5000); // Poll every 5 seconds

    // Update metrics more frequently
    const metricsInterval = setInterval(async () => {
      if (!isRealTimeMonitoring) {
        clearInterval(metricsInterval);
        return;
      }
      
      try {
        await fetchLatestMetrics();
      } catch (error) {
        console.error('Failed to fetch real-time metrics:', error);
      }
    }, 5000);

    // Store references for cleanup
    (window as any).__serverLogsInterval = logsInterval;
    (window as any).__metricsInterval = metricsInterval;
  };

  const stopRealTimeMonitoring = () => {
    setIsRealTimeMonitoring(false);
    console.log('⏹️ Stopping real-time monitoring...');
    
    // Stop centralized logging session
    const stopLoggingSession = async () => {
      try {
        const encodedToken = encodeURIComponent(SECURE_TOKEN);
        const endpoint = getEndpoint('/api/auth/dev/server-logs');
        const response = await fetch(`${endpoint}?token=${encodedToken}&action=stop`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log('✅ Monitoring session stopped:', data);
          
          setServerLogs(prev => [{
            timestamp: new Date().toISOString(),
            level: 'info',
            message: `🔍 ${data.message}`,
            source: 'monitoring-session'
          }, ...prev]);
        }
      } catch (error) {
        console.error('❌ Failed to stop monitoring session:', error);
      }
    };
    
    // Stop the logging session
    stopLoggingSession();
    
    // Clear polling intervals
    if ((window as any).__serverLogsInterval) {
      clearInterval((window as any).__serverLogsInterval);
      delete (window as any).__serverLogsInterval;
    }
    
    if ((window as any).__metricsInterval) {
      clearInterval((window as any).__metricsInterval);
      delete (window as any).__metricsInterval;
    }
    
    setServerLogs(prev => [{
      timestamp: new Date().toISOString(),
      level: 'info',
      message: '🔌 Real-time monitoring stopped',
      source: 'client'
    }, ...prev]);
  };

  const fetchLatestMetrics = async () => {
    try {
      // Use proper URL encoding for the token
      const encodedToken = encodeURIComponent(SECURE_TOKEN);
      const endpoint = getEndpoint('/api/auth/dev/performance-metrics');
      
      const response = await fetch(`${endpoint}?token=${encodedToken}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data: DevMetricsResponse = await response.json();
        if (data.success) {
          setRealTimeMetrics(data.serverMetrics);
        }
      } else {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error(`❌ Failed to fetch real-time metrics: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Failed to fetch real-time metrics:', errorMessage);
    }
  };

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
      
      // Fix URL encoding issue - use proper encoding for the token
      // The token contains special characters that need proper encoding
      const encodedToken = encodeURIComponent(inputToken);
      const endpoint = getEndpoint('/api/auth/dev/performance-metrics');
      
      const response = await fetch(`${endpoint}?token=${encodedToken}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (response.status === 403) {
        console.warn('🚨 Server rejected developer token');
        setError('Access denied by server - invalid token or connection error');
        setAttemptCount(prev => prev + 1);
        return;
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error('Server error response:', response.status, errorText);
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      const data: DevMetricsResponse = await response.json();
      
      if (data.success) {
        console.log('🔓 Developer access authorized');
        setIsAuthenticated(true);
        setServerMetrics(data.serverMetrics);
        setToken(''); // Clear token from memory
      } else {
        setError('Invalid server response - authentication failed');
        setAttemptCount(prev => prev + 1);
      }

    } catch (err) {
      console.error('❌ Developer route error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Connection error';
      setError(`Connection failed: ${errorMessage}`);
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

  const handleRateLimitReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetToken.trim()) return;

    try {
      setIsResetting(true);
      setResetMessage('');
      
      const endpoint = getEndpoint('/api/auth/dev/reset-rate-limit');
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ token: resetToken.trim() })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const resetInfo = data.resetLimiters ? ` (${data.resetLimiters.join(', ')})` : '';
        const note = data.note ? `\n\nNote: ${data.note}` : '';
        setResetMessage(`✅ Rate limit reset successful! Admin login attempts have been cleared${resetInfo}.${note}`);
        setResetToken('');
        setShowRateLimitReset(false);
        
        // Add success log to server logs if monitoring is active
        if (isRealTimeMonitoring) {
          setServerLogs(prev => [{
            timestamp: new Date().toISOString(),
            level: 'info',
            message: `🔄 Rate limits reset successfully${import.meta.env.DEV ? '' : ' (Netlify mode)'}`,
            source: 'admin-action'
          }, ...prev]);
        }
      } else {
        const errorMsg = data.message || 'Invalid developer token or reset failed';
        setResetMessage(`❌ ${errorMsg}`);
      }

    } catch (err) {
      console.error('Rate limit reset error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setResetMessage(`❌ Connection error - could not reset rate limit: ${errorMessage}`);
    } finally {
      setIsResetting(false);
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

  const getLogLevelColor = (level: string): string => {
    switch (level) {
      case 'error': return 'text-red-600 bg-red-50';
      case 'warn': return 'text-yellow-600 bg-yellow-50';
      case 'info': return 'text-blue-600 bg-blue-50';
      case 'debug': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
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
                  {isRealTimeMonitoring && (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-green-700">Real-time monitoring active</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={isRealTimeMonitoring ? stopRealTimeMonitoring : startRealTimeMonitoring}
                  variant={isRealTimeMonitoring ? "destructive" : "default"}
                  size="sm"
                >
                  {isRealTimeMonitoring ? (
                    <>
                      <Square className="w-4 h-4 mr-2" />
                      Stop Monitoring
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Start Real-Time
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsAuthenticated(false);
                    setServerMetrics(null);
                    setToken('');
                    setError(null);
                    setAttemptCount(0);
                    stopRealTimeMonitoring();
                  }}
                  className="border-green-300 text-green-700 hover:bg-green-100"
                >
                  Logout
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Real-Time Server Logs */}
        {isRealTimeMonitoring && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Real-Time Server Logs
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse ml-2"></div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 overflow-y-auto space-y-2 border rounded-lg p-4 bg-gray-50 font-mono text-sm">
                {serverLogs.length === 0 ? (
                  <div className="text-gray-500 text-center py-8">
                    Waiting for server logs...
                  </div>
                ) : (
                  serverLogs.map((log, index) => (
                    <div key={index} className={`p-2 rounded ${getLogLevelColor(log.level)}`}>
                      <div className="flex items-start gap-2">
                        <span className="text-xs text-gray-500 min-w-[80px]">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                        <span className="uppercase text-xs font-bold min-w-[50px]">
                          {log.level}
                        </span>
                        <span className="flex-1">{log.message}</span>
                        {log.source && (
                          <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                            {log.source}
                          </span>
                        )}
                      </div>
                      {log.data && (
                        <div className="text-xs text-gray-600 mt-1 ml-[132px]">
                          {JSON.stringify(log.data)}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Server Metrics */}
        {(serverMetrics || realTimeMetrics) && (
          <Card>
            <CardHeader>
              <CardTitle>Server Metrics {isRealTimeMonitoring && <span className="text-sm text-green-600">(Live)</span>}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatUptime((realTimeMetrics || serverMetrics)!.uptime)}
                  </div>
                  <div className="text-sm text-muted-foreground">Uptime</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {formatBytes((realTimeMetrics || serverMetrics)!.memory.heapUsed)}
                  </div>
                  <div className="text-sm text-muted-foreground">Memory Used</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {(realTimeMetrics || serverMetrics)!.environment}
                  </div>
                  <div className="text-sm text-muted-foreground">Environment</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">
                    {(realTimeMetrics || serverMetrics)!.nodeVersion}
                  </div>
                  <div className="text-sm text-muted-foreground">Node.js</div>
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <strong>Platform:</strong> {(realTimeMetrics || serverMetrics)!.platform}
                </div>
                <div>
                  <strong>Architecture:</strong> {(realTimeMetrics || serverMetrics)!.arch}
                </div>
                <div>
                  <strong>Total Memory:</strong> {formatBytes((realTimeMetrics || serverMetrics)!.memory.heapTotal)}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rate Limit Reset */}
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800">Admin Rate Limit Reset</CardTitle>
            <p className="text-orange-600 text-sm">
              Reset admin login rate limiting when users are locked out
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {!showRateLimitReset ? (
              <Button
                onClick={() => setShowRateLimitReset(true)}
                variant="outline"
                className="border-orange-300 text-orange-700 hover:bg-orange-100"
              >
                Reset Admin Rate Limit
              </Button>
            ) : (
              <form onSubmit={handleRateLimitReset} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="resetToken">Developer Token</Label>
                  <Input
                    id="resetToken"
                    type="password"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    placeholder="Enter developer token to reset rate limit"
                    disabled={isResetting}
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    type="submit" 
                    disabled={isResetting || !resetToken.trim()}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    {isResetting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Resetting...
                      </>
                    ) : (
                      'Reset Rate Limit'
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowRateLimitReset(false);
                      setResetToken('');
                      setResetMessage('');
                    }}
                    disabled={isResetting}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
            
            {resetMessage && (
              <Alert variant={resetMessage.includes('✅') ? 'default' : 'destructive'}>
                <AlertDescription>{resetMessage}</AlertDescription>
              </Alert>
            )}
            
            <div className="text-xs text-orange-700 bg-orange-100 p-2 rounded">
              <p><strong>What this does:</strong></p>
              <p>• Clears failed login attempts for admin accounts</p>
              <p>• Allows immediate login retry without waiting 10 minutes</p>
              <p>• Only affects rate limiting, not account security</p>
            </div>
          </CardContent>
        </Card>

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
              <p><strong>Real-time:</strong> {isRealTimeMonitoring ? '🟢 Active' : '🔴 Inactive'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}; 