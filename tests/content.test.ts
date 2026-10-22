import { expect, test } from 'bun:test'
import { collectArticles, parseArticle } from '../scripts/content'
const fixture = (status = 'published', id = 'example', version = '6.1') =>
  `---\nid: ${id}\nversion: "${version}"\narc: 示例\nact: 1\ntitle: 示例\norder: 1\nstatus: ${status}\nspoilerThrough:\n  version: "${version}"\n  act: 1\nupdated: "2026-10-14"\nsources:\n  - id: source\n    title: 资料\n    url: https://example.com\n---\n\n## start | 开始\n\n正文。`
test('draft and review bodies never enter published output', () => {
  const articles = collectArticles(
    ['draft', 'review', 'published'].map((status, index) => ({
      source:
        fixture(status, `example-${index}`) +
        (status === 'published' ? '' : '\nPRIVATE_DRAFT_SENTINEL'),
      demo: false,
    })),
  )
  expect(articles).toHaveLength(1)
  expect(articles[0].status).toBe('published')
  expect(JSON.stringify(articles)).not.toContain('PRIVATE_DRAFT_SENTINEL')
  expect(parseArticle(fixture('draft'))).toBeNull()
})
test('duplicate article and scene IDs fail the build', () => {
  expect(() =>
    collectArticles([
      { source: fixture(), demo: false },
      { source: fixture(), demo: false },
    ]),
  ).toThrow('Duplicate')
  expect(() => parseArticle(fixture() + '\n## start | 重复')).toThrow(
    'duplicate scene',
  )
})
test('versions sort numerically and scene IDs survive title changes', () => {
  const result = collectArticles([
    { source: fixture('published', 'later', '6.10'), demo: false },
    { source: fixture('published', 'earlier', '6.2'), demo: false },
  ])
  expect(result.map((a) => a.version)).toEqual(['6.2', '6.10'])
  expect(
    parseArticle(fixture().replace('start | 开始', 'start | 新标题'))?.html,
  ).toContain('id="start"')
})
test('raw HTML and unsafe Markdown links cannot execute', () => {
  const html = parseArticle(
    fixture() + '\n<script>alert(1)</script>\n[bad](javascript:alert(1))',
  )!.html
  expect(html).not.toContain('<script>')
  expect(html).not.toContain('href="javascript:')
})
test('published content requires sources and matching spoiler boundary', () => {
  expect(() =>
    parseArticle(
      fixture().replace(
        'sources:\n  - id: source\n    title: 资料\n    url: https://example.com',
        'sources: []',
      ),
    ),
  ).toThrow('need sources')
  expect(() =>
    parseArticle(fixture().replace('  version: "6.1"', '  version: "6.2"')),
  ).toThrow('spoiler boundary')
})

test('interludes keep their own label between numbered acts', async () => {
  const { chapterLabel } = await import('../src/lib/chapter-label')
  const result = collectArticles([
    {
      source: fixture('published', 'fifth', '5.3').replaceAll(
        'act: 1',
        'act: 5',
      ),
      demo: false,
    },
    {
      source: fixture('published', 'interlude', '5.2')
        .replaceAll('act: 1', 'act: 4')
        .replace('arc: 示例', 'arc: 示例\nchapterType: interlude'),
      demo: false,
    },
    {
      source: fixture('published', 'fourth', '5.1').replaceAll(
        'act: 1',
        'act: 4',
      ),
      demo: false,
    },
  ])
  expect(result.map((article) => article.id)).toEqual([
    'fourth',
    'interlude',
    'fifth',
  ])
  expect(result[0].chapterType).toBe('act')
  expect(chapterLabel(result[0])).toBe('第 4 幕')
  expect(chapterLabel(result[1])).toBe('幕间')
  expect(result[1].act).toBe(4)
})
