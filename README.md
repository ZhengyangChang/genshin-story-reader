# 原神故事阅读器

用中文逐幕讲清《原神》发生了什么：经过、人物选择、转折，以及这些事为什么连在一起。

项目暂名：原神故事阅读器（genshin-story-reader）。当前处于内容与产品规划阶段，尚无可运行网站，也未部署。

## 文档入口

- [项目架构](docs/architecture.md)：范围、页面、技术边界与数据流。
- [内容规范](docs/content-guide.md)：叙述方法、事实核实与防剧透。
- [视觉与交互](docs/design.md)：阅读器风格和操作规则。
- [实施计划](docs/roadmap.md)：从样章到首个可读版本。
- [文章模板](content/templates/act.md)：一幕一篇的写作起点。
- [来源与权利说明](NOTICE.md)：设计参考与素材边界。

## 初始目录

```text
docs/                  产品、架构、内容与设计文档
content/templates/     文章模板，不参与发布
content/stories/       已核实的剧情正文，按版本归档
content/sources/       事实核查和来源笔记，不进入正文
src/                   后续阅读器实现
public/                后续本地静态素材
```

先完成 6.1 奈芙尔相关情节样章，再扩成完整一幕，最后接入阅读器。全文、代码和视觉实现独立创作。

本地工作目录：`C:\Users\Zhengyang Chang\Documents\code\genshin-story-reader`。
GitHub：计划使用 `ZhengyangChang/genshin-story-reader`，私有。
代码和原创文章的对外许可证暂未选定；公开发布前分别确定。
