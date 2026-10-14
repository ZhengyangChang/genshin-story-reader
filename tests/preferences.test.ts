import { expect, test } from 'bun:test'
import { validatePreferences } from '../src/lib/preferences'

test('damaged reading records fall back to safe preferences', () => {
  expect(validatePreferences(null).fontSize).toBe(19)
  expect(validatePreferences({ schemaVersion: 99 }).visitedArticleIds).toEqual(
    [],
  )
  const result = validatePreferences({
    schemaVersion: 1,
    fontSize: Infinity,
    lineWidth: 100,
    theme: 'unknown',
    visitedArticleIds: ['one', 'one', 4],
    completedArticleIds: 'wrong',
  })
  expect(result.fontSize).toBe(19)
  expect(result.lineWidth).toBe(42)
  expect(result.theme).toBe('day')
  expect(result.visitedArticleIds).toEqual(['one'])
  expect(result.completedArticleIds).toEqual([])
})
