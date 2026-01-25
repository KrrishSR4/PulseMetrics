import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: 'up' | 'down' | 'unknown' | 'healthy' | 'degraded' | 'critical';
  label?: string;
  pulse?: boolean;
}

export function StatusBadge({ status, label, pulse = true }: StatusBadgeProps) {
  const statusConfig = {
    up: { color: 'bg-success', text: 'Up', textColor: 'text-success' },
    healthy: { color: 'bg-success', text: 'Healthy', textColor: 'text-success' },
    down: { color: 'bg-destructive', text: 'Down', textColor: 'text-destructive' },
    critical: { color: 'bg-destructive', text: 'Critical', textColor: 'text-destructive' },
    degraded: { color: 'bg-warning', text: 'Degraded', textColor: 'text-warning' },
    unknown: { color: 'bg-muted-foreground', text: 'Unknown', textColor: 'text-muted-foreground' },
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-2">
      <span className="relative flex h-2.5 w-2.5">
        {pulse && (status === 'up' || status === 'healthy') && (
          <span className={cn(
            "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
            config.color
          )} />
        )}
        <span className={cn(
          "relative inline-flex rounded-full h-2.5 w-2.5",
          config.color
        )} />
      </span>
      <span className={cn("text-sm font-medium", config.textColor)}>
        {label || config.text}
      </span>
    </div>
  );
}
