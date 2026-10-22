import matter from 'gray-matter'
import MarkdownIt from 'markdown-it'
import { z } from 'zod'

const version = z.string().regex(/^\d+\.\d+$/)
const id = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
const mode = z.enum(['brief', 'detailed'])
export type ReadingMode = z.infer<typeof mode>
const source = z.object({
  id,
  title: z.string().min(1),
  url: z
    .string()
    .url()
    .refine((value) => /^https?:\/\//.test(value)),
})
const note = z.object({
  id,
  scene: id,
  kind: z.enum(['easter-egg', 'foreshadowing', 'closure', 'context']),
  title: z.string().min(1),
  body: z.string().min(1),
  spoiler: z.enum(['current', 'future']).default('current'),
  evidence: z.enum(['confirmed', 'interpretation']).default('confirmed'),
  sourceIds: z.array(id).min(1),
})
export const metadata = z.object({
  id,
  version,
  arc: z.string().min(1),
  act: z.number().int().positive(),
  chapterType: z.enum(['act', 'interlude']).default('act'),
  title: z.string().min(1),
  order: z.number().int().nonnegative(),
  status: z.enum(['draft', 'review', 'published']),
  mode: mode.default('brief'),
  spoilerThrough: z.object({ version, act: z.number().int().positive() }),
  updated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sources: z.array(source),
  notes: z.array(note).default([]),
})
export type ArticleMeta = Omit<z.infer<typeof metadata>, 'notes' | 'mode'> & {
  demo: boolean
  availableModes: ReadingMode[]
}
export type Scene = { id: string; title: string; html: string }
export type Supplement = Omit<z.infer<typeof note>, 'body'> & { html: string }
export type Edition = {
  html: string
  scenes: Scene[]
  preambleHtml: string
  sources: z.infer<typeof source>[]
  updated: string
}
export type Article = ArticleMeta &
  Edition & { detailed?: Edition; notes: Supplement[] }

const md = new MarkdownIt({ html: false, linkify: false })
md.renderer.rules.image = (tokens, index) =>
  md.utils.escapeHtml(tokens[index]?.content ?? '')
md.inline.ruler.before('link', 'note_ref', (state, silent) => {
  const match = /^\[\[([^\]\n|]+)\|([a-z0-9]+(?:-[a-z0-9]+)*)\]\]/.exec(
    state.src.slice(state.pos),
  )
  if (!match) return false
  if (!silent) {
    const token = state.push('note_ref', '', 0)
    token.meta = { label: match[1], id: match[2] }
  }
  state.pos += match[0].length
  return true
})
md.renderer.rules.note_ref = (tokens, index, _options, env) => {
  const ref = tokens[index].meta as { label: string; id: string }
  if (env?.readingMode === 'brief') return md.utils.escapeHtml(ref.label)
  return `<button type="button" class="note-reference" data-note="${ref.id}" aria-controls="note-${ref.id}" aria-expanded="false">${md.utils.escapeHtml(ref.label)}<span aria-hidden="true"> ⓘ</span></button>`
}

export function parseArticle(raw: string, demo = false): Article | null {
  const { data, content } = matter(raw)
  const { notes, mode: readingMode, ...meta } = metadata.parse(data)
  if (meta.status !== 'published') return null
  if (!meta.sources.length)
    throw new Error(`${meta.id}: published articles need sources`)
  if (
    meta.spoilerThrough.version !== meta.version ||
    meta.spoilerThrough.act !== meta.act
  )
    throw new Error(`${meta.id}: spoiler boundary must match this act`)
  if (new Set(meta.sources.map((s) => s.id)).size !== meta.sources.length)
    throw new Error(`${meta.id}: duplicate source ID`)
  const tokens = md.parse(content, {})
  const scenes: Scene[] = []
  const starts: number[] = []
  for (let index = 0; index < tokens.length; index++) {
    if (tokens[index].type !== 'heading_open') continue
    if (tokens[index].tag !== 'h2')
      throw new Error(`${meta.id}: use only level-two scene headings`)
    const inline = tokens[index + 1]
    const match = /^([a-z0-9]+(?:-[a-z0-9]+)*)\s*\|\s*(.+)$/.exec(
      inline.content,
    )
    if (!match)
      throw new Error(`${meta.id}: scene headings require stable-id | title`)
    if (scenes.some((scene) => scene.id === match[1]))
      throw new Error(`${meta.id}: duplicate scene ID`)
    scenes.push({ id: match[1], title: match[2], html: '' })
    starts.push(index)
    tokens[index].attrSet('id', match[1])
    inline.content = match[2]
    inline.children = md.parseInline(match[2], {})[0].children
  }
  if (!scenes.length)
    throw new Error(`${meta.id}: at least one scene is required`)
  scenes.forEach((scene, i) => {
    scene.html = md.renderer.render(
      tokens.slice(starts[i] + 3, starts[i + 1] ?? tokens.length),
      md.options,
      {},
    )
  })
  const preambleHtml = md.renderer.render(
    tokens.slice(0, starts[0]),
    md.options,
    {},
  )
  const supplementIds = new Set<string>()
  const supplements = notes.map(({ body, ...note }) => {
    if (supplementIds.has(note.id))
      throw new Error(`${meta.id}: duplicate note ID`)
    supplementIds.add(note.id)
    if (!scenes.some((scene) => scene.id === note.scene))
      throw new Error(`${meta.id}: unknown note scene`)
    if (
      note.sourceIds.some(
        (id) => !meta.sources.some((source) => source.id === id),
      )
    )
      throw new Error(`${meta.id}: unknown note source`)
    if (/\[\[/.test(body))
      throw new Error(`${meta.id}: nested note references are not supported`)
    return { ...note, html: md.render(body) }
  })
  for (const scene of scenes) {
    for (const match of scene.html.matchAll(/data-note="([a-z0-9-]+)"/g)) {
      const note = supplements.find((note) => note.id === match[1])
      // Detailed editions reuse notes from the brief file, validated when the editions are joined.
      if (readingMode === 'brief' && (!note || note.scene !== scene.id))
        throw new Error(`${meta.id}: unknown or misplaced note reference`)
    }
  }
  if (preambleHtml.includes('data-note='))
    throw new Error(`${meta.id}: note references must belong to a scene`)
  if (readingMode === 'brief') {
    scenes.forEach((scene, i) => {
      scene.html = md.renderer.render(
        tokens.slice(starts[i] + 3, starts[i + 1] ?? tokens.length),
        md.options,
        { readingMode },
      )
    })
  }
  return {
    ...meta,
    demo,
    availableModes: [readingMode],
    notes: supplements,
    html: md.renderer.render(tokens, md.options, { readingMode }),
    scenes,
    preambleHtml,
  }
}

const pairedBlock = z.object({
  id,
  title: z.string().min(1),
  brief: z.string().trim().min(1),
  detail: z.string().trim().min(1),
})

// Paired Markdown stores both texts together in YAML frontmatter. Reuse the
// existing Markdown safety, source, spoiler and supplement validation below.
export function expandPairedInput(input: { source: string; demo: boolean }) {
  const parsed = matter(input.source)
  if (parsed.data.format !== 'paired') return [input]
  const blocks = z.array(pairedBlock).min(1).parse(parsed.data.blocks)
  if (parsed.content.trim()) throw new Error('Paired content belongs in blocks')
  if (new Set(blocks.map((block) => block.id)).size !== blocks.length)
    throw new Error('Duplicate paired block ID')
  if (blocks.some((block) => /\n\s*\n/.test(block.brief)))
    throw new Error('Each paired brief must be a single narrative paragraph')
  const { blocks: _blocks, format: _format, ...meta } = parsed.data
  return (['brief', 'detailed'] as const).map((mode) => ({
    demo: input.demo,
    source: matter.stringify(
      blocks
        .map(
          (block) =>
            '## ' +
            block.id +
            ' | ' +
            block.title +
            '\n\n' +
            (mode === 'brief' ? block.brief : block.detail),
        )
        .join('\n\n'),
      { ...meta, mode, notes: mode === 'brief' ? (meta.notes ?? []) : [] },
    ),
  }))
}

export function collectArticles(inputs: { source: string; demo: boolean }[]) {
  const groups = new Map<string, Partial<Record<ReadingMode, Article>>>()
  const keys = new Set<string>()
  for (const input of inputs.flatMap(expandPairedInput)) {
    const meta = metadata.parse(matter(input.source).data)
    const key = `${meta.id}:${meta.mode}`
    if (keys.has(key)) throw new Error(`Duplicate article ID and mode: ${key}`)
    keys.add(key)
    const article = parseArticle(input.source, input.demo)
    if (!article) continue
    const group = groups.get(meta.id) ?? {}
    group[meta.mode] = article
    groups.set(meta.id, group)
  }
  const articles: Article[] = []
  for (const [id, group] of groups) {
    if (!group.brief)
      throw new Error(`${id}: a published brief edition is required`)
    const base = group.brief
    if (group.detailed) {
      const detail = group.detailed
      if (
        ['version', 'act', 'chapterType', 'title', 'arc', 'order', 'demo'].some(
          (key) => base[key as keyof Article] !== detail[key as keyof Article],
        )
      )
        throw new Error(`${id}: edition metadata must match`)
      if (
        JSON.stringify(base.scenes.map((s) => s.id)) !==
        JSON.stringify(detail.scenes.map((s) => s.id))
      )
        throw new Error(`${id}: editions must share ordered scene IDs`)
      if (detail.notes.length)
        throw new Error(`${id}: shared notes belong in the brief edition`)
      for (const scene of detail.scenes)
        for (const match of scene.html.matchAll(/data-note="([a-z0-9-]+)"/g)) {
          if (
            !base.notes.some(
              (note) => note.id === match[1] && note.scene === scene.id,
            )
          )
            throw new Error(`${id}: unknown or misplaced note reference`)
        }
      base.detailed = {
        html: detail.html,
        scenes: detail.scenes,
        preambleHtml: detail.preambleHtml,
        sources: detail.sources,
        updated: detail.updated,
      }
      base.availableModes.push('detailed')
    }
    articles.push(base)
  }
  return articles.sort((a, b) => {
    const av = a.version.split('.').map(Number),
      bv = b.version.split('.').map(Number)
    return (
      Number(a.demo) - Number(b.demo) ||
      av[0] - bv[0] ||
      av[1] - bv[1] ||
      a.order - b.order ||
      a.id.localeCompare(b.id)
    )
  })
}
