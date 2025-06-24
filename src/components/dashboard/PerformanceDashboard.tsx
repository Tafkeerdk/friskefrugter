import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Activity, 
  Zap, 
  Globe, 
  Monitor, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  AlertTriangle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { debugPerformance, usePerformanceTracking } from '../../lib/performance';

interface PerformanceReport {
  timestamp: string;
  score: number;
  webVitals: Record<string, {
    value: number;
    rating: 'good' | 'needs-improvement' | 'poor';
    trend: 'improving' | 'stable' | 'degrading';
  }>;
  apiCalls: {
    total: number;
    slow: number;
    averageTime: number;
    errorRate: number;
    slowest: Array<{
      url: string;
      method: string;
      duration: number;
      status: number;
    }>;
  };
  components: {
    total: number;
    slow: number;
    slowest: Array<[string, number]>;
  };
  userInteractions: {
    total: number;
    recent: Array<{ action: string; timestamp: number }>;
    patterns: Array<[string, number]>;
  };
  recommendations: Array<{
    type: string;
    message: string;
    priority: 'high' | 'medium' | 'low';
    action?: string;
    endpoints?: string[];
    components?: string[];
    vitals?: string[];
  }>;
}

export const PerformanceDashboard: React.FC = () => {
  const [report, setReport] = useState<PerformanceReport | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  const { trackInteraction } = usePerformanceTracking('PerformanceDashboard');

  useEffect(() => {
    // Initial load
    refreshReport();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(refreshReport, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const refreshReport = () => {
    try {
      const newReport = debugPerformance.getReport();
      setReport(newReport);
      setLastUpdate(new Date());
      trackInteraction('refresh_report');
    } catch (error) {
      console.error('Failed to get performance report:', error);
    }
  };

  const startMonitoring = () => {
    debugPerformance.startMonitoring();
    setIsMonitoring(true);
    trackInteraction('start_monitoring');
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
    trackInteraction('stop_monitoring');
  };

  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'text-brand-primary';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number): 'default' | 'secondary' | 'destructive' => {
    if (score >= 90) return 'default';
    if (score >= 70) return 'secondary';
    return 'destructive';
  };

  const getWebVitalColor = (rating: string): string => {
    switch (rating) {
      case 'good': return 'text-brand-primary';
      case 'needs-improvement': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="w-4 h-4 text-brand-primary" />;
      case 'degrading': return <TrendingDown className="w-4 h-4 text-red-600" />;
      default: return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'medium': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      default: return <CheckCircle className="w-4 h-4 text-brand-primary" />;
    }
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  if (!report) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading performance data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Performance Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time performance monitoring and optimization insights
          </p>
          {lastUpdate && (
            <p className="text-sm text-muted-foreground">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={refreshReport}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={isMonitoring ? stopMonitoring : startMonitoring}
            variant={isMonitoring ? "destructive" : "default"}
            size="sm"
          >
            <Activity className="w-4 h-4 mr-2" />
            {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
          </Button>
        </div>
      </div>

      {/* Performance Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Overall Performance Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold">
              <span className={getScoreColor(report.score)}>{Math.round(report.score)}</span>
              <span className="text-lg text-muted-foreground">/100</span>
            </div>
            <div className="flex-1">
              <Progress value={report.score} className="h-3" />
            </div>
            <Badge variant={getScoreBadgeVariant(report.score)}>
              {report.score >= 90 ? 'Excellent' : report.score >= 70 ? 'Good' : 'Needs Work'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Web Vitals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Web Vitals
          </CardTitle>
          <CardDescription>
            Core Web Vitals measuring user experience quality
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {Object.entries(report.webVitals).map(([name, vital]) => (
              <div key={name} className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="font-semibold">{name}</span>
                  {getTrendIcon(vital.trend)}
                </div>
                <div className={`text-2xl font-bold ${getWebVitalColor(vital.rating)}`}>
                  {formatDuration(vital.value)}
                </div>
                <Badge 
                  variant={vital.rating === 'good' ? 'default' : vital.rating === 'needs-improvement' ? 'secondary' : 'destructive'}
                  className="text-xs"
                >
                  {vital.rating.replace('-', ' ')}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* API Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            API Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{report.apiCalls.total}</div>
              <div className="text-sm text-muted-foreground">Total Calls</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{report.apiCalls.slow}</div>
              <div className="text-sm text-muted-foreground">Slow Calls (&gt;1s)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{formatDuration(report.apiCalls.averageTime)}</div>
              <div className="text-sm text-muted-foreground">Average Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{report.apiCalls.errorRate.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Error Rate</div>
            </div>
          </div>
          
          {report.apiCalls.slowest.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Slowest API Calls</h4>
              <div className="space-y-2">
                {report.apiCalls.slowest.slice(0, 3).map((call, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                    <div>
                      <span className="font-mono text-sm">{call.method} {call.url}</span>
                      <Badge variant={call.status >= 400 ? 'destructive' : 'outline'} className="ml-2">
                        {call.status}
                      </Badge>
                    </div>
                    <span className="text-red-600 font-semibold">{formatDuration(call.duration)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Component Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            Component Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{report.components.total}</div>
              <div className="text-sm text-muted-foreground">Components Tracked</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{report.components.slow}</div>
              <div className="text-sm text-muted-foreground">Slow Renders (&gt;50ms)</div>
            </div>
          </div>
          
          {report.components.slowest.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Slowest Components</h4>
              <div className="space-y-2">
                {report.components.slowest.slice(0, 3).map(([name, duration], index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="font-mono text-sm">{name}</span>
                    <span className="text-red-600 font-semibold">{formatDuration(duration)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Interactions */}
      <Card>
        <CardHeader>
          <CardTitle>User Interactions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{report.userInteractions.total}</div>
              <div className="text-sm text-muted-foreground">Total Interactions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{report.userInteractions.recent.length}</div>
              <div className="text-sm text-muted-foreground">Recent (10s)</div>
            </div>
          </div>
          
          {report.userInteractions.patterns.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Interaction Patterns</h4>
              <div className="space-y-2">
                {report.userInteractions.patterns.slice(0, 5).map(([action, count], index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="font-mono text-sm">{action}</span>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recommendations */}
      {report.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Performance Recommendations</CardTitle>
            <CardDescription>
              Actionable insights to improve your application performance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {report.recommendations.map((rec, index) => (
              <Alert key={index} variant={rec.priority === 'high' ? 'destructive' : 'default'}>
                <div className="flex items-start gap-3">
                  {getPriorityIcon(rec.priority)}
                  <div className="flex-1">
                    <AlertDescription>
                      <div className="font-semibold mb-1">{rec.message}</div>
                      {rec.action && (
                        <div className="text-sm text-muted-foreground mb-2">{rec.action}</div>
                      )}
                      {rec.endpoints && (
                        <div className="text-xs">
                          <strong>Affected endpoints:</strong> {rec.endpoints.join(', ')}
                        </div>
                      )}
                      {rec.components && (
                        <div className="text-xs">
                          <strong>Affected components:</strong> {rec.components.join(', ')}
                        </div>
                      )}
                      {rec.vitals && (
                        <div className="text-xs">
                          <strong>Affected vitals:</strong> {rec.vitals.join(', ')}
                        </div>
                      )}
                    </AlertDescription>
                  </div>
                  <Badge variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'secondary' : 'outline'}>
                    {rec.priority}
                  </Badge>
                </div>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Debug Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Debug Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                debugPerformance.log();
                trackInteraction('debug_log');
              }}
              variant="outline"
              size="sm"
            >
              Log to Console
            </Button>
            <Button
              onClick={() => {
                const data = debugPerformance.exportData();
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `performance-data-${new Date().toISOString()}.json`;
                a.click();
                URL.revokeObjectURL(url);
                trackInteraction('export_data');
              }}
              variant="outline"
              size="sm"
            >
              Export Data
            </Button>
            <Button
              onClick={() => {
                debugPerformance.reset();
                refreshReport();
                trackInteraction('reset_metrics');
              }}
              variant="outline"
              size="sm"
            >
              Reset Metrics
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 