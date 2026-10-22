import { createFileRoute, Link } from '@tanstack/react-router'
import { catalog } from '../lib/content'
import { usePreferences } from '../lib/preferences'

export const Route = createFileRoute('/')({ component: Home })
function Home() {
  const { prefs } = usePreferences()
  const resume = catalog.find((article) => article.id === prefs.lastArticleId)
  const demo = catalog.find((article) => article.demo)
  const stories = catalog.filter((article) => !article.demo)
  const first = stories[0] ?? demo
  return (
    <div className="home-page">
      <div className="page-topline">
        <span>原神 · 中文故事阅读计划</span>
        <span>序 / INTRODUCTION</span>
      </div>
      <section className="intro">
        <p className="eyebrow">循着故事，重新出发</p>
        <h1>
          把每一幕，
          <br />
          慢慢讲清楚。
        </h1>
        <p className="intro-copy">
          先读主要经过，再展开想了解的细节。
          <br />
          按版本与幕，读懂人物走过的路。
        </p>
        <div className="intro-actions">
          {resume ? (
            <Link
              className="primary-button"
              to="/story/$storyId"
              params={{ storyId: resume.id }}
              search={{ mode: prefs.readingMode }}
            >
              继续阅读 <span>→</span>
            </Link>
          ) : first ? (
            <Link
              className="primary-button"
              to="/story/$storyId"
              params={{ storyId: first.id }}
              search={{ mode: 'brief' }}
            >
              {first.demo ? '体验阅读' : '开始阅读'} <span>→</span>
            </Link>
          ) : null}
          <a className="text-link" href="#collection">
            浏览目录 ↓
          </a>
        </div>
        <div className="intro-meta">
          <span>简述先行</span>
          <span>补充按需展开</span>
          <span>为手机阅读而设计</span>
        </div>
      </section>
      <section id="collection" className="collection">
        <div className="section-heading">
          <h2>故事目录</h2>
          <span>{stories.length} 幕</span>
        </div>
        {stories.map((article) => (
          <Link
            className="demo-card"
            key={article.id}
            to="/story/$storyId"
            params={{ storyId: article.id }}
            search={{ mode: 'brief' }}
          >
            <span className="preparing-number">{article.version}</span>
            <div>
              <span className="eyebrow">
                {article.arc} · 第 {article.act} 幕
              </span>
              <h3>
                {prefs.visitedArticleIds.includes(article.id)
                  ? article.title
                  : '未读故事'}
              </h3>
              <p>
                {prefs.completedArticleIds.includes(article.id)
                  ? '已有读完记录'
                  : '主要经过 · 详述含补充'}{' '}
                ·{' '}
                {article.availableModes.includes('detailed')
                  ? '点击段落看详述'
                  : '详述待补充'}
              </p>
            </div>
            <span className="card-arrow">↗</span>
          </Link>
        ))}
        {!stories.length && (
          <div className="preparing">
            <p>正式故事准备中，可以先体验下方阅读示例。</p>
          </div>
        )}
        {demo && (
          <Link
            className="demo-card"
            to="/story/$storyId"
            params={{ storyId: demo.id }}
            search={{ mode: 'brief' }}
          >
            <span className="demo-symbol">Aa</span>
            <div>
              <span className="eyebrow">阅读示例</span>
              <h3>试试逐段展开阅读</h3>
              <p>原创虚构短文，非游戏剧情。点击段落查看详述与折叠卡片。</p>
            </div>
            <span className="card-arrow">↗</span>
          </Link>
        )}
      </section>
      <footer className="page-footer">
        <p>目前收录纳塔前两幕与《空月之歌》前八幕，均可点击段落展开详述。</p>
        <span>独立复述 · 非官方项目</span>
      </footer>
    </div>
  )
}
