import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' — относительные пути к ассетам.
// Сборка корректно работает и на корне поддомена 3-го уровня (todo.24di.online),
// и при размещении в подпапке.
export default defineConfig({
  plugins: [react()],
  base: './',
});
