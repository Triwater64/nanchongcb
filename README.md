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
- **推荐：Render 全栈部署（有实时 AI 反馈）**：仓库已带 `render.yaml`，Render 会自动 `npm ci && npm run build`，再用 `npm start` 启动 Express。同一个服务同时托管 `dist/` 页面和 `/api/*`，用户打开一个网址即可实时调用模型，不再有 API 404
- **GitHub Pages 的限制**：Pages 只能托管静态文件，不能运行 Express，`/api/*` 必然 404、前端拿不到实时结果。若坚持用 Pages，必须把 API 单独部署到 Node 主机，并给前端设置 `VITE_API_BASE=https://你的后端域名`
- **密钥配置**：在 Render/Railway 控制台设置 `DEEPSEEK_API_KEY` 与 `DASHSCOPE_API_KEY`，不要提交 `.env`
- **CI**：`.github/workflows/ci.yml` 在每次 push/pull request 时执行构建校验
- **演示兜底**：未配置 Key 或模型超时时，后端返回预置数据，界面标注"演示降级数据"，流程不中断

## 新增 API 的扩展点

后端已按模块拆分，新增接口无需改动核心逻辑：

1. 复制 `server/routes/_template.ts` 为你的新路由文件（例如 `server/routes/report.ts`）
2. 在 `server/index.ts` 的 `apiRouters` 数组中注册这个路由
3. 模型调用统一走 `server/lib/ai.ts` 的 `chat()`；新提示词放进 `server/lib/prompts/`
4. 新数据放进 `data/*.json`，通过 `server/lib/knowledge.ts` 加载；需要检索就在该文件加匹配函数
5. 需要流式状态时用 `server/lib/sse.ts` 的 `openSse()`，前端 `AgentPanel` 会自动展示节点流转
6. 前端调用统一使用 `src/lib/api.ts` 的 `postJson()` / `getJson()` / `streamPost()`，已内置 `VITE_API_BASE` 支持
7. 新增环境变量时同步写入 `.env.example`，永远不要提交 `.env` 到 GitHub
