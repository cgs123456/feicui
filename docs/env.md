# 环境变量说明

## 前端变量

| 变量名              | 类型     | 说明                                                                      | 开发环境默认值 | 生产环境默认值 |
| ------------------- | -------- | ------------------------------------------------------------------------- | -------------- | -------------- |
| `VITE_API_BASE_URL` | `string` | API 基础路径，拼接到所有请求 URL 前面。开发环境经 Vite 代理到后端 `:3001` | `/api`         | `/api`         |

## 环境文件

项目使用 Vite 标准的多环境文件机制：

| 文件               | 何时加载                |
| ------------------ | ----------------------- |
| `.env.development` | 执行 `npm run dev` 时   |
| `.env.production`  | 执行 `npm run build` 时 |

> Vite 不加载 `.env` 通用文件，如需添加可自行创建。

## 使用方式

代码中通过 `import.meta.env` 读取（见 `src/api/http.ts`）：

```typescript
const baseURL = import.meta.env.VITE_API_BASE_URL || ''
```

## 后端变量

| 变量名            | 类型     | 说明                                                                      | 默认值                                                              |
| ----------------- | -------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `PORT`            | `number` | 监听端口                                                                  | `3001`                                                              |
| `DB_PATH`         | `string` | SQLite 库文件路径（相对 `server/`），首次启动自动建表并 seed 商品数据     | `data/jadeite.db`                                                   |
| `JWT_SECRET`      | `string` | JWT 签名密钥；生产环境（`NODE_ENV=production`）必须显式设置，否则拒绝启动 | 开发环境回退 `jadeite-dev-secret`                                   |
| `ALLOWED_ORIGINS` | `string` | CORS 白名单，逗号分隔                                                     | `http://localhost:5173,http://localhost:5180,http://localhost:4173` |
| `NODE_ENV`        | `string` | `production` 时：短信验证码不再回传到响应、强制校验 `JWT_SECRET`          | —                                                                   |

## 本地开发

1. 终端 1：`cd server && npm install && npm run dev`（后端 `:3001`）
2. 终端 2：`npm install && npm run dev`（前端 `:5173`，`/api` 代理到 `:3001`）
3. 登录：手机号任意（未注册自动注册为买家），验证码万能码 `1234`；dev 模式点"发送验证码"会弹窗展示后端生成的验证码

## 生产部署

1. `npm run build` 产出 `dist/`（含 PWA service worker）
2. Nginx 将 `/api` 反向代理到后端服务（`server/` 目录 `npm start`）
3. 生产环境必须设置 `JWT_SECRET`；短信验证码不会出现在接口响应中，需接入真实短信通道
4. Token 通过 `Authorization: Bearer <token>` 请求头传递，401 响应自动清除并跳转登录页

后端统一响应结构：

```json
{
  "code": 0,
  "data": { ... },
  "message": "success"
}
```

## 自定义变量

如需新增环境变量，注意：

- 变量名必须以 `VITE_` 前缀开头，否则 Vite 不会暴露给客户端代码
- 在对应模块中通过 `import.meta.env.VITE_XXX` 读取
- 修改 `.env.*` 文件后需重启开发服务器
