/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// GitHub Pages project site: https://gakshith.github.io/ocean_portfolio/
export default defineConfig({
  base: '/ocean_portfolio/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
  },
})
