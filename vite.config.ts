import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import react from '@vitejs/plugin-react'
import { buildContent } from './scripts/build-content.ts'
import { readFileSync } from 'node:fs'
const catalog = JSON.parse(
  readFileSync(
    new URL('./src/generated/catalog.json', import.meta.url),
    'utf8',
  ),
) as { id: string }[]

const pagesBuild = process.env.PAGES_BUILD === '1'
const base = process.env.VITE_SITE_BASE ?? '/'

export default defineConfig({
  base,
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
    tanstackStart({
      router: { basepath: base },
      prerender: {
        enabled: pagesBuild,
        autoStaticPathsDiscovery: false,
        crawlLinks: false,
        failOnError: true,
        concurrency: 2,
      },
      pages: pagesBuild
        ? [
            { path: '/' },
            ...catalog.map((article) => ({ path: '/story/' + article.id })),
          ]
        : [],
    }),
    react(),
  ],
})
