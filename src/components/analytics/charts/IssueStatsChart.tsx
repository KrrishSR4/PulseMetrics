import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface IssueStatsChartProps {
  open: number;
  closed: number;
  isLoading?: boolean;
}

export function IssueStatsChart({ open, closed, isLoading }: IssueStatsChartProps) {
  if (isLoading) {
    return (
      <div className="h-64 animate-pulse bg-muted rounded" />
    );
  }

  const data = [
    { name: 'Open', value: open, color: 'hsl(var(--warning))' },
    { name: 'Closed', value: closed, color: 'hsl(var(--success))' },
  ];

  const total = open + closed;
  const closedPercentage = total > 0 ? ((closed / total) * 100).toFixed(1) : '0';

  return (
    <div className="h-64 flex flex-col">
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 10, right: 30, left: 50, bottom: 10 }}>
            <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
            <YAxis 
              type="category" 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              width={60}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
                fontSize: '12px',
              }}
              formatter={(value: number) => [value.toLocaleString(), 'Issues']}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="text-center text-sm text-muted-foreground mt-2">
        {closedPercentage}% issues resolved ({closed.toLocaleString()} of {total.toLocaleString()})
      </div>
    </div>
  );
}
