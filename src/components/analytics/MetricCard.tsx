import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  status?: 'success' | 'warning' | 'error' | 'neutral';
  isLoading?: boolean;
  unavailable?: boolean;
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  status = 'neutral',
  isLoading,
  unavailable,
}: MetricCardProps) {
  const statusColors = {
    success: 'border-l-success',
    warning: 'border-l-warning',
    error: 'border-l-destructive',
    neutral: 'border-l-border',
  };

  const trendColors = {
    up: 'text-success',
    down: 'text-destructive',
    neutral: 'text-muted-foreground',
  };

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-md p-4 animate-pulse">
        <div className="h-4 bg-muted rounded w-24 mb-2" />
        <div className="h-8 bg-muted rounded w-16 mb-1" />
        <div className="h-3 bg-muted rounded w-20" />
      </div>
    );
  }

  return (
    <div className={cn(
      "bg-card border border-border rounded-md p-4 border-l-2",
      statusColors[status]
    )}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
            {title}
          </p>
          <p className={cn(
            "text-2xl font-semibold tracking-tight",
            unavailable && "text-muted-foreground italic"
          )}>
            {unavailable ? 'N/A' : value}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          )}
          {trend && trendValue && !unavailable && (
            <div className={cn("flex items-center gap-1 mt-1", trendColors[trend])}>
              <TrendIcon className="h-3 w-3" />
              <span className="text-xs font-medium">{trendValue}</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="text-muted-foreground">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
