import { defineConfig } from 'vite';
import { copyFileSync, mkdirSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

export default defineConfig({
  base: './', // Use relative paths for GitHub Pages compatibility
  server: {
    open: true,
    port: 3000
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  },
  plugins: [
    {
      name: 'copy-assets',
      closeBundle() {
        // Copy icons folder to dist
        const iconsSource = 'icons';
        const iconsDest = join('dist', 'icons');

        if (existsSync(iconsSource)) {
          if (!existsSync(iconsDest)) {
            mkdirSync(iconsDest, { recursive: true });
          }

          const files = readdirSync(iconsSource);
          files.forEach(file => {
            copyFileSync(join(iconsSource, file), join(iconsDest, file));
            console.log(`Copied icon: ${file}`);
          });
        }

        // Copy sample2.csv to dist
        const sampleCsv = 'sample2.csv';
        if (existsSync(sampleCsv)) {
          copyFileSync(sampleCsv, join('dist', sampleCsv));
          console.log('Copied sample2.csv');
        }
      }
    }
  ]
});
