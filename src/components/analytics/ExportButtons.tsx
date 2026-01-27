import { FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { exportGitHubToPDF, exportWebsiteToPDF } from '@/lib/pdf-export';

interface ExportButtonsProps {
  resourceName: string;
  data: unknown;
  type: 'github' | 'website';
}

export function ExportButtons({ resourceName, data, type }: ExportButtonsProps) {
  const handleExport = () => {
    if (!data) return;
    
    if (type === 'github') {
      exportGitHubToPDF(resourceName, data as Parameters<typeof exportGitHubToPDF>[1]);
    } else {
      exportWebsiteToPDF(resourceName, data as Parameters<typeof exportWebsiteToPDF>[1]);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={!data}>
      <FileDown className="h-4 w-4 mr-2" />
      Export PDF
    </Button>
  );
}
