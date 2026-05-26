import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    proxy: {
      '/tts': 'http://localhost:8080',
      '/asr': {
        target: 'http://localhost:8080',
        ws: true,
      },
    },
  },
});
