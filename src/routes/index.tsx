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
          那些发生过的事，那些选择与告别。
          <br />
          按版本与幕，读懂人物走过的路。
        </p>
        <div className="intro-actions">
          {resume ? (
            <Link
              className="primary-button"
              to="/story/$storyId"
              params={{ storyId: resume.id }}
            >
              继续阅读 <span>→</span>
            </Link>
          ) : first ? (
            <Link
              className="primary-button"
              to="/story/$storyId"
              params={{ storyId: first.id }}
            >
              {first.demo ? '体验阅读' : '开始阅读'} <span>→</span>
            </Link>
          ) : null}
          <a className="text-link" href="#collection">
            浏览目录 ↓
          </a>
        </div>
        <div className="intro-meta">
          <span>逐幕叙述</span>
          <span>按剧情顺序展开</span>
          <span>为长文阅读而设计</span>
        </div>
      </section>
      <section id="collection" className="collection">
        <div className="section-heading">
          <h2>故事目录</h2>
          <span>{stories.length} 篇正式故事</span>
        </div>
        <div className="preparing">
          <span className="preparing-number">6.1</span>
          <div>
            <p className="eyebrow">首批内容 · 筹备中</p>
            <h3>从奈芙尔相关情节开始</h3>
            <p>先核实原始剧情，再写成完整一幕。正式故事尚未发布。</p>
          </div>
          <span className="pill">待成稿</span>
        </div>
        {demo && (
          <Link
            className="demo-card"
            to="/story/$storyId"
            params={{ storyId: demo.id }}
          >
            <span className="demo-symbol">Aa</span>
            <div>
              <span className="eyebrow">阅读示例</span>
              <h3>{demo.title}</h3>
              <p>一段原创短文，用来体验排版与阅读设置。不是游戏剧情。</p>
            </div>
            <span className="card-arrow">↗</span>
          </Link>
        )}
      </section>
      {stories.map((article) => (
        <Link
          className="demo-card"
          key={article.id}
          to="/story/$storyId"
          params={{ storyId: article.id }}
        >
          <span className="preparing-number">{article.version}</span>
          <div>
            <span className="eyebrow">第 {article.act} 幕</span>
            <h3>
              {prefs.visitedArticleIds.includes(article.id)
                ? article.title
                : '未读故事'}
            </h3>
            <p>
              {prefs.completedArticleIds.includes(article.id)
                ? '已读完'
                : '点击开始阅读'}
            </p>
          </div>
          <span className="card-arrow">↗</span>
        </Link>
      ))}
      <footer className="page-footer">
        <p>故事会逐篇补齐，不必急着一次读完。</p>
        <span>独立创作 · 非官方项目</span>
      </footer>
    </div>
  )
}
