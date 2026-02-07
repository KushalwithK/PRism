import type { Platform } from '../../shared/types.js';
import type { PlatformAdapter, PlatformMetadata } from './platform-adapter.js';

export class GitLabAdapter implements PlatformAdapter {
  readonly platform: Platform = 'gitlab';

  detect(): boolean {
    return (
      window.location.href.includes('gitlab.com') &&
      window.location.href.includes('/merge_requests/new')
    );
  }

  async extractDiff(): Promise<string> {
    // Strategy 1: Get diff from the MR diff tab
    const diffContent = document.querySelectorAll('.diff-content .line_content');
    if (diffContent.length > 0) {
      const lines: string[] = [];
      document.querySelectorAll('.diff-file').forEach((file) => {
        const filename = file.querySelector('.file-title-name')?.textContent?.trim() || '';
        lines.push(`--- a/${filename}`);
        lines.push(`+++ b/${filename}`);
        file.querySelectorAll('.diff-td .line_content').forEach((line) => {
          const el = line as HTMLElement;
          if (el.classList.contains('old')) lines.push(`-${el.textContent || ''}`);
          else if (el.classList.contains('new')) lines.push(`+${el.textContent || ''}`);
          else lines.push(` ${el.textContent || ''}`);
        });
      });
      if (lines.length > 0) return lines.join('\n');
    }

    // Strategy 2: Fetch diff from API using the MR source/target
    const sourceInput = document.querySelector<HTMLInputElement>('[name="merge_request[source_branch]"]');
    const targetInput = document.querySelector<HTMLInputElement>('[name="merge_request[target_branch]"]');
    if (sourceInput?.value && targetInput?.value) {
      const projectPath = window.location.pathname.match(/^\/(.+?)\/-/)?.[1];
      if (projectPath) {
        try {
          const encoded = encodeURIComponent(projectPath);
          const res = await fetch(
            `https://gitlab.com/api/v4/projects/${encoded}/repository/compare?from=${targetInput.value}&to=${sourceInput.value}`,
          );
          if (res.ok) {
            const data = await res.json();
            return (data.diffs || [])
              .map((d: { diff: string; new_path: string }) => `--- a/${d.new_path}\n+++ b/${d.new_path}\n${d.diff}`)
              .join('\n');
          }
        } catch { /* fall through */ }
      }
    }

    return '';
  }

  getMetadata(): PlatformMetadata {
    const url = window.location.href;
    const projectMatch = url.match(/gitlab\.com\/(.+?)\/-/);
    const repoUrl = projectMatch ? `https://gitlab.com/${projectMatch[1]}` : url;

    const sourceInput = document.querySelector<HTMLInputElement>('[name="merge_request[source_branch]"]');
    const targetInput = document.querySelector<HTMLInputElement>('[name="merge_request[target_branch]"]');

    return {
      repoUrl,
      sourceBranch: sourceInput?.value || '',
      targetBranch: targetInput?.value || '',
    };
  }

  fillTitle(title: string): void {
    const titleInput = document.querySelector<HTMLInputElement>(
      '#merge_request_title, input[name="merge_request[title]"]',
    );
    if (titleInput) {
      titleInput.value = title;
      titleInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  fillDescription(description: string): void {
    const bodyTextarea = document.querySelector<HTMLTextAreaElement>(
      '#merge_request_description, textarea[name="merge_request[description]"]',
    );
    if (bodyTextarea) {
      bodyTextarea.value = description;
      bodyTextarea.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  getButtonAnchor(): Element | null {
    return (
      document.querySelector('.merge-request-form .form-actions') ||
      document.querySelector('#merge_request_description')?.parentElement ||
      document.querySelector('.merge-request-form')
    );
  }
}
