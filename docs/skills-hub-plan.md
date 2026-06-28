# Skills Hub - 实施计划 (Plan v0.3)

> 把 Spec v0.3 落地为可执行的工程方案。技术栈：Next.js (前后端一把梭) + 自部署 PostgreSQL + S3 兼容对象存储。**v1 不引入 Redis/异步任务/API 调用链路**。

> 修订历史：
>
> - **v0.2** Review 修订（M1~~M5 + S1~~S11 + 全部补充项）
> - **v0.2.1** 首个 Owner 凭据从 `.env` 读取，seed 脚本不写死默认凭据
> - **v0.3** 架构 pivot：移除 invoke / API Key / CallLog / 限流 / 试运行 / OpenAPI 渲染，加入 zip 上传 / 下载 / 文件树 / 多 AI 工具安装指引。完整背景见 [`decisions/adr-001-download-style-skill-hub.md`](./decisions/adr-001-download-style-skill-hub.md)
>
> 完整变更见文末"修订记录"。

---

## 1. 技术选型

### 1.1 一句话架构

**Next.js (App Router) 一把梭**：前端页面、API 路由、SSR 渲染、Server Actions 全部在一个工程内完成，后端无独立服务。

### 1.2 选型清单

| 维度          | 选型                                                | 理由                               |
| ------------- | --------------------------------------------------- | ---------------------------------- |
| 框架          | **Next.js 15 (App Router) + TypeScript**            | 前后端一把梭，SSR 友好，生态成熟   |
| UI            | **Tailwind CSS + shadcn/ui**                        | 组件化好、视觉统一、改造成本低     |
| ORM           | **Prisma**                                          | TS 友好，迁移简单，类型安全        |
| 数据库        | **PostgreSQL 16** (自部署)                          | 关系型 + JSONB 兼顾，足够撑住 MVP  |
| 对象存储      | **S3 兼容存储 (MinIO / 自有 S3)**                   | 头像、附件、Skill zip 资源         |
| 鉴权          | **自建账号 + JWT (HTTP-only Cookie) + bcrypt**      | v1 不接 SSO；v2 替换为 OIDC        |
| Schema 校验   | **Zod 3**                                           | 运行时类型校验，与 TS 强类型互通   |
| 搜索          | **PG 全文搜索 (pg_trgm + tsvector)**                | 1k 级别数据量足够；后续可升级到 ES |
| Lint / 格式化 | **ESLint + Prettier + Husky + lint-staged**         | 代码质量底线                       |
| 部署          | **Docker Compose**（app + postgres + minio 三件套） | 内部部署友好                       |
| 反向代理      | **Caddy / Nginx**                                   | HTTPS 终止                         |
| 异步任务      | ❌ **v1 不引入**                                    | 下载式模型不需要                   |
| HTTP 调用链路 | ❌ **v1 不引入**（v0.3 移除）                       | Skill 在用户本地执行，Hub 不调用   |
| API Key       | ❌ **v1 不引入**（v0.3 移除）                       | 同上                               |

> v1 = 不上 Redis、不上异步任务、不上调用链路、不引入 API Key。

### 1.3 目录结构

```
skills-hub/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/                  # v0.3 起强制使用 prisma migrate dev（不再用 db push）
│   └── seed.ts                      # 首个 Owner 创建脚本
├── src/
│   ├── app/                         # Next.js App Router
│   │   ├── (public)/                # 公开页面：首页、列表、详情
│   │   ├── (account)/               # 个人中心、我的收藏
│   │   ├── (studio)/                # 贡献者工作台
│   │   ├── (review)/                # 审核员工作台
│   │   ├── (admin)/                 # 超级管理员后台
│   │   └── api/                     # 内部 API 路由
│   ├── components/                  # 公共组件
│   ├── lib/                         # 业务逻辑：prisma client、auth、skill state machine、skill-package
│   ├── server/                      # 业务服务层：skill / review / community / user / audit / notification
│   ├── types/                       # 共享类型
│   └── styles/                      # Tailwind 全局样式
├── uploads/skills/<skillId>/        # Skill zip 资源包本地落盘（生产建议改为对象存储直存）
├── docker/
│   ├── docker-compose.yml           # app + postgres + minio
│   ├── Dockerfile
│   └── caddy/Caddyfile
├── .github/
│   └── workflows/ci.yml             # Lint / Typecheck / Build / Test
└── docs/
    ├── skills-hub-spec.md
    ├── skills-hub-plan.md
    ├── decisions/                   # ADR
    │   └── adr-001-...md
    ├── deploy.md                    # 部署手册（W6 交付）
    ├── upgrade.md                   # 升级手册（W6 交付）
    └── runbook.md                   # 运维手册（W6 交付）
```

---

## 2. 数据模型（核心表）

> 详细 Prisma Schema 见仓库 `prisma/schema.prisma`；这里只列关键字段与关系。

```text
User        (id, email, name, avatar, passwordHash, role[Visitor|Contributor|Reviewer|Owner],
             status[Active|Disabled], lastLoginAt, createdAt)
Category    (id, name, parentId, sort, createdAt)
Skill       (id, slug, name, summary, tags[], ownerId, categoryId,
             status[Draft|Pending|Approved|Rejected|Offline],
             latestVersionId, zipUrl, endpointUrl?,
             ratingAvg, ratingCount,
             downloadCount,           -- v0.3 新增：累计下载量（详情页统计源）
             createdAt, updatedAt)
             -- 注：skillMd 是 latestVersion 的冗余字段（读时优化），
             -- 写入只能通过 SkillVersion 机制更新（避免双 source of truth）
             -- v0.3 起 Skill 不再持有 inputSchema/outputSchema（已删除）
SkillFile   (id, skillId, path, content?, mimeType, size, createdAt)   -- v0.3：zip 包内单文件
SkillVersion(id, skillId, version, skillMd, changelog, createdAt)      -- v0.3：仅 skillMd，无 inputSchema/outputSchema
DigitalEmployee (id, skillId, personaName, avatarUrl, personaIntro, welcomeMessage, roleDesc)
Review      (id, skillId, versionId, reviewerId, decision[Approve|Reject|RequestChanges],
              comment, createdAt)
Comment     (id, skillId, userId, content, parentId, createdAt)        -- parentId 一层回复
Rating      (id, skillId, userId, stars, createdAt)
Favorite    (id, userId, skillId, createdAt)
Like        (id, userId, skillId, createdAt)                            -- 点赞
AuditLog    (id, userId?, action, targetType, targetId?, payload, createdAt)
Notification(id, userId, type, title, content, read, link?, createdAt)  -- v0.3 正式收入（v0.2 仅在 Plan §W4 提及）
```

**关键设计**

- `User.passwordHash` + `bcrypt` 加密存储，登录用 email + password
- `Skill` 与 `DigitalEmployee` 是 **1:0..1** 关系，数字员工 = 附加人设字段
- `Skill.skillMd` 是 `latestVersion` 的**冗余字段（读时优化）**，写入只能通过 `SkillVersion` 机制更新（避免双 source of truth）
- `Skill.zipUrl` 指向最近一次上传的 zip 落盘路径；`SkillFile` 表存解压后每个文件的元信息与（文本文件）内容
- `Skill.endpointUrl` 在 v0.3 仅作为可选元数据保留（少数 Skill 可能附带自部署 endpoint 信息展示给用户），**Hub 不调用、不解析、不校验**
- `Skill.status` 是状态机核心字段，状态转移由 `lib/skill/state.ts` 服务层强约束
- `Skill.downloadCount` 由下载接口原子自增（不依赖任何 CallLog 聚合）
- `AuditLog` 记录所有关键操作（发布/审核/上下架/角色变更/强制下架），可导出 CSV/JSON
- `Notification` 承载站内消息：审核结果、强制下架通知、角色变更通知
- 索引：`Skill(slug)`、`Skill(status, createdAt)`、`Skill(categoryId, status)`、`AuditLog(userId, createdAt)`、`SkillFile(skillId, path)`（唯一）

**v0.3 相对 v0.2 的模型差异（与 ADR-001 对齐）**

| 操作        | 对象                                                                      | 说明                          |
| ----------- | ------------------------------------------------------------------------- | ----------------------------- |
| ❌ 删除     | `CallLog` 表                                                              | 不再有调用链路                |
| ❌ 删除     | `ApiKey` 表                                                               | 不再有 API Key                |
| ❌ 删除     | `Skill.callCount`                                                         | 改用 `downloadCount`          |
| ❌ 删除     | `Skill.inputSchema/outputSchema`、`SkillVersion.inputSchema/outputSchema` | 平台不再解析入参契约          |
| ➕ 新增     | `SkillFile` 表                                                            | zip 包内文件存储              |
| ➕ 新增     | `Skill.zipUrl`                                                            | 最近一次上传的 zip 路径       |
| ➕ 新增     | `Skill.downloadCount`                                                     | 累计下载量                    |
| ➕ 新增     | `Skill.endpointUrl`                                                       | 可选展示元数据（不参与调用）  |
| ⬆️ 正式收入 | `Notification` 表                                                         | v0.2 文字提到但 schema 没建模 |

---

## 3. 状态机：Skill

```
                    submit
Draft ────────────────────────────> Pending
 ^                                    │
 │                                    │ approve
 │ requestChanges                     ▼
 └────────────────────────── Approved
                                     │
                                     ├── self offline ──> Offline ── republish ──> Pending
                                     └── forceOffline(admin) ──> Offline

Pending ── reject ──> Rejected ── edit & submit ──> Pending
```

转移规则：

- `Draft → Pending`：Contributor 提交（自身）
- `Pending → Approved`：Reviewer 批准
- `Pending → Rejected`：Reviewer 驳回（带 comment）
- `Pending → Draft`：Reviewer 打回修改（带 comment）
- `Approved → Offline`：Contributor 自主下架 / Owner 强制下架（强制下架需 reason）
- `Offline → Pending`：重新发布（生成 patch 版本号）
- `Rejected → Draft`：贡献者编辑后回到 Draft，再走 `Draft → Pending`（**即 Rejected → Pending 必须经由 Draft 过渡**）

权限：仅 `Approved` 状态对普通用户可见、可下载；其他状态仅归属人 / Reviewer / Owner 可见。

---

## 4. 关键 API 设计

> Next.js Route Handlers (`app/api/.../route.ts`)，按 RESTful 风格。
> 内部 API 资源标识用 `:id`（cuid），公开/详情页用 `:slug`（人友好）。

### 4.1 公开/用户 API

| Method | Path                             | 说明                                   |
| ------ | -------------------------------- | -------------------------------------- |
| GET    | `/api/skills`                    | 列表（关键词、分类、标签、分页、排序） |
| GET    | `/api/skills/:slug`              | 详情                                   |
| GET    | `/api/skills/:slug/download`     | **下载 Skill zip 包**（v0.3）          |
| GET    | `/api/skills/:slug/files`        | **文件树元数据列表**（v0.3）           |
| GET    | `/api/skills/:slug/files/[...p]` | **读取包内单个文件内容**（v0.3）       |
| POST   | `/api/skills/:slug/comments`     | 发表评论（支持 parentId 一次回复）     |
| POST   | `/api/skills/:slug/rating`       | 打分（1-5）                            |
| POST   | `/api/skills/:slug/favorite`     | 收藏/取消                              |
| POST   | `/api/skills/:slug/like`         | 点赞/取消                              |
| GET    | `/api/skills/:slug/comments`     | 评论列表                               |

> 下载接口在响应成功时同步自增 `Skill.downloadCount`，并对未登录用户也允许（若 Spec/Owner 后续要求登录才能下载，再加 session 校验）。

### 4.2 贡献者 API

| Method | Path                                | 说明                                 |
| ------ | ----------------------------------- | ------------------------------------ |
| POST   | `/api/studio/skills`                | 创建 Skill (Draft)                   |
| PATCH  | `/api/studio/skills/:id`            | 更新（仅 Draft/Rejected 可改）       |
| POST   | `/api/studio/skills/:id/versions`   | 新建版本                             |
| POST   | `/api/studio/skills/:id/submit`     | 提交审核（Draft/Rejected → Pending） |
| POST   | `/api/studio/skills/:id/offline`    | 自主下架（Approved → Offline）       |
| POST   | `/api/studio/skills/:id/republish`  | 重新发布（Offline → Pending）        |
| POST   | `/api/studio/skills/:id/upload-zip` | **上传 Skill zip 资源包**（v0.3）    |

> `upload-zip` 接收 multipart/form-data，服务端用 adm-zip 解压，逐文件入库 `SkillFile`，原始 zip 落盘到 `uploads/skills/<skillId>/`；解压时严格校验：
>
> - 单文件 ≤ 10MB，整包 ≤ 50MB
> - 路径不得穿越（`../`、绝对路径一律拒绝）
> - 文件扩展名白名单（md/yaml/yml/json/py/js/ts/sh/txt/png/jpg/jpeg/gif/webp/svg）
> - 入库时若是文本（md/yaml/json/...）写 `content`，二进制只存元信息

### 4.3 审核员 API

| Method | Path                       | 说明                                      |
| ------ | -------------------------- | ----------------------------------------- |
| GET    | `/api/review/queue`        | 待审队列                                  |
| POST   | `/api/review/:id/decision` | 提交决策（approve/reject/requestChanges） |

### 4.4 管理 API

| Method         | Path                                             | 说明                        |
| -------------- | ------------------------------------------------ | --------------------------- |
| GET / POST     | `/api/admin/users`                               | 用户列表 / 邀请新用户       |
| PATCH / DELETE | `/api/admin/users/:id`                           | 编辑 / 停用用户             |
| POST           | `/api/admin/users/:id/role`                      | 分配角色                    |
| CRUD           | `/api/admin/categories`                          | 分类管理                    |
| POST           | `/api/admin/skills/:id/force-offline`            | 强制下架（必传 reason）     |
| GET            | `/api/admin/audit-logs?from=&to=&actor=&action=` | 审计日志（可导出 CSV/JSON） |
| GET            | `/api/admin/stats/overview`                      | Hub 大盘                    |

### 4.5 错误约定

- 统一 JSON 错误体：`{ code: string, message: string, details?: any }`
- 常见码：`UNAUTHORIZED` / `FORBIDDEN` / `NOT_FOUND` / `VALIDATION_ERROR` / `STATE_INVALID` / `CONFLICT`
- v0.2 的 `RATE_LIMITED` 错误码在 v0.3 **保留**（语义改为"上传频率限制"等通用限流，下载/调用相关用法删除）

> v0.3 已**移除整个"调用方 API"章节**（原 §4.5：`POST /api/v1/skills/:slug/invoke` 等）。原因见 ADR-001。

---

## 5. 权限矩阵

| 资源/操作                                       | Visitor | Contributor | Reviewer | Owner  |
| ----------------------------------------------- | ------- | ----------- | -------- | ------ |
| 浏览/搜索/下载/文件预览                         | ✅      | ✅          | ✅       | ✅     |
| 评分/评论/回复/点赞/收藏                        | ✅      | ✅          | ✅       | ✅     |
| 创建/编辑自己的 Skill                           | ❌      | ✅          | ✅       | ✅     |
| 上传 zip 资源包                                 | ❌      | ✅          | ✅       | ✅     |
| 提交审核                                        | ❌      | ✅          | ✅       | ✅     |
| 自主下架自己的 Skill                            | ❌      | ✅          | ✅       | ✅     |
| 重新发布                                        | ❌      | ✅          | ✅       | ✅     |
| 审核 Skill（approve / reject / requestChanges） | ❌      | ❌          | ✅       | ✅     |
| 强制下架任意 Skill                              | ❌      | ❌          | ❌       | **✅** |
| 用户/角色管理 / 邀请用户                        | ❌      | ❌          | ❌       | ✅     |
| 分类管理                                        | ❌      | ❌          | ❌       | ✅     |
| 查看 / 导出审计日志                             | ❌      | ❌          | ❌       | ✅     |

> Reviewer 不能强制下架；强制下架是高危操作，仅 Owner。

---

## 6. 里程碑（MVP，6 周）

> 按"可演示闭环"为目标拆分里程碑，每周交付一个可演示的增量。

### W1 - 基础工程

- [ ] 初始化 Next.js 15 + TS + Tailwind + shadcn/ui
- [ ] 接入 ESLint + Prettier + Husky + lint-staged
- [ ] 建立 GitHub Actions CI（lint / typecheck / build / test）
- [ ] Prisma + PostgreSQL 接入，**初始 migration**（含 seed.ts，禁止用 `db push` 上生产）
- [ ] 账号体系：注册/登录/JWT HTTP-only Cookie/bcrypt
- [ ] 4 角色基础权限中间件（`assertCan(user, action)`）
- [ ] Docker Compose：app + postgres + minio 三件套
- [ ] 跑通 seed：创建首个 Owner 账号

### W2 - 浏览与发现

- [ ] 首页（数字员工卡片 + Skill 卡片入口分流 + 推荐位 + 最新上架 + 热门下载）
- [ ] 列表页（关键词 + 分类 + 标签筛选 + 排序 + 分页）
- [ ] 详情页骨架（占位内容，状态机 UI）
- [ ] PG 全文搜索（pg_trgm + tsvector）索引上线

### W3 - 发布与生命周期

- [ ] Skill 创建向导（表单 + SKILL.md 在线编辑 + 实时预览 + zip 上传）
- [ ] 版本管理（SemVer：新版本发布 + 历史 + 回滚）
- [ ] 数字员工：在 Skill 基础上叠加人设层
- [ ] 我的工作台（Draft / Pending / Approved / Rejected / Offline 列表）
- [ ] 自主下架 / 重新发布
- [ ] **zip 上传服务端校验**（大小/路径穿越/扩展名白名单）

### W4 - 审核流

- [ ] 审核队列页（待审 Skill 列表）
- [ ] 审核操作（通过 / 驳回 / 打回修改）
- [ ] 审核历史（按 Skill 聚合展示）
- [ ] 强制下架（Owner，必填 reason）
- [ ] 通知贡献者（站内消息，对应 `Notification` 表）

### W5 - 下载分发链路（v0.3 替换原"调用链路"）

- [ ] 详情页**文件树预览**（zip 包内文件结构 + 单文件文本内容查看）
- [ ] **Skill zip 下载接口**（服务端实时打包 SkillFile → zip 流，自增 downloadCount）
- [ ] 详情页**安装指引自动渲染**（OpenCode / Claude / Cursor / VS Code / Codex 多 tab）
- [ ] **下载量统计**写回 Skill 表，详情页展示

### W6 - 统计、社区、收尾

- [ ] 详情页统计（累计下载 / 平均评分 / 收藏数 / 点赞数；时间窗趋势留 v1.1）
- [ ] 评分 / 评论（一层回复）/ 收藏 / 点赞
- [ ] Hub 大盘（Owner 视角：总 Skill / 下载趋势 / Top 10 / 活跃贡献者）
- [ ] 审计日志 + 导出（CSV/JSON）
- [ ] 部署 / 升级 / 运维三件套文档（`docs/deploy.md` / `upgrade.md` / `runbook.md`）

---

## 7. 风险与应对

| 风险                       | 影响 | 应对                                                                                      |
| -------------------------- | ---- | ----------------------------------------------------------------------------------------- |
| 状态机被绕过               | 高   | 全部状态转移集中在 `lib/skill/state.ts`，API 路由与 UI 都必须调用                         |
| 越权访问                   | 高   | `assertCan(user, action)` 中间件强制每个 API 调用                                         |
| 上传 zip 含恶意脚本        | 高   | 服务端解压时校验路径穿越、文件大小、扩展名；Reviewer 人工兜底；v1.1 加敏感词/密钥扫描     |
| Schema 不一致导致 API 报错 | 中   | 服务层用 Zod 严格校验入参                                                                 |
| 内部部署升级复杂           | 中   | Docker 镜像 + 标准化升级脚本（migration + restart）                                       |
| 自建账号被刷注册           | 中   | 首个 Owner seed + 后续邀请码 / Owner 邀请激活（v1.1）                                     |
| 强制下架被滥用             | 中   | 仅 Owner + 必填 reason + 必留审计                                                         |
| 用户下载后跑不起来         | 中   | 安装指引覆盖主流工具；评论/评分反向暴露问题 Skill；数字员工附欢迎语降低使用门槛           |
| 大量 SkillFile 写入拖慢 PG | 低   | 单 Skill 文件数 ≤ 100、单文件 ≤ 10MB；二进制不写 content；查询走 (skillId, path) 唯一索引 |

---

## 8. 部署方案

### 8.1 部署架构

```
                    ┌────────────┐
                    │   Caddy    │  (HTTPS / 反代)
                    └─────┬──────┘
                          │
                    ┌─────▼──────┐
                    │  Next.js   │  (Docker)
                    │  App + API │
                    └──┬──────┬──┘
                       │      │
               ┌────────▼─┐  ┌─▼────────┐
               │ Postgres │  │   S3 /   │
               │          │  │  MinIO   │
               └──────────┘  └──────────┘
```

> v1 不部署 Redis、不部署调用网关、不部署沙箱。下载所需 zip 由 app 实时打包。

### 8.2 部署步骤（一次性）

1. 准备一台 Linux 服务器（推荐 4C8G 起）
2. 安装 Docker + Docker Compose
3. `git clone` 代码到 `/opt/skills-hub`
4. 复制 `.env.example` → `.env`，填入数据库密码、JWT 密钥、S3 凭据等
5. `docker compose up -d`（app + postgres + minio 一键起）
6. 执行 `docker compose exec app npx prisma migrate deploy`
7. **创建第一个 Owner 账号**：`docker compose exec app npx tsx prisma/seed.ts`
   - seed 脚本从 `.env` 读 `SEED_OWNER_EMAIL` / `SEED_OWNER_NAME` / `SEED_OWNER_PASSWORD`
   - 行为：若 DB 中**不存在**该 email 的用户则创建（role=Owner），**已存在则跳过**（保证幂等）
   - **不**在 seed 脚本或代码中硬编码任何默认密码；缺失 env 变量时 seed 报错退出
8. Owner 登录后台 → 邀请并分配其他用户角色
9. 配置 Caddy 自动 HTTPS
10. （可选）挂载持久卷到 `/app/uploads/skills/` 保存 zip 原档；或改为代码直存 S3

### 8.3 升级流程

- 拉取新代码 → `docker compose build app` → `docker compose up -d app`
- 启动脚本会先 `prisma migrate deploy` 再启服务
- 数据零停机升级：先起新容器再切流量（旧容器 graceful shutdown）

---

## 9. 验收与质量门

每个里程碑结束跑一次：

- [ ] 本周涉及的所有 AC 条目演示通过
- [ ] PR 全部 Review
- [ ] Lint / TypeScript / Build / Test / CI 全绿
- [ ] 关键路径（创建→上传 zip→审核→上架→下载）跑通
- [ ] 更新对应文档
- [ ] 关键操作均有审计日志

---

## 10. 附录 A：关键依赖版本（首版建议）

| 依赖         | 版本                   |
| ------------ | ---------------------- |
| Next.js      | 15.x                   |
| React        | 19.x                   |
| TypeScript   | 5.x                    |
| Prisma       | 5.x                    |
| PostgreSQL   | 16                     |
| Tailwind CSS | 3.4                    |
| shadcn/ui    | latest                 |
| Zod          | 3.x                    |
| bcrypt       | 5.x                    |
| jsonwebtoken | 9.x                    |
| adm-zip      | 0.5.x（zip 解压/打包） |
| ESLint       | 9.x                    |
| Prettier     | 3.x                    |
| ~~BullMQ~~   | ~~不引入~~             |
| ~~Redis~~    | ~~不引入~~             |

---

## 11. 附录 B：Open Questions

> 实施前需逐条拍板的点（绝大多数已确认）：

1. **Skill 包大小限制**：单文件 10MB、整包 50MB —— **确认**
2. **zip 内文件扩展名白名单**：md/yaml/yml/json/py/js/ts/sh/txt/png/jpg/jpeg/gif/webp/svg —— **确认**（v1.1 可放宽）
3. **数字员工头像存储**：统一存对象存储，不允许外链 —— **确认**
4. **审核工作流**：v1 单层 Reviewer —— **确认，不做双层**
5. **评论敏感词审核**：v1 暂不做，依赖 Reviewer 兜底 —— **确认**
6. **Hub Owner 数量**：v1 单 Owner —— **确认**
7. **首个 Owner 凭据来源**：从 `.env` 的 `SEED_OWNER_EMAIL/SEED_OWNER_NAME/SEED_OWNER_PASSWORD` 读，**不写死在数据库/seed 代码里** —— **确认**
8. **下载是否需要登录**：v1 不强制（详情页浏览/下载对 Visitor 开放，符合 §5 权限矩阵）—— **确认**
9. **Skill.endpointUrl 是否在 v0.3 保留**：保留为可选展示字段，**Hub 不调用** —— **确认**（若未来 ADR 决定走调用式，可激活）
10. **未来是否回归"调用式"**：不默认排进 v1.1/v2，**必须新开 ADR 评估后再排期** —— **确认**

---

## 12. 附录 C：与 Spec 的交叉引用

| Plan 章节          | 对应 Spec 章节                  |
| ------------------ | ------------------------------- |
| §1 技术选型        | Spec §3.1/3.2/3.4（Skill 形态） |
| §3 状态机          | Spec §3 核心概念、§6 用户流程   |
| §4 API 设计        | Spec §4 功能清单（F1~F26）      |
| §5 权限矩阵        | Spec §2 用户与角色              |
| §6 里程碑（W1~W6） | Spec §7 验收标准（AC-1~AC-14）  |
| §8 部署            | Spec §1.4 范围、§8.1 假设       |

---

## 13. 修订记录

| 版本   | 日期       | 主要变更                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| v0.1   | 2026-06-27 | 初版（访谈产出）                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| v0.2   | 2026-06-27 | Review 修订：M1 权限矩阵对齐 Spec（Reviewer 移除强制下架）；M2 首个 Owner seed 流程补全；M3 移除 Redis/异步任务到 v1.1，部署图同步收敛；M4/M5 补"重新发布"与自主下架 API；S1 目标度量补基线；S2 明确 Zod + JSON Schema；S4 补 passwordHash；S5 路径规范 id vs slug；S6 W1 补 CI/Lint 任务；S7 补 Skill 执行模型；S8 解释冗余字段；S9 自动从 Schema 渲染 OpenAPI；S10 交叉引用；S11 open questions 标确认状态；新增 §1.3 完整目录、§3 状态机展开、§4.6 错误约定、§7 风险与应对、§12/§13 交叉引用与修订记录                                                                                                                                                                                                                                                                  |
| v0.2.1 | 2026-06-27 | 收口：首个 Owner 凭据统一从 `.env`（`SEED_OWNER_EMAIL/NAME/PASSWORD`）读，不写死到 seed 代码；seed 幂等；缺失 env 报错退出；标题版本号同步到 v0.2.1；§3 状态机图加注释明确 Rejected 须经 Draft 过渡                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| v0.3   | 2026-06-28 | **架构 pivot（详见 ADR-001）**：§1.2 标注 HTTP 调用链路/API Key 不引入；§1.3 加入 `uploads/`、`docs/decisions/`；§2 数据模型整段重写——删 `CallLog`/`ApiKey`/`Skill.callCount`/`inputSchema/outputSchema`，加 `SkillFile`/`zipUrl`/`endpointUrl`/`downloadCount`，正式收入 `Notification`，附"v0.3 vs v0.2 模型差异"表；§4.1 公开 API 新增 download/files/单文件读取；§4.2 贡献者 API 新增 upload-zip（含服务端校验细节）；§4.3/4.4 不变；§4.5 错误约定注明 RATE_LIMITED 语义变化，**整段删除原"调用方 API"**；§5 权限矩阵"试运行"改为"下载/文件预览"；§6 W5 整周替换为"下载分发链路"，W6 统计口径改为下载量；§7 风险表加入"上传恶意 zip/用户跑不起来"；§8.2 补持久卷挂载步骤；§10 移除 BullMQ/Redis，加 adm-zip；§11 Open Questions 重写为 10 条全部确认；§12 交叉引用更新 |
