import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  define: {
    'import.meta.env.VITE_APP_BUILD_TIME': JSON.stringify(Date.now()),
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.svg',
        'pwa-icon.svg',
        'apple-touch-icon.png',
        'pwa-icon-192.png',
        'pwa-icon-512.png',
      ],
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,svg,webmanifest}'],
        runtimeCaching: [
          {
            urlPattern: /\/recipes-update\.json/i,
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    allowedHosts: true,
  },
})
