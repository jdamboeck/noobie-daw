import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1];
const isUserOrOrganizationSite = repositoryName?.endsWith('.github.io') ?? false;
const base = process.env.GITHUB_ACTIONS === 'true' && repositoryName && !isUserOrOrganizationSite
  ? `/${repositoryName}/`
  : '/';

// https://vitejs.dev/config/
export default defineConfig({
  base,
  plugins: [react()],
  server: {
    port: 3000,
    host: true
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/node_modules/tone/') || id.includes('/node_modules/standardized-audio-context/')) return 'audio-vendor';
          if (id.includes('/node_modules/yjs/') || id.includes('/node_modules/y-webrtc/') || id.includes('/node_modules/y-protocols/') || id.includes('/node_modules/lib0/')) return 'collaboration-vendor';
          if (id.includes('/node_modules/react/') || id.includes('/node_modules/react-dom/')) return 'react-vendor';
        }
      }
    }
  }
});
