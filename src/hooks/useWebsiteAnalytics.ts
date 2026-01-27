import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { WebsiteMetrics, UptimeHistory, WebsitePerformance } from '@/types/analytics';

interface WebsiteAnalyticsResult {
  metrics: WebsiteMetrics;
  performance: WebsitePerformance | null;
  uptimeHistory: UptimeHistory[];
  uptimePercentage: number;
  avgResponseTime: number;
  lastUpdated: string;
  error: string | null;
}

export function useWebsiteAnalytics(url: string | null, enabled: boolean = true) {
  return useQuery({
    queryKey: ['website-analytics', url],
    queryFn: async (): Promise<WebsiteAnalyticsResult> => {
      if (!url) throw new Error('No URL provided');

      const { data, error } = await supabase.functions.invoke('website-monitor', {
        body: { url },
      });

      if (error) throw error;
      return data;
    },
    enabled: !!url && enabled,
    refetchInterval: 5000, // Refetch every 5 seconds for real-time monitoring
    staleTime: 2500,
  });
}

export function useWebsiteRealtimePolling(url: string | null, intervalMs: number = 5000) {
  return useQuery({
    queryKey: ['website-realtime', url],
    queryFn: async (): Promise<WebsiteAnalyticsResult> => {
      if (!url) throw new Error('No URL provided');

      const { data, error } = await supabase.functions.invoke('website-monitor', {
        body: { url },
      });

      if (error) throw error;
      return data;
    },
    enabled: !!url,
    refetchInterval: intervalMs,
    staleTime: intervalMs / 2,
  });
}
