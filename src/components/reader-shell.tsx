import { Link, useRouterState } from '@tanstack/react-router'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { catalog } from '../lib/content'
import { usePreferences, validatePreferences } from '../lib/preferences'

export function ReaderShell({ children }: { children: ReactNode }) {
  const { prefs, update } = usePreferences()
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const input = useRef<HTMLInputElement>(null)
  const panel = useRef<HTMLElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  useEffect(() => {
    setOpen(false)
  }, [pathname])
  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panel.current?.querySelector<HTMLElement>('button, a')?.focus()
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        trigger.current?.focus()
      }
      if (e.key === 'Tab') {
        const elements = panel.current?.querySelectorAll<HTMLElement>(
          'a,button,input:not([hidden])',
        )
        if (!elements?.length) return
        const first = elements[0],
          last = elements[elements.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
        if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', handle)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', handle)
    }
  }, [open])
  const groups = new Map<string, typeof catalog>()
  for (const article of catalog) {
    const group = article.demo ? '阅读示例' : `版本 ${article.version}`
    groups.set(group, [...(groups.get(group) ?? []), article])
  }
  return (
    <div className="app-shell">
      <a className="skip" href="#main">
        跳到正文
      </a>
      <header className="mobile-header">
        <button
          ref={trigger}
          aria-expanded={open}
          aria-controls="reader-sidebar"
          onClick={() => setOpen(!open)}
        >
          ☰ <span>目录</span>
        </button>
        <Link to="/">原神故事阅读器</Link>
      </header>
      {open && (
        <button
          className="scrim"
          tabIndex={-1}
          aria-label="关闭目录"
          onClick={() => {
            setOpen(false)
            trigger.current?.focus()
          }}
        />
      )}
      <aside
        ref={panel}
        id="reader-sidebar"
        className={`sidebar ${open ? 'is-open' : ''}`}
      >
        <div className="brand-row">
          <Link className="brand" to="/">
            <span className="brand-mark">叙</span>
            <span>
              原神故事阅读器<small>TEYVAT · STORIES</small>
            </span>
          </Link>
          <button
            className="close-sidebar"
            aria-label="关闭目录"
            onClick={() => {
              setOpen(false)
              trigger.current?.focus()
            }}
          >
            ×
          </button>
        </div>
        <p className="sidebar-note">一幕一篇，循着故事往前走。</p>
        <nav
          aria-label="故事目录"
          onClick={(event) => {
            if ((event.target as HTMLElement).closest('a')) setOpen(false)
          }}
        >
          <Link
            className="home-link"
            to="/"
            activeOptions={{ exact: true }}
            activeProps={{ className: 'home-link active' }}
          >
            阅读入口 <span>↗</span>
          </Link>
          {[...groups].map(([group, entries]) => (
            <section className="toc-group" key={group}>
              <h2>
                {group} <span>{entries.length} 篇</span>
              </h2>
              {entries.map((article) => (
                <Link
                  className="toc-item"
                  key={article.id}
                  to="/story/$storyId"
                  params={{ storyId: article.id }}
                  activeProps={{ className: 'toc-item active' }}
                >
                  <span className="toc-number">
                    {String(article.act).padStart(2, '0')}
                  </span>
                  <span>
                    {article.demo ||
                    prefs.visitedArticleIds.includes(article.id)
                      ? article.title
                      : `第 ${article.act} 幕 · 未读`}
                    <small>
                      {prefs.completedArticleIds.includes(article.id)
                        ? '已有读完记录'
                        : article.demo
                          ? '原创排版演示'
                          : '点击开始阅读'}
                    </small>
                  </span>
                </Link>
              ))}
            </section>
          ))}
        </nav>
        <section className="reading-settings" aria-label="阅读设置">
          <div className="settings-heading">
            <span>阅读设置</span>
            <button
              onClick={() =>
                update((old) => ({
                  ...old,
                  theme: old.theme === 'day' ? 'night' : 'day',
                }))
              }
            >
              {prefs.theme === 'day' ? '☾ 夜间' : '☀ 日间'}
            </button>
          </div>
          <label>
            字号 <span>{prefs.fontSize}</span>
            <input
              aria-label="正文字号"
              type="range"
              min="16"
              max="24"
              value={prefs.fontSize}
              onChange={(e) =>
                update((old) => ({ ...old, fontSize: Number(e.target.value) }))
              }
            />
          </label>
          <label>
            行宽 <span>{prefs.lineWidth} 字</span>
            <input
              aria-label="正文行宽"
              type="range"
              min="26"
              max="42"
              value={prefs.lineWidth}
              onChange={(e) =>
                update((old) => ({ ...old, lineWidth: Number(e.target.value) }))
              }
            />
          </label>
          <div className="record-actions">
            <button
              onClick={() => {
                const url = URL.createObjectURL(
                  new Blob([JSON.stringify(prefs, null, 2)], {
                    type: 'application/json',
                  }),
                )
                const a = document.createElement('a')
                a.href = url
                a.download = 'story-reader-record.json'
                a.click()
                setTimeout(() => URL.revokeObjectURL(url), 1000)
              }}
            >
              导出记录
            </button>
            <button onClick={() => input.current?.click()}>导入记录</button>
          </div>
          <input
            ref={input}
            hidden
            type="file"
            accept="application/json"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              if (!file) return
              try {
                const raw = JSON.parse(await file.text())
                if (
                  raw?.schemaVersion !== 1 ||
                  !Array.isArray(raw.visitedArticleIds)
                )
                  throw Error()
                const valid = new Set(catalog.map((a) => a.id))
                const value = validatePreferences(raw)
                value.completedEditionKeys = value.completedEditionKeys.filter(
                  (key) => valid.has(key.split(':')[0]),
                )
                value.visitedArticleIds = value.visitedArticleIds.filter((id) =>
                  valid.has(id),
                )
                value.completedArticleIds = value.completedArticleIds.filter(
                  (id) => valid.has(id),
                )
                value.lastArticleId =
                  value.lastArticleId && valid.has(value.lastArticleId)
                    ? value.lastArticleId
                    : null
                update(() => value)
                setMessage('已导入；不存在的文章记录已忽略。')
              } catch {
                setMessage('无法导入，请选择本阅读器导出的 JSON 记录。')
              }
              e.target.value = ''
            }}
          />
          <p role="status" className="record-message">
            {message}
          </p>
        </section>
        <footer className="sidebar-footer">
          <span className="status-dot" /> 前八幕已收录 <span>非官方项目</span>
        </footer>
      </aside>
      <main id="main" className="main-content" tabIndex={-1} inert={open}>
        {children}
      </main>
    </div>
  )
}
