import { ref } from 'vue';
import { APP_VERSION, UPDATE_MANIFEST_URL } from '../constants';

interface VersionManifest {
  version: string;
  downloadUrl: string;
}

function parseVersion(v: string): number[] {
  return v.split('.').map(Number);
}

function isNewer(remote: string, current: string): boolean {
  const r = parseVersion(remote);
  const c = parseVersion(current);
  for (let i = 0; i < Math.max(r.length, c.length); i++) {
    const rv = r[i] ?? 0;
    const cv = c[i] ?? 0;
    if (rv > cv) return true;
    if (rv < cv) return false;
  }
  return false;
}

const updateAvailable = ref(false);
const latestVersion = ref('');
const downloadUrl = ref('');

export async function checkForUpdate(): Promise<void> {
  if (!navigator.onLine) return;

  try {
    const response = await fetch(UPDATE_MANIFEST_URL, { cache: 'no-store' });
    if (!response.ok) return;

    const manifest: VersionManifest = await response.json();

    if (isNewer(manifest.version, APP_VERSION)) {
      latestVersion.value = manifest.version;
      downloadUrl.value = manifest.downloadUrl;
      updateAvailable.value = true;
    }
  } catch {
    // Silently fail — update check is non-critical
  }
}

export function dismissUpdate(): void {
  updateAvailable.value = false;
}

export function useUpdateChecker() {
  return { updateAvailable, latestVersion, downloadUrl };
}
