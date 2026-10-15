import {
  createRootRoute,
  HeadContent,
  Link,
  Outlet,
  Scripts,
} from '@tanstack/react-router'
import { PreferencesProvider } from '../lib/preferences'
import { ReaderShell } from '../components/reader-shell'
import styles from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: '原神故事阅读器' },
      {
        name: 'description',
        content:
          '按版本与幕，慢慢读懂故事。空月之歌前八幕，点击段落展开详述，补充按需展开。',
      },
    ],
    links: [{ rel: 'stylesheet', href: styles }],
  }),
  component: Root,
  notFoundComponent: () => (
    <div className="empty">
      <p className="eyebrow">没有找到这一页</p>
      <h1>故事还没走到这里。</h1>
      <Link to="/">回到阅读入口 →</Link>
    </div>
  ),
  errorComponent: () => (
    <div className="empty">
      <h1>这一页暂时无法打开</h1>
      <p>请刷新页面后重试。</p>
      <a href={import.meta.env.BASE_URL}>回到阅读入口</a>
    </div>
  ),
})
function Root() {
  return (
    <html lang="zh-CN">
      <head>
        <HeadContent />
      </head>
      <body>
        <PreferencesProvider>
          <ReaderShell>
            <Outlet />
          </ReaderShell>
        </PreferencesProvider>
        <Scripts />
      </body>
    </html>
  )
}
