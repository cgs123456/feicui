# 翡翠商城 (Jadeite Mall)

AI 驱动的翡翠珠宝电商平台，包含 **C 端 AI 匹配找货** 与 **B 端商家后台管理** 两大模块。

> 在线预览：https://feicui.vercel.app

## 原型理解

本项目将原型理解为 **"AI 找货 + 商家发布 + 客资转化"** 的双端闭环系统：

- **买家**通过自然语言描述预算、品类、用途，AI 解析需求并推荐翡翠商品
- 买家可查看商品详情、规格参数，完成下单购买流程
- **商家**登录后台发布商品、管理上下架、查看客户咨询
- 两端路由完全隔离（C 端 `/products`，B 端 `/merchant/*`），边界清晰

## 用户流程图

### C 端（买家端）

```
首页 AI 对话
  ├─ 输入需求（预算、品类、材质）
  ├─ AI 匹配推荐商品
  ├─ 点击商品 → 商品详情页
  │    ├─ 查看规格参数、证书
  │    ├─ 联系商家
  │    └─ 立即购买 → 订单确认 → 下单成功
  └─ 个人中心
       ├─ 我的收藏
       ├─ 浏览记录
       ├─ 我的订单
       ├─ 地址管理
       └─ 设置
```

### B 端（商家端）

```
商家登录
  └─ 仪表盘
       ├─ 数据概览（浏览、询价、订单、金额）
       ├─ 发布商品（4步引导：上传图片 → 填写信息 → AI生成 → 发布）
       ├─ 商品管理（搜索筛选、上架/下架、编辑）
       ├─ 客资管理（客户列表、详情、对话记录）
       └─ 账户权限（修改密码、通知、隐私设置）
```

## 测试账号

| 角色 | 手机号 | 验证码（任意4位或弹窗中显示） |
|------|--------|------------------------------|
| 商家 | 任意11位手机号 | 弹窗中显示的 4 位数字或 `1234` |

- 验证码为前端模拟生成，点击"发送验证码"后弹窗展示
- 输入 `1234` 也可通过验证（测试用）

## 项目亮点

1. **AI 翡翠顾问**：基于自然语言解析用户需求（预算、品类、材质、场景），加权评分匹配商品，给出推荐理由和匹配分
2. **双端路由隔离**：C 端 `/products` 与 B 端 `/merchant/*` 完全分离，路由守卫精准保护商家后台，C 端商品列表自动隐藏管理操作
3. **完整购买流程**：商品详情 → 订单确认 → 下单成功，流程闭环
4. **TypeScript 严格模式**：`strict: true`，所有页面组件 100% 使用 `lang="ts"` + 类型化 Props/Emits
5. **29 个单元测试**：覆盖用户登录、商品管理、AI 匹配（预算解析/品类匹配/推荐理由）、路由守卫等核心业务逻辑
6. **无障碍支持**：`aria-label`、`role`、`tabindex` 覆盖关键交互元素
7. **代码规范**：ESLint + Prettier + StyleLint + Husky + lint-staged
8. **CI/CD**：GitHub Actions 自动执行 lint、type-check、test、build
9. **PWA 离线支持**：完整 manifest 配置 + Service Worker 缓存策略

## 核心设计决策

### AI 匹配服务层 (`src/services/aiMatch.ts`)
```
用户输入 → parseUserRequirement() 结构化解析
  ├─ parseBudget()        → 预算（支持"5万""50000""2.5w"等格式）
  ├─ keywordMap           → 品类（手镯/戒指/吊坠/平安扣/项链）
  ├─ materialKeys         → 材质（玻璃种/冰种/糯种/帝王绿...）
  └─ sceneMap             → 场景（送礼/自用/收藏）
       ↓
matchProducts() 加权评分
  ├─ 品类匹配: 30分
  ├─ 材质匹配: 20分
  ├─ 预算匹配: 25分（超出预算自动排除）
  ├─ 场景加分: 5分
  └─ 仅匹配在售(status=active)商品
       ↓
getAIResponse() 生成AI回复 + 推荐理由列表
```

### C/B 双端隔离
- 路由层：C端 `/products` vs B端 `/merchant/products`
- 模板层：`isMerchant` 计算属性控制编辑/上下架按钮可见性
- 守卫层：仅拦截 `/merchant` 前缀，排除 `/merchant/login` 防死循环

## 功能列表

### C 端（买家端）

| 页面 | 路由 | 功能 |
|------|------|------|
| AI 聊天首页 | `/` | 输入需求或点击预设问题，AI 匹配翡翠商品并给出推荐理由 |
| 商品列表 | `/products` | 浏览全部商品 |
| 商品详情 | `/products/:id` | 查看图片、规格参数、详情描述，联系商家/立即购买 |
| 订单确认 | `/order/confirm?id=xxx` | 地址、商品、备注、价格明细，提交订单 |
| 下单成功 | `/order/success` | 订单编号、温馨提示、返回首页 |
| 个人中心 | `/profile` | 收藏、浏览历史、订单、地址、设置 |

### B 端（商家端）

| 页面 | 路由 | 功能 |
|------|------|------|
| 登录 | `/merchant/login` | 手机号验证码登录 |
| 仪表盘 | `/merchant/dashboard` | 今日数据概览、快捷入口、最近消息 |
| 发布商品 | `/merchant/publish` | 4 步引导发布（上传图片→填写信息→AI生成→发布） |
| AI 生成 | `/merchant/publish/ai` | 独立 AI 商品信息生成页 |
| 商品管理 | `/merchant/products` | 搜索筛选、上架/下架、编辑跳转 |
| 编辑商品 | `/merchant/products/:id/edit` | 修改商品全部字段 |
| 客资列表 | `/merchant/customers` | 客户消息列表，按时间/状态筛选 |
| 客资详情 | `/merchant/customers/:id` | 客户详情、对话记录、统计数据 |
| 账户权限 | `/merchant/account` | 修改密码、消息通知、隐私设置、关于/协议 |

### 路由守卫

B 端商家页面（`/merchant/*`）需要登录态，未登录自动跳转 `/merchant/login`。C 端页面（`/`、`/products`、`/profile`）无登录限制。

## 技术栈

| 技术 | 用途 |
|------|------|
| Vue 3 (Composition API) | 前端框架 |
| TypeScript | 类型安全 |
| Vite 5 | 构建工具 |
| Pinia | 状态管理 |
| Vue Router 4 | 路由管理 |
| Vant UI 4 | 移动端组件库 |
| Vitest | 单元测试 |
| Vite PWA | Service Worker 静态资源缓存 |
| ESLint + Prettier + StyleLint | 代码规范 |
| Husky + lint-staged | Git 提交规范 |

## 安装与运行

**环境要求：Node.js >= 18**

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview

# 代码格式化
npm run format

# 类型检查
npm run type-check

# 运行测试
npm run test

# 监听模式测试
npm run test:watch
```

开发服务器默认运行在 `http://localhost:5173`。

## 项目结构

```
src/
├── __tests__/          # 单元测试（29 个）
│   ├── aiMatch.test.ts     # AI 匹配逻辑测试
│   ├── routerGuard.test.ts # 路由守卫测试
│   ├── userStore.test.ts   # 用户状态测试
│   └── productStore.test.ts # 商品状态测试
├── api/                # 接口请求层（当前为 Mock）
│   ├── product.ts
│   └── user.ts
├── assets/             # 静态资源
├── components/         # 公共组件
│   ├── AppNavbar.vue
│   ├── ChatBubble.vue
│   ├── CustomerCard.vue
│   ├── EmptyState.vue
│   ├── LoadingView.vue
│   ├── ProductCard.vue
│   ├── StatCard.vue
│   └── TabBar.vue
├── composables/        # 组合式函数
│   ├── useLoading.ts
│   └── useFormatPrice.ts
├── mock/               # 静态 Mock 数据
│   ├── products.json
│   ├── customers.json
│   └── dashboard.json
├── pages/              # 页面组件（16 个页面）
│   ├── home/             # AI 对话首页
│   ├── product-detail/   # 商品详情
│   ├── product-list/     # 商品列表
│   ├── order-confirm/    # 订单确认
│   ├── order-success/    # 下单成功
│   ├── profile/          # 个人中心
│   ├── login/            # 商家登录
│   ├── dashboard/        # 商家仪表盘
│   ├── publish/          # 发布商品
│   ├── product-edit/     # 编辑商品
│   ├── customer-list/    # 客资列表
│   ├── customer-detail/  # 客资详情
│   ├── account/          # 账户权限
│   └── not-found/        # 404 页面
├── router/             # 路由配置（C 端 + B 端 + 路由守卫）
├── services/           # 业务逻辑层
│   └── aiMatch.ts        # AI 需求解析与商品匹配
├── stores/             # Pinia 状态管理
├── styles/             # 全局样式
├── utils/              # 工具函数
│   └── format.ts
├── App.vue
├── main.ts
├── env.d.ts
└── types.d.ts          # TypeScript 类型定义
```

## 部署说明

### Vercel / Netlify

1. 将项目推送到 GitHub
2. 在 Vercel/Netlify 中导入仓库
3. 构建命令：`npm run build`
4. 输出目录：`dist`
5. 框架预设：Vite

### 服务器部署

```bash
npm run build
# 将 dist/ 目录部署到 Nginx 等静态服务器
# SPA 需要配置 fallback 到 index.html
```

Nginx 示例配置：

```nginx
server {
    listen 80;
    server_name example.com;
    root /var/www/jadeite-mall/dist;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## 后续可扩展方向

- [ ] 接入真实 AI API（如 OpenAI / 文心一言）实现智能对话
- [ ] 后端 API 对接（用户认证、商品 CRUD、订单管理）
- [ ] 支付流程接入（微信支付 / 支付宝）
- [ ] 图片上传到 OSS
- [ ] 实时聊天（WebSocket）
- [ ] 商品 3D 展示
- [ ] 多语言支持

## 说明

- 本项目为前端 Demo，所有数据均为静态 Mock，不发起真实网络请求
- 验证码为前端模拟生成，登录测试码为弹窗中显示的 4 位数字或 `1234`
- 已接入 Service Worker 静态资源缓存能力
- 已配置无障碍属性（aria-label / role / tabindex），支持屏幕阅读器
- 商品状态统一使用英文（active/sold/offline），展示层转换为中文