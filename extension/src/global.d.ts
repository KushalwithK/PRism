// Firefox WebExtension API global
declare const browser: typeof chrome | undefined;

// Build-time env vars injected by esbuild define
declare namespace process {
  const env: {
    BROWSER: 'chrome' | 'firefox';
    API_URL: string;
  };
}
