/* eslint-disable no-console */
const path = require('path');
const fs = require('fs');
const fsp = require('fs/promises');

async function ensureDir(dir) {
  await fsp.mkdir(dir, { recursive: true });
}

async function run() {
  // Dynamically import ESM-only module
  const { default: favicons } = await import('favicons');
  const source = path.resolve(__dirname, '../src/app/icon.svg');
  const outDir = path.resolve(__dirname, '../src/app');
  const configuration = {
    path: '/',
    icons: {
      android: false,
      appleIcon: false,
      appleStartup: false,
      coast: false,
      favicons: true,
      firefox: false,
      windows: false,
      yandex: false,
    },
  };

  if (!fs.existsSync(source)) {
    console.error('Source icon not found:', source);
    process.exit(1);
  }

  await ensureDir(outDir);

  try {
    const response = await favicons(source, configuration);
    // Write images (includes favicon.ico and pngs)
    await Promise.all(
      response.images.map((image) =>
        fsp.writeFile(path.join(outDir, image.name), image.contents)
      )
    );
    // Optionally write other files (manifest/browserconfig) if present and desired in future
    console.log('Generated:', response.images.map((i) => i.name).join(', '));
  } catch (err) {
    console.error('Error generating favicons:', err && err.message ? err.message : err);
    process.exit(1);
  }
}

run();
