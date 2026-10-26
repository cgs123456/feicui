# API 接口文档

> **后端已实施（`server/`）**，契约以 `docs/backend-design.md` 为准。本项目只有真实后端一条数据链路：store 经本目录接口函数调用 `/api/*`（开发环境由 Vite 代理到 `localhost:3001`），本目录即前后端契约层。`http.ts` 负责 token、超时与统一错误处理。

## 统一响应格式

所有接口返回 `ApiResponse<T>` 结构（`http.ts` 统一校验）：

```typescript
interface ApiResponse<T> {
  code: number // 0=成功，非0=失败（http 层抛 ApiError）
  data: T // 业务数据
  message: string // 提示信息
}
```

## 环境变量

| 变量                | 说明         | 开发环境                               | 生产环境                 |
| ------------------- | ------------ | -------------------------------------- | ------------------------ |
| `VITE_API_BASE_URL` | API 基础路径 | `/api`（Vite 代理到 `localhost:3001`） | `/api`（Nginx 反代后端） |

服务端变量（`PORT` / `JWT_SECRET` / `ALLOWED_ORIGINS` / `DB_PATH`）见 [docs/env.md](../../docs/env.md)。

## 接口矩阵

| 接口                                             | api 层实现                                     | 调用方                            | 说明                                              |
| ------------------------------------------------ | ---------------------------------------------- | --------------------------------- | ------------------------------------------------- |
| GET /products                                    | ✅（响应 `Product[]`，分页参数为后端预留）     | productStore.syncFromServer       | 全量商品，seed 自 `server/src/data/products.json` |
| GET /products/:id                                | ✅（查无商品返回 code 404，`showError:false`） | productStore / product-edit 页    |                                                   |
| POST /products                                   | ✅                                             | productStore.addProduct           | 仅 owner；含种水/颜色等全部字段                   |
| PUT /products/:id                                | ✅（响应更新后 Product）                       | productStore.updateProductInStore | 白名单字段部分更新                                |
| DELETE /products/:id                             | ✅（响应 `{success}`）                         | productStore.deleteProduct        | 仅 owner                                          |
| POST /auth/sms                                   | ✅                                             | 登录页 sendCode                   | dev 环境响应携带 `code` 便于联调                  |
| POST /auth/login                                 | ✅（验证码错误返回 code 1001）                 | userStore.login                   | 万能码 `1234`；登录即注册                         |
| GET /orders（分页）                              | ✅                                             | orderStore（买家侧）              | `PaginatedResponse<Order>`                        |
| GET /orders/merchant                             | ✅（api 层解包 `.list`）                       | orderStore（商家侧）              | 本店订单分页                                      |
| GET /orders/:id                                  | ✅（`showError:false`）                        | orderStore                        | 买家本人或本店商家可见                            |
| POST /orders                                     | ✅                                             | orderStore.createOrder            | 幂等键 `idempotentKey`，事务扣库存                |
| POST /orders/:id/pay / ship / complete           | ✅                                             | orderStore                        | 状态机推进，见下方"订单接口"                      |
| POST /orders/:id/refund                          | ✅（action: apply/approve/reject）             | orderStore                        | 审批仅本店商家                                    |
| POST /orders/:id/cancel                          | ✅                                             | orderStore                        | 仅待付款，取消回补库存                            |
| GET/POST/PUT/DELETE /addresses（+ /:id/default） | ✅                                             | addressStore                      | 默认地址互斥，删除后自动补位                      |

## 商品接口

### 获取商品列表

- **路径**: `GET /products`
- **参数**: `keyword`, `category`, `material`, `priceMin`, `priceMax`, `status`, `sort`, `page`, `pageSize`（后端预留，当前实现不接收）
- **响应**: `Product[]`

### 获取商品详情

- **路径**: `GET /products/:id`
- **响应**: `Product`；404 时 `code: 404`（http 层抛 ApiError）

### 创建商品

- **路径**: `POST /products`
- **参数**: `CreateProductParams`（title/price/cover 必填，种水/颜色/尺寸/证书等可选，`stock: -1` 表示不限库存）
- **响应**: `Product`

### 更新商品

- **路径**: `PUT /products/:id`
- **参数**: `UpdateProductParams`（部分更新，`status ∈ active|sold|offline`）
- **响应**: `Product`

### 删除商品

- **路径**: `DELETE /products/:id`
- **响应**: `{ success: boolean }`

## 用户接口

### 登录

- **路径**: `POST /auth/login`
- **参数**: `{ phone: string, code: string }`
- **响应**: `LoginResponse`（`{ success, user, token }`；验证码错误 `code: 1001`；`user` 为线格式 `{ id, phone, role, nickname? }`）

### 发送验证码

- **路径**: `POST /auth/sms`
- **参数**: `{ phone: string }`
- **响应**: `SendSmsCodeResponse`（仅非生产环境回传 `{ code }`；同号 60 秒限流）

## 订单接口

- `POST /orders` — 参数 `CreateOrderParams`（`items[{productId,quantity}]` + `addressId` + 可选 `remark`/`idempotentKey`），响应 `Order`；重复提交同幂等键返回首单
- `GET /orders` — 参数 `status, page, pageSize`，响应 `PaginatedResponse<Order>`（买家本人订单）
- `GET /orders/merchant` — 响应 `PaginatedResponse<Order>`（本店订单）
- `GET /orders/:id` — 响应 `Order`
- `POST /orders/:id/pay` — 待付款 → 待发货；买家本人或本店商家
- `POST /orders/:id/ship` — 参数 `ShipOrderParams`（`logisticsNo`/`logisticsCompany`）；仅本店商家
- `POST /orders/:id/complete` — 待收货 → 已完成；买家本人或本店商家
- `POST /orders/:id/refund` — 参数 `RefundParams`（`action: apply|approve|reject` + `reason?`），响应 `Order`；申请仅买家，审批仅本店商家
- `POST /orders/:id/cancel` — 仅待付款可取消，回补库存

与 store 层参数的映射关系见 `src/api/types.ts` 注释。

## 错误处理约定

1. Token 通过 `Authorization: Bearer <token>` 请求头传递（`http.ts` 自动附带，localStorage 持久化 7 天）
2. HTTP 401 或响应体 `code: 401` 自动清除 token 并跳转商家登录页
3. 非 0 `code` 统一抛 `ApiError`，UI 层监听 `api-error` 事件展示；传 `{ showError: false }` 可静默（用于 404 详情回退等场景）
4. 网络/超时错误以 `code: -1` 抛出，默认超时 10 秒
