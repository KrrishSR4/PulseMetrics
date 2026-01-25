import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ExportButtonsProps {
  resourceName: string;
  data: unknown;
  type: 'github' | 'website';
}

export function ExportButtons({ resourceName, data, type }: ExportButtonsProps) {
  const exportCSV = () => {
    if (!data) return;
    const rows = type === 'github' 
      ? [['Metric', 'Value'], ['Stars', (data as any).repoData?.stars], ['Forks', (data as any).repoData?.forks], ['Open Issues', (data as any).issueStats?.open]]
      : [['Metric', 'Value'], ['Status', (data as any).metrics?.status], ['Response Time', (data as any).metrics?.response_time_ms], ['Uptime', (data as any).uptimePercentage]];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${resourceName}-analytics.csv`;
    a.click();
  };

  return (
    <Button variant="outline" size="sm" onClick={exportCSV} disabled={!data}>
      <Download className="h-4 w-4 mr-2" />
      Export CSV
    </Button>
  );
}
