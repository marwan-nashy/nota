/**
 * In-app update checker querying GitHub Releases API.
 * Works seamlessly in both Native Desktop (Tauri) and Browser PWA.
 */

export interface UpdateCheckResult {
  checked: boolean;
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseName: string;
  releaseNotes: string;
  publishedAt: string;
  downloadUrl: string;
  htmlUrl: string;
  error?: string;
}

export const CURRENT_VERSION = '1.1.0';

// Compare two semver strings like "1.0.2" > "1.0.1"
function isNewerVersion(latest: string, current: string): boolean {
  const cleanL = latest.replace(/^v/, '').trim();
  const cleanC = current.replace(/^v/, '').trim();

  const partsL = cleanL.split('.').map(Number);
  const partsC = cleanC.split('.').map(Number);

  for (let i = 0; i < Math.max(partsL.length, partsC.length); i++) {
    const l = partsL[i] || 0;
    const c = partsC[i] || 0;
    if (l > c) return true;
    if (l < c) return false;
  }
  return false;
}

export async function checkForAppUpdates(): Promise<UpdateCheckResult> {
  const defaultRes: UpdateCheckResult = {
    checked: true,
    hasUpdate: false,
    currentVersion: CURRENT_VERSION,
    latestVersion: CURRENT_VERSION,
    releaseName: '',
    releaseNotes: '',
    publishedAt: '',
    downloadUrl: `https://github.com/marwan-nashy/nota/releases`,
    htmlUrl: `https://github.com/marwan-nashy/nota/releases`,
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch('https://api.github.com/repos/marwan-nashy/nota/releases/latest', {
      headers: {
        Accept: 'application/vnd.github.v3+json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 404) {
        return {
          ...defaultRes,
          error: 'No releases published yet on repository.',
        };
      }
      throw new Error(`GitHub API returned status ${response.status}`);
    }

    const data = await response.json();
    const tagName = (data.tag_name || '').replace(/^v/, '');
    const hasUpdate = isNewerVersion(tagName, CURRENT_VERSION);

    // Look for Windows .exe or asset
    let downloadUrl = data.html_url;
    if (Array.isArray(data.assets) && data.assets.length > 0) {
      const exeAsset = data.assets.find((a: any) => a.name?.endsWith('.exe'));
      if (exeAsset && exeAsset.browser_download_url) {
        downloadUrl = exeAsset.browser_download_url;
      }
    }

    return {
      checked: true,
      hasUpdate,
      currentVersion: CURRENT_VERSION,
      latestVersion: data.tag_name || tagName,
      releaseName: data.name || `Release ${data.tag_name}`,
      releaseNotes: data.body || 'No release notes provided.',
      publishedAt: data.published_at ? new Date(data.published_at).toLocaleDateString() : '',
      downloadUrl,
      htmlUrl: data.html_url || `https://github.com/marwan-nashy/nota/releases`,
    };
  } catch (err: any) {
    return {
      ...defaultRes,
      error: err?.message || 'Could not reach update server. Check your internet connection.',
    };
  }
}
