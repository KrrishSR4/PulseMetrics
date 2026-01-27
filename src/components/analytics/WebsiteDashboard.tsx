import { useEffect, useRef } from 'react';
import { Globe, Clock, Activity, Zap, AlertTriangle, CheckCircle, TrendingUp, Server } from 'lucide-react';
import { MetricCard } from './MetricCard';
import { StatusBadge } from './StatusBadge';
import { LiveIndicator } from './LiveIndicator';
import { ResponseTimeChart } from './charts/ResponseTimeChart';
import { UptimeHistoryChart } from './charts/UptimeHistoryChart';
import { PerformanceBreakdown } from './PerformanceBreakdown';
import { ExportButtons } from './ExportButtons';
import { NotificationToggle } from './NotificationToggle';
import { useWebsiteAnalytics } from '@/hooks/useWebsiteAnalytics';
import { useNotifications } from '@/hooks/useNotifications';
import type { TrackedResource } from '@/types/analytics';

interface WebsiteDashboardProps {
  resource: TrackedResource;
}

export function WebsiteDashboard({ resource }: WebsiteDashboardProps) {
  const { data, isLoading, isFetching, error } = useWebsiteAnalytics(resource.url);
  const { notifyWebsiteDown, notifyResponseTimeSpike } = useNotifications();
  const previousStatusRef = useRef<'up' | 'down' | 'unknown' | null>(null);
  const previousResponseTimeRef = useRef<number | null>(null);

  // Check for status changes and trigger notifications
  useEffect(() => {
    if (!resource.notifications_enabled || !data?.metrics) return;

    const currentStatus = data.metrics.status;
    const currentResponseTime = data.metrics.response_time_ms;

    // Notify if website goes down
    if (previousStatusRef.current === 'up' && currentStatus === 'down') {
      notifyWebsiteDown(resource.name, resource.url);
    }

    // Notify if response time spikes (>3x previous or >2000ms)
    const threshold = 2000;
    if (
      currentResponseTime && 
      previousResponseTimeRef.current && 
      currentResponseTime > threshold &&
      currentResponseTime > previousResponseTimeRef.current * 3
    ) {
      notifyResponseTimeSpike(resource.name, currentResponseTime, threshold);
    }

    previousStatusRef.current = currentStatus;
    if (currentResponseTime) {
      previousResponseTimeRef.current = currentResponseTime;
    }
  }, [data?.metrics, resource.notifications_enabled, resource.name, resource.url, notifyWebsiteDown, notifyResponseTimeSpike]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-semibold mb-2">Unable to Monitor Website</h3>
        <p className="text-muted-foreground max-w-md">
          {error instanceof Error ? error.message : 'Failed to fetch website analytics'}
        </p>
      </div>
    );
  }

  const responseTimeStatus = data?.metrics?.response_time_ms
    ? data.metrics.response_time_ms < 500
      ? 'success'
      : data.metrics.response_time_ms < 1500
        ? 'warning'
        : 'error'
    : 'neutral';

  const uptimeStatus = data?.uptimePercentage
    ? data.uptimePercentage >= 99.5
      ? 'success'
      : data.uptimePercentage >= 95
        ? 'warning'
        : 'error'
    : 'neutral';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <StatusBadge 
            status={data?.metrics?.status === 'up' ? 'up' : data?.metrics?.status === 'down' ? 'down' : 'unknown'} 
          />
          <LiveIndicator lastUpdated={data?.lastUpdated || null} isRefetching={isFetching} />
        </div>
        <div className="flex items-center gap-2">
          <NotificationToggle resource={resource} />
          <ExportButtons 
            resourceName={resource.name} 
            data={data} 
            type="website"
          />
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Status"
          value={data?.metrics?.status === 'up' ? 'Online' : data?.metrics?.status === 'down' ? 'Offline' : 'Unknown'}
          subtitle={data?.metrics?.status_code ? `HTTP ${data.metrics.status_code}` : undefined}
          icon={data?.metrics?.status === 'up' ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          status={data?.metrics?.status === 'up' ? 'success' : data?.metrics?.status === 'down' ? 'error' : 'neutral'}
          isLoading={isLoading}
          unavailable={!data?.metrics}
        />
        <MetricCard
          title="Response Time"
          value={data?.metrics?.response_time_ms ? `${data.metrics.response_time_ms}ms` : '—'}
          icon={<Clock className="h-4 w-4" />}
          status={responseTimeStatus}
          isLoading={isLoading}
          unavailable={data?.metrics?.response_time_ms === null}
        />
        <MetricCard
          title="Uptime (24h)"
          value={data?.uptimePercentage !== undefined ? `${data.uptimePercentage.toFixed(2)}%` : '—'}
          icon={<Activity className="h-4 w-4" />}
          status={uptimeStatus}
          isLoading={isLoading}
          unavailable={data?.uptimePercentage === undefined}
        />
        <MetricCard
          title="Avg Response"
          value={data?.avgResponseTime ? `${data.avgResponseTime}ms` : '—'}
          icon={<TrendingUp className="h-4 w-4" />}
          isLoading={isLoading}
          unavailable={!data?.avgResponseTime}
        />
      </div>

      {/* SSL & Additional Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="SSL Certificate"
          value={data?.metrics?.ssl_valid === true ? 'Valid' : data?.metrics?.ssl_valid === false ? 'Invalid' : 'N/A'}
          icon={<Server className="h-4 w-4" />}
          status={data?.metrics?.ssl_valid === true ? 'success' : data?.metrics?.ssl_valid === false ? 'error' : 'neutral'}
          isLoading={isLoading}
          unavailable={data?.metrics?.ssl_valid === null}
        />
        <MetricCard
          title="Last Checked"
          value={data?.metrics?.last_checked 
            ? new Date(data.metrics.last_checked).toLocaleTimeString() 
            : '—'}
          icon={<Clock className="h-4 w-4" />}
          isLoading={isLoading}
          unavailable={!data?.metrics?.last_checked}
        />
        <MetricCard
          title="Total Time (TTFB)"
          value={data?.performance?.ttfb_ms ? `${data.performance.ttfb_ms}ms` : '—'}
          subtitle="Time to First Byte"
          icon={<Zap className="h-4 w-4" />}
          isLoading={isLoading}
          unavailable={!data?.performance}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-md p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Response Time History</h3>
          <ResponseTimeChart 
            data={data?.uptimeHistory || []} 
            isLoading={isLoading}
          />
        </div>
        
        <div className="bg-card border border-border rounded-md p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Uptime History (24h)</h3>
          <UptimeHistoryChart 
            data={data?.uptimeHistory || []}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Performance Breakdown */}
      <div className="bg-card border border-border rounded-md p-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-4">Performance Breakdown</h3>
        <PerformanceBreakdown 
          performance={data?.performance || null}
          isLoading={isLoading}
        />
      </div>

      {/* Error Display */}
      {data?.metrics?.error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-destructive">Connection Error</h4>
              <p className="text-sm text-destructive/80 mt-1">{data.metrics.error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
