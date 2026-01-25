export type ResourceType = 'github' | 'website';

export interface TrackedResource {
  id: string;
  url: string;
  resource_type: ResourceType;
  name: string;
  created_at: string;
  updated_at: string;
  notifications_enabled: boolean;
  last_checked_at: string | null;
  metadata: Record<string, unknown>;
}

export interface AnalyticsSnapshot {
  id: string;
  resource_id: string;
  snapshot_type: string;
  data: Record<string, unknown>;
  created_at: string;
}

export interface GitHubRepoData {
  name: string;
  full_name: string;
  description: string | null;
  stars: number;
  forks: number;
  watchers: number;
  open_issues: number;
  language: string | null;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  default_branch: string;
  license: string | null;
  topics: string[];
  size: number;
  subscribers_count: number;
  network_count: number;
}

export interface GitHubCommitActivity {
  date: string;
  count: number;
}

export interface GitHubIssueStats {
  open: number;
  closed: number;
}

export interface GitHubContributor {
  login: string;
  avatar_url: string;
  contributions: number;
}

export interface GitHubWorkflowRun {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  created_at: string;
  updated_at: string;
}

export interface WebsiteMetrics {
  url: string;
  status: 'up' | 'down' | 'unknown';
  status_code: number | null;
  response_time_ms: number | null;
  ssl_valid: boolean | null;
  ssl_expiry: string | null;
  last_checked: string;
  error: string | null;
}

export interface WebsitePerformance {
  dns_time_ms: number;
  connect_time_ms: number;
  ttfb_ms: number;
  download_time_ms: number;
  total_time_ms: number;
}

export interface UptimeHistory {
  timestamp: string;
  status: 'up' | 'down';
  response_time_ms: number | null;
}

export interface HealthScore {
  score: number;
  factors: {
    name: string;
    value: number;
    weight: number;
  }[];
}

export interface NotificationEvent {
  id: string;
  resource_id: string;
  type: 'website_down' | 'response_time_spike' | 'error_rate_increase' | 'ci_failure' | 'critical_issue';
  message: string;
  created_at: string;
  acknowledged: boolean;
}
