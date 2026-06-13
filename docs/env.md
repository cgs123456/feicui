# 环境变量说明

## 变量列表

| 变量名 | 类型 | 说明 | 开发环境默认值 | 生产环境默认值 |
|--------|------|------|---------------|---------------|
| `VITE_USE_MOCK` | `'true' \| 'false'` | 是否使用本地 Mock 数据。`true` 时所有 API 请求走 `src/mock/` 下的 JSON 数据，不发送真实网络请求 | `true` | `false` |
| `VITE_API_BASE_URL` | `string` | API 基础路径，会拼接到所有请求 URL 前面。开发时留空表示请求发往 Vite dev server 同源地址 | `''` | `/api` |

## 环境文件

项目使用 Vite 标准的多环境文件机制：

| 文件 | 何时加载 |
|------|---------|
| `.env.development` | 执行 `npm run dev` 时 |
| `.env.production` | 执行 `npm run build` 时 |

> Vite 不加载 `.env` 通用文件，如需添加可自行创建。

## 使用方式

代码中通过 `import.meta.env` 读取：

```typescript
const useMock = import.meta.env.VITE_USE_MOCK === 'true'
const baseURL = import.meta.env.VITE_API_BASE_URL || ''
```

## 开发模式（Mock）

1. 确保 `.env.development` 中 `VITE_USE_MOCK=true`
2. 运行 `npm run dev` 启动开发服务器
3. 所有 API 调用会命中 `src/api/` 中传入的 `mockFn`，返回 `src/mock/` 下的本地数据
4. 无需后端服务即可完整运行 C 端和 B 端流程

## 切换真实接口

1. 将 `.env.development` 中 `VITE_USE_MOCK` 改为 `false`
2. 设置 `VITE_API_BASE_URL` 为后端服务地址（如 `http://localhost:3000/api`）
3. 重启开发服务器
4. 后端需按 `ApiResponse<T>` 结构返回数据：

```json
{
  "code": 0,
  "data": { ... },
  "message": "success"
}
```

## 生产部署

1. `.env.production` 默认 `VITE_USE_MOCK=false`、`VITE_API_BASE_URL=/api`
2. 部署时通过 Nginx 反向代理将 `/api` 路径转发到后端服务
3. Token 通过 `Authorization: Bearer <token>` 请求头传递，401 响应自动跳转登录页

## 自定义变量

如需新增环境变量，注意：

- 变量名必须以 `VITE_` 前缀开头，否则 Vite 不会暴露给客户端代码
- 在 `src/api/http.ts` 或对应模块中通过 `import.meta.env.VITE_XXX` 读取
- 修改 `.env.*` 文件后需重启开发服务器
