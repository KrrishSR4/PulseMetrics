import type { GitHubContributor } from '@/types/analytics';

interface ContributorsListProps {
  contributors: GitHubContributor[];
  isLoading?: boolean;
}

export function ContributorsList({ contributors, isLoading }: ContributorsListProps) {
  if (isLoading) {
    return <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-muted rounded animate-pulse" />)}</div>;
  }
  if (!contributors.length) return <p className="text-muted-foreground text-sm">No contributor data</p>;
  return (
    <div className="space-y-2">
      {contributors.slice(0, 5).map(c => (
        <div key={c.login} className="flex items-center gap-3 p-2 rounded hover:bg-muted/50">
          <img src={c.avatar_url} alt={c.login} className="w-8 h-8 rounded-full" />
          <span className="font-medium text-sm flex-1">{c.login}</span>
          <span className="text-xs text-muted-foreground">{c.contributions} commits</span>
        </div>
      ))}
    </div>
  );
}
