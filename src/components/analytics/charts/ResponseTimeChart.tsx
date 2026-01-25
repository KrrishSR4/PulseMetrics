import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { format, parseISO } from 'date-fns';

interface ResponseTimeChartProps {
  data: { timestamp: string; response_time_ms: number | null }[];
  isLoading?: boolean;
}

export function ResponseTimeChart({ data, isLoading }: ResponseTimeChartProps) {
  if (isLoading) {
    return (
      <div className="h-64 animate-pulse bg-muted rounded" />
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        No response time data available
      </div>
    );
  }

  const formattedData = data
    .filter(d => d.response_time_ms !== null)
    .map(d => ({
      ...d,
      formattedTime: format(parseISO(d.timestamp), 'HH:mm'),
      responseTime: d.response_time_ms,
    }));

  const avgResponseTime = formattedData.reduce((sum, d) => sum + (d.responseTime || 0), 0) / formattedData.length;

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={formattedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="formattedTime"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
            interval="preserveStartEnd"
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
            width={40}
            tickFormatter={(value) => `${value}ms`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px',
              fontSize: '12px',
            }}
            labelFormatter={(label) => `Time: ${label}`}
            formatter={(value: number) => [`${value}ms`, 'Response Time']}
          />
          <ReferenceLine 
            y={avgResponseTime} 
            stroke="hsl(var(--muted-foreground))" 
            strokeDasharray="5 5"
            label={{ 
              value: `Avg: ${Math.round(avgResponseTime)}ms`, 
              fill: 'hsl(var(--muted-foreground))',
              fontSize: 10,
              position: 'right'
            }}
          />
          <Line
            type="monotone"
            dataKey="responseTime"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: 'hsl(var(--primary))' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
