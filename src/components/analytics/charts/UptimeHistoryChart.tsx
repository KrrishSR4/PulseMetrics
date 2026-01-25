import { format, parseISO } from 'date-fns';

interface UptimeHistoryChartProps {
  data: { timestamp: string; status: 'up' | 'down'; response_time_ms: number | null }[];
  isLoading?: boolean;
}

export function UptimeHistoryChart({ data, isLoading }: UptimeHistoryChartProps) {
  if (isLoading) {
    return (
      <div className="h-20 animate-pulse bg-muted rounded" />
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-20 flex items-center justify-center text-muted-foreground">
        No uptime data available
      </div>
    );
  }

  // Take last 96 data points (24 hours at 15-min intervals)
  const displayData = data.slice(-96);
  
  const upCount = displayData.filter(d => d.status === 'up').length;
  const uptimePercentage = ((upCount / displayData.length) * 100).toFixed(2);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 h-12 overflow-hidden">
        {displayData.map((point, index) => (
          <div
            key={index}
            className={`flex-1 h-full rounded-sm transition-colors ${
              point.status === 'up' 
                ? 'bg-success hover:bg-success/80' 
                : 'bg-destructive hover:bg-destructive/80'
            }`}
            title={`${format(parseISO(point.timestamp), 'MMM d, HH:mm')} - ${point.status.toUpperCase()}${
              point.response_time_ms ? ` (${point.response_time_ms}ms)` : ''
            }`}
          />
        ))}
      </div>
      
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{format(parseISO(displayData[0]?.timestamp || new Date().toISOString()), 'MMM d, HH:mm')}</span>
        <span className="font-medium text-foreground">{uptimePercentage}% uptime</span>
        <span>{format(parseISO(displayData[displayData.length - 1]?.timestamp || new Date().toISOString()), 'MMM d, HH:mm')}</span>
      </div>
      
      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-success" />
          <span className="text-muted-foreground">Up</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-destructive" />
          <span className="text-muted-foreground">Down</span>
        </div>
      </div>
    </div>
  );
}
