interface HealthScoreGaugeProps {
  score: number;
  factors: { name: string; value: number; weight: number }[];
  isLoading?: boolean;
}

export function HealthScoreGauge({ score, factors, isLoading }: HealthScoreGaugeProps) {
  if (isLoading) return <div className="h-32 bg-muted rounded animate-pulse" />;
  const color = score >= 80 ? 'text-success' : score >= 50 ? 'text-warning' : 'text-destructive';
  return (
    <div className="text-center">
      <div className={`text-5xl font-bold ${color}`}>{score}</div>
      <p className="text-sm text-muted-foreground mt-1">Health Score</p>
      <div className="mt-4 space-y-2">
        {factors.map(f => (
          <div key={f.name} className="flex items-center gap-2 text-xs">
            <span className="w-24 text-left text-muted-foreground">{f.name}</span>
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary" style={{ width: `${f.value}%` }} />
            </div>
            <span className="w-8 text-right">{Math.round(f.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
