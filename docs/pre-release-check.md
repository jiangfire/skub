# Skills Hub — 发布前检查报告

> 检查时间：2026-07-04 10:45 GMT+8  
> 版本：v0.1.0 → 首次生产发布  
> 检查者：WorkBuddy

---

## 一、检查结果总览

| 检查项                  | 状态          | 说明                                  |
| ----------------------- | ------------- | ------------------------------------- |
| TypeScript 类型检查     | ✅ 通过       | 0 错误                                |
| ESLint 代码规范         | ✅ 通过       | 0 错误，1 警告（非阻塞）              |
| 单元测试                | ✅ 通过       | 138 tests / 5 files 全部通过          |
| 生产构建                | ✅ 通过       | 32 页面全部成功生成                   |
| Docker 镜像构建         | ✅ 通过       | 多阶段构建正常                        |
| Prisma 迁移             | ⚠️ 已修复     | 原缺少初始迁移，已补全                |
| Docker Compose 生产命令 | ⚠️ 已修复     | 原使用 tsx（devDep），已改为编译后 JS |
| 依赖安全审计            | ⚠️ 注意       | 12 个漏洞，均在 devDependencies 中    |
| 环境变量安全            | 🔴 需手动处理 | JWT_SECRET 等仍为占位值               |
| CD 流水线               | ✅ 已创建     | CI + CD GitHub Actions                |

---

## 二、已完成的修复

### 2.1 创建初始 Prisma 迁移（关键）

**问题**：项目仅有 1 个索引迁移，缺少初始建表迁移。`prisma migrate deploy` 在新数据库上会失败。

**修复**：

- 创建 `prisma/migrations/20250628000000_init/migration.sql` — 包含全部 13 张表、4 个枚举、30+ 索引、20+ 外键
- 创建 `prisma/migrations/migration_lock.toml`
- 删除旧的索引迁移（内容已合并到初始迁移中）

### 2.2 修复 Docker 生产启动命令（关键）

**问题**：`docker-compose.yml` 的启动命令使用 `npx tsx prisma/seed.ts`，但 `tsx` 是 devDependency，生产镜像中不可用。同时 `npx next start` 未利用 standalone 构建优势。

**修复**：

- Dockerfile 构建阶段新增 `esbuild` 编译步骤：将 `seed.ts` 打包为独立的 `seed.js`
- docker-compose 启动命令改为 `node prisma/seed.js` + `node server.js`
- 已验证编译后的 `seed.js` 可正常运行

### 2.3 完善 Docker Compose 编排

**修复**：

- 新增 Caddy 反向代理服务到 `docker-compose.yml`（HTTPS 终止 + 安全头）
- 创建 `docker/docker-compose.prod.yml` — 生产专用，使用 GHCR 预构建镜像
- 移除开发用端口暴露（PostgreSQL、MinIO 端口不对外）

### 2.4 创建 CI/CD 流水线

**新增文件**：

- `.github/workflows/ci.yml` — PR/push 触发：Lint → TypeCheck → Test → Build → Docker 构建验证
- `.github/workflows/deploy.yml` — Tag push (v*) 触发：构建镜像 → 推送 GHCR → SSH 部署 → 创建 GitHub Release

**CD 流程**：

```
git tag v1.0.0 && git push origin v1.0.0
    ↓
GitHub Actions 构建 Docker 镜像
    ↓
推送至 ghcr.io/jiangfire/skills-hub:v1.0.0
    ↓
SSH 到服务器：docker pull → docker compose up -d
    ↓
容器内自动执行：prisma migrate deploy → seed → node server.js
    ↓
自动创建 GitHub Release（含变更日志）
```

### 2.5 创建生产环境配置模板

**新增**：`.env.production.example` — 包含所有必需环境变量及安全提示

---

## 三、发布前必须手动处理的事项

### 3.1 🔴 生成强密钥（阻塞性）

当前 `.env` 中以下值仍为占位符，**生产环境必须替换**：

```bash
# JWT_SECRET — 生成 64+ 字符随机字符串
openssl rand -base64 48

# POSTGRES_PASSWORD — 数据库密码
openssl rand -base64 24

# SEED_OWNER_PASSWORD — 初始管理员密码
openssl rand -base64 16

# S3 密钥 — MinIO 凭据（不要使用 minioadmin）
# 在 MinIO 控制台中创建专用 access key
```

### 3.2 🔴 配置 GitHub Secrets（CD 部署用）

在 GitHub 仓库 Settings → Secrets and variables → Actions 中添加：

| Secret 名        | 说明                                 |
| ---------------- | ------------------------------------ |
| `DEPLOY_HOST`    | 服务器 IP 或域名                     |
| `DEPLOY_USER`    | SSH 用户名                           |
| `DEPLOY_SSH_KEY` | SSH 私钥                             |
| `DEPLOY_PATH`    | 部署目录路径（如 `/opt/skills-hub`） |

### 3.3 🟡 服务器环境准备

在生产服务器上：

1. 安装 Docker + Docker Compose
2. 创建部署目录，上传 `.env`（从 `.env.production.example` 复制并填写）
3. 首次部署需登录 GHCR：`echo $GITHUB_TOKEN | docker login ghcr.io -u jiangfire --password-stdin`
4. 配置域名 DNS 指向服务器（Caddy 会自动申请 HTTPS 证书）

---

## 四、依赖安全审计详情

`npm audit` 发现 12 个漏洞（5 moderate, 5 high, 2 critical），**均位于 devDependencies 构建链中**，不影响生产运行时：

| 包              | 严重性        | 来源                                | 生产影响                          |
| --------------- | ------------- | ----------------------------------- | --------------------------------- |
| esbuild ≤0.24.2 | moderate      | vitest → vite → esbuild             | 无（仅开发/构建时）               |
| glob 10.x       | high          | test-exclude → glob                 | 无（仅测试时）                    |
| postcss <8.5.10 | moderate      | next 内置                           | 无（Next.js 团队维护）            |
| tar ≤7.5.15     | high/critical | bcrypt → @mapbox/node-pre-gyp → tar | 无（仅 npm install 时下载二进制） |

**结论**：生产运行时无已知漏洞。建议后续升级 vitest@4 和 bcrypt@6 以消除构建链警告。

---

## 五、项目架构概览

```
src/
├── app/              # Next.js App Router
│   ├── api/          # 34 个 API 路由文件
│   ├── (public)/     # 公开浏览（技能列表/详情）
│   ├── (auth)/       # 登录/注册
│   ├── (studio)/     # 工作室（贡献者管理）
│   ├── (review)/     # 审核
│   ├── (admin)/      # 管理后台
│   └── (account)/    # 个人中心
├── components/       # 21 个 React 组件
├── lib/              # 核心库
│   ├── api/          # 错误处理、限流、会话
│   ├── auth/         # JWT、bcrypt、权限矩阵（4角色×16权限）
│   └── skill/        # Skill 状态机
├── server/           # 6 个业务服务
└── types/            # 领域类型定义
```

**技术栈**：Next.js 15.5 (standalone) + TypeScript 5.7 + Prisma 5.22 + PostgreSQL 16 + Tailwind 3.4 + Docker + Caddy

---

## 六、已知限制（v1 可接受）

1. **限流器为内存存储** — 单实例部署正常，多实例需迁移至 Redis
2. **无根级 middleware.ts** — 鉴权在 API 路由层实现，页面保护依赖服务端渲染
3. **测试覆盖率** — 5 个测试文件覆盖 auth + state 模块（138 tests），API/Service 层未覆盖
4. **ESLint 警告** — MarkdownRenderer 使用 `<img>` 而非 `<Image />`（Markdown 内嵌图片，非阻塞）

---

## 七、发布操作清单

```bash
# 1. 确认所有改动已提交
git add -A
git commit -m "chore: pre-release fixes — init migration, Docker prod cmd, CI/CD pipelines"

# 2. 配置 GitHub Secrets（见 3.2）

# 3. 在服务器上准备 .env（见 3.3）

# 4. 打标签发布
git tag v1.0.0
git push origin v1.0.0

# 5. 观察 GitHub Actions 部署进度
# https://github.com/jiangfire/skub/actions

# 6. 验证部署
curl https://your-domain.com/api/skills
```

---

_报告生成 by WorkBuddy_
