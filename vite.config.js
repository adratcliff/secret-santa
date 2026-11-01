import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import vueDevTools from 'vite-plugin-vue-devtools'
import federation from "@originjs/vite-plugin-federation";


// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      vue(),
      vuetify({ autoImport: true }),
      vueDevTools(),
      federation({
        name: 'secret-santa',
        filename: 'secretSanta.js',
        exposes: {
          './Create': './src/views/SantaCreate.vue',
          './Draw': './src/views/SantaDraw.vue',
          './List': './src/views/SantaList.vue',
        },
        remotes: {
          shared: `${env.VITE_REMOTE_MODULE_BASE}${mode === 'production' ? '' : '8070'}/assets/remoteEntry.js`,
        },
        shared: ['vue', 'vuetify', 'vue-router', 'pinia'],
      }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      },
    },
    server: {
      origin: 'http://localhost:8095',
      port: '8095',
    },
    preview: {
      port: '8095',
      strictPort: true,
    },
    build: {
      target: 'esnext',
      minify: env.VITE_MINIFY === 'true',
      cssCodeSplit: env.VITE_CSS_CODE_SPLIT === 'true',
    },
    optimizeDeps: {
      esbuildOptions: {
        target: 'esnext'
      }
    }
  }
});
