import type { Platform } from '../../shared/types.js';
import type { PlatformAdapter, PlatformMetadata } from './platform-adapter.js';

/**
 * Set a value on an input/textarea in a React-aware way.
 * React overrides the native value setter, so we need to use
 * the native setter + dispatch an input event.
 */
function setNativeValue(el: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const nativeSetter = Object.getOwnPropertyDescriptor(
    el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype,
    'value',
  )?.set;

  if (nativeSetter) {
    nativeSetter.call(el, value);
  } else {
    el.value = value;
  }

  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

export class GitHubAdapter implements PlatformAdapter {
  readonly platform: Platform = 'github';

  detect(): boolean {
    const url = window.location.href;
    return (
      url.includes('github.com') &&
      (url.includes('/compare/') || url.includes('/pull/new/'))
    );
  }

  async extractDiff(): Promise<string> {
    // Strategy 1: Get diff from the page's diff content
    const diffElements = document.querySelectorAll('.diff-table .blob-code-inner');
    if (diffElements.length > 0) {
      const lines: string[] = [];
      document.querySelectorAll('.file').forEach((file) => {
        const filename = file.querySelector('.file-header')?.getAttribute('data-path') || '';
        lines.push(`--- a/${filename}`);
        lines.push(`+++ b/${filename}`);
        file.querySelectorAll('tr').forEach((row) => {
          const addCell = row.querySelector('.blob-code-addition .blob-code-inner');
          const delCell = row.querySelector('.blob-code-deletion .blob-code-inner');
          const ctxCell = row.querySelector('.blob-code-context .blob-code-inner');
          if (addCell) lines.push(`+${addCell.textContent || ''}`);
          else if (delCell) lines.push(`-${delCell.textContent || ''}`);
          else if (ctxCell) lines.push(` ${ctxCell.textContent || ''}`);
        });
      });
      if (lines.length > 0) return lines.join('\n');
    }

    // Strategy 2: Fetch diff via .diff URL
    const url = window.location.href;
    const compareMatch = url.match(/github\.com\/([^/]+\/[^/]+)\/compare\/(.+)/);
    if (compareMatch) {
      const [, repo, range] = compareMatch;
      try {
        const res = await fetch(`https://github.com/${repo}/compare/${range}.diff`);
        if (res.ok) return await res.text();
      } catch { /* fall through */ }
    }

    // Strategy 3: Get from commit list page
    const commitDiffs = document.querySelectorAll('[data-diff-anchor]');
    if (commitDiffs.length > 0) {
      return Array.from(commitDiffs)
        .map((el) => el.textContent || '')
        .join('\n');
    }

    return '';
  }

  getMetadata(): PlatformMetadata {
    const url = window.location.href;
    const repoMatch = url.match(/github\.com\/([^/]+\/[^/]+)/);
    const repoUrl = repoMatch ? `https://github.com/${repoMatch[1]}` : url;

    // Try to extract branches from the compare page
    const headRef = document.querySelector('.head-ref')?.textContent?.trim() || '';
    const baseRef = document.querySelector('.base-ref')?.textContent?.trim() || '';

    return {
      repoUrl,
      sourceBranch: headRef,
      targetBranch: baseRef,
    };
  }

  fillTitle(title: string): void {
    const titleInput = document.querySelector<HTMLInputElement>(
      '#pull_request_title, input[name="pull_request[title]"]',
    );
    if (titleInput) {
      setNativeValue(titleInput, title);
    }
  }

  fillDescription(description: string): void {
    const bodyTextarea = document.querySelector<HTMLTextAreaElement>(
      '#pull_request_body, textarea[name="pull_request[body]"]',
    );
    if (bodyTextarea) {
      setNativeValue(bodyTextarea, description);
    }
  }

  getButtonAnchor(): Element | null {
    // Place button near the PR form actions
    return (
      document.querySelector('.merge-pr-more-commits') ||
      document.querySelector('#pull_request_body')?.closest('.write-content') ||
      document.querySelector('.pull-request-tab-content') ||
      document.querySelector('#new_pull_request')
    );
  }
}
