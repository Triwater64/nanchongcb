# 中国南充市跨境商业平台 · Demo

结合南充四大优势产业（丝绸纺织服装、汽车汽配、农产品/食品加工、精细化工）与
**多模型协同架构**（总控路由 + 专精模型分工 + 本地知识库）的跨境贸易平台演示系统。

## 快速启动

```bash
npm install
# 复制 .env.example 为 .env 并填入密钥（不填也能跑，自动降级为预置数据）
npm run dev
# 浏览器打开 http://localhost:5173
```

## 四大页面

| 页面 | 路径 | 演示重点 |
|---|---|---|
| 平台门户 | `/#/` | 产业带总览 + 多模型分工 |
| 卖家工作台 | `/#/seller` | 一键出海：多语言 Listing + 场景图 + 合规提示 |
| 海外买家端 | `/#/buyer` | 多语言询盘 → 企业匹配 → PI 报价单 |
| 产业驾驶舱 | `/#/dashboard` | 深色大屏：热力流向图 + 热搜趋势 + AI 商机诊断 |

## 模型分工

| 任务 | 模型 | 提供方 |
|---|---|---|
| 意图识别/路由/客服 | qwen-turbo | 阿里云百炼 |
| 多语言 Listing 文案 | qwen-plus | 阿里云百炼 |
| 报价推理/商机诊断 | deepseek-reasoner | DeepSeek |
| 海外场景图生成 | wanx2.1-t2i-plus | 阿里云百炼（通义万相） |

## 文档

- `docs/OPERATION_GUIDE.md` —— 环境准备、API Key 注册、手动操作清单、提示词位置
- `docs/DEMO_SCRIPTS.md` —— 政府版 / 企业版两套演示脚本 + 应急预案

## GitHub 与部署

本副本仅保留源码、配置、数据、素材和文档（少于 100 个文件），已排除 `node_modules`、`dist`、`.env` 和临时文件。

- **本地运行**：`npm ci` → 复制 `.env.example` 为 `.env` → `npm run dev` → 打开 `http://localhost:5173`
- **前端部署**：`npm run build` 生成 `dist/`；`vite.config.ts` 已设 `base: './'`，可直接部署到 GitHub Pages 子路径
- **GitHub Pages 正确姿势**：仓库 Settings → Pages → Build and deployment → Source 选择 **GitHub Actions**；推送 `main` 后 `.github/workflows/deploy-pages.yml` 会自动构建 `dist` 并发布。不要尝试直接发布仓库根目录的 `index.html`（那是 Vite 开发入口，浏览器无法运行 TSX）
- **后端部署**：`server/` 是 Express 服务，需单独部署到 Render、Railway、Cloud Run 等 Node 主机；配置 `DEEPSEEK_API_KEY`、`DASHSCOPE_API_KEY`、`PORT`
- **前后端分离**：在部署环境给前端设置 `VITE_API_BASE=https://你的后端域名`，前端 API 请求会自动带上该前缀；留空则走本地 Vite 代理
- **CI**：`.github/workflows/ci.yml` 在每次 push/pull request 时执行构建校验并上传 `dist` 产物
- **注意**：GitHub Pages 不能直接运行 Express 后端，API 必须单独部署；演示模式不配 Key 也能用预置数据跑通全流程

## 新增 API 的扩展点

后端已按模块拆分，新增接口无需改动核心逻辑：

1. 复制 `server/routes/_template.ts` 为你的新路由文件（例如 `server/routes/report.ts`）
2. 在 `server/index.ts` 的 `apiRouters` 数组中注册这个路由
3. 模型调用统一走 `server/lib/ai.ts` 的 `chat()`；新提示词放进 `server/lib/prompts/`
4. 新数据放进 `data/*.json`，通过 `server/lib/knowledge.ts` 加载；需要检索就在该文件加匹配函数
5. 需要流式状态时用 `server/lib/sse.ts` 的 `openSse()`，前端 `AgentPanel` 会自动展示节点流转
6. 前端调用统一使用 `src/lib/api.ts` 的 `postJson()` / `getJson()` / `streamPost()`，已内置 `VITE_API_BASE` 支持
7. 新增环境变量时同步写入 `.env.example`，永远不要提交 `.env` 到 GitHub
