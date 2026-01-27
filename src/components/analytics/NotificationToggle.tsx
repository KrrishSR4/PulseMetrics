import { Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/hooks/useNotifications';
import { useToggleNotifications } from '@/hooks/useTrackedResources';
import { useToast } from '@/hooks/use-toast';
import type { TrackedResource } from '@/types/analytics';

interface NotificationToggleProps {
  resource: TrackedResource;
}

export function NotificationToggle({ resource }: NotificationToggleProps) {
  const { isSupported, permission, requestPermission } = useNotifications();
  const toggleNotifications = useToggleNotifications();
  const { toast } = useToast();

  const handleToggle = async () => {
    if (!isSupported) {
      toast({
        title: 'Not Supported',
        description: 'Push notifications are not supported in this browser.',
        variant: 'destructive',
      });
      return;
    }

    if (permission !== 'granted' && !resource.notifications_enabled) {
      const granted = await requestPermission();
      if (!granted) {
        toast({
          title: 'Permission Denied',
          description: 'Please allow notifications in your browser settings.',
          variant: 'destructive',
        });
        return;
      }
    }

    try {
      await toggleNotifications.mutateAsync({
        id: resource.id,
        enabled: !resource.notifications_enabled,
      });
      toast({
        title: resource.notifications_enabled ? 'Notifications Disabled' : 'Notifications Enabled',
        description: resource.notifications_enabled
          ? `You won't receive alerts for ${resource.name}`
          : `You'll be notified of critical events for ${resource.name}`,
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to update notification settings',
        variant: 'destructive',
      });
    }
  };

  return (
    <Button
      variant={resource.notifications_enabled ? 'default' : 'outline'}
      size="sm"
      onClick={handleToggle}
      disabled={toggleNotifications.isPending}
    >
      {resource.notifications_enabled ? (
        <>
          <Bell className="h-4 w-4 mr-2" />
          Alerts On
        </>
      ) : (
        <>
          <BellOff className="h-4 w-4 mr-2" />
          Alerts Off
        </>
      )}
    </Button>
  );
}
