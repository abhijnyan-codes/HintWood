import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // Plugins run during the build. react() lets Vite understand JSX,
  // tailwindcss() scans your files for class names and generates only the CSS you use.
  plugins: [react(), tailwindcss()],
})
