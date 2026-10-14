import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import react from '@vitejs/plugin-react'
import { buildContent } from './scripts/build-content.ts'

export default defineConfig({
  plugins: [
    {
      name: 'story-content',
      configureServer(server) {
        server.watcher.add('content')
        let queue = Promise.resolve()
        server.watcher.on('all', (_event, path) => {
          if (!/[\\/]content[\\/](stories|examples)[\\/].*\.md$/.test(path))
            return
          queue = queue
            .then(async () => {
              await buildContent()
              server.ws.send({ type: 'full-reload' })
            })
            .catch((error) => server.config.logger.error(String(error)))
        })
      },
    },
    tanstackStart(),
    react(),
  ],
})
