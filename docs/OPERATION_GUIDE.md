# 操作手册（OPERATION GUIDE）

> 南充跨境商业平台 Demo —— 从零启动到演示的完整操作清单。
> 全程约需 30~60 分钟（不含 API 审核等待时间）。

---

## 一、你需要手动做的事（共 5 项）

### 1. 安装 Node.js（一次性，5 分钟）
- 前往 https://nodejs.org 下载 **LTS 版（18 或以上）**，一路下一步安装。
- 验证：打开 PowerShell，输入 `node -v`，显示版本号即成功。

### 2. 注册 DeepSeek API Key（约 5 分钟）
1. 打开 https://platform.deepseek.com ，手机号注册。
2. 左侧菜单「API keys」→「创建 API key」→ 复制保存（只显示一次）。
3. 新账号有赠送额度，Demo 用量几乎为零成本。
- 用途：**报价单推理、驾驶舱商机诊断**（模型 `deepseek-reasoner`）。

### 3. 注册阿里云百炼 API Key（约 8 分钟）
1. 打开 https://bailian.console.aliyun.com ，支付宝/淘宝账号登录，完成实名认证。
2. 开通「模型服务」：在模型广场确认 **qwen-turbo、qwen-plus、通义万相 wanx2.1-t2i-plus** 均已开通（新用户各送百万级 token / 数百张图免费额度）。
3. 右上角头像 →「API-KEY」→ 创建并复制。
- 用途：**意图路由**（qwen-turbo）、**多语言 Listing 文案**（qwen-plus）、**场景图生成**（wanx2.1-t2i-plus）。

### 4. 填入密钥并启动（2 分钟）
1. 用记事本打开项目根目录的 `.env` 文件（没有就复制 `.env.example` 改名为 `.env`）：
   ```
   DEEPSEEK_API_KEY=sk-你的DeepSeek密钥
   DASHSCOPE_API_KEY=sk-你的百炼密钥
   DEMO_FALLBACK=true
   ```
2. 在项目目录打开 PowerShell，依次执行：
   ```
   npm install
   npm run dev
   ```
3. 看到 `web` 和 `api` 两行日志后，浏览器打开 **http://localhost:5173** 。

> 没配密钥也能跑：`DEMO_FALLBACK=true` 时系统自动切换预置数据，全部演示流程不断流（界面上会标注"演示降级数据"）。正式演示前建议至少配好百炼 Key。

### 5. 准备演示素材（可选，10 分钟）
- 平台已预置 8 张示例图（`public/samples/`，覆盖四大产业），开箱即用。
- 若要更真实：准备 5~10 张南充本地企业的真实产品照片（手机拍摄即可），演示时在卖家工作台点击上传区替换。
- 核对 `data/companies.json` 中的 18 家模拟企业信息，可替换成真实园区企业名录（保持字段结构不变即可）。

---

## 二、新增功能速览（无需额外配置）

| 功能 | 位置 | 说明 |
|---|---|---|
| 一键自动演示 | 首页金色按钮 | 约 50 秒自动跑完三大演示闭环，全程零操作，适合领导视察 |
| AI 智能客服浮窗 | 全站右下角 | 先路由识别意图，再由 Qwen-Turbo 应答，气泡内展示路由标签 |
| PI 打印/导出 | 报价单卡片右上 | 「打印/导出PDF」按钮只打印报价单卡片，也可一键复制纯文本 PI |
| 物流成本对比图 | 驾驶舱底部 | 中欧班列 vs 海运整柜成本，金色柱=班列、蓝色柱=海运 |
| 模型状态徽标 | 导航栏中部 | 「AI 模型在线 / 演示兜底模式」自动反映 .env 配置情况 |

## 三、模型分工与提示词位置（方便你调优）

| 环节 | 模型 | 提示词文件 | 说明 |
|---|---|---|---|
| 意图识别与路由 | `qwen-turbo` | `server/lib/prompts/router.ts` | 只输出 JSON 标签，毫秒级 |
| 多语言 Listing | `qwen-plus` | `server/lib/prompts/listing.ts` | 英/法/俄/阿四语种 + 合规提示 |
| 报价单/商机诊断 | `deepseek-reasoner` | `server/lib/prompts/quote.ts`、`dashboard.ts` | 注入汇率、物流、企业库上下文 |
| 海外场景图 | `wanx2.1-t2i-plus` | `server/lib/prompts/image.ts` | 按产业 × 目标市场拼接场景提示词 |
| 企业匹配 | 本地知识库检索 | `server/lib/knowledge.ts` | 关键词打分，零延迟零成本 |

**改提示词的方法**：直接编辑上述 `.ts` 文件中的字符串，保存后后端自动热重载（tsx watch），无需重启。

---

## 四、常见问题排查

| 现象 | 原因与解决 |
|---|---|
| 页面一直"渲染中" | 通义万相生图需 30~60 秒，属正常；超过 60 秒会自动降级为预置场景图 |
| 结果出现"演示降级数据"角标 | 对应模型的 Key 未配置或超时，检查 `.env` 后重启 `npm run dev` |
| 浏览器打不开 5173 端口 | 确认 `npm run dev` 两个进程都在运行；防火墙弹窗选"允许" |
| 报价数字不合理 | 演示兜底报价是按行业基准价拼装；配置 DeepSeek Key 后由推理模型实时计算 |
| 改了 data/*.json 没生效 | 后端热重载偶尔会缓存，按 Ctrl+C 重启 `npm run dev` |

---

## 五、项目结构速查

```
├── src/pages/            # 四个页面：门户 / 卖家工作台 / 买家端 / 驾驶舱
├── src/components/       # AgentPanel(协同面板)、ListingResult、QuotePI、图表
├── server/               # Express 后端：API 路由 + 模型客户端 + 提示词
├── data/                 # 预置知识库：企业库 / 政策物流 / 热搜趋势（可自由编辑）
├── public/samples/       # 8 张 AI 生成的示例产品图与场景图
└── docs/DEMO_SCRIPTS.md  # 政府版 / 企业版演示脚本
```
