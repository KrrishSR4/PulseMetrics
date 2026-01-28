import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AlertEmailRequest {
  to: string;
  alertType: 'website_down' | 'response_time_spike' | 'ci_failure' | 'website_recovered';
  resourceName: string;
  resourceUrl: string;
  details: {
    responseTime?: number;
    threshold?: number;
    workflowName?: string;
    errorMessage?: string;
    statusCode?: number;
    downtime?: string;
  };
}

function getAlertSubject(alertType: string, resourceName: string): string {
  const subjects: Record<string, string> = {
    website_down: `🔴 ALERT: ${resourceName} is DOWN`,
    response_time_spike: `⚠️ WARNING: ${resourceName} - Response Time Spike`,
    ci_failure: `❌ ALERT: ${resourceName} - CI/CD Pipeline Failed`,
    website_recovered: `✅ RECOVERED: ${resourceName} is back UP`,
  };
  return subjects[alertType] || `Alert: ${resourceName}`;
}

function getAlertHtml(request: AlertEmailRequest): string {
  const { alertType, resourceName, resourceUrl, details } = request;
  const timestamp = new Date().toLocaleString('en-US', { 
    dateStyle: 'full', 
    timeStyle: 'long' 
  });

  const alertColors: Record<string, { bg: string; border: string; icon: string }> = {
    website_down: { bg: '#FEE2E2', border: '#EF4444', icon: '🔴' },
    response_time_spike: { bg: '#FEF3C7', border: '#F59E0B', icon: '⚠️' },
    ci_failure: { bg: '#FEE2E2', border: '#EF4444', icon: '❌' },
    website_recovered: { bg: '#D1FAE5', border: '#10B981', icon: '✅' },
  };

  const colors = alertColors[alertType] || alertColors.website_down;

  let detailsHtml = '';
  
  if (alertType === 'website_down') {
    detailsHtml = `
      <tr><td style="padding: 8px 0; border-bottom: 1px solid #E5E7EB;"><strong>Status:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #E5E7EB;">Offline / Unreachable</td></tr>
      ${details.statusCode ? `<tr><td style="padding: 8px 0; border-bottom: 1px solid #E5E7EB;"><strong>HTTP Status:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #E5E7EB;">${details.statusCode}</td></tr>` : ''}
      ${details.errorMessage ? `<tr><td style="padding: 8px 0; border-bottom: 1px solid #E5E7EB;"><strong>Error:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #E5E7EB;">${details.errorMessage}</td></tr>` : ''}
      ${details.responseTime ? `<tr><td style="padding: 8px 0; border-bottom: 1px solid #E5E7EB;"><strong>Last Response Time:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #E5E7EB;">${details.responseTime}ms</td></tr>` : ''}
    `;
  } else if (alertType === 'response_time_spike') {
    detailsHtml = `
      <tr><td style="padding: 8px 0; border-bottom: 1px solid #E5E7EB;"><strong>Current Response Time:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #E5E7EB; color: #EF4444; font-weight: bold;">${details.responseTime}ms</td></tr>
      <tr><td style="padding: 8px 0; border-bottom: 1px solid #E5E7EB;"><strong>Threshold:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #E5E7EB;">${details.threshold}ms</td></tr>
      <tr><td style="padding: 8px 0; border-bottom: 1px solid #E5E7EB;"><strong>Status:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #E5E7EB;">Performance Degraded</td></tr>
    `;
  } else if (alertType === 'ci_failure') {
    detailsHtml = `
      <tr><td style="padding: 8px 0; border-bottom: 1px solid #E5E7EB;"><strong>Workflow:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #E5E7EB;">${details.workflowName}</td></tr>
      <tr><td style="padding: 8px 0; border-bottom: 1px solid #E5E7EB;"><strong>Status:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #E5E7EB; color: #EF4444; font-weight: bold;">Failed</td></tr>
      ${details.errorMessage ? `<tr><td style="padding: 8px 0; border-bottom: 1px solid #E5E7EB;"><strong>Error:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #E5E7EB;">${details.errorMessage}</td></tr>` : ''}
    `;
  } else if (alertType === 'website_recovered') {
    detailsHtml = `
      <tr><td style="padding: 8px 0; border-bottom: 1px solid #E5E7EB;"><strong>Status:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #E5E7EB; color: #10B981; font-weight: bold;">Online</td></tr>
      ${details.downtime ? `<tr><td style="padding: 8px 0; border-bottom: 1px solid #E5E7EB;"><strong>Downtime Duration:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #E5E7EB;">${details.downtime}</td></tr>` : ''}
      ${details.responseTime ? `<tr><td style="padding: 8px 0; border-bottom: 1px solid #E5E7EB;"><strong>Response Time:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #E5E7EB;">${details.responseTime}ms</td></tr>` : ''}
    `;
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #F3F4F6;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <!-- Alert Header -->
      <div style="background-color: ${colors.bg}; border-left: 4px solid ${colors.border}; padding: 20px;">
        <h1 style="margin: 0; font-size: 24px; color: #111827;">
          ${colors.icon} ${alertType === 'website_down' ? 'Website Down Alert' : alertType === 'response_time_spike' ? 'Performance Warning' : alertType === 'ci_failure' ? 'CI/CD Failure' : 'Service Recovered'}
        </h1>
        <p style="margin: 8px 0 0 0; color: #6B7280; font-size: 14px;">${timestamp}</p>
      </div>
      
      <!-- Content -->
      <div style="padding: 24px;">
        <h2 style="margin: 0 0 16px 0; font-size: 18px; color: #111827;">${resourceName}</h2>
        <p style="margin: 0 0 16px 0; color: #6B7280;">
          <a href="${resourceUrl}" style="color: #3B82F6; text-decoration: none;">${resourceUrl}</a>
        </p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
          ${detailsHtml}
          <tr><td style="padding: 8px 0;"><strong>Detected At:</strong></td><td style="padding: 8px 0;">${timestamp}</td></tr>
        </table>
      </div>
      
      <!-- Footer -->
      <div style="background-color: #F9FAFB; padding: 16px 24px; border-top: 1px solid #E5E7EB;">
        <p style="margin: 0; font-size: 12px; color: #9CA3AF;">
          This is an automated alert from your Analytics Monitor. 
          <br>You can manage notification settings in your dashboard.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: AlertEmailRequest = await req.json();
    
    if (!request.to || !request.alertType || !request.resourceName) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, alertType, resourceName' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const emailResponse = await resend.emails.send({
      from: 'Analytics Monitor <alerts@resend.dev>',
      to: [request.to],
      subject: getAlertSubject(request.alertType, request.resourceName),
      html: getAlertHtml(request),
    });

    // Check for Resend API errors
    if (emailResponse.error) {
      console.error('Resend API error:', emailResponse.error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: emailResponse.error.message || 'Failed to send email',
          details: emailResponse.error
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Alert email sent successfully:', emailResponse.data);

    return new Response(
      JSON.stringify({ success: true, id: emailResponse.data?.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error sending alert email:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
