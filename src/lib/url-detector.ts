import type { ResourceType } from '@/types/analytics';

export interface DetectedUrl {
  type: ResourceType;
  url: string;
  owner?: string;
  repo?: string;
  normalizedUrl: string;
}

export function detectUrlType(input: string): DetectedUrl | null {
  const trimmed = input.trim();
  
  if (!trimmed) {
    return null;
  }

  // GitHub URL patterns
  const githubPatterns = [
    /^https?:\/\/github\.com\/([^\/]+)\/([^\/]+)\/?.*$/,
    /^github\.com\/([^\/]+)\/([^\/]+)\/?.*$/,
    /^([^\/]+)\/([^\/]+)$/, // owner/repo format
  ];

  for (const pattern of githubPatterns) {
    const match = trimmed.match(pattern);
    if (match) {
      const owner = match[1];
      const repo = match[2].replace(/\.git$/, '').split('/')[0].split('?')[0].split('#')[0];
      
      // Validate it looks like a GitHub path
      if (owner && repo && !owner.includes('.') && owner !== 'www') {
        return {
          type: 'github',
          url: `https://github.com/${owner}/${repo}`,
          owner,
          repo,
          normalizedUrl: `https://github.com/${owner}/${repo}`,
        };
      }
    }
  }

  // Website URL pattern
  let url = trimmed;
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }

  try {
    const parsed = new URL(url);
    // Exclude GitHub URLs from website detection
    if (parsed.hostname === 'github.com') {
      return null;
    }
    
    return {
      type: 'website',
      url: parsed.href,
      normalizedUrl: `${parsed.protocol}//${parsed.hostname}${parsed.pathname}`.replace(/\/$/, ''),
    };
  } catch {
    return null;
  }
}

export function extractRepoInfo(url: string): { owner: string; repo: string } | null {
  const detected = detectUrlType(url);
  if (detected?.type === 'github' && detected.owner && detected.repo) {
    return { owner: detected.owner, repo: detected.repo };
  }
  return null;
}

export function getDisplayName(detected: DetectedUrl): string {
  if (detected.type === 'github' && detected.owner && detected.repo) {
    return `${detected.owner}/${detected.repo}`;
  }
  try {
    const parsed = new URL(detected.url);
    return parsed.hostname;
  } catch {
    return detected.url;
  }
}
