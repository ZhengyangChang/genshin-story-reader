import {
  createFileRoute,
  Link,
  notFound,
  useNavigate,
} from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { catalog, getArticle } from '../lib/content'
import { usePreferences } from '../lib/preferences'
import { SupplementCard } from '../components/supplement-card'
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
    (search.mode ?? prefs.readingMode) === 'detailed' && article.detailed
      ? 'detailed'
      : 'brief'
  const edition = mode === 'detailed' ? article.detailed! : article
  const [openNotes, setOpenNotes] = useState<Set<string>>(new Set())
  const content = useRef<HTMLDivElement>(null)
  const anchorAfterSwitch = useRef<string | null>(null)
  const siblings = catalog.filter((item) => item.demo === article.demo)
  const index = siblings.findIndex((item) => item.id === article.id)
  const previous = siblings[index - 1],
    next = siblings[index + 1]
  const completionKey = `${article.id}:${mode}`
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
    if (anchorAfterSwitch.current) {
      document
        .getElementById(anchorAfterSwitch.current)
        ?.scrollIntoView({ block: 'start' })
      anchorAfterSwitch.current = null
    }
    for (const button of content.current?.querySelectorAll<HTMLButtonElement>(
      '[data-note]',
    ) ?? [])
      button.setAttribute(
        'aria-expanded',
        String(openNotes.has(button.dataset.note!)),
      )
  }, [mode, openNotes])
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
          search: { mode },
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
  const switchMode = (next: ReadingMode) => {
    if (next === mode) return
    const headings = [
      ...(content.current?.querySelectorAll<HTMLElement>(
        '[data-scene-anchor]',
      ) ?? []),
    ]
    anchorAfterSwitch.current =
      headings
        .filter((heading) => heading.getBoundingClientRect().top <= 220)
        .at(-1)?.id ?? null
    setOpenNotes(new Set())
    update((old) => ({ ...old, readingMode: next }))
    void navigate({
      to: '/story/$storyId',
      params: { storyId: article.id },
      search: { mode: next },
      hash: anchorAfterSwitch.current ?? '',
      replace: true,
      resetScroll: false,
    })
  }
  const label = (item: typeof previous) =>
    item && (item.demo || prefs.visitedArticleIds.includes(item.id))
      ? item.title
      : `第 ${item?.act} 幕`
  return (
    <div className="story-page">
      <div className="page-topline">
        <Link to="/">← 阅读入口</Link>
        <span>
          {article.demo ? '阅读体验示例' : `版本 ${article.version} · 空月之歌`}
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
            <span>修订于 {edition.updated}</span>
          </div>
        </header>
        <div className="edition-toolbar" role="group" aria-label="叙述版本">
          <span>阅读版本</span>
          <div>
            <button
              aria-pressed={mode === 'brief'}
              onClick={() => switchMode('brief')}
            >
              简述
            </button>
            <button
              aria-pressed={mode === 'detailed'}
              disabled={!article.detailed}
              onClick={() => switchMode('detailed')}
            >
              {article.detailed ? '详述' : '详述 · 待补充'}
            </button>
          </div>
        </div>
        <p className="edition-caption">
          {mode === 'brief'
            ? '先读主要经过。更多细节与补充可切换到详述查看。'
            : '展开事件经过与前因后果，保留同一组场景与补充入口。'}
          {search.mode === 'detailed' && !article.detailed
            ? '本篇详述尚未发布，当前显示简述。'
            : ''}
        </p>
        {mode === 'detailed' && (
          <nav className="scene-nav" aria-label="本篇小节">
            {edition.scenes.map((scene) => (
              <a key={scene.id} href={`#${scene.id}`}>
                {scene.title}
              </a>
            ))}
          </nav>
        )}
        {article.demo && (
          <aside className="demo-notice">
            排版示例 ·
            原创虚构故事，非游戏剧情。这里可以体验两个叙述版本的切换。
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
          {edition.preambleHtml && (
            <div
              className="prose"
              dangerouslySetInnerHTML={{ __html: edition.preambleHtml }}
            />
          )}
          {edition.scenes.map((scene) => (
            <section
              className="story-scene"
              key={scene.id}
              id={scene.id}
              data-scene-anchor
            >
              <div className="prose">
                {mode === 'detailed' && <h2>{scene.title}</h2>}
                <div dangerouslySetInnerHTML={{ __html: scene.html }} />
              </div>
              {(mode === 'detailed' ? article.notes : [])
                .filter((note) => note.scene === scene.id)
                .map((note) => (
                  <SupplementCard
                    key={note.id}
                    note={note}
                    open={openNotes.has(note.id)}
                    onToggle={() => toggle(note.id)}
                  />
                ))}
            </section>
          ))}
        </div>
        <div className="end-mark" aria-hidden="true">
          ◇
        </div>
        <div className="completion">
          <p>
            {complete
              ? `已读完本篇${mode === 'brief' ? '简述' : '详述'}。`
              : '读到这里，给这个版本留个记号。'}
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
              : `标记${mode === 'brief' ? '简述' : '详述'}读完 ✓`}
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
              search={{ mode }}
            >
              ← 上一幕<small>{label(previous)}</small>
            </Link>
          ) : (
            <span>已是第一幕</span>
          )}
          {next ? (
            <Link
              to="/story/$storyId"
              params={{ storyId: next.id }}
              search={{ mode }}
            >
              下一幕 →<small>{label(next)}</small>
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
