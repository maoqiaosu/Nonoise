# Nonoise - AI 资讯助手

一个个性化的阅读简报生成器，从 100+ 优质技术博客抓取内容，用 AI 生成中文摘要。

## 功能特点

- 🚀 无需注册 - 用户只需输入自己的 API Key
- 🔒 隐私安全 - API Key 保存在浏览器本地，不上传服务器
- 📱 响应式设计 - 支持手机和电脑访问
- ⚡ 快速部署 - 一键部署到 Vercel

## 部署方法

### 方法 1: Vercel 一键部署（推荐）

1. 点击下方按钮部署：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/import/project?template=https://github.com/vercel/vercel/tree/main/examples/vercel-next)

或者：

1. 注册 [Vercel](https://vercel.com) 账号
2. 将此项目推送到 GitHub
3. 在 Vercel 中导入此项目
4. 点击 Deploy 完成部署

### 方法 2: 本地运行

```bash
# 安装依赖
npm install

# 本地开发
npm run dev

# 构建
npm run build
```

## 使用方法

1. 打开部署后的网站
2. 选择 AI 服务提供商（MiniMax / OpenAI / 火山引擎）
3. 输入你的 API Key
4. 选择或输入自定义关键词
5. 点击"一键生成"
6. 等待 AI 处理完成，查看阅读简报

## 支持的 API

- MiniMax (推荐)
- OpenAI
- 火山引擎

## 项目结构

```
.
├── api/
│   └── generate.js      # Serverless Function (处理 RSS 和 AI)
├── public/
│   ├── index.html       # 主页面
│   ├── style.css       # 样式
│   └── app.js          # 前端逻辑
├── vercel.json         # Vercel 配置
└── package.json        # 项目配置
```

## 注意事项

- 免费版的 Vercel 每月有 100GB 带宽，足够个人使用
- 首次生成需要等待 1-2 分钟（需要抓取 RSS + 调用 AI）
- API 消耗取决于选择的文章数量

## License

MIT
