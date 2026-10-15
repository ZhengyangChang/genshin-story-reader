import { expect, test } from 'bun:test'
import matter from 'gray-matter'
import { renderToStaticMarkup } from 'react-dom/server'
import { collectArticles } from '../scripts/content'
import { NarrativeBlock } from '../src/components/narrative-block'

const meta = {
  id: 'paired-example',
  version: '6.2',
  arc: '示例',
  act: 5,
  title: '示例',
  order: 1,
  status: 'published',
  spoilerThrough: { version: '6.2', act: 5 },
  updated: '2026-10-15',
  sources: [{ id: 'source', title: '资料', url: 'https://example.com' }],
  format: 'paired',
}
const block = {
  id: 'first',
  title: '第一段',
  brief: '简述。',
  detail: '详述一。\n\n详述二。',
}
const collect = (blocks: unknown[], extra = {}) =>
  collectArticles([
    {
      demo: false,
      source: matter.stringify('', { ...meta, ...extra, blocks }),
    },
  ])

test('paired records preserve stable IDs and one-to-many narrative text', () => {
  const [article] = collect([block])
  expect(article.scenes[0].id).toBe('first')
  expect(article.scenes[0].html).toBe('<p>简述。</p>\n')
  expect(article.detailed?.scenes[0].html).toBe(
    '<p>详述一。</p>\n<p>详述二。</p>\n',
  )
  expect(() => collect([block, block])).toThrow('Duplicate paired block')
  expect(() => collect([{ ...block, brief: '第一段\n\n第二段' }])).toThrow(
    'single narrative paragraph',
  )
  expect(() => collect([{ ...block, detail: '' }])).toThrow()
  expect(collect([block], { status: 'draft' })).toHaveLength(0)
})

test('paired notes stay in their block and briefs never reveal interactive notes', () => {
  const notes = [
    {
      id: 'person',
      scene: 'first',
      kind: 'context',
      title: '补充',
      body: '答案',
      sourceIds: ['source'],
    },
  ]
  const [article] = collect(
    [{ ...block, brief: '[[某人|person]]', detail: '[[某人|person]]' }],
    { notes },
  )
  expect(article.scenes[0].html).not.toContain('data-note')
  expect(article.detailed?.scenes[0].html).toContain('data-note="person"')
  expect(() =>
    collect([{ ...block, detail: '[[某人|missing]]' }], { notes }),
  ).toThrow('note reference')
})

test('collapsed paragraph markup excludes detail and supplement answers', () => {
  const props = {
    id: 'first',
    title: '第一段',
    briefHtml: '<p>简述</p>',
    detailHtml: '<p>DETAIL_SENTINEL</p>',
    notes: [],
    openNotes: new Set<string>(),
    onToggle: () => {},
    onToggleNote: () => {},
  }
  const closed = renderToStaticMarkup(
    <NarrativeBlock {...props} expanded={false} />,
  )
  expect(closed).toContain('role="button"')
  expect(closed).toContain('tabindex="0"')
  expect(closed).not.toContain('DETAIL_SENTINEL')
  expect(closed).not.toContain('展开这段')
  const open = renderToStaticMarkup(<NarrativeBlock {...props} expanded />)
  expect(open).toContain('DETAIL_SENTINEL')
  expect(open).not.toContain('<p>简述</p>')
  expect(open).toContain('收起第一段的详述')
})
