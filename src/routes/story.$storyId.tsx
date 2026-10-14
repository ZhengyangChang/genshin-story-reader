import {
  createFileRoute,
  Link,
  notFound,
  useNavigate,
} from '@tanstack/react-router'
import { useEffect } from 'react'
import { catalog, getArticle } from '../lib/content'
import { usePreferences } from '../lib/preferences'

export const Route = createFileRoute('/story/$storyId')({
  loader: async ({ params }) => {
    const article = await getArticle(params.storyId)
    if (!article) throw notFound()
    return article
  },
  // A neutral document title avoids revealing unread story names during navigation.
  head: () => ({ meta: [{ title: '逐幕阅读 · 原神故事阅读器' }] }),
  component: Story,
})
function Story() {
  const article = Route.useLoaderData()
  const { prefs, ready, update } = usePreferences()
  const navigate = useNavigate()
  const siblings = catalog.filter((item) => item.demo === article.demo)
  const index = siblings.findIndex((item) => item.id === article.id)
  const previous = siblings[index - 1],
    next = siblings[index + 1]
  const complete = prefs.completedArticleIds.includes(article.id)
  useEffect(() => {
    if (ready)
      update((old) => ({
        ...old,
        lastArticleId: article.id,
        visitedArticleIds: [...new Set([...old.visitedArticleIds, article.id])],
      }))
  }, [article.id, ready, update])
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        window.getSelection()?.toString() ||
        (event.target instanceof HTMLElement &&
          event.target.closest(
            'input,textarea,select,button,[contenteditable]',
          ))
      )
        return
      const target =
        event.key === 'ArrowLeft'
          ? previous
          : event.key === 'ArrowRight'
            ? next
            : null
      if (target) {
        event.preventDefault()
        void navigate({ to: '/story/$storyId', params: { storyId: target.id } })
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [previous, next, navigate])
  const label = (item: typeof previous) =>
    item && (item.demo || prefs.visitedArticleIds.includes(item.id))
      ? item.title
      : `第 ${item?.act} 幕`
  return (
    <div className="story-page" key={article.id}>
      <div className="page-topline">
        <Link to="/">← 阅读入口</Link>
        <span>
          {article.demo
            ? 'LAYOUT STUDY / 排版示例'
            : `VERSION ${article.version}`}
        </span>
      </div>
      <article className="story-article">
        <header className="story-header">
          <p className="eyebrow">
            {article.arc} · {article.demo ? '示例 01' : `第 ${article.act} 幕`}
          </p>
          <h1>{article.title}</h1>
          <div className="story-meta">
            <span>
              {article.demo
                ? '原创演示 · 非游戏剧情'
                : `剧透范围：至 ${article.version} 第 ${article.act} 幕`}
            </span>
            <span>修订于 {article.updated}</span>
          </div>
        </header>
        <nav className="scene-nav" aria-label="本篇小节">
          {article.scenes.map((scene) => (
            <a key={scene.id} href={`#${scene.id}`}>
              {scene.title}
            </a>
          ))}
        </nav>
        {article.demo && (
          <aside className="demo-notice">
            排版示例 ·
            下文为原创虚构故事，仅用于测试阅读体验。正式剧情尚未发布。
          </aside>
        )}
        <div
          className="prose"
          dangerouslySetInnerHTML={{ __html: article.html }}
        />
        <div className="end-mark" aria-hidden="true">
          ◇
        </div>
        <div className="completion">
          <p>
            {complete ? '这一篇，已经读完了。' : '读到这里，给这一篇留个记号。'}
          </p>
          <button
            className={complete ? 'secondary-button' : 'primary-button'}
            onClick={() =>
              update((old) => ({
                ...old,
                completedArticleIds: complete
                  ? old.completedArticleIds.filter((id) => id !== article.id)
                  : [...new Set([...old.completedArticleIds, article.id])],
              }))
            }
          >
            {complete ? '取消读完标记' : '标记读完 ✓'}
          </button>
        </div>
        <details className="sources">
          <summary>
            资料与说明 <span>{article.sources.length} 项</span>
          </summary>
          <ul>
            {article.sources.map((source) => (
              <li key={source.id}>
                <a href={source.url} target="_blank" rel="noopener noreferrer">
                  {source.title} ↗
                </a>
              </li>
            ))}
          </ul>
        </details>
        <nav className="article-pager" aria-label="前后篇">
          {previous ? (
            <Link to="/story/$storyId" params={{ storyId: previous.id }}>
              ← 上一篇<small>{label(previous)}</small>
            </Link>
          ) : (
            <span>已是第一篇</span>
          )}
          {next ? (
            <Link to="/story/$storyId" params={{ storyId: next.id }}>
              下一篇 →<small>{label(next)}</small>
            </Link>
          ) : (
            <Link to="/">
              返回目录 →<small>更多故事正在准备</small>
            </Link>
          )}
        </nav>
      </article>
    </div>
  )
}
