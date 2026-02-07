import type { Platform } from '../../shared/types.js';

export interface PlatformMetadata {
  repoUrl: string;
  sourceBranch: string;
  targetBranch: string;
}

export interface PlatformAdapter {
  readonly platform: Platform;
  detect(): boolean;
  extractDiff(): Promise<string>;
  getMetadata(): PlatformMetadata;
  fillTitle(title: string): void;
  fillDescription(description: string): void;
  getButtonAnchor(): Element | null;
}
