import { Star, GitFork, Eye, AlertCircle, Clock, Activity, Users, GitBranch, CheckCircle, XCircle } from 'lucide-react';
import { MetricCard } from './MetricCard';
import { StatusBadge } from './StatusBadge';
import { LiveIndicator } from './LiveIndicator';
import { CommitActivityChart } from './charts/CommitActivityChart';
import { IssueStatsChart } from './charts/IssueStatsChart';
import { ContributorsList } from './ContributorsList';
import { WorkflowRunsList } from './WorkflowRunsList';
import { HealthScoreGauge } from './HealthScoreGauge';
import { ExportButtons } from './ExportButtons';
import { useGitHubAnalytics } from '@/hooks/useGitHubAnalytics';
import type { TrackedResource } from '@/types/analytics';

interface GitHubDashboardProps {
  resource: TrackedResource;
}

export function GitHubDashboard({ resource }: GitHubDashboardProps) {
  const { data, isLoading, isFetching, error } = useGitHubAnalytics(resource.url);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-semibold mb-2">Unable to Load Repository Data</h3>
        <p className="text-muted-foreground max-w-md">
          {error instanceof Error ? error.message : 'Failed to fetch repository analytics'}
        </p>
      </div>
    );
  }

  const healthStatus = data?.healthScore?.score 
    ? data.healthScore.score >= 80 
      ? 'healthy' 
      : data.healthScore.score >= 50 
        ? 'degraded' 
        : 'critical'
    : 'unknown';

  const failedWorkflows = data?.workflowRuns?.filter(r => r.conclusion === 'failure').length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <StatusBadge status={healthStatus} />
          <LiveIndicator lastUpdated={data?.lastUpdated || null} isRefetching={isFetching} />
        </div>
        <ExportButtons 
          resourceName={resource.name} 
          data={data} 
          type="github"
        />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <MetricCard
          title="Stars"
          value={data?.repoData?.stars?.toLocaleString() || '—'}
          icon={<Star className="h-4 w-4" />}
          isLoading={isLoading}
          unavailable={!data?.repoData}
        />
        <MetricCard
          title="Forks"
          value={data?.repoData?.forks?.toLocaleString() || '—'}
          icon={<GitFork className="h-4 w-4" />}
          isLoading={isLoading}
          unavailable={!data?.repoData}
        />
        <MetricCard
          title="Watchers"
          value={data?.repoData?.watchers?.toLocaleString() || '—'}
          icon={<Eye className="h-4 w-4" />}
          isLoading={isLoading}
          unavailable={!data?.repoData}
        />
        <MetricCard
          title="Open Issues"
          value={data?.issueStats?.open?.toLocaleString() || '—'}
          icon={<AlertCircle className="h-4 w-4" />}
          status={data?.issueStats?.open && data.issueStats.open > 50 ? 'warning' : 'neutral'}
          isLoading={isLoading}
          unavailable={!data?.issueStats}
        />
        <MetricCard
          title="Contributors"
          value={data?.contributors?.length?.toString() || '—'}
          subtitle="Top 10"
          icon={<Users className="h-4 w-4" />}
          isLoading={isLoading}
          unavailable={!data?.contributors}
        />
        <MetricCard
          title="CI Status"
          value={failedWorkflows === 0 ? 'Passing' : `${failedWorkflows} Failed`}
          icon={failedWorkflows === 0 ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          status={failedWorkflows === 0 ? 'success' : 'error'}
          isLoading={isLoading}
          unavailable={!data?.workflowRuns || data.workflowRuns.length === 0}
        />
      </div>

      {/* Health Score & Repository Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-md p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Repository Health</h3>
          <HealthScoreGauge 
            score={data?.healthScore?.score || 0} 
            factors={data?.healthScore?.factors || []}
            isLoading={isLoading}
          />
        </div>
        
        <div className="bg-card border border-border rounded-md p-6 lg:col-span-2">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Repository Info</h3>
          {isLoading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/2" />
              <div className="h-4 bg-muted rounded w-2/3" />
            </div>
          ) : data?.repoData ? (
            <div className="space-y-3 text-sm">
              {data.repoData.description && (
                <p className="text-muted-foreground">{data.repoData.description}</p>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-muted-foreground">Language:</span>
                  <span className="ml-2 font-medium">{data.repoData.language || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">License:</span>
                  <span className="ml-2 font-medium">{data.repoData.license || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Default Branch:</span>
                  <span className="ml-2 font-mono text-xs bg-secondary px-1.5 py-0.5 rounded">
                    {data.repoData.default_branch}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Size:</span>
                  <span className="ml-2 font-medium">{(data.repoData.size / 1024).toFixed(1)} MB</span>
                </div>
              </div>
              {data.repoData.topics && data.repoData.topics.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {data.repoData.topics.slice(0, 8).map((topic) => (
                    <span 
                      key={topic}
                      className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">Data unavailable</p>
          )}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-md p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Commit Activity (Last 4 Weeks)</h3>
          <CommitActivityChart 
            data={data?.commitActivity || []} 
            isLoading={isLoading}
          />
        </div>
        
        <div className="bg-card border border-border rounded-md p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Issue Statistics</h3>
          <IssueStatsChart 
            open={data?.issueStats?.open || 0}
            closed={data?.issueStats?.closed || 0}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Contributors & Workflows */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-md p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Top Contributors</h3>
          <ContributorsList 
            contributors={data?.contributors || []} 
            isLoading={isLoading}
          />
        </div>
        
        <div className="bg-card border border-border rounded-md p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Recent Workflow Runs</h3>
          <WorkflowRunsList 
            runs={data?.workflowRuns || []} 
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
