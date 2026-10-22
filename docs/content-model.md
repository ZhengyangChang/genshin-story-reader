# 逐段阅读与内容格式

## 同一条记录，两种篇幅

每幕一个 UTF-8 Markdown 文件，例如 `content/stories/6.2/act-5.md`。YAML frontmatter 中设置 `format: paired`，正文存放在 `blocks` 中，文件的 Markdown body 留空。正文字符串仍使用 Markdown；构建时生成按幕加载的 JSON，浏览器不解析 YAML。

```yaml
format: paired
blocks:
  - id: festival-coming
    title: 为归途准备一场节日
    brief: |
      这一件事的简短叙述，只写一个自然段。
    detail: |
      同一件事的完整叙述。

      可以分成多个段落。
```

`id` 是永久锚点，标题仅供编辑识别，不显示在阅读正文中。简述与详述相邻保存，不能靠数组序号或两个文件的段落数推测对应关系。每条记录按事件与因果划分，一段简述可对应多段详述。当前第一至第六幕与演示篇均已迁移；第一轮沿用原来的场景范围，将同一场景内的简述段落连为一个自然段，详述文本保留。6.3 第七、第八幕直接按 paired 格式写作，补齐月之四主线收束。后续可人工细分过长单元，同时处理旧锚点兼容。

前言同样作为 `opening` 单元保存。当前 paired 格式要求每个单元的 brief、detail 都非空；未完成的文章设为 draft 或 review，不进入发布输出。编译器仍兼容旧两文件格式，用于现有校验及过渡，但同一幕禁止存在两套发布源。

元数据继续保留 id、version、arc、act、title、order、status、spoilerThrough、updated、sources、notes。来源合并到整幕 sources；剧透上限必须与本幕一致。构建检查重复文章或单元 ID、空文字、无效来源、错误的补充归属、裸正文和跨段简述。

## 阅读交互

普通访问默认简述，不受旧版 readingMode 偏好影响。点击简述段落，原地换成详述；点击详述正文可以收起，也可使用段尾的上箭头。选中文字、操作链接或卡片不触发正文切换。不显示“展开这段”按钮。页面提供次要的“全部展开 / 收起”。

段落支持键盘 Enter / Space 展开，收起箭头为原生按钮。展开采用淡色渐变、文字淡入和高度过渡；减少动态效果偏好关闭动画。手机保持单栏，交互不依赖 hover。收起长文时将段首带回可见范围。

保留原场景锚点，例如 `/story/aq-6-1-act-4#aftermath`。旧 `?mode=detailed` 链接初始全部展开；前往下一幕默认简述。展开状态仅在当前页面中保存，尚不跨刷新持久化。

访问记录仍以整幕计。只有主动点击读完按钮才保存完成状态；全部展开时可标记详述读完，其余情况标记简述读完。展开行为本身不等于完成阅读。已有两种篇幅的读完记录继续保留。

## 补充卡片与证据

notes 集中定义在整幕元数据内，`scene` 字段沿用旧名称，指向所属 block ID。只有该单元展开时，才显示正文引用和卡片；卡片仍默认折叠，收起正文后清空该单元的卡片展开状态。简述中的引用显示为普通文字。

```yaml
notes:
  - id: absent-colleague
    scene: aftermath
    kind: foreshadowing
    title: 茶会里没被点名的同事
    evidence: interpretation
    spoiler: current
    sourceIds: [echo]
    body: |
      点击后显示的说明，可以使用安全 Markdown。
```

正文引用使用 `[[某人|absent-colleague]]`。kind 支持 easter-egg、foreshadowing、closure、context；evidence 支持 confirmed、interpretation；spoiler 支持 current、future。构建检查引用存在、属于同一单元、sourceIds 有效；补充不支持嵌套引用。

current 只使用本幕及此前信息。future 卡片折叠时隐藏揭底标题与答案，点击后才渲染；内容仍包含在按幕下载的数据里，这是阅读防剧透而非访问控制。身份推断与台词明确点名须分开，后续回收证据另建 future 卡片。

完整任务对话与过场的核查记录见 `content/sources/6.0.md`、`6.1.md`、`6.2.md`、`6.3.md`。细分单元不能从简述注水生成详述，也不能丢失原文情节和证据边界。

## 幕间

`chapterType` 默认为 `act`，既有文章无需迁移。第五章幕间《万火归一》设置为 `interlude`，目录、标题与前后篇链接统一显示“幕间”。它使用独立 ID `aq-5-2-interlude`，不占用第五幕编号。幕间的 `act: 4` 表示承接第四幕，`spoilerThrough` 使用相同编号；实际阅读顺序仍按版本及 `order` 排列，因此位于 5.1 第四幕与 5.3 第五幕之间。
