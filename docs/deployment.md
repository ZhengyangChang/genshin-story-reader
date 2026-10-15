# GitHub Pages：已配置，未发布

仓库已改为公开。Settings → Pages 的 Source 使用 GitHub Actions。此设置不等于已经部署网站。

## 两个流程

- Check：push / pull_request 自动运行普通检查和 Pages 静态构建，只验证，不发布、不上传 Pages 部署产物。
- Publish Pages (manual)：只支持 workflow_dispatch，只有 main 分支且 confirmation 精确填写 PUBLISH 才构建并部署。没有 push 或定时发布触发器。

本次不运行发布流程。准备发布时，到 Actions → Publish Pages (manual) → Run workflow，选择 main 并填 PUBLISH。这一步会公开网站，需要届时明确决定。

## 本地验证

```sh
bun install --frozen-lockfile
bun run build:pages
bun run preview:pages
```

预览地址：http://127.0.0.1:4173/genshin-story-reader/ 。这是真正的静态文件服务，不运行 Start 服务端。默认 bun run dev 仍在根路径开发。

build:pages 生成 dist/client/index.html、每篇文章的 story/<id>/index.html、404.html、.nojekyll 与 assets。目录来自过滤草稿后的内容目录，每段简述可由页面交互原地展开为详述。构建验证资源与导航带有 /genshin-story-reader/ 前缀。

静态文件不提交；dist/ 仍被忽略。发布流程将 dist/client 作为 Pages artifact 上传，然后由 deploy-pages 发布。dist/server 不发布。不存在 gh-pages 生成文件分支。

未来默认地址：https://zhengyangchang.github.io/genshin-story-reader/ 。本次没有创建任何有效线上部署；该地址应在首次部署成功后使用。

当前没有站外接口、服务端函数、登录或云同步依赖。后续引入这类功能时必须重新评估静态托管。仓库改名或自定义域名需要同步调整 Pages base、静态预览与工作流说明。
