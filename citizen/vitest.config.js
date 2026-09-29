import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // The app builds with the automatic JSX runtime, so no component imports
  // React. Rendering a component in a test has to use the same runtime.
  esbuild: { jsx: 'automatic' },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.{js,jsx}'],
    globals: false,
  },
});
