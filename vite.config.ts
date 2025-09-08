import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate Firebase into its own chunk
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          // Separate React/UI libraries
          react: ['react', 'react-dom', 'react-router-dom'],
          // Separate UI components
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', 'lucide-react'],
          // Separate query library
          query: ['@tanstack/react-query'],
        },
      },
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 600,
  },
}));
