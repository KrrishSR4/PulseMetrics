import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  uptimePercentage: number;
  avgResponseTime: number;
}

export function exportGitHubToPDF(resourceName: string, data: GitHubExportData): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
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
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, yPos, { align: 'center' });
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
      head: [['Metric', 'Value']],
      body: [
        ['Full Name', data.repoData.full_name],
        ['Description', data.repoData.description || 'N/A'],
        ['Stars', data.repoData.stars.toLocaleString()],
        ['Forks', data.repoData.forks.toLocaleString()],
        ['Watchers', data.repoData.watchers.toLocaleString()],
        ['Open Issues', data.repoData.open_issues.toLocaleString()],
        ['Language', data.repoData.language || 'N/A'],
        ['License', data.repoData.license || 'N/A'],
        ['Created', new Date(data.repoData.created_at).toLocaleDateString()],
        ['Last Updated', new Date(data.repoData.updated_at).toLocaleDateString()],
      ],
      theme: 'striped',
      headStyles: { fillColor: [50, 50, 50] },
    });

    yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
  }

  // Health Score
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Health Score', 14, yPos);
  yPos += 8;

  autoTable(doc, {
    startY: yPos,
    head: [['Factor', 'Score']],
    body: [
      ['Overall Score', `${data.healthScore.score}/100`],
      ...data.healthScore.factors.map(f => [f.name, `${Math.round(f.value)}/100`]),
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

  autoTable(doc, {
    startY: yPos,
    head: [['Status', 'Count']],
    body: [
      ['Open Issues', data.issueStats.open.toString()],
      ['Closed Issues', data.issueStats.closed.toString()],
      ['Total Issues', (data.issueStats.open + data.issueStats.closed).toString()],
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

    autoTable(doc, {
      startY: yPos,
      head: [['Username', 'Contributions']],
      body: data.contributors.map(c => [c.login, c.contributions.toLocaleString()]),
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
      head: [['Workflow', 'Status', 'Conclusion', 'Date']],
      body: data.workflowRuns.map(w => [
        w.name,
        w.status,
        w.conclusion || 'In Progress',
        new Date(w.created_at).toLocaleString(),
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
    doc.text('Recent Commit Activity', 14, yPos);
    yPos += 8;

    const recentActivity = data.commitActivity.slice(-14);
    autoTable(doc, {
      startY: yPos,
      head: [['Date', 'Commits']],
      body: recentActivity.map(c => [c.date, c.count.toString()]),
      theme: 'striped',
      headStyles: { fillColor: [50, 50, 50] },
    });
  }

  doc.save(`${resourceName.replace(/[^a-zA-Z0-9]/g, '-')}-github-analytics.pdf`);
}

export function exportWebsiteToPDF(resourceName: string, data: WebsiteExportData): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
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
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, yPos, { align: 'center' });
  doc.setTextColor(0);
  yPos += 15;

  // Current Status
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Current Status', 14, yPos);
  yPos += 8;

  autoTable(doc, {
    startY: yPos,
    head: [['Metric', 'Value']],
    body: [
      ['URL', data.metrics.url],
      ['Status', data.metrics.status.toUpperCase()],
      ['HTTP Status Code', data.metrics.status_code?.toString() || 'N/A'],
      ['Response Time', data.metrics.response_time_ms ? `${data.metrics.response_time_ms}ms` : 'N/A'],
      ['SSL Valid', data.metrics.ssl_valid ? 'Yes' : data.metrics.ssl_valid === false ? 'No' : 'N/A'],
      ['Last Checked', new Date(data.metrics.last_checked).toLocaleString()],
    ],
    theme: 'striped',
    headStyles: { fillColor: [50, 50, 50] },
  });

  yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;

  // Uptime Statistics
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Uptime Statistics', 14, yPos);
  yPos += 8;

  autoTable(doc, {
    startY: yPos,
    head: [['Metric', 'Value']],
    body: [
      ['Uptime (24h)', `${data.uptimePercentage.toFixed(2)}%`],
      ['Average Response Time', `${data.avgResponseTime}ms`],
    ],
    theme: 'striped',
    headStyles: { fillColor: [50, 50, 50] },
  });

  yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;

  // Performance Breakdown
  if (data.performance) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Performance Breakdown', 14, yPos);
    yPos += 8;

    autoTable(doc, {
      startY: yPos,
      head: [['Phase', 'Duration']],
      body: [
        ['DNS Lookup', `${data.performance.dns_time_ms}ms`],
        ['Connection', `${data.performance.connect_time_ms}ms`],
        ['Time to First Byte (TTFB)', `${data.performance.ttfb_ms}ms`],
        ['Download', `${data.performance.download_time_ms}ms`],
        ['Total', `${data.performance.total_time_ms}ms`],
      ],
      theme: 'striped',
      headStyles: { fillColor: [50, 50, 50] },
    });
  }

  doc.save(`${resourceName.replace(/[^a-zA-Z0-9]/g, '-')}-website-analytics.pdf`);
}
