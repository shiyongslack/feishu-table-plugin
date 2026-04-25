# UI 设计指南

> **设计类型**: App 设计（应用架构设计）
> **确认检查**: 本指南适用于可交互的应用/网站/工具。

> ℹ️ Section 1-2 为设计意图与决策上下文。Code agent 实现时以 Section 3 及之后的具体参数为准。

## 1. Design Archetype (设计原型)

### 1.1 内容理解

- **目标用户**: 使用飞书多维表格的办公用户，需要导出数据到 Excel 进行后续分析或分享，追求高效、便捷的批量导出体验
- **核心目的**: 提供智能导出操作界面，引导用户完成视图选择、配置调整、预览和导出下载全流程
- **期望情绪**: 专注、高效、可信，让用户轻松完成复杂的导出任务
- **需避免的感受**: 混乱、操作繁琐、加载缓慢、功能难以找到

### 1.2 设计语言

- **Aesthetic Direction**: 飞书生态原生风格，简约现代工具感，清晰的功能分区，低干扰交互体验
- **Visual Signature**: 1) 清晰垂直分区布局，适配侧边栏窄容器；2) 柔和圆角搭配细腻边框；3) 主色偏蓝调契合飞书品牌，提供可信赖感；4) 充足留白缓解操作压力
- **Emotional Tone**: 专业可靠 + 简洁高效 — 工具类产品需要让用户快速信任并上手操作
- **Design Style**: Soft Blocks 柔色块 — 飞书侧边栏插件，分区清晰，柔和圆角创造亲和感同时保持专业度
- **Application Type**: Tool — 单页工具应用，所有操作在一个页面完成

## 2. Design Principles (设计理念)

1. **功能优先，最小干扰** — 所有视觉元素服务于导出操作，避免不必要的装饰分散用户注意力
2. **清晰分区，分步引导** — 视图选择 → 配置 → 操作，自然流畅的垂直阅读顺序
3. **即时反馈，状态可见** — 导出进度、操作结果、错误状态都需要清晰反馈给用户
4. **适配侧边，原生协调** — 严格遵循飞书侧边栏最小宽度 410px 约束，与飞书整体视觉风格协调

## 3. Color System (色彩系统)

**配色设计理由**：契合飞书生态系统，选择专业可信的蓝色主调，建立用户信任感，同时保持工具类产品的克制，避免过度色彩干扰操作。

### 3.1 主题颜色

> **Color Token 语义速查（供 code agent 参考）**:
> - `primary` → 主行动：按钮填充、激活态高亮、关键操作 CTA
> - `accent` → 状态反馈：Ghost/Outline 按钮 hover、DropdownMenu focus、Toggle 激活、Skeleton 占位背景
> - `muted` → 静态非交互：禁用态背景、次级说明背景、占位文字色（`text-muted-foreground`）
> - **选择原则**：用户"可以点击" → primary；交互"正在发生" → accent；内容"不可操作" → muted

| 角色               | CSS 变量               | Tailwind Class            | HSL 值                    
| ------------------ | ---------------------- | ------------------------- | --------------------------
| bg                 | `--background`         | `bg-background`           | hsl(210 20% 98%)           
| card               | `--card`               | `bg-card`                 | hsl(0 0% 100%)             
| text               | `--foreground`         | `text-foreground`         | hsl(220 40% 13%)           
| textMuted          | `--muted-foreground`   | `text-muted-foreground`   | hsl(220 15% 45%)           
| primary            | `--primary`            | `bg-primary`              | hsl(213 94% 48%)           
| primary-foreground | `--primary-foreground` | `text-primary-foreground` | hsl(0 0% 100%)             
| accent             | `--accent`             | `bg-accent`               | hsl(210 25% 96%)           
| accent-foreground  | `--accent-foreground`  | `text-accent-foreground`  | hsl(220 40% 13%)           
| border             | `--border`             | `border-border`           | hsl(220 13% 91%)           

### 3.2 Topbar/Header 设计策略（仅当使用顶部导航时定义）

> 本应用为单页工具，飞书侧边栏插件，无需独立顶部导航栏。不定义此章节。

### 3.4 语义颜色（可选）

| 用途        | CSS 变量          | HSL 值                    | 使用说明                     |
| ----------- | ----------------- | ------------------------- | ---------------------------- |
| success     | `--success`       | hsl(143 71% 30%)          | 导出成功、完成状态           |
| success-bg  | `--success-bg`    | hsl(143 71% 95%)          | 成功状态背景                 |
| destructive | `--destructive`   | hsl(0 84% 60%)            | 错误、导出失败               |
| destructive-bg | `--destructive-bg` | hsl(0 84% 96%)          | 错误状态背景                 |
| warning     | `--warning`       | hsl(32 95% 44%)           | 警告提示                     |
| warning-bg  | `--warning-bg`    | hsl(32 95% 96%)           | 警告背景                     |

## 4. Typography (字体排版)

- **Heading**: 系统无衬线字体 → `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`
- **Body**: 系统无衬线字体 → `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"`
- **字体导入**: 使用系统字体栈，无需外部导入

**排版层级**:
- 区域标题: `text-lg font-semibold` （18px）
- 标签文字: `text-sm font-medium` （14px）
- 正文/描述: `text-sm text-muted-foreground` （14px）
- 辅助文字: `text-xs text-muted-foreground` （12px）
- 按钮文字: `text-sm font-medium` （14px）

## 5. Layout Strategy (布局策略)

### 5.1 结构方向

**导航策略**: 单页工具，侧边栏插件容器，所有功能在单一页面完成 → 无需导航。飞书平台已提供外层容器，插件只负责内容区域。

**页面架构特征**:
- 垂直流式布局，适配 410px-600px 侧边栏宽度
- 功能区块清晰分隔：视图选择区 → 导出配置区 → 操作区，从上到下自然流
- 信息密度适中，每个区块保持足够内边距，避免拥挤

### 5.2 响应式原则

**断点策略**:
- 最小宽度固定 410px，适配飞书侧边栏最小约束
- 宽度扩展时内容自适应，保持区块内边距比例不变
- 所有可点击区域最小 44px 满足触摸要求

**内容密度**:
- 始终单列布局，不做多列排列，适配侧边栏窄容器
- 复选框和开关组件保持足够点击区域，避免误触

## 6. Visual Language (视觉语言)

**形态特征**:
- 圆角：所有卡片区块 `rounded-lg (0.5rem)`，按钮 `rounded-md`，保持柔和但专业的视觉感受
- 边框：使用 `border-border` 细边框分隔区块，不使用阴影创造层次
- 间距：区块之间 `gap-6`，区块内 `p-5`，保持舒适呼吸空间，符合 Soft Blocks 风格特征
- 复选框列表：每项保持 `py-2` 垂直间距，便于点击选择

**装饰策略**:
- 极简装饰，不使用额外几何图形或渐变背景
- 通过卡片边框和背景差异创造视觉层次
- 唯一强调色是主操作按钮的蓝色，突出核心动作

**动效原则**:
- 交互反馈快速，过渡时长 150-200ms，干脆利落
- 所有可交互元素必须有 hover/focus 状态反馈
- 进度条平滑动画展示导出进度
- 开关切换有自然过渡效果

**可及性保障**:
- 正文文字对比度 ≥ 4.5:1，所有文本都满足 WCAG AA 标准
- 交互元素有明确的 hover/focus 状态，键盘可导航
- 错误状态使用语义颜色 + 文字说明，不依赖单一色彩传递信息
- 进度条展示当前状态，用户随时了解导出进度

**组件状态规范**:

| 组件 | 状态 | 视觉处理 |
| ---- | ---- | -------- |
| Button - Primary | Default | `bg-primary text-primary-foreground` |
| | Hover | `opacity-90` |
| | Disabled | `opacity-50 cursor-not-allowed` |
| Button - Secondary | Default | `bg-accent text-accent-foreground` |
| | Hover | `bg-accent/80` |
| Checkbox | Unchecked | `border-border` |
| | Checked | `bg-primary border-primary text-primary-foreground` |
| Switch | Off | `bg-muted` |
| | On | `bg-primary` |
| Card/Section | Default | `bg-card border border-border rounded-lg p-5` |
| Progress | Track | `bg-accent` |
| | Fill | `bg-primary` |

**容器约束**:
- 页面根容器: `min-w-[410px] w-full p-4 space-y-6 bg-background`
- 最大宽度不做限制，跟随飞书侧边栏拖拽宽度自适应