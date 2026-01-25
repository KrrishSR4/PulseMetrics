import type { WebsitePerformance } from '@/types/analytics';

interface PerformanceBreakdownProps {
  performance: WebsitePerformance | null;
  isLoading?: boolean;
}

export function PerformanceBreakdown({ performance, isLoading }: PerformanceBreakdownProps) {
  if (isLoading) return <div className="h-20 bg-muted rounded animate-pulse" />;
  if (!performance) return <p className="text-muted-foreground text-sm">Performance data unavailable</p>;
  
  const segments = [
    { name: 'DNS', value: performance.dns_time_ms, color: 'bg-chart-1' },
    { name: 'Connect', value: performance.connect_time_ms, color: 'bg-chart-2' },
    { name: 'TTFB', value: performance.ttfb_ms, color: 'bg-chart-3' },
    { name: 'Download', value: performance.download_time_ms, color: 'bg-chart-4' },
  ];
  const total = performance.total_time_ms;
  
  return (
    <div className="space-y-3">
      <div className="flex h-4 rounded overflow-hidden">
        {segments.map(s => (
          <div key={s.name} className={`${s.color}`} style={{ width: `${(s.value / total) * 100}%` }} title={`${s.name}: ${s.value}ms`} />
        ))}
      </div>
      <div className="flex flex-wrap gap-4 text-xs">
        {segments.map(s => (
          <div key={s.name} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded ${s.color}`} />
            <span className="text-muted-foreground">{s.name}:</span>
            <span className="font-medium">{s.value}ms</span>
          </div>
        ))}
      </div>
    </div>
  );
}
