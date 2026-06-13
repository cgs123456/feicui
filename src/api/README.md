# API 接口文档

## 统一响应格式

所有接口返回 `ApiResponse<T>` 结构：

```typescript
interface ApiResponse<T> {
  code: number    // 0=成功，非0=失败
  data: T         // 业务数据
  message: string // 提示信息
}
```

## 环境变量

| 变量 | 说明 | 开发环境 | 生产环境 |
|------|------|---------|---------|
| `VITE_USE_MOCK` | 是否使用 Mock 数据 | `true` | `false` |
| `VITE_API_BASE_URL` | API 基础路径 | `''` | `/api` |

## 商品接口

### 获取商品列表
- **路径**: `GET /products`
- **参数**: `keyword`, `category`, `material`, `priceMin`, `priceMax`, `status`, `sort`, `page`, `pageSize`
- **响应**: `PaginatedResponse<Product>`

### 获取商品详情
- **路径**: `GET /products/:id`
- **响应**: `Product`

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
- **响应**: `LoginResponse`

### 发送验证码
- **路径**: `POST /auth/sms`
- **参数**: `{ phone: string }`
- **响应**: `SendSmsCodeResponse`

## 订单接口

### 创建订单
- **路径**: `POST /orders`
- **参数**: `CreateOrderParams`
- **响应**: `Order`

### 获取订单列表
- **路径**: `GET /orders`
- **参数**: `status`, `page`, `pageSize`
- **响应**: `PaginatedResponse<Order>`

### 获取订单详情
- **路径**: `GET /orders/:id`
- **响应**: `Order`

### 支付订单
- **路径**: `POST /orders/:id/pay`
- **响应**: `Order`

### 发货
- **路径**: `POST /orders/:id/ship`
- **参数**: `ShipOrderParams`
- **响应**: `Order`

### 申请退款
- **路径**: `POST /orders/:id/refund`
- **参数**: `RefundParams`
- **响应**: `Order`

## 对接后端说明

1. 后端按 `ApiResponse<T>` 结构返回数据，前端无需修改
2. 设置 `VITE_USE_MOCK=false` 切换到真实接口
3. Token 通过 `Authorization: Bearer <token>` 请求头传递
4. 401 响应自动跳转登录页
