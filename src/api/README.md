# API 接口文档

> **当前状态：后端已实施（`server/`，契约以 `docs/backend-design.md` 为准）。** mock 模式（`VITE_USE_MOCK=true`）下数据流由 Pinia store 直连 mock/JSON 与 localStorage；server 模式（`false`）下 store 经本目录接口函数调用 `/api/*`，本目录即前后端契约层。`http.ts` 负责 token/超时/错误处理。

## 统一响应格式

所有接口返回 `ApiResponse<T>` 结构（`http.ts` 统一处理，mock 与真实 fetch 同一套校验）：

```typescript
interface ApiResponse<T> {
  code: number // 0=成功，非0=失败（http 层抛 ApiError）
  data: T // 业务数据
  message: string // 提示信息
}
```

## 环境变量

| 变量                | 说明               | 开发环境 | 生产环境                                            |
| ------------------- | ------------------ | -------- | --------------------------------------------------- |
| `VITE_USE_MOCK`     | 是否使用 Mock 数据 | `true`   | `false`（后端已实施，需同源部署或配置 `/api` 代理） |
| `VITE_API_BASE_URL` | API 基础路径       | `''`     | 接入后端时设置，如 `/api`                           |

## 实现状态矩阵

| 接口                                                             | 契约 | api 层实现                                                      | 调用方                        | 实际数据流                                                             |
| ---------------------------------------------------------------- | ---- | --------------------------------------------------------------- | ----------------------------- | ---------------------------------------------------------------------- |
| GET /products                                                    | ✅   | ✅（响应 `Product[]`，过滤/分页参数为后端预留，当前实现不接收） | 无                            | store 直连 products.json                                               |
| GET /products/:id                                                | ✅   | ✅（查无商品返回 code 404，与真实后端语义对齐）                 | 无                            | store.getProductById                                                   |
| POST /products                                                   | ✅   | ✅                                                              | 无                            | store.addProduct（api 层生成的 `P${Date.now()}` id 与 store 各自独立） |
| PUT /products/:id                                                | ✅   | ✅（响应更新后 Product）                                        | 无                            | store.updateProduct                                                    |
| DELETE /products/:id                                             | ✅   | ✅（响应 `{success}`）                                          | 无                            | store.deleteProduct                                                    |
| POST /auth/login                                                 | ✅   | ✅（验证码错误返回 code 1001）                                  | 无                            | store.login（本地校验）                                                |
| POST /auth/sms                                                   | ✅   | ✅                                                              | 无                            | 登录页本地模拟                                                         |
| POST /orders 等 9 个订单接口（含 /merchant、/complete、/cancel） | ✅   | ✅                                                              | store/order.ts（server 分支） | server 模式走后端事务（幂等键/库存扣减/退款状态机）                    |

## 商品接口

### 获取商品列表

- **路径**: `GET /products`
- **参数**: `keyword`, `category`, `material`, `priceMin`, `priceMax`, `status`, `sort`, `page`, `pageSize`（后端预留）
- **响应**: `Product[]`

### 获取商品详情

- **路径**: `GET /products/:id`
- **响应**: `Product`；404 时 `code: 404`（http 层抛 ApiError）

### 创建商品

- **路径**: `POST /products`
- **参数**: `CreateProductParams`
- **响应**: `Product`

### 更新商品

- **路径**: `PUT /products/:id`
- **参数**: `UpdateProductParams`
- **响应**: `Product`

### 删除商品

- **路径**: `DELETE /products/:id`
- **响应**: `{ success: boolean }`

## 用户接口

### 登录

- **路径**: `POST /auth/login`
- **参数**: `{ phone: string, code: string }`
- **响应**: `LoginResponse`（`{ success, user?, token? }`；验证码错误 `code: 1001`）

### 发送验证码

- **路径**: `POST /auth/sms`
- **参数**: `{ phone: string }`
- **响应**: `SendSmsCodeResponse`

## 订单接口（契约预留，api 层未实现）

- `POST /orders` — 参数 `CreateOrderParams`（`items[{productId,quantity}]` + `addressId`），响应 `Order`
- `GET /orders` — 参数 `status, page, pageSize`，响应 `PaginatedResponse<Order>`
- `GET /orders/:id` — 响应 `Order`
- `POST /orders/:id/pay` — 响应 `Order`
- `POST /orders/:id/ship` — 参数 `ShipOrderParams`（store 层当前不收物流参数，接入时需在 B 端补录）
- `POST /orders/:id/refund` — 参数 `RefundParams`，响应 `Order`

与 store 层参数的映射关系见 `src/api/types.ts` 注释。

## 对接后端说明

1. 后端按 `ApiResponse<T>` 结构返回数据，前端只需替换 store 内 mock 数据源为 api 层调用
2. 设置 `VITE_USE_MOCK=false` 并配置 `VITE_API_BASE_URL` 切换到真实接口
3. Token 通过 `Authorization: Bearer <token>` 请求头传递（`http.ts` 自动附带）
4. 401 响应自动清除 token 并跳转商家登录页
5. 非 0 `code` 统一抛 `ApiError`（mock 与真实模式行为一致），UI 层监听 `api-error` 事件展示
