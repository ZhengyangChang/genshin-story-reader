import { expect, test } from 'bun:test'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  collectArticles,
  parseArticle,
  type Supplement,
} from '../scripts/content'
import { SupplementCard } from '../src/components/supplement-card'

const fixture = (
  mode = 'brief',
  status = 'published',
  body = '正文。',
  notes = '',
) => `---
id: story-one
version: "6.1"
arc: 示例
act: 3
title: 示例
order: 1
mode: ${mode}
status: ${status}
spoilerThrough:
  version: "6.1"
  act: 3
updated: "2026-10-14"
sources:
  - id: source
    title: 任务记录
    url: https://example.com
${notes}
---

## first | 场景一

${body}`
const notes = `notes:
  - id: person
    scene: first
    kind: foreshadowing
    title: 身份线索
    body: "身份答案。"
    sourceIds: [source]`

test('two editions produce one story with stable scene anchors', () => {
  const result = collectArticles([
    { source: fixture(), demo: false },
    { source: fixture('detailed', 'published', '更详细的正文。'), demo: false },
  ])
  expect(result).toHaveLength(1)
  expect(result[0].availableModes).toEqual(['brief', 'detailed'])
  expect(result[0].detailed?.scenes[0].id).toBe(result[0].scenes[0].id)
  expect(result[0].html).not.toContain('更详细')
})
test('draft detailed text cannot leak into a published brief', () => {
  const result = collectArticles([
    { source: fixture(), demo: false },
    {
      source: fixture('detailed', 'draft', 'SECRET_DETAIL_SENTINEL'),
      demo: false,
    },
  ])
  expect(result[0].availableModes).toEqual(['brief'])
  expect(JSON.stringify(result)).not.toContain('SECRET_DETAIL_SENTINEL')
  expect(result[0].detailed).toBeUndefined()
})
test('editions with inconsistent scene IDs fail instead of jumping to the wrong scene', () => {
  expect(() =>
    collectArticles([
      { source: fixture(), demo: false },
      {
        source: fixture('detailed').replace('## first |', '## other |'),
        demo: false,
      },
    ]),
  ).toThrow('share ordered scene IDs')
})
test('inline disclosures require a real note in the same scene and valid source', () => {
  const brief = parseArticle(
    fixture('brief', 'published', '提到[[某人|person]]。', notes),
  )!
  expect(brief.scenes[0].html).toContain('提到某人。')
  expect(brief.scenes[0].html).not.toContain('data-note=')
  expect(brief.html).not.toContain('note-reference')
  expect(
    parseArticle(fixture('detailed', 'published', '提到[[某人|person]]。'))
      ?.scenes[0].html,
  ).toContain('data-note="person"')
  expect(() =>
    parseArticle(fixture('brief', 'published', '[[某人|missing]]', notes)),
  ).toThrow('note reference')
  expect(() =>
    parseArticle(
      fixture(
        'brief',
        'published',
        '正文',
        notes.replace('scene: first', 'scene: absent'),
      ),
    ),
  ).toThrow('unknown note scene')
  expect(() =>
    parseArticle(
      fixture(
        'brief',
        'published',
        '正文',
        notes.replace('sourceIds: [source]', 'sourceIds: [absent]'),
      ),
    ),
  ).toThrow('unknown note source')
})
test('future spoiler answers and revealing titles are absent from collapsed markup', () => {
  const note: Supplement = {
    id: 'future',
    scene: 'first',
    title: 'SECRET_TITLE',
    html: '<p>SECRET_ANSWER</p>',
    kind: 'foreshadowing',
    evidence: 'interpretation',
    spoiler: 'future',
    sourceIds: ['source'],
  }
  const collapsed = renderToStaticMarkup(
    <SupplementCard note={note} open={false} onToggle={() => {}} />,
  )
  expect(collapsed).not.toContain('SECRET_TITLE')
  expect(collapsed).not.toContain('SECRET_ANSWER')
  expect(collapsed).toContain('涉及后续信息')
  expect(
    renderToStaticMarkup(
      <SupplementCard note={note} open onToggle={() => {}} />,
    ),
  ).toContain('SECRET_ANSWER')
})
