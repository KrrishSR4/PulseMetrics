import { useState } from 'react';
import { Activity } from 'lucide-react';
import { UrlInput } from '@/components/analytics/UrlInput';
import { ResourceList } from '@/components/analytics/ResourceList';
import { GitHubDashboard } from '@/components/analytics/GitHubDashboard';
import { WebsiteDashboard } from '@/components/analytics/WebsiteDashboard';
import { useTrackedResources, useAddTrackedResource } from '@/hooks/useTrackedResources';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: resources = [], isLoading } = useTrackedResources();
  const addResource = useAddTrackedResource();
  const { toast } = useToast();

  const selectedResource = resources.find(r => r.id === selectedId);

  const handleAddResource = async (url: string, type: 'github' | 'website', name: string) => {
    try {
      const existing = resources.find(r => r.url === url);
      if (existing) {
        setSelectedId(existing.id);
        toast({ title: 'Resource already tracked', description: 'Showing existing analytics.' });
        return;
      }
      const newResource = await addResource.mutateAsync({ url, resource_type: type, name });
      setSelectedId(newResource.id);
      toast({ title: 'Resource added', description: `Now tracking ${name}` });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to add resource', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Activity className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-semibold">Analytics Monitor</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* URL Input */}
        <div className="mb-8">
          <UrlInput onSubmit={handleAddResource} isLoading={addResource.isPending} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Resource List */}
          <aside className="lg:col-span-1">
            <h2 className="text-sm font-medium text-muted-foreground mb-3">Tracked Resources</h2>
            <ResourceList resources={resources} selectedId={selectedId} onSelect={setSelectedId} />
          </aside>

          {/* Dashboard */}
          <div className="lg:col-span-3">
            {selectedResource ? (
              selectedResource.resource_type === 'github' ? (
                <GitHubDashboard resource={selectedResource} />
              ) : (
                <WebsiteDashboard resource={selectedResource} />
              )
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
                <Activity className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg">Select a resource or add a new one</p>
                <p className="text-sm mt-1">Paste a GitHub repo or website URL above to start monitoring</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
