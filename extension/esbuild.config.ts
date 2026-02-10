import * as esbuild from 'esbuild';
import { cpSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const isWatch = process.argv.includes('--watch');
const isFirefox = process.env.BROWSER === 'firefox';
const apiUrl = process.env.API_URL || 'http://localhost:3000';
const websiteUrl = process.env.WEBSITE_URL || 'http://localhost:3001';
const outdir = resolve(__dirname, 'dist');

// Ensure output directory
mkdirSync(outdir, { recursive: true });

// Copy static files
cpSync(resolve(__dirname, 'src/manifest.json'), resolve(outdir, 'manifest.json'));
cpSync(resolve(__dirname, 'src/popup/popup.html'), resolve(outdir, 'popup.html'));
cpSync(resolve(__dirname, 'src/popup/popup.css'), resolve(outdir, 'popup.css'));
cpSync(resolve(__dirname, 'src/icons'), resolve(outdir, 'icons'), { recursive: true });

const buildOptions: esbuild.BuildOptions = {
  entryPoints: {
    background: resolve(__dirname, 'src/background/index.ts'),
    content: resolve(__dirname, 'src/content/index.ts'),
    popup: resolve(__dirname, 'src/popup/popup.ts'),
  },
  bundle: true,
  outdir,
  format: 'esm',
  target: 'es2022',
  sourcemap: isWatch ? 'inline' : false,
  minify: !isWatch,
  define: {
    'process.env.BROWSER': JSON.stringify(isFirefox ? 'firefox' : 'chrome'),
    'process.env.API_URL': JSON.stringify(apiUrl),
    'process.env.WEBSITE_URL': JSON.stringify(websiteUrl),
  },
};

async function build() {
  if (isWatch) {
    const ctx = await esbuild.context(buildOptions);
    await ctx.watch();
    console.log('Watching for changes...');
  } else {
    await esbuild.build(buildOptions);
    console.log('Build complete.');
  }
}

build().catch((e) => {
  console.error(e);
  process.exit(1);
});
