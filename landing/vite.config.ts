
  import { defineConfig, Plugin } from 'vite';
  import react from '@vitejs/plugin-react-swc';
  import path from 'path';
  import { readFileSync, existsSync } from 'fs';

  // Plugin to handle react/jsx-runtime imports from ai-page
  function handleAiPageImports(): Plugin {
    return {
      name: 'handle-ai-page-imports',
      enforce: 'pre',
      resolveId(id, importer) {
        // Handle react/jsx-runtime imports, especially from ai-page files
        if (id === 'react/jsx-runtime' || id === 'react/jsx-dev-runtime') {
          // Return a virtual module ID to intercept
          return `\0${id}`;
        }
        return null;
      },
      load(id) {
        // Handle virtual modules for react/jsx-runtime
        if (id === '\0react/jsx-runtime') {
          // Try multiple possible paths
          const possiblePaths = [
            path.resolve(__dirname, 'node_modules/react/jsx-runtime.js'),
            path.resolve(process.cwd(), 'node_modules/react/jsx-runtime.js'),
          ];
          
          for (const filePath of possiblePaths) {
            if (existsSync(filePath)) {
              try {
                return readFileSync(filePath, 'utf-8');
              } catch {
                // Continue to next path
              }
            }
          }
          
          // Fallback: re-export from react/jsx-runtime (let Vite resolve it)
          return `export * from 'react/jsx-runtime';`;
        }
        if (id === '\0react/jsx-dev-runtime') {
          const possiblePaths = [
            path.resolve(__dirname, 'node_modules/react/jsx-dev-runtime.js'),
            path.resolve(process.cwd(), 'node_modules/react/jsx-dev-runtime.js'),
          ];
          
          for (const filePath of possiblePaths) {
            if (existsSync(filePath)) {
              try {
                return readFileSync(filePath, 'utf-8');
              } catch {
                // Continue to next path
              }
            }
          }
          
          return `export * from 'react/jsx-dev-runtime';`;
        }
        return null;
      },
    };
  }

  export default defineConfig({
    plugins: [react(), handleAiPageImports()],
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
      conditions: ['import', 'module', 'browser', 'default'],
      mainFields: ['module', 'jsnext:main', 'jsnext'],
      alias: {
        'vaul@1.1.2': 'vaul',
        'sonner@2.0.3': 'sonner',
        'recharts@2.15.2': 'recharts',
        'react-resizable-panels@2.1.7': 'react-resizable-panels',
        'react-hook-form@7.55.0': 'react-hook-form',
        'react-day-picker@8.10.1': 'react-day-picker',
        'next-themes@0.4.6': 'next-themes',
        'lucide-react@0.487.0': 'lucide-react',
        'input-otp@1.4.2': 'input-otp',
        'embla-carousel-react@8.6.0': 'embla-carousel-react',
        'cmdk@1.1.1': 'cmdk',
        'class-variance-authority@0.7.1': 'class-variance-authority',
        '@radix-ui/react-tooltip@1.1.8': '@radix-ui/react-tooltip',
        '@radix-ui/react-toggle@1.1.2': '@radix-ui/react-toggle',
        '@radix-ui/react-toggle-group@1.1.2': '@radix-ui/react-toggle-group',
        '@radix-ui/react-tabs@1.1.3': '@radix-ui/react-tabs',
        '@radix-ui/react-switch@1.1.3': '@radix-ui/react-switch',
        '@radix-ui/react-slot@1.1.2': '@radix-ui/react-slot',
        '@radix-ui/react-slider@1.2.3': '@radix-ui/react-slider',
        '@radix-ui/react-separator@1.1.2': '@radix-ui/react-separator',
        '@radix-ui/react-select@2.1.6': '@radix-ui/react-select',
        '@radix-ui/react-scroll-area@1.2.3': '@radix-ui/react-scroll-area',
        '@radix-ui/react-radio-group@1.2.3': '@radix-ui/react-radio-group',
        '@radix-ui/react-progress@1.1.2': '@radix-ui/react-progress',
        '@radix-ui/react-popover@1.1.6': '@radix-ui/react-popover',
        '@radix-ui/react-navigation-menu@1.2.5': '@radix-ui/react-navigation-menu',
        '@radix-ui/react-menubar@1.1.6': '@radix-ui/react-menubar',
        '@radix-ui/react-label@2.1.2': '@radix-ui/react-label',
        '@radix-ui/react-hover-card@1.1.6': '@radix-ui/react-hover-card',
        '@radix-ui/react-dropdown-menu@2.1.6': '@radix-ui/react-dropdown-menu',
        '@radix-ui/react-dialog@1.1.6': '@radix-ui/react-dialog',
        '@radix-ui/react-context-menu@2.2.6': '@radix-ui/react-context-menu',
        '@radix-ui/react-collapsible@1.1.3': '@radix-ui/react-collapsible',
        '@radix-ui/react-checkbox@1.1.4': '@radix-ui/react-checkbox',
        '@radix-ui/react-avatar@1.1.3': '@radix-ui/react-avatar',
        '@radix-ui/react-aspect-ratio@1.1.2': '@radix-ui/react-aspect-ratio',
        '@radix-ui/react-alert-dialog@1.1.6': '@radix-ui/react-alert-dialog',
        '@radix-ui/react-accordion@1.2.3': '@radix-ui/react-accordion',
        'react/jsx-runtime': 'react/jsx-runtime',
        'react/jsx-dev-runtime': 'react/jsx-dev-runtime',
        '@': path.resolve(__dirname, './src'),
      },
      dedupe: ['react', 'react-dom', 'react/jsx-runtime'],
      preserveSymlinks: false,
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'react/jsx-runtime', 'react-router-dom'],
      esbuildOptions: {
        jsx: 'automatic',
      },
    },
    build: {
      target: 'esnext',
      outDir: 'build',
      commonjsOptions: {
        transformMixedEsModules: true,
      },
      rollupOptions: {
        output: {
          manualChunks: undefined,
        },
      },
    },
    server: {
      port: 3000,
      open: true,
    },
  });