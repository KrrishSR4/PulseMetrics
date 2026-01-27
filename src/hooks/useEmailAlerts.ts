import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type AlertType = 'website_down' | 'response_time_spike' | 'ci_failure' | 'website_recovered';

interface AlertDetails {
  responseTime?: number;
  threshold?: number;
  workflowName?: string;
  errorMessage?: string;
  statusCode?: number;
  downtime?: string;
}

interface SendAlertOptions {
  to: string;
  alertType: AlertType;
  resourceName: string;
  resourceUrl: string;
  details: AlertDetails;
}

// Store email in localStorage for persistence
const EMAIL_STORAGE_KEY = 'analytics-alert-email';

export function useEmailAlerts() {
  const { toast } = useToast();

  const getStoredEmail = useCallback((): string | null => {
    return localStorage.getItem(EMAIL_STORAGE_KEY);
  }, []);

  const setStoredEmail = useCallback((email: string) => {
    localStorage.setItem(EMAIL_STORAGE_KEY, email);
  }, []);

  const clearStoredEmail = useCallback(() => {
    localStorage.removeItem(EMAIL_STORAGE_KEY);
  }, []);

  const sendAlert = useCallback(async (options: SendAlertOptions): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('send-alert-email', {
        body: options,
      });

      if (error) {
        console.error('Failed to send alert email:', error);
        return false;
      }

      if (data?.error) {
        console.error('Email service error:', data.error);
        return false;
      }

      console.log('Alert email sent:', data);
      return true;
    } catch (err) {
      console.error('Error sending alert:', err);
      return false;
    }
  }, []);

  const sendWebsiteDownAlert = useCallback(async (
    resourceName: string,
    resourceUrl: string,
    details: { statusCode?: number; errorMessage?: string; responseTime?: number }
  ) => {
    const email = getStoredEmail();
    if (!email) return false;

    return sendAlert({
      to: email,
      alertType: 'website_down',
      resourceName,
      resourceUrl,
      details,
    });
  }, [getStoredEmail, sendAlert]);

  const sendResponseTimeSpikeAlert = useCallback(async (
    resourceName: string,
    resourceUrl: string,
    responseTime: number,
    threshold: number
  ) => {
    const email = getStoredEmail();
    if (!email) return false;

    return sendAlert({
      to: email,
      alertType: 'response_time_spike',
      resourceName,
      resourceUrl,
      details: { responseTime, threshold },
    });
  }, [getStoredEmail, sendAlert]);

  const sendCIFailureAlert = useCallback(async (
    resourceName: string,
    resourceUrl: string,
    workflowName: string,
    errorMessage?: string
  ) => {
    const email = getStoredEmail();
    if (!email) return false;

    return sendAlert({
      to: email,
      alertType: 'ci_failure',
      resourceName,
      resourceUrl,
      details: { workflowName, errorMessage },
    });
  }, [getStoredEmail, sendAlert]);

  const sendWebsiteRecoveredAlert = useCallback(async (
    resourceName: string,
    resourceUrl: string,
    details: { downtime?: string; responseTime?: number }
  ) => {
    const email = getStoredEmail();
    if (!email) return false;

    return sendAlert({
      to: email,
      alertType: 'website_recovered',
      resourceName,
      resourceUrl,
      details,
    });
  }, [getStoredEmail, sendAlert]);

  const testEmailAlert = useCallback(async (email: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('send-alert-email', {
        body: {
          to: email,
          alertType: 'website_down',
          resourceName: 'Test Alert',
          resourceUrl: 'https://example.com',
          details: {
            statusCode: 503,
            errorMessage: 'This is a test alert to verify your email notifications are working.',
            responseTime: 5000,
          },
        },
      });

      if (error || data?.error) {
        toast({
          title: 'Test Failed',
          description: 'Could not send test email. Please check your RESEND_API_KEY.',
          variant: 'destructive',
        });
        return false;
      }

      toast({
        title: 'Test Email Sent',
        description: `Check ${email} for the test alert.`,
      });
      return true;
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to send test email.',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast]);

  return {
    getStoredEmail,
    setStoredEmail,
    clearStoredEmail,
    sendWebsiteDownAlert,
    sendResponseTimeSpikeAlert,
    sendCIFailureAlert,
    sendWebsiteRecoveredAlert,
    testEmailAlert,
  };
}
