# 舞蹈培训机构课时包管理应用设计文档

## 项目背景

舞蹈培训机构学员按课时包购买课程（如 40 节）。当前用纸质本子划课，易出现与家长对不上数、课时快用完时未及时发现等问题。需要一个小型 Web 应用，支持：

- 报名时为学员建立课时包；
- 每次上课老师签到扣 1 节；
- 扣错可撤销；
- 剩余不多时列表里能一眼看出；
- 家长可通过专属链接查看孩子剩余课时和上课记录。

## 决策记录

| 问题 | 决策 |
|---|---|
| 用户角色 | 选 **A**：一个共享管理员账号供老师/老板登录后台；家长不登录，靠专属链接查看。 |
| 数据存储 | 选 **A**：SQLite 单文件，一个 Docker 容器 + volume 即可部署。 |
| 课时包规则 | 选 **A**：通用课时包，不区分舞种/班级，签到统一扣 1 节。 |
| 有效期 | 选 **B**：统一从购买日起 12 个月有效期。 |
| 签到方式 | 选 **A**：老师逐个点名签到，一次扣 1 节。 |
| 低课时阈值 | 选 **A**：剩余 ≤ 5 节时标红/置顶提醒。 |
| 提醒方式 | 选 **A**：仅页面颜色提醒，本期不做短信/微信通知。 |
| 家长查询 | 选 **A**：每个学员一个专属链接/二维码，带随机码。 |
| 学员信息字段 | 选 **C**：姓名 + 家长手机号 + 备注/出生日期等。 |
| 课时包总数 | 选 **A**：固定选项 20/40/60 节（可配置）。 |
| 金额记录 | 选 **A**：不记录购买金额。 |
| 技术方案 | 选 **B**：Nuxt 3 + Drizzle ORM + better-sqlite3。 |

## 技术栈

- **Nuxt 3**：统一前端页面与 Nitro 后端 API。
- **Vue 3 + Tailwind CSS**：手机端优先的响应式界面。
- **Drizzle ORM + better-sqlite3**：类型安全的关系型数据操作与迁移。
- **bcryptjs**：管理员密码哈希。
- **nanoid**：生成不可猜测的家长专属查询码。
- **Docker**：单容器部署，数据通过 volume 持久化到宿主机。

## 数据模型

### `students`（学员）

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | INTEGER PK | 自增主键 |
| `name` | TEXT NOT NULL | 学员姓名 |
| `phone` | TEXT | 家长手机号 |
| `birthDate` | TEXT | 出生日期，格式 `YYYY-MM-DD` |
| `notes` | TEXT | 备注 |
| `shareToken` | TEXT UNIQUE NOT NULL | 家长查询页面随机码 |
| `createdAt` | INTEGER | 创建时间戳 |
| `updatedAt` | INTEGER | 更新时间戳 |

### `classPackages`（课时包）

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | INTEGER PK | 自增主键 |
| `studentId` | INTEGER FK | 所属学员 |
| `totalClasses` | INTEGER NOT NULL | 总课时数（20/40/60） |
| `usedClasses` | INTEGER DEFAULT 0 | 已用课时数 |
| `expiresAt` | INTEGER | 到期时间戳，购买日起 +12 个月 |
| `createdAt` | INTEGER | 创建时间戳 |

### `attendance`（上课记录）

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | INTEGER PK | 自增主键 |
| `studentId` | INTEGER FK | 学员 |
| `packageId` | INTEGER FK | 扣减的课时包 |
| `classDate` | TEXT | 上课日期，格式 `YYYY-MM-DD` |
| `cancelledAt` | INTEGER NULL | 撤销时间戳；NULL 表示有效记录 |
| `createdAt` | INTEGER | 创建时间戳 |

## 页面与流程

### 管理员后台

- **`/login`**：管理员登录页。
- **`/dashboard`**：学员/课时包总览。列表按剩余课时升序排列，剩余 ≤ 5 的标红，过期的标灰。
- **`/students/new`**：新增学员，同时创建第一个课时包。
- **`/students/:id`**：学员详情。展示个人信息、当前课时包、上课记录，并支持撤销某次签到。
- **`/checkin`**：签到页。默认当天日期，列出所有可签到学员，点击即扣 1 节。
- **`/settings`**：修改管理员密码、查看数据文件路径。

### 家长公开页面

- **`/p/:token`**：通过学员的 `shareToken` 查询。展示学员姓名、当前有效课时包剩余课时、到期时间、低课时提醒、上课历史（仅有效记录）。

## 核心逻辑

### 创建学员与课时包

1. 填写学员信息（姓名、手机号、出生日期、备注）。
2. 选择课时包规格（20/40/60 节）。
3. 生成 `shareToken`，创建 `classPackages` 记录，`expiresAt` = 当前时间 + 12 个月。

### 签到扣课时

1. 请求 `POST /api/attendance`。
2. 查找该学员满足 `expiresAt > now` 且 `usedClasses < totalClasses` 的课时包。
3. 若存在多个，按 `expiresAt` 最早的优先扣减。
4. 创建 `attendance` 记录，`classPackages.usedClasses` +1。
5. 若无可用课时包，返回错误提示。

### 撤销签到

1. 请求 `POST /api/attendance/:id/undo`。
2. 检查记录未撤销（`cancelledAt IS NULL`）。
3. 设置 `cancelledAt = now`。
4. 对应 `classPackages.usedClasses` -1。

### 低课时与过期提醒

- 剩余课时 = `totalClasses - usedClasses`。
- 在 `dashboard` 列表中：
  - 剩余 ≤ 5：红色高亮；
  - 已过期：灰色标注“已过期”。
- 家长页面同样显示低课时提示。

## 权限与安全

- 管理员通过环境变量 `ADMIN_PASSWORD` 设置初始密码，登录后使用 server-side session cookie。
- 后台路由使用 Nuxt 中间件保护，未登录跳 `/login`。
- 家长页面仅靠 `shareToken` 访问，不设置登录体系。`shareToken` 使用 nanoid 生成，保证不可猜测。
- SQLite 数据文件挂载在容器外，避免容器重建导致数据丢失。

## Docker 部署

### Dockerfile

- 基于 `node:20-alpine`。
- 使用 `pnpm` 安装依赖。
- 构建 Nuxt 生产包。
- 运行 `node .output/server/index.mjs`，监听 3000 端口。

### docker-compose.yml

- 单服务运行。
- 环境变量：`ADMIN_PASSWORD`。
- Volume 挂载：`class-records-data:/app/data`。
- 容器启动时自动执行数据库迁移。

### 备份

- 直接复制宿主机上的 SQLite 文件即可备份。

## 后续可扩展项（本期不做）

- 多老师账号与权限细分。
- 短信/微信续费提醒。
- 记录每个课时包的购买金额。
- 按班级/舞种绑定课时包。
- 上课记录导出为 Excel。

## 验收标准

- [ ] 能新增学员并创建课时包。
- [ ] 老师签到后学员剩余课时正确扣减。
- [ ] 扣错后可撤销，剩余课时恢复。
- [ ] 剩余 ≤ 5 节课时后台列表和家长页面有明显提示。
- [ ] 家长通过专属链接能看到剩余课时和历史记录。
- [ ] 能通过 `docker-compose up` 一键部署并持久化数据。
