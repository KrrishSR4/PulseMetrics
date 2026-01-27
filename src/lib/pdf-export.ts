import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

interface GitHubExportData {
  repoData: {
    name: string;
    full_name: string;
    description: string | null;
    stars: number;
    forks: number;
    watchers: number;
    open_issues: number;
    language: string | null;
    license: string | null;
    created_at: string;
    updated_at: string;
  } | null;
  commitActivity: { date: string; count: number }[];
  contributors: { login: string; contributions: number }[];
  issueStats: { open: number; closed: number };
  workflowRuns: { name: string; status: string; conclusion: string | null; created_at: string }[];
  healthScore: { score: number; factors: { name: string; value: number }[] };
}

interface UptimeHistoryEntry {
  timestamp: string;
  status: 'up' | 'down';
  response_time_ms: number | null;
}

interface WebsiteExportData {
  metrics: {
    url: string;
    status: 'up' | 'down' | 'unknown';
    status_code: number | null;
    response_time_ms: number | null;
    ssl_valid: boolean | null;
    last_checked: string;
  };
  performance: {
    dns_time_ms: number;
    connect_time_ms: number;
    ttfb_ms: number;
    download_time_ms: number;
    total_time_ms: number;
  } | null;
  uptimeHistory?: UptimeHistoryEntry[];
  uptimePercentage: number;
  avgResponseTime: number;
}

function drawPerformanceBreakdownChart(doc: jsPDF, performance: WebsiteExportData['performance'], startY: number, pageWidth: number): number {
  if (!performance) return startY;

  const chartWidth = pageWidth - 40;
  const chartHeight = 30;
  const chartX = 20;
  
  const phases = [
    { name: 'DNS', value: performance.dns_time_ms, color: '#3B82F6' },
    { name: 'Connect', value: performance.connect_time_ms, color: '#10B981' },
    { name: 'TTFB', value: performance.ttfb_ms, color: '#F59E0B' },
    { name: 'Download', value: performance.download_time_ms, color: '#8B5CF6' },
  ];

  const total = phases.reduce((sum, p) => sum + p.value, 0);
  
  // Draw stacked bar chart
  let currentX = chartX;
  phases.forEach((phase) => {
    const width = (phase.value / total) * chartWidth;
    doc.setFillColor(phase.color);
    doc.rect(currentX, startY, width, chartHeight, 'F');
    currentX += width;
  });

  // Draw legend
  const legendY = startY + chartHeight + 10;
  let legendX = chartX;
  
  phases.forEach((phase) => {
    doc.setFillColor(phase.color);
    doc.rect(legendX, legendY, 8, 8, 'F');
    doc.setFontSize(9);
    doc.setTextColor(60);
    const label = `${phase.name}: ${phase.value}ms (${((phase.value / total) * 100).toFixed(1)}%)`;
    doc.text(label, legendX + 12, legendY + 6);
    legendX += 50;
  });

  return legendY + 20;
}

function drawResponseTimeHistoryChart(doc: jsPDF, history: UptimeHistoryEntry[], startY: number, pageWidth: number): number {
  if (!history || history.length === 0) return startY;

  const chartWidth = pageWidth - 40;
  const chartHeight = 60;
  const chartX = 20;
  
  // Filter entries with valid response times
  const validEntries = history.filter(h => h.response_time_ms !== null).slice(-30);
  if (validEntries.length === 0) return startY;

  const maxResponseTime = Math.max(...validEntries.map(h => h.response_time_ms || 0));
  const minResponseTime = Math.min(...validEntries.map(h => h.response_time_ms || 0));

  // Draw chart background
  doc.setDrawColor(200);
  doc.setLineWidth(0.5);
  doc.rect(chartX, startY, chartWidth, chartHeight);

  // Draw grid lines
  doc.setDrawColor(230);
  for (let i = 1; i < 4; i++) {
    const y = startY + (chartHeight / 4) * i;
    doc.line(chartX, y, chartX + chartWidth, y);
  }

  // Draw data points and lines
  const pointSpacing = chartWidth / (validEntries.length - 1 || 1);
  
  doc.setDrawColor(59, 130, 246); // Blue
  doc.setLineWidth(1.5);
  
  validEntries.forEach((entry, index) => {
    const x = chartX + index * pointSpacing;
    const responseTime = entry.response_time_ms || 0;
    const normalizedY = (responseTime - minResponseTime) / (maxResponseTime - minResponseTime || 1);
    const y = startY + chartHeight - (normalizedY * (chartHeight - 10)) - 5;
    
    if (index > 0) {
      const prevEntry = validEntries[index - 1];
      const prevX = chartX + (index - 1) * pointSpacing;
      const prevResponseTime = prevEntry.response_time_ms || 0;
      const prevNormalizedY = (prevResponseTime - minResponseTime) / (maxResponseTime - minResponseTime || 1);
      const prevY = startY + chartHeight - (prevNormalizedY * (chartHeight - 10)) - 5;
      doc.line(prevX, prevY, x, y);
    }
    
    // Draw point
    doc.setFillColor(59, 130, 246);
    doc.circle(x, y, 1.5, 'F');
  });

  // Draw Y-axis labels
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text(`${maxResponseTime}ms`, chartX - 2, startY + 5, { align: 'right' });
  doc.text(`${minResponseTime}ms`, chartX - 2, startY + chartHeight - 2, { align: 'right' });

  // Draw time labels
  const firstEntry = validEntries[0];
  const lastEntry = validEntries[validEntries.length - 1];
  doc.text(format(new Date(firstEntry.timestamp), 'HH:mm'), chartX, startY + chartHeight + 10);
  doc.text(format(new Date(lastEntry.timestamp), 'HH:mm'), chartX + chartWidth, startY + chartHeight + 10, { align: 'right' });

  return startY + chartHeight + 20;
}

export function exportGitHubToPDF(resourceName: string, data: GitHubExportData): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const reportDate = new Date();
  let yPos = 20;

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('GitHub Repository Analytics', pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(resourceName, pageWidth / 2, yPos, { align: 'center' });
  yPos += 5;

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Report Generated: ${format(reportDate, 'PPpp')}`, pageWidth / 2, yPos, { align: 'center' });
  doc.setTextColor(0);
  yPos += 15;

  // Repository Overview
  if (data.repoData) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Repository Overview', 14, yPos);
    yPos += 8;

    autoTable(doc, {
      startY: yPos,
      head: [['Metric', 'Value', 'As of']],
      body: [
        ['Full Name', data.repoData.full_name, format(reportDate, 'PPp')],
        ['Description', data.repoData.description || 'N/A', ''],
        ['Stars', data.repoData.stars.toLocaleString(), format(reportDate, 'PPp')],
        ['Forks', data.repoData.forks.toLocaleString(), format(reportDate, 'PPp')],
        ['Watchers', data.repoData.watchers.toLocaleString(), format(reportDate, 'PPp')],
        ['Open Issues', data.repoData.open_issues.toLocaleString(), format(reportDate, 'PPp')],
        ['Language', data.repoData.language || 'N/A', ''],
        ['License', data.repoData.license || 'N/A', ''],
        ['Created', format(new Date(data.repoData.created_at), 'PPp'), ''],
        ['Last Updated', format(new Date(data.repoData.updated_at), 'PPp'), ''],
      ],
      theme: 'striped',
      headStyles: { fillColor: [50, 50, 50] },
      columnStyles: {
        2: { cellWidth: 50, fontSize: 9, textColor: [100, 100, 100] }
      }
    });

    yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
  }

  // Health Score
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Health Score Analysis', 14, yPos);
  yPos += 8;

  autoTable(doc, {
    startY: yPos,
    head: [['Factor', 'Score', 'Measured At']],
    body: [
      ['Overall Score', `${data.healthScore.score}/100`, format(reportDate, 'PPp')],
      ...data.healthScore.factors.map(f => [f.name, `${Math.round(f.value)}/100`, format(reportDate, 'HH:mm:ss')]),
    ],
    theme: 'striped',
    headStyles: { fillColor: [50, 50, 50] },
  });

  yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;

  // Issue Statistics
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Issue Statistics', 14, yPos);
  yPos += 8;

  const totalIssues = data.issueStats.open + data.issueStats.closed;
  const closureRate = totalIssues > 0 ? ((data.issueStats.closed / totalIssues) * 100).toFixed(1) : '0';

  autoTable(doc, {
    startY: yPos,
    head: [['Metric', 'Count', 'Percentage']],
    body: [
      ['Open Issues', data.issueStats.open.toString(), `${totalIssues > 0 ? ((data.issueStats.open / totalIssues) * 100).toFixed(1) : 0}%`],
      ['Closed Issues', data.issueStats.closed.toString(), `${closureRate}%`],
      ['Total Issues', totalIssues.toString(), '100%'],
    ],
    theme: 'striped',
    headStyles: { fillColor: [50, 50, 50] },
  });

  yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;

  // New page for contributors and workflows
  doc.addPage();
  yPos = 20;

  // Top Contributors
  if (data.contributors.length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Top Contributors', 14, yPos);
    yPos += 8;

    const totalContributions = data.contributors.reduce((sum, c) => sum + c.contributions, 0);

    autoTable(doc, {
      startY: yPos,
      head: [['Rank', 'Username', 'Contributions', 'Share']],
      body: data.contributors.map((c, i) => [
        `#${i + 1}`,
        c.login,
        c.contributions.toLocaleString(),
        `${((c.contributions / totalContributions) * 100).toFixed(1)}%`
      ]),
      theme: 'striped',
      headStyles: { fillColor: [50, 50, 50] },
    });

    yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
  }

  // Recent Workflow Runs
  if (data.workflowRuns.length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Recent Workflow Runs', 14, yPos);
    yPos += 8;

    autoTable(doc, {
      startY: yPos,
      head: [['Workflow', 'Status', 'Conclusion', 'Run Date & Time']],
      body: data.workflowRuns.map(w => [
        w.name,
        w.status,
        w.conclusion || 'In Progress',
        format(new Date(w.created_at), 'PPpp'),
      ]),
      theme: 'striped',
      headStyles: { fillColor: [50, 50, 50] },
    });

    yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
  }

  // Commit Activity
  if (data.commitActivity.length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Commit Activity (Last 14 Days)', 14, yPos);
    yPos += 8;

    const recentActivity = data.commitActivity.slice(-14);
    const totalCommits = recentActivity.reduce((sum, c) => sum + c.count, 0);
    const avgCommits = (totalCommits / recentActivity.length).toFixed(1);

    autoTable(doc, {
      startY: yPos,
      head: [['Date', 'Day', 'Commits', 'Trend']],
      body: recentActivity.map((c, i) => {
        const date = new Date(c.date);
        const prevCount = i > 0 ? recentActivity[i - 1].count : c.count;
        const trend = c.count > prevCount ? '↑' : c.count < prevCount ? '↓' : '→';
        return [
          format(date, 'PP'),
          format(date, 'EEEE'),
          c.count.toString(),
          trend
        ];
      }),
      theme: 'striped',
      headStyles: { fillColor: [50, 50, 50] },
    });

    yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Total Commits: ${totalCommits} | Average: ${avgCommits}/day`, 14, yPos);
    doc.setTextColor(0);
  }

  doc.save(`${resourceName.replace(/[^a-zA-Z0-9]/g, '-')}-github-analytics-${format(reportDate, 'yyyy-MM-dd')}.pdf`);
}

export function exportWebsiteToPDF(resourceName: string, data: WebsiteExportData): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const reportDate = new Date();
  let yPos = 20;

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Website Analytics Report', pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(resourceName, pageWidth / 2, yPos, { align: 'center' });
  yPos += 5;

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Report Generated: ${format(reportDate, 'PPpp')}`, pageWidth / 2, yPos, { align: 'center' });
  doc.setTextColor(0);
  yPos += 15;

  // Current Status Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Current Status', 14, yPos);
  yPos += 8;

  const statusColor = data.metrics.status === 'up' ? [16, 185, 129] : [239, 68, 68];
  
  autoTable(doc, {
    startY: yPos,
    head: [['Metric', 'Value', 'Recorded At']],
    body: [
      ['URL', data.metrics.url, ''],
      ['Status', data.metrics.status.toUpperCase(), format(new Date(data.metrics.last_checked), 'PPpp')],
      ['HTTP Status Code', data.metrics.status_code?.toString() || 'N/A', format(new Date(data.metrics.last_checked), 'HH:mm:ss')],
      ['Current Response Time', data.metrics.response_time_ms ? `${data.metrics.response_time_ms}ms` : 'N/A', format(new Date(data.metrics.last_checked), 'HH:mm:ss')],
      ['SSL Certificate', data.metrics.ssl_valid ? 'Valid ✓' : data.metrics.ssl_valid === false ? 'Invalid ✗' : 'N/A', ''],
    ],
    theme: 'striped',
    headStyles: { fillColor: [50, 50, 50] },
    didParseCell: function(hookData) {
      if (hookData.row.index === 1 && hookData.column.index === 1) {
        hookData.cell.styles.textColor = statusColor as [number, number, number];
        hookData.cell.styles.fontStyle = 'bold';
      }
    }
  });

  yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;

  // Uptime Statistics
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Uptime Statistics (Last 24 Hours)', 14, yPos);
  yPos += 8;

  const uptimeStatus = data.uptimePercentage >= 99.5 ? 'Excellent' : data.uptimePercentage >= 95 ? 'Good' : 'Needs Attention';
  const responseStatus = data.avgResponseTime < 500 ? 'Fast' : data.avgResponseTime < 1500 ? 'Moderate' : 'Slow';

  autoTable(doc, {
    startY: yPos,
    head: [['Metric', 'Value', 'Status', 'Measured At']],
    body: [
      ['Uptime Percentage', `${data.uptimePercentage.toFixed(2)}%`, uptimeStatus, format(reportDate, 'PPp')],
      ['Average Response Time', `${data.avgResponseTime}ms`, responseStatus, format(reportDate, 'PPp')],
    ],
    theme: 'striped',
    headStyles: { fillColor: [50, 50, 50] },
  });

  yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;

  // Performance Breakdown with Chart
  if (data.performance) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Performance Breakdown', 14, yPos);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(`Measured at: ${format(new Date(data.metrics.last_checked), 'PPpp')}`, 14, yPos + 6);
    doc.setTextColor(0);
    yPos += 12;

    // Draw performance chart
    yPos = drawPerformanceBreakdownChart(doc, data.performance, yPos, pageWidth);

    // Performance table
    autoTable(doc, {
      startY: yPos,
      head: [['Phase', 'Duration', 'Percentage', 'Timestamp']],
      body: [
        ['DNS Lookup', `${data.performance.dns_time_ms}ms`, `${((data.performance.dns_time_ms / data.performance.total_time_ms) * 100).toFixed(1)}%`, format(new Date(data.metrics.last_checked), 'HH:mm:ss')],
        ['TCP Connection', `${data.performance.connect_time_ms}ms`, `${((data.performance.connect_time_ms / data.performance.total_time_ms) * 100).toFixed(1)}%`, format(new Date(data.metrics.last_checked), 'HH:mm:ss')],
        ['Time to First Byte', `${data.performance.ttfb_ms}ms`, `${((data.performance.ttfb_ms / data.performance.total_time_ms) * 100).toFixed(1)}%`, format(new Date(data.metrics.last_checked), 'HH:mm:ss')],
        ['Content Download', `${data.performance.download_time_ms}ms`, `${((data.performance.download_time_ms / data.performance.total_time_ms) * 100).toFixed(1)}%`, format(new Date(data.metrics.last_checked), 'HH:mm:ss')],
        ['Total Time', `${data.performance.total_time_ms}ms`, '100%', format(new Date(data.metrics.last_checked), 'HH:mm:ss')],
      ],
      theme: 'striped',
      headStyles: { fillColor: [50, 50, 50] },
    });

    yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
  }

  // Response Time History - New Page
  if (data.uptimeHistory && data.uptimeHistory.length > 0) {
    doc.addPage();
    yPos = 20;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Response Time History', 14, yPos);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text('Last 30 data points', 14, yPos + 6);
    doc.setTextColor(0);
    yPos += 15;

    // Draw response time chart
    yPos = drawResponseTimeHistoryChart(doc, data.uptimeHistory, yPos, pageWidth);

    // Response time history table
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Detailed Response Time Log', 14, yPos);
    yPos += 8;

    const recentHistory = data.uptimeHistory.slice(-30).reverse();
    
    autoTable(doc, {
      startY: yPos,
      head: [['Date', 'Time', 'Status', 'Response Time']],
      body: recentHistory.map(h => [
        format(new Date(h.timestamp), 'PP'),
        format(new Date(h.timestamp), 'HH:mm:ss'),
        h.status.toUpperCase(),
        h.response_time_ms ? `${h.response_time_ms}ms` : 'N/A',
      ]),
      theme: 'striped',
      headStyles: { fillColor: [50, 50, 50] },
      didParseCell: function(hookData) {
        if (hookData.column.index === 2) {
          const status = hookData.cell.raw as string;
          if (status === 'UP') {
            hookData.cell.styles.textColor = [16, 185, 129];
          } else if (status === 'DOWN') {
            hookData.cell.styles.textColor = [239, 68, 68];
          }
        }
      }
    });

    yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

    // Statistics summary
    const upCount = recentHistory.filter(h => h.status === 'up').length;
    const downCount = recentHistory.filter(h => h.status === 'down').length;
    const avgTime = recentHistory
      .filter(h => h.response_time_ms !== null)
      .reduce((sum, h) => sum + (h.response_time_ms || 0), 0) / 
      recentHistory.filter(h => h.response_time_ms !== null).length || 0;

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Summary: ${upCount} successful checks, ${downCount} failures, Average response: ${Math.round(avgTime)}ms`, 14, yPos);
    doc.setTextColor(0);
  }

  // Uptime History Table
  if (data.uptimeHistory && data.uptimeHistory.length > 0) {
    doc.addPage();
    yPos = 20;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Complete Uptime History (24 Hours)', 14, yPos);
    yPos += 8;

    // Group by hour for summary
    const hourlyData: Record<string, { up: number; down: number; avgResponse: number; times: number[] }> = {};
    
    data.uptimeHistory.forEach(h => {
      const hour = format(new Date(h.timestamp), 'yyyy-MM-dd HH:00');
      if (!hourlyData[hour]) {
        hourlyData[hour] = { up: 0, down: 0, avgResponse: 0, times: [] };
      }
      if (h.status === 'up') hourlyData[hour].up++;
      else hourlyData[hour].down++;
      if (h.response_time_ms) hourlyData[hour].times.push(h.response_time_ms);
    });

    Object.keys(hourlyData).forEach(hour => {
      const times = hourlyData[hour].times;
      hourlyData[hour].avgResponse = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
    });

    autoTable(doc, {
      startY: yPos,
      head: [['Hour', 'Successful Checks', 'Failed Checks', 'Uptime %', 'Avg Response']],
      body: Object.entries(hourlyData).map(([hour, stats]) => {
        const total = stats.up + stats.down;
        const uptimePct = total > 0 ? ((stats.up / total) * 100).toFixed(1) : '0';
        return [
          format(new Date(hour), 'MMM d, HH:mm'),
          stats.up.toString(),
          stats.down.toString(),
          `${uptimePct}%`,
          `${Math.round(stats.avgResponse)}ms`,
        ];
      }),
      theme: 'striped',
      headStyles: { fillColor: [50, 50, 50] },
    });
  }

  doc.save(`${resourceName.replace(/[^a-zA-Z0-9]/g, '-')}-website-analytics-${format(reportDate, 'yyyy-MM-dd-HHmm')}.pdf`);
}
