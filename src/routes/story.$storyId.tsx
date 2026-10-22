import {
  createFileRoute,
  Link,
  notFound,
  useNavigate,
} from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { catalog, getArticle } from '../lib/content'
import { chapterLabel } from '../lib/chapter-label'
import { usePreferences } from '../lib/preferences'
import { NarrativeBlock } from '../components/narrative-block'
import type { Article, ReadingMode } from '../../scripts/content'

export const Route = createFileRoute('/story/$storyId')({
  validateSearch: (
    search: Record<string, unknown>,
  ): { mode?: ReadingMode } => ({
    mode:
      search.mode === 'brief' || search.mode === 'detailed'
        ? search.mode
        : undefined,
  }),
  loader: async ({ params }) => {
    const article = await getArticle(params.storyId)
    if (!article) throw notFound()
    return article
  },
  head: () => ({ meta: [{ title: '逐幕阅读 · 原神故事阅读器' }] }),
  component: Story,
})
function Story() {
  const article = Route.useLoaderData()
  return <StoryContent key={article.id} article={article} />
}
function StoryContent({ article }: { article: Article }) {
  const { prefs, ready, update } = usePreferences()
  const search = Route.useSearch()
  const navigate = useNavigate()
  const mode =
    search.mode === 'detailed' && article.detailed ? 'detailed' : 'brief'
  const edition = article.detailed ?? article
  const [expanded, setExpanded] = useState<Set<string>>(
    () =>
      new Set(
        mode === 'detailed' ? article.scenes.map((scene) => scene.id) : [],
      ),
  )
  const allExpanded =
    !!article.detailed && expanded.size === article.scenes.length
  const completionMode = allExpanded ? 'detailed' : 'brief'
  const [openNotes, setOpenNotes] = useState<Set<string>>(new Set())
  const content = useRef<HTMLDivElement>(null)
  const siblings = catalog.filter(
    (item) => item.demo === article.demo && item.arc === article.arc,
  )
  const index = siblings.findIndex((item) => item.id === article.id)
  const previous = siblings[index - 1],
    next = siblings[index + 1]
  const completionKey = `${article.id}:${completionMode}`
  const complete = prefs.completedEditionKeys.includes(completionKey)
  useEffect(() => {
    if (ready)
      update((old) => ({
        ...old,
        lastArticleId: article.id,
        visitedArticleIds: [...new Set([...old.visitedArticleIds, article.id])],
      }))
  }, [article.id, ready, update])
  useEffect(() => {
    for (const button of content.current?.querySelectorAll<HTMLButtonElement>(
      '[data-note]',
    ) ?? [])
      button.setAttribute(
        'aria-expanded',
        String(openNotes.has(button.dataset.note!)),
      )
  }, [expanded, openNotes])
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
        void navigate({
          to: '/story/$storyId',
          params: { storyId: target.id },
          search: {},
        })
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [previous, next, navigate, mode])
  const toggle = (id: string) =>
    setOpenNotes((old) => {
      const next = new Set(old)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  const toggleBlock = (id: string) => {
    setExpanded((old) => {
      const next = new Set(old)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    setOpenNotes(
      (old) =>
        new Set(
          [...old].filter(
            (noteId) =>
              !article.notes.some(
                (note) => note.id === noteId && note.scene === id,
              ),
          ),
        ),
    )
  }
  const setAll = (open: boolean) => {
    setExpanded(new Set(open ? article.scenes.map((scene) => scene.id) : []))
    setOpenNotes(new Set())
  }
  const label = (item: typeof previous) =>
    item && (item.demo || prefs.visitedArticleIds.includes(item.id))
      ? item.title
      : item
        ? chapterLabel(item)
        : ''
  return (
    <div className="story-page">
      <div className="page-topline">
        <Link to="/">← 阅读入口</Link>
        <span>
          {article.demo
            ? '阅读体验示例'
            : `版本 ${article.version} · ${article.arc}`}
        </span>
      </div>
      <article className="story-article">
        <header className="story-header">
          <p className="eyebrow">
            {article.arc} · {article.demo ? '示例 01' : chapterLabel(article)}
          </p>
          <h1>{article.title}</h1>
          <div className="story-meta">
            <span>
              {article.demo
                ? '原创演示 · 非游戏剧情'
                : `剧透范围：至 ${article.version} ${chapterLabel(article)}`}
            </span>
            <span>修订于 {edition.updated}</span>
          </div>
        </header>
        <div className="reading-guide">
          <p>点击段落，读得更深一点。</p>
          {article.detailed && (
            <button type="button" onClick={() => setAll(!allExpanded)}>
              {allExpanded ? '全部收起' : '全部展开'}{' '}
              <span aria-hidden="true">{allExpanded ? '−' : '+'}</span>
            </button>
          )}
        </div>
        {article.demo && (
          <aside className="demo-notice">
            排版示例 · 原创虚构故事，非游戏剧情。点击段落可以体验详略展开。
          </aside>
        )}
        <div
          ref={content}
          className="story-body"
          onClick={(event) => {
            const button = (
              event.target as HTMLElement
            ).closest<HTMLButtonElement>('button[data-note]')
            if (
              !button ||
              !article.notes.some((note) => note.id === button.dataset.note)
            )
              return
            const id = button.dataset.note!
            toggle(id)
            document
              .getElementById(`note-${id}`)
              ?.scrollIntoView({ block: 'nearest' })
          }}
        >
          {article.scenes.map((scene) => (
            <NarrativeBlock
              key={scene.id}
              id={scene.id}
              title={scene.title}
              briefHtml={scene.html}
              detailHtml={
                article.detailed?.scenes.find(
                  (detail) => detail.id === scene.id,
                )?.html
              }
              expanded={expanded.has(scene.id)}
              onToggle={() => toggleBlock(scene.id)}
              notes={article.notes.filter((note) => note.scene === scene.id)}
              openNotes={openNotes}
              onToggleNote={toggle}
            />
          ))}
        </div>
        <div className="end-mark" aria-hidden="true">
          ◇
        </div>
        <div className="completion">
          <p>
            {complete
              ? `已读完本篇${completionMode === 'brief' ? '简述' : '详述'}。`
              : '读到这里，给这次阅读留个记号。'}
          </p>
          <button
            className={complete ? 'secondary-button' : 'primary-button'}
            onClick={() =>
              update((old) => {
                const completedEditionKeys = complete
                  ? old.completedEditionKeys.filter(
                      (key) => key !== completionKey,
                    )
                  : [...new Set([...old.completedEditionKeys, completionKey])]
                const anyComplete = completedEditionKeys.some((key) =>
                  key.startsWith(`${article.id}:`),
                )
                return {
                  ...old,
                  completedEditionKeys,
                  completedArticleIds: anyComplete
                    ? [...new Set([...old.completedArticleIds, article.id])]
                    : old.completedArticleIds.filter((id) => id !== article.id),
                }
              })
            }
          >
            {complete
              ? '取消读完标记'
              : `标记${completionMode === 'brief' ? '简述' : '详述'}读完 ✓`}
          </button>
        </div>
        <details className="sources">
          <summary>
            资料与说明 <span>{edition.sources.length} 项</span>
          </summary>
          <p>正文独立复述；以下任务记录用于核对。补充中的推断会单独标明。</p>
          <ul>
            {edition.sources.map((source) => (
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
            <Link
              to="/story/$storyId"
              params={{ storyId: previous.id }}
              search={{}}
            >
              ← 上一篇<small>{label(previous)}</small>
            </Link>
          ) : (
            <span>已是第一篇</span>
          )}
          {next ? (
            <Link
              to="/story/$storyId"
              params={{ storyId: next.id }}
              search={{}}
            >
              下一篇 →<small>{label(next)}</small>
            </Link>
          ) : (
            <Link to="/">
              返回目录 →<small>更多故事将逐步补齐</small>
            </Link>
          )}
        </nav>
      </article>
    </div>
  )
}
