import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { extractRepoInfo } from '@/lib/url-detector';
import type { GitHubRepoData, GitHubCommitActivity, GitHubContributor, GitHubIssueStats, GitHubWorkflowRun, HealthScore } from '@/types/analytics';

interface GitHubAnalyticsResult {
  repoData: GitHubRepoData | null;
  commitActivity: GitHubCommitActivity[];
  contributors: GitHubContributor[];
  issueStats: GitHubIssueStats;
  workflowRuns: GitHubWorkflowRun[];
  healthScore: HealthScore;
  lastUpdated: string;
  error: string | null;
}

export function useGitHubAnalytics(url: string | null, enabled: boolean = true) {
  return useQuery({
    queryKey: ['github-analytics', url],
    queryFn: async (): Promise<GitHubAnalyticsResult> => {
      if (!url) throw new Error('No URL provided');
      
      const repoInfo = extractRepoInfo(url);
      if (!repoInfo) throw new Error('Invalid GitHub URL');

      const { data, error } = await supabase.functions.invoke('github-analytics', {
        body: { owner: repoInfo.owner, repo: repoInfo.repo },
      });

      if (error) throw error;
      return data;
    },
    enabled: !!url && enabled,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
  });
}

export function useGitHubRealtimePolling(url: string | null, intervalMs: number = 30000) {
  return useQuery({
    queryKey: ['github-realtime', url],
    queryFn: async (): Promise<GitHubAnalyticsResult> => {
      if (!url) throw new Error('No URL provided');
      
      const repoInfo = extractRepoInfo(url);
      if (!repoInfo) throw new Error('Invalid GitHub URL');

      const { data, error } = await supabase.functions.invoke('github-analytics', {
        body: { owner: repoInfo.owner, repo: repoInfo.repo },
      });

      if (error) throw error;
      return data;
    },
    enabled: !!url,
    refetchInterval: intervalMs,
    staleTime: intervalMs / 2,
  });
}
