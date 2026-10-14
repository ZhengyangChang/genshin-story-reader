import matter from 'gray-matter'
import MarkdownIt from 'markdown-it'
import { z } from 'zod'

const version = z.string().regex(/^\d+\.\d+$/)
const id = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
export const metadata = z.object({
  id,
  version,
  arc: z.string().min(1),
  act: z.number().int().positive(),
  title: z.string().min(1),
  order: z.number().int().nonnegative(),
  status: z.enum(['draft', 'review', 'published']),
  spoilerThrough: z.object({ version, act: z.number().int().positive() }),
  updated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sources: z.array(
    z.object({
      id,
      title: z.string().min(1),
      url: z
        .string()
        .url()
        .refine((value) => /^https?:\/\//.test(value)),
    }),
  ),
})
export type ArticleMeta = z.infer<typeof metadata> & { demo: boolean }
export type Article = ArticleMeta & {
  html: string
  scenes: { id: string; title: string }[]
}

const md = new MarkdownIt({ html: false, linkify: false, typographer: false })
// Images are deliberately omitted until asset provenance is reviewed.
md.renderer.rules.image = (tokens, index) =>
  md.utils.escapeHtml(tokens[index]?.content ?? '')

export function parseArticle(source: string, demo = false): Article | null {
  const { data, content } = matter(source)
  const meta = metadata.parse(data)
  if (meta.status !== 'published') return null
  if (!meta.sources.length)
    throw new Error(`${meta.id}: published articles need sources`)
  if (
    meta.spoilerThrough.version !== meta.version ||
    meta.spoilerThrough.act !== meta.act
  ) {
    throw new Error(`${meta.id}: spoiler boundary must match this act`)
  }
  const tokens = md.parse(content, {})
  const scenes: Article['scenes'] = []
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].type !== 'heading_open') continue
    if (tokens[i].tag !== 'h2')
      throw new Error(`${meta.id}: use only level-two scene headings`)
    const inline = tokens[i + 1]
    const match = /^([a-z0-9]+(?:-[a-z0-9]+)*)\s*\|\s*(.+)$/.exec(
      inline.content,
    )
    if (!match)
      throw new Error(`${meta.id}: scene headings require stable-id | title`)
    if (scenes.some((scene) => scene.id === match[1]))
      throw new Error(`${meta.id}: duplicate scene ID`)
    scenes.push({ id: match[1], title: match[2] })
    tokens[i].attrSet('id', match[1])
    inline.content = match[2]
    inline.children = md.parseInline(match[2], {})[0].children
  }
  if (!scenes.length)
    throw new Error(`${meta.id}: at least one scene is required`)
  return {
    ...meta,
    demo,
    scenes,
    html: md.renderer.render(tokens, md.options, {}),
  }
}

export function collectArticles(inputs: { source: string; demo: boolean }[]) {
  const articles: Article[] = []
  const ids = new Set<string>()
  for (const input of inputs) {
    const raw = matter(input.source).data
    const parsed = metadata.parse(raw)
    if (ids.has(parsed.id))
      throw new Error(`Duplicate article ID: ${parsed.id}`)
    ids.add(parsed.id)
    const article = parseArticle(input.source, input.demo)
    if (article) articles.push(article)
  }
  return articles.sort((a, b) => {
    const av = a.version.split('.').map(Number),
      bv = b.version.split('.').map(Number)
    return (
      av[0] - bv[0] ||
      av[1] - bv[1] ||
      a.order - b.order ||
      a.id.localeCompare(b.id)
    )
  })
}
