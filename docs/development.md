# 开发说明

## 已安装的工程

使用 Bun 管理依赖和命令，TanStack Start 提供 React 服务端渲染与文件路由，Vite 负责开发和构建。准确依赖版本记录在 package.json，bun.lock 记录完整解析结果。

主目录：

- src/routes/__root.tsx：页面文档、元信息、共享阅读器外壳。
- src/routes/index.tsx：阅读入口与目录。
- src/routes/story.$storyId.tsx：文章加载、场景、来源和读完状态。
- src/components/reader-shell.tsx：目录、手机抽屉和阅读设置。
- src/lib/preferences.tsx：本地记录与校验；存储失败不阻断阅读。
- scripts/content.ts：元数据校验、Markdown 安全渲染和排序。
- scripts/build-content.ts：生成目录和按篇 JSON 模块。
- src/generated/：忽略的内容产物；正文不直接从 Markdown 导入浏览器。
- src/routeTree.gen.ts：自动生成的路由类型；不要手动修改。
- tests/：内容边界与记录恢复测试。

## 内容边界

templates 与 sources 目录不参与构建。stories 和 examples 分别扫描，只选择 published；每次重写加载注册表，曾发布后改为 draft 的文章不再被发布构建引用。HTML 默认转义，危险协议链接不渲染为链接；图片暂不渲染，待素材来源审查后再开放。

已检查：重复文章／场景 ID、草稿排除、版本数值排序、来源必填、剧透边界、HTML 与危险链接、损坏偏好记录。

## 当前限制与下一步

已加入 6.1 两幕的简述、详述与共享补充卡片，真实内容与演示均支持双篇幅切换。内容格式见 content-model.md。导入／导出已有实现；本轮检查了记录校验与刷新持久化，未做跨设备迁移验收。

继续阅读目前恢复文章，不恢复精确场景位置。桌面侧栏固定显示，手机抽屉可收起；桌面收起和手机滑动翻篇待后续。

普通 build 仍输出客户端与服务端；新增 build:pages 在构建时预渲染首页和所有已发布文章，生成可独立托管的 dist/client。资源与路由使用仓库子路径，已有独立静态预览与自定义 404。Pages 流程仅手动触发，本次未发布。详见 deployment.md。

官方搭建依据：https://tanstack.com/start/latest/docs/framework/react/build-from-scratch
