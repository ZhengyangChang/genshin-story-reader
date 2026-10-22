import type { ArticleMeta } from '../../scripts/content'

export function chapterLabel(
  article: Pick<ArticleMeta, 'act' | 'chapterType'>,
) {
  return article.chapterType === 'interlude' ? '幕间' : `第 ${article.act} 幕`
}
