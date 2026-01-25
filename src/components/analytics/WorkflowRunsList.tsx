import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { GitHubWorkflowRun } from '@/types/analytics';

interface WorkflowRunsListProps {
  runs: GitHubWorkflowRun[];
  isLoading?: boolean;
}

export function WorkflowRunsList({ runs, isLoading }: WorkflowRunsListProps) {
  if (isLoading) {
    return <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-muted rounded animate-pulse" />)}</div>;
  }
  if (!runs.length) return <p className="text-muted-foreground text-sm">No workflow data available</p>;
  return (
    <div className="space-y-2">
      {runs.slice(0, 5).map(run => (
        <div key={run.id} className="flex items-center gap-3 p-2 rounded hover:bg-muted/50">
          {run.conclusion === 'success' ? <CheckCircle className="h-4 w-4 text-success" /> : run.conclusion === 'failure' ? <XCircle className="h-4 w-4 text-destructive" /> : <Clock className="h-4 w-4 text-warning" />}
          <span className="text-sm flex-1 truncate">{run.name}</span>
          <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(run.created_at), { addSuffix: true })}</span>
        </div>
      ))}
    </div>
  );
}
