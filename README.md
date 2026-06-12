# 翡翠商城 (Jadeite Mall)

AI 驱动的翡翠珠宝电商平台，包含 **C 端 AI 匹配找货** 与 **B 端商家后台管理** 两大模块。适用于翡翠珠宝行业线上展示、AI 智能推荐、商家后台管理等场景。

## 功能列表

### C 端（买家端）

| 页面 | 路由 | 功能 |
|------|------|------|
| AI 聊天首页 | `/` | 输入需求或点击预设问题，AI 匹配翡翠商品 |
| 商品详情 | `/products/:id` | 查看商品图片、规格参数、详情描述，联系商家/立即购买 |
| 个人中心 | `/profile` | 收藏列表、浏览历史、订单管理、地址管理、设置 |
| 商品列表 | `/products` | 浏览全部商品 |

### B 端（商家端）

| 页面 | 路由 | 功能 |
|------|------|------|
| 登录 | `/login` | 手机号验证码登录 |
| 仪表盘 | `/dashboard` | 今日数据概览、快捷入口、最近消息 |
| 发布商品 | `/publish` | 4 步引导发布（基本信息→AI 生成→确认→发布） |
| AI 生成 | `/publish/ai` | 独立 AI 商品信息生成页 |
| 商品管理 | `/products` | 搜索筛选、上架/下架、编辑跳转 |
| 编辑商品 | `/products/:id/edit` | 修改商品全部字段 |
| 客资列表 | `/customers` | 客户消息列表，按时间/状态筛选 |
| 客资详情 | `/customers/:id` | 客户详情、对话记录、统计数据 |
| 账户权限 | `/account` | 修改密码、消息通知、隐私设置、关于/协议 |

### 路由守卫

商家后台页面（`/dashboard`、`/publish`、`/products`、`/customers`、`/account`）需要登录态，未登录自动跳转 `/login`。

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
| Vite PWA | 离线支持 |
| ESLint + Prettier | 代码规范 |

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
├── __tests__/          # 单元测试
│   ├── userStore.test.ts
│   └── productStore.test.ts
├── api/                # 接口请求层（当前为 Mock）
│   ├── product.ts        # 商品相关接口
│   └── user.ts           # 用户相关接口
├── assets/             # 静态资源
├── components/         # 公共组件
│   ├── AppNavbar.vue     # 顶部导航栏
│   ├── ChatBubble.vue    # AI 对话气泡
│   ├── CustomerCard.vue  # 客资卡片
│   ├── EmptyState.vue    # 空状态占位
│   ├── LoadingView.vue   # 加载中占位
│   ├── ProductCard.vue   # 商品卡片
│   ├── StatCard.vue      # 统计卡片
│   └── TabBar.vue        # 底部导航栏
├── composables/        # 组合式函数
│   ├── useLoading.ts     # 加载状态管理
│   └── useFormatPrice.ts # 价格格式化
├── mock/               # 静态 Mock 数据
│   ├── products.json
│   ├── customers.json
│   └── dashboard.json
├── pages/              # 页面组件（14 个页面）
├── router/             # 路由配置（含 404 兜底）
├── stores/             # Pinia 状态管理
├── styles/             # 全局样式
├── utils/              # 工具函数
│   └── format.ts         # 格式化工具
├── App.vue
├── main.ts
├── env.d.ts
└── types.d.ts
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

## 说明

- 本项目为前端 Demo，所有数据均为静态 Mock，不发起真实网络请求
- 验证码为前端模拟生成，登录测试码为弹窗中显示的 4 位数字
- 已配置 PWA 离线支持，构建后可通过 Service Worker 缓存静态资源
- 已配置无障碍属性（aria-label / role / tabindex），支持屏幕阅读器