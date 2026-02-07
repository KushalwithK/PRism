import type { PlatformAdapter } from './platforms/platform-adapter.js';
import { GitHubAdapter } from './platforms/github.js';
import { GitLabAdapter } from './platforms/gitlab.js';

const adapters: PlatformAdapter[] = [
  new GitHubAdapter(),
  new GitLabAdapter(),
];

export function detectPlatform(): PlatformAdapter | null {
  for (const adapter of adapters) {
    if (adapter.detect()) return adapter;
  }
  return null;
}
