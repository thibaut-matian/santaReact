import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate', // Met à jour l'app automatiquement si tu pousses une nouvelle version
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'], // Fichiers à mettre en cache
      manifest: {
        name: 'Santa React App', // Le nom complet de ton appli
        short_name: 'Santa', // Le nom sous l'icône sur le téléphone
        description: 'Une application React magique pour Noël',
        theme_color: '#ffffff', // La couleur de la barre de statut du téléphone
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
})