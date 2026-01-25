import { useState } from 'react';
import { Github, Globe, Bell, BellOff, Trash2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useDeleteTrackedResource, useToggleNotifications } from '@/hooks/useTrackedResources';
import type { TrackedResource } from '@/types/analytics';
import { formatDistanceToNow } from 'date-fns';

interface ResourceListProps {
  resources: TrackedResource[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ResourceList({ resources, selectedId, onSelect }: ResourceListProps) {
  const deleteResource = useDeleteTrackedResource();
  const toggleNotifications = useToggleNotifications();

  if (!resources.length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No resources tracked yet.</p>
        <p className="text-sm mt-1">Add a GitHub repo or website URL above.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {resources.map(resource => (
        <div
          key={resource.id}
          className={cn(
            "flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-colors",
            selectedId === resource.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
          )}
          onClick={() => onSelect(resource.id)}
        >
          {resource.resource_type === 'github' ? <Github className="h-5 w-5 flex-shrink-0" /> : <Globe className="h-5 w-5 flex-shrink-0" />}
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{resource.name}</p>
            <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(resource.created_at), { addSuffix: true })}</p>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); toggleNotifications.mutate({ id: resource.id, enabled: !resource.notifications_enabled }); }}>
              {resource.notifications_enabled ? <Bell className="h-4 w-4 text-primary" /> : <BellOff className="h-4 w-4 text-muted-foreground" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild onClick={(e) => e.stopPropagation()}>
              <a href={resource.url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" /></a>
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); deleteResource.mutate(resource.id); }}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
