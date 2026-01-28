const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GitHubRepoData {
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

async function fetchGitHubAPI(endpoint: string): Promise<Response> {
  const response = await fetch(`https://api.github.com${endpoint}`, {
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Lovable-Analytics',
    },
  });
  return response;
}

async function getRepoData(owner: string, repo: string): Promise<GitHubRepoData | null> {
  const response = await fetchGitHubAPI(`/repos/${owner}/${repo}`);
  
  if (!response.ok) {
    console.error('Failed to fetch repo data:', response.status);
    return null;
  }
  
  const data = await response.json();
  
  return {
    name: data.name,
    full_name: data.full_name,
    description: data.description,
    stars: data.stargazers_count,
    forks: data.forks_count,
    watchers: data.watchers_count,
    open_issues: data.open_issues_count,
    language: data.language,
    created_at: data.created_at,
    updated_at: data.updated_at,
    pushed_at: data.pushed_at,
    default_branch: data.default_branch,
    license: data.license?.name || null,
    topics: data.topics || [],
    size: data.size,
    subscribers_count: data.subscribers_count,
    network_count: data.network_count,
  };
}

async function getCommitActivity(owner: string, repo: string) {
  const response = await fetchGitHubAPI(`/repos/${owner}/${repo}/stats/commit_activity`);
  
  if (!response.ok) {
    console.error('Failed to fetch commit activity:', response.status);
    return [];
  }
  
  const data = await response.json();
  
  if (!Array.isArray(data)) {
    return [];
  }
  
  // Transform weekly data to daily data for the last 4 weeks
  const dailyData: { date: string; count: number }[] = [];
  const recentWeeks = data.slice(-4);
  
  for (const week of recentWeeks) {
    const weekStart = new Date(week.week * 1000);
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      dailyData.push({
        date: date.toISOString().split('T')[0],
        count: week.days[i] || 0,
      });
    }
  }
  
  return dailyData;
}

async function getContributors(owner: string, repo: string) {
  const response = await fetchGitHubAPI(`/repos/${owner}/${repo}/contributors?per_page=10`);
  
  if (!response.ok) {
    console.error('Failed to fetch contributors:', response.status);
    return [];
  }
  
  const data = await response.json();
  
  if (!Array.isArray(data)) {
    return [];
  }
  
  return data.map((c: { login: string; avatar_url: string; contributions: number }) => ({
    login: c.login,
    avatar_url: c.avatar_url,
    contributions: c.contributions,
  }));
}

async function getIssueStats(owner: string, repo: string) {
  const [openRes, closedRes] = await Promise.all([
    fetchGitHubAPI(`/repos/${owner}/${repo}/issues?state=open&per_page=1`),
    fetchGitHubAPI(`/repos/${owner}/${repo}/issues?state=closed&per_page=1`),
  ]);
  
  // Extract counts from Link header or use repo data
  let open = 0;
  let closed = 0;
  
  // Try to parse Link header for pagination info
  const openLink = openRes.headers.get('Link');
  const closedLink = closedRes.headers.get('Link');
  
  if (openLink) {
    const match = openLink.match(/page=(\d+)>; rel="last"/);
    if (match) open = parseInt(match[1], 10);
    else if (openRes.ok) {
      const data = await openRes.json();
      open = Array.isArray(data) ? data.length : 0;
    }
  } else if (openRes.ok) {
    const data = await openRes.json();
    open = Array.isArray(data) ? data.length : 0;
  }
  
  if (closedLink) {
    const match = closedLink.match(/page=(\d+)>; rel="last"/);
    if (match) closed = parseInt(match[1], 10);
    else if (closedRes.ok) {
      const data = await closedRes.json();
      closed = Array.isArray(data) ? data.length : 0;
    }
  } else if (closedRes.ok) {
    const data = await closedRes.json();
    closed = Array.isArray(data) ? data.length : 0;
  }
  
  return { open, closed };
}

async function getWorkflowRuns(owner: string, repo: string) {
  const response = await fetchGitHubAPI(`/repos/${owner}/${repo}/actions/runs?per_page=10`);
  
  if (!response.ok) {
    // This might fail for repos without actions or without permission
    return [];
  }
  
  const data = await response.json();
  
  if (!data.workflow_runs || !Array.isArray(data.workflow_runs)) {
    return [];
  }
  
  return data.workflow_runs.map((run: { 
    id: number; 
    name: string; 
    status: string; 
    conclusion: string | null;
    created_at: string;
    updated_at: string;
  }) => ({
    id: run.id,
    name: run.name,
    status: run.status,
    conclusion: run.conclusion,
    created_at: run.created_at,
    updated_at: run.updated_at,
  }));
}

function calculateHealthScore(
  repoData: GitHubRepoData | null,
  commitActivity: { date: string; count: number }[],
  issueStats: { open: number; closed: number },
  workflowRuns: { conclusion: string | null }[]
) {
  const factors: { name: string; value: number; weight: number }[] = [];
  
  // Activity score (based on recent commits)
  const recentCommits = commitActivity.slice(-14).reduce((sum, d) => sum + d.count, 0);
  const activityScore = Math.min(100, (recentCommits / 20) * 100);
  factors.push({ name: 'Activity', value: activityScore, weight: 0.25 });
  
  // Community score (stars, forks)
  const communityScore = repoData 
    ? Math.min(100, ((repoData.stars + repoData.forks * 2) / 500) * 100)
    : 0;
  factors.push({ name: 'Community', value: communityScore, weight: 0.2 });
  
  // Issue health (closed vs open ratio)
  const totalIssues = issueStats.open + issueStats.closed;
  const issueHealthScore = totalIssues > 0 
    ? (issueStats.closed / totalIssues) * 100 
    : 100;
  factors.push({ name: 'Issue Management', value: issueHealthScore, weight: 0.25 });
  
  // CI health (workflow success rate)
  const recentRuns = workflowRuns.slice(0, 10);
  const successfulRuns = recentRuns.filter(r => r.conclusion === 'success').length;
  const ciHealthScore = recentRuns.length > 0 
    ? (successfulRuns / recentRuns.length) * 100 
    : 100;
  factors.push({ name: 'CI Health', value: ciHealthScore, weight: 0.3 });
  
  // Calculate weighted average
  const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
  const weightedSum = factors.reduce((sum, f) => sum + f.value * f.weight, 0);
  const score = Math.round(weightedSum / totalWeight);
  
  return { score, factors };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { owner, repo } = await req.json();
    
    if (!owner || !repo) {
      return new Response(
        JSON.stringify({ error: 'Owner and repo are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch all data in parallel
    const [repoData, commitActivity, contributors, issueStats, workflowRuns] = await Promise.all([
      getRepoData(owner, repo),
      getCommitActivity(owner, repo),
      getContributors(owner, repo),
      getIssueStats(owner, repo),
      getWorkflowRuns(owner, repo),
    ]);

    if (!repoData) {
      return new Response(
        JSON.stringify({ error: 'Repository not found or inaccessible' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const healthScore = calculateHealthScore(repoData, commitActivity, issueStats, workflowRuns);

    const result = {
      repoData,
      commitActivity,
      contributors,
      issueStats,
      workflowRuns,
      healthScore,
      lastUpdated: new Date().toISOString(),
      error: null,
    };

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error in github-analytics:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
