# ADR-001: Pivot to Download-style Skill Hub

## Status

Accepted（取代 Spec v0.2.1 §3.4 与 Plan v0.2.1 §4.5 中"容器化 HTTP 微服务 + Hub 统一调用"的设定）

## Date

2026-06-28

## Context

Spec v0.2.1 / Plan v0.2.1 设计的 Skill 形态是**容器化 HTTP 微服务**：

- 平台通过 `POST /api/v1/skills/:slug/invoke` 以 HTTP 方式调用 Skill 暴露的 endpoint
- 同步调用，按 API Key 鉴权 + 限流，CallLog 记录每次调用
- 详情页提供试运行控制台、自动渲染 OpenAPI 片段

在 W1～W4 实施过程中，团队逐步意识到这套模型与公司真实使用场景错配：

1. **Skill 来源现实**：公司内部 AI Skill 主要形态是 `SKILL.md` + 脚本/资源文件，由员工在自己常用的 AI 工具（OpenCode、Claude Desktop、Cursor、Codex 等）里加载使用，**不是常驻的 HTTP 服务**。强行要求每个 Skill 作者打包容器、暴露 endpoint，发布门槛过高。
2. **执行环境现实**：员工希望在自己电脑/自己常用的 IDE 里跑这些 Skill，而不是把请求发给 Hub 让 Hub 转发。Hub 既不该、也无力承担模型层 / 推理网关的角色。
3. **公司治理现实**：Spec §3.4 假设的"AI 推理能力由各 Skill 自带，Hub 不提供模型层"在下载式模型里更彻底地成立——Hub 只做**发现、治理、分发**，不做**调用**。
4. **MVP 价值**：尽快让员工能找到、下载、安装 Skill 就足够产生价值；HTTP 调用链路（invoke / CallLog / 限流 / 试运行）是 v1 的成本中心，但不是核心价值。

继续按原 Spec 实施会让 v1 周期多花 2～3 周（容器化规范、调用链路、试运行沙箱、API Key 限流、统计聚合），且产出的功能用户用不上。

## Decision

**Skills Hub v1 改为「下载式 Skill 分发平台」**：

- Skill 形态：一个目录，包含 `SKILL.md`（按 WorkBuddy 规范）+ 可选资源文件（脚本、references、assets 等）
- 分发方式：贡献者上传 zip 包，平台存储并展示；用户在详情页下载 zip，按平台提供的安装指引放到对应 AI 工具的 skills 目录
- 平台职责：发现（搜索/分类）、治理（4 角色审核流、版本、强制下架、审计）、社区（评分/评论/点赞/收藏）、下载分发
- 平台**不**承担：HTTP 调用、试运行、API Key、调用统计、限流、异步任务

具体影响见 Spec v0.3 与 Plan v0.3 的对应章节。

## Alternatives Considered

### 方案 A：保留原 Spec（HTTP 微服务 + invoke API）

- 优点：API 化能力对长期 SaaS 化/集成更友好
- 缺点：
  - 与公司真实 Skill 形态不匹配，作者要额外学容器化
  - Hub 要承担调用网关职责，运维成本高
  - W5 整周工作量投入到大部分用户不会用的功能
- 拒绝原因：错配严重，MVP 价值不达

### 方案 B：混合（下载为主 + 选择性 invoke）

- 优点：保留长期 API 化口子
- 缺点：
  - 两套模型都要建，复杂度翻倍
  - "哪些 Skill 走 invoke" 在权限/审核/UI 上引入分支
  - MVP 阶段没人能说清哪些 Skill 真需要 invoke
- 拒绝原因：复杂度收益不匹配；如未来确有需求，写 ADR-002 引入即可

## Consequences

### 删除的能力（v0.2 设定过、v0.3 不再做）

- `POST /api/v1/skills/:slug/invoke` 同步调用 API
- API Key 生成/校验/吊销流程
- CallLog 表与调用统计聚合
- 试运行控制台、OpenAPI 自动渲染
- 限流（按 Key 维度令牌桶）
- 异步任务（v1.1 推迟过的，现在也不必再补）

### 新增/强化的能力

- Skill zip 包上传、解压校验、存储（Plan §4.2 上传 zip；SkillFile 表）
- 详情页下载入口 + 多 AI 工具安装指引（OpenCode / Claude / Cursor / Codex / VS Code）
- 文件树展示（SkillFileTree 组件，让用户下载前预览包内容）
- 单文件读取接口（`GET /api/skills/:slug/files/[...path]`，便于外部工具按需取文件）

### 数据模型变化

- 移除：`CallLog`、`ApiKey`、`Skill.callCount`、`Skill.inputSchema/outputSchema`、`SkillVersion.inputSchema/outputSchema`
- 新增（已在代码中）：`SkillFile`、`Skill.zipUrl`、`Skill.endpointUrl`（后者保留为可选元数据，不参与调用）
- 保留：`Notification`（原 Plan §W4 提到但 schema 没建模，v0.3 正式收入）

### 需要的代码清理（与 ADR 一并通过 PR 落地）

下列代码在当前仓库里仍存在但属于 v0.2 残留，应在 v0.3 收口 PR 中删除：

- `prisma/schema.prisma` 的 `ApiKey` 模型
- `src/server/apikey.service.ts`
- `src/server/ratelimit.service.ts`（stub，无调用方）
- `src/server/stats.service.ts` 中 `getSkillStats`（永远返回 0）
- `src/app/api/account/api-keys/**`
- `src/app/(account)/account/page.tsx` 中 ApiKey 区块与 `src/components/ApiKeyManager.tsx`
- `src/lib/auth/schemas.ts` 的 `createApiKeySchema` / `CreateApiKeyInput`

### 留下的限制

- 用户无法在站内验证 Skill 是否能跑——只能下载后到自己环境里试。后续若需求强烈，可在 v2 引入沙箱试运行（写新 ADR）。
- 平台无法采集真实调用数据，F20/F22 改为下载量/收藏量/评分等**站内可观测指标**，不是调用指标。
