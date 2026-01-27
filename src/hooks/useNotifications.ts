import { useState, useEffect, useCallback } from 'react';

export type NotificationType = 'website_down' | 'response_time_spike' | 'ci_failure' | 'error_rate';

interface NotificationPayload {
  type: NotificationType;
  title: string;
  body: string;
  resourceName: string;
  timestamp: string;
}

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported('Notification' in window);
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;
    
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch {
      return false;
    }
  }, [isSupported]);

  const sendNotification = useCallback(({ type, title, body, resourceName, timestamp }: NotificationPayload) => {
    if (permission !== 'granted') return;

    const iconMap: Record<NotificationType, string> = {
      website_down: '🔴',
      response_time_spike: '⚠️',
      ci_failure: '❌',
      error_rate: '📈',
    };

    const notification = new Notification(`${iconMap[type]} ${title}`, {
      body: `${body}\n${resourceName} • ${new Date(timestamp).toLocaleTimeString()}`,
      icon: '/favicon.ico',
      tag: `${type}-${resourceName}`,
      requireInteraction: type === 'website_down' || type === 'ci_failure',
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return notification;
  }, [permission]);

  const notifyWebsiteDown = useCallback((resourceName: string, url: string) => {
    sendNotification({
      type: 'website_down',
      title: 'Website Down',
      body: `${url} is not responding`,
      resourceName,
      timestamp: new Date().toISOString(),
    });
  }, [sendNotification]);

  const notifyResponseTimeSpike = useCallback((resourceName: string, responseTime: number, threshold: number) => {
    sendNotification({
      type: 'response_time_spike',
      title: 'Response Time Spike',
      body: `Response time: ${responseTime}ms (threshold: ${threshold}ms)`,
      resourceName,
      timestamp: new Date().toISOString(),
    });
  }, [sendNotification]);

  const notifyCIFailure = useCallback((resourceName: string, workflowName: string) => {
    sendNotification({
      type: 'ci_failure',
      title: 'CI/CD Failure',
      body: `Workflow "${workflowName}" failed`,
      resourceName,
      timestamp: new Date().toISOString(),
    });
  }, [sendNotification]);

  return {
    isSupported,
    permission,
    requestPermission,
    sendNotification,
    notifyWebsiteDown,
    notifyResponseTimeSpike,
    notifyCIFailure,
  };
}
