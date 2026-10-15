import { resolve, join } from 'node:path'
import { stat } from 'node:fs/promises'

const root = resolve('dist/client')
const base = '/genshin-story-reader/'
Bun.serve({
  hostname: '127.0.0.1',
  port: 4173,
  async fetch(request) {
    const url = new URL(request.url)
    if (url.pathname === base.slice(0, -1)) {
      url.pathname = base
      return Response.redirect(url, 301)
    }
    if (!url.pathname.startsWith(base))
      return new Response('Not found', { status: 404 })
    let relative: string
    try {
      relative = decodeURIComponent(url.pathname.slice(base.length))
    } catch {
      return new Response('Bad request', { status: 400 })
    }
    const path = resolve(root, relative)
    if (
      path !== root &&
      !path.startsWith(root + (process.platform === 'win32' ? '\\' : '/'))
    )
      return new Response('Forbidden', { status: 403 })
    const info = await stat(path).catch(() => null)
    if (info?.isDirectory()) {
      if (!url.pathname.endsWith('/')) {
        url.pathname += '/'
        return Response.redirect(url, 301)
      }
      return new Response(Bun.file(join(path, 'index.html')))
    }
    if (info?.isFile()) return new Response(Bun.file(path))
    return new Response(Bun.file(join(root, '404.html')), { status: 404 })
  },
})
console.log(
  `Static Pages preview: http://127.0.0.1:4173${base} (no Start server, no deployment)`,
)
