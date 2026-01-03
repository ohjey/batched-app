import { defineConfig } from 'vite';
import native from 'vite-plugin-native';

// https://vitejs.dev/config
export default defineConfig({
  plugins: [
    native({
      webpack: {
        nativeBinding: true,
      },
    }),
  ],
  build: {
    rollupOptions: {
      external: [],
    },
  },
});
