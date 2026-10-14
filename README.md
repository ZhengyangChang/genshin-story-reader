# 原神故事阅读器

用中文逐幕讲清《原神》发生了什么：经过、人物选择、转折，以及这些事为什么连在一起。

已搭建 **Bun + TanStack Start + React + TypeScript + Vite** 工程。当前有阅读入口、文章页和一篇明确标注的原创排版示例；正式游戏剧情尚未发布，网站尚未部署。

## 本地运行

需要 Bun 1.4.3（见 packageManager 和 CI）。

```sh
bun install --frozen-lockfile
bun run dev
```

打开终端打印的地址，默认 http://127.0.0.1:3000/。文章示例：/story/demo-reading。

```sh
bun run check          # 生产构建、类型检查、测试
bun run content:build  # 单独校验并生成内容
bun run format         # 格式化源码与文档
```

开发时修改 content/stories/ 或 content/examples/ 的 Markdown 会重新生成内容并刷新页面。路由类型由 TanStack Start 在启动／构建时生成；新克隆后先构建或启动，再单独运行 typecheck。

## 当前能力

- 按版本／幕组织目录，固定文章 ID 与场景锚点。
- 长文阅读、前后篇、来源折叠、未知文章 404。
- 日夜模式、字号、行宽，移动端目录抽屉。
- 本地访问／读完记录、继续阅读、JSON 导出导入。
- 未访问正式文章的目录标题隐藏；访问不自动算读完。
- 构建过滤 draft/review，校验元数据，文章正文按篇加载。
- GitHub Actions 自动构建、类型检查和测试，不自动部署。

阅读记录只存在当前浏览器；目前继续阅读恢复到文章，精确到场景的位置恢复后续补充。暂无正文全文搜索、账号与云同步。

## 写文章

复制 [模板](content/templates/act.md) 到 content/stories/版本号/，填写元数据与来源。场景标题使用固定锚点语法：

```md
## first-scene | 中性场景标题

连续的故事叙述……
```

只有 status: published 的文章进入阅读器。资料来源放在 sources 元数据，不另加“资料”场景页。排版示例存放在 content/examples/，与正式剧情分开标记。

## 文档入口

- [项目架构](docs/architecture.md)
- [开发说明](docs/development.md)
- [内容规范](docs/content-guide.md)
- [视觉与交互](docs/design.md)
- [实施计划](docs/roadmap.md)
- [来源与权利说明](NOTICE.md)

本地工作目录：C:\Users\Zhengyang Chang\Documents\code\genshin-story-reader。
私有仓库：[ZhengyangChang/genshin-story-reader](https://github.com/ZhengyangChang/genshin-story-reader)。

代码、样式和正文独立实现，原参考项目只提供阅读体验方向。代码与原创文章的对外许可证待定。
