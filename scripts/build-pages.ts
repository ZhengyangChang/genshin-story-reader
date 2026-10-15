import { spawnSync } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const base = '/genshin-story-reader/'
const result = spawnSync(process.execPath, ['run', 'build'], {
  stdio: 'inherit',
  env: { ...process.env, PAGES_BUILD: '1', VITE_SITE_BASE: base },
})
if (result.error) throw result.error
if (result.status !== 0) process.exit(result.status ?? 1)
const { catalog } = await import('../src/generated/content.ts')
const directory = 'dist/client'
for (const relative of [
  'index.html',
  ...catalog.map((a) => `story/${a.id}/index.html`),
]) {
  const html = await readFile(join(directory, relative), 'utf8')
  if (!html.includes(`${base}assets/`))
    throw new Error(`${relative}: missing Pages asset prefix`)
  if (/\b(?:href|src)="\/(?:assets|story)\//.test(html))
    throw new Error(`${relative}: unprefixed URL`)
}
await writeFile(join(directory, '.nojekyll'), '')
await writeFile(
  join(directory, '404.html'),
  `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>没有找到这一页 · 原神故事阅读器</title><style>body{margin:0;background:#f8f6f0;color:#283b35;font:18px/1.9 system-ui,sans-serif}main{max-width:36em;padding:15vh 24px;margin:auto}h1{font-size:30px;font-weight:400}a{color:#315c4b}</style></head><body><main><p>404 · 没有找到这一页</p><h1>故事还没走到这里。</h1><a href="${base}">回到阅读入口 →</a></main></body></html>`,
)
console.log(
  `Pages static output verified: ${catalog.length + 1} pages, custom 404 and .nojekyll. No deployment performed.`,
)
