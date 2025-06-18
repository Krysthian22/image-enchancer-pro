import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/image-enchancer-pro/', // <-- CORRIGIDO AQUI! MUITO IMPORTANTE!
  build: {
    outDir: 'docs' // Para garantir que o output seja na pasta 'docs'
  }
});
