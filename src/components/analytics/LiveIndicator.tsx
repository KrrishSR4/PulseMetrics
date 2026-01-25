import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface LiveIndicatorProps {
  lastUpdated: string | null;
  isRefetching?: boolean;
}

export function LiveIndicator({ lastUpdated, isRefetching }: LiveIndicatorProps) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span className="relative flex h-2 w-2">
        <span className={cn(
          "absolute inline-flex h-full w-full rounded-full bg-success",
          isRefetching && "animate-ping opacity-75"
        )} />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
      </span>
      <span>
        {isRefetching ? 'Updating...' : (
          lastUpdated
            ? `Updated ${formatDistanceToNow(new Date(lastUpdated), { addSuffix: true })}`
            : 'Live'
        )}
      </span>
    </div>
  );
}
