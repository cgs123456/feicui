# 翡翠商城后端架构方案（docs/backend-design.md）

> 状态：已实施。本文档为 server/ 与前端接线的权威设计记录。

## 1. 参考项目调研结论

| 项目                                                                                                      | 栈                                | 借鉴点                                                                                                                                                                                                       |
| --------------------------------------------------------------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [newbee-ltd/newbee-mall-api](https://github.com/newbee-ltd/newbee-mall-api)（Spring Boot）                | 前后端分离商城后端                | 统一响应壳（ResultBean{resultCode,message,data}）、token 拦截器鉴权、订单状态机（待支付→已支付→出库→完成/关闭）、分页 PageResult——与本项目 `ApiResponse{code,data,message}` 契约同型，验证了契约形状的合理性 |
| [newbee-ltd/newbee-mall-api-go](https://github.com/newbee-ltd/newbee-mall-api-go)（Gin+MySQL）            | 同上镜像                          | 数据结构全镜像说明该接口面可平移到任意栈                                                                                                                                                                     |
| [SHESHKUMARMISHRA/nodejs-ecommerce-backend](https://github.com/SHESHKUMARMISHRA/nodejs-ecommerce-backend) | Express+Sequelize+SQLite+JWT+RBAC | 分层结构 routes/controllers/services/models、soft delete + timestamps、seeder 导入初始数据、角色隔离（Admin/Vendor ↔ 本项目买家/商家）                                                                       |

## 2. 技术选型（决策与理由）

- **Express 5 + TypeScript**：与前端语言统一；Express 5 异步错误自动进入错误中间件。路由仅简单 `:id` 参数，不触碰 path-to-regexp 变更面。
- **better-sqlite3**（不用 ORM）：契约只有十几个接口，引 Sequelize 是推测性抽象；SQLite 单文件零配置，同步 API 天然适合事务化库存操作。
- **jsonwebtoken**：成熟标准库；本项目无密码体系（手机号+验证码登录），不需要 bcrypt。
- **tsx**：server 的 TS 直接运行（dev watch / prod），不引入构建产物链。
- **cors**：dev 直连调试用；常规走 vite proxy 同源。

## 3. 目录结构（server/）

```
server/
├── package.json          # 独立 npm 项目（dev: tsx watch / start: tsx src/index.ts）
├── data/                 # jadeite.db（gitignore）
└── src/
    ├── index.ts          # 入口：装配 + 监听
    ├── app.ts            # express app（可测试，不监听端口）
    ├── db.ts             # better-sqlite3 初始化 + schema + seed（products.json 导入）
    ├── types.ts          # ApiResponse / 领域类型（镜像 src/types/models.ts）
    ├── middleware/auth.ts # JWT 解析：requireAuth（必须）/ optionalAuth（可选）
    ├── routes/
    │   ├── auth.ts       # POST /api/auth/sms、/api/auth/login
    │   ├── products.ts   # 商品 5 接口
    │   ├── orders.ts     # 订单 6 接口 + GET /api/orders/merchant
    │   └── addresses.ts  # 地址 CRUD 4 接口（契约补充，order-confirm.addressId 必需）
    └── services/
        ├── orders.ts     # 订单状态机 + 幂等 + 库存事务
        └── products.ts   # 商品查询/变更
```

## 4. 数据模型（5 表）

```sql
users(id TEXT PK, phone TEXT UNIQUE, role TEXT 'owner'|'buyer', nickname TEXT, created_at TEXT)
sms_codes(phone TEXT PK, code TEXT, expires_at INTEGER)   -- dev 万能码 1234 对齐前端 demo 语义
products(id TEXT PK, merchant_id TEXT, merchant_name TEXT,
         title, category, price REAL, original_price REAL, cover TEXT,
         images TEXT/*json*/, description, material, weight,
         cert_no, cert_org, cert_date, cert_grade, certificate TEXT/*json*/,
         stock INTEGER/*-1 不限*/, status TEXT 'active'|'sold'|'offshelf',
         views INTEGER, popularity INTEGER, inquiries INTEGER,
         created_at TEXT, updated_at TEXT)
addresses(id TEXT PK, user_id TEXT, name, phone, province, city, district, detail,
          full_address TEXT, is_default INTEGER /*默认互斥，删默认自动补位*/)
orders(id TEXT PK, order_no TEXT UNIQUE, buyer_id TEXT, status TEXT,
       total_price REAL, address TEXT/*json 快照*/, remark TEXT,
       items TEXT/*json: [{productId,title,cover,price,quantity}]*/,
       idempotent_key TEXT,
       refund_from_status TEXT, refund_reason TEXT, refund_time TEXT,
       pay_time TEXT, ship_time TEXT, complete_time TEXT,
       logistics_no TEXT, logistics_company TEXT,
       created_at TEXT, updated_at TEXT,
       UNIQUE(buyer_id, idempotent_key))  -- 幂等：重复提交返回首单，重启不丢
```

设计取舍：`items` 用 JSON 快照列而非关系表——契约 `Order.items` 就是快照数组（下单时价格快照），直接对齐前端模型避免二次映射；订单与商品通过 `items[].productId` 关联（商家订单过滤 join 之用）。

## 5. 接口清单（对齐 src/api/README.md 契约 + 接线必需补充）

| 方法/路径                                              | 说明                                                                                                                                         | 契约                            |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| POST /api/auth/sms                                     | 下发验证码（dev 直接返回 code）                                                                                                              | ✅ 契约                         |
| POST /api/auth/login                                   | {phone,code}→LoginResponse{success,user,token}；错码 code:1001；登录即 upsert 注册（任意 11 位手机号）；`['138','8888','6666']` → M001 owner | ✅ 契约                         |
| GET /api/products                                      | 全量商品列表（分页参数后端预留，seed 数据 10 条）                                                                                            | ✅ 契约                         |
| GET /api/products/:id                                  | 详情；404→code:404                                                                                                                           | ✅ 契约                         |
| POST /api/products                                     | 商家发布（auth: owner；merchantId 取自 token 用户）                                                                                          | ✅ 契约                         |
| PUT /api/products/:id                                  | 商家编辑→返回 Product                                                                                                                        | ✅ 契约                         |
| DELETE /api/products/:id                               | →{success:true}                                                                                                                              | ✅ 契约                         |
| POST /api/orders                                       | {items,addressId,remark,idempotentKey}→Order；事务内校验库存并扣减；UNIQUE 幂等                                                              | ✅ 契约                         |
| GET /api/orders                                        | 我的购买订单（status,page,pageSize→PaginatedResponse）                                                                                       | ✅ 契约                         |
| GET /api/orders/merchant                               | 本店售出订单（join items.productId→products.merchant_id 过滤）【接线补充】                                                                   | 补充                            |
| GET /api/orders/:id                                    | 详情（买家本人或本店商家可见）                                                                                                               | ✅ 契约                         |
| POST /api/orders/:id/pay                               | pending→paid                                                                                                                                 | ✅ 契约                         |
| POST /api/orders/:id/ship                              | paid→shipped（logisticsNo/logisticsCompany）                                                                                                 | ✅ 契约                         |
| POST /api/orders/:id/refund                            | {action:'apply'\|'approve'\|'reject', reason}——paid/shipped/completed 可退，记录 refundFromStatus；拒绝回退；批准→refunded 并回补库存        | ✅ 契约（合并三操作为动作参数） |
| GET/POST /api/addresses、PUT/DELETE /api/addresses/:id | 地址 CRUD（默认互斥）【契约补充，addressId 必需】                                                                                            | 补充                            |

错误码：0 成功；401 未登录/无效 token（前端 http.ts 已实现清 token 跳登录）；403 无权限（非本店资源）；404 不存在；1001 验证码错误；2000 参数错误；3000 业务冲突（状态机非法迁移/库存不足）；5000 服务器错误——与 http.ts 既有语义对齐。

## 6. 订单状态机（镜像 store 语义）

```
pending → paid → shipped → completed
   │(取消,canceled,回补库存)      │
   └── paid|shipped|completed ──→ refunding ──(批准)→ refunded(回补库存)
                                     └──(拒绝)→ refundFromStatus ?? 'shipped'
```

orderNo：`ORD + yyyyMMddHHmmssSSS + 4 位随机`（对齐前端 generateOrderNo）。扣库存条件：`stock != -1 AND stock >= qty`，事务内 `UPDATE ... SET stock = stock - ? WHERE id = ? AND (stock = -1 OR stock >= ?)`，affected=0 即库存不足。

## 7. 前端接线（已完成，mock 双轨已移除）

- 前端只保留真实后端一条数据链路：`VITE_USE_MOCK` 开关与 `src/utils/env.ts`、`src/mock/` mock 数据源均已删除；store 增删改查全部经 `src/api/` 调用 `/api/*`。
- `src/api/order.ts`（9 个订单函数，`/merchant` 分页壳在 api 层解包）、`src/api/address.ts`（5 函数）：全部走 http.ts（Bearer token、ApiResponse 校验）。
- store 接线：product（load/add/update/delete）、order（create 幂等键照传 / list / pay / ship / complete / refund / cancel）、address（CRUD + 设默认）、user（login 走 loginApi，token 交 http 层存储，线格式 user 映射为 UserInfo）。
- vite.config `server.proxy`：`/api → http://localhost:3001`；`.env.development` / `.env.production` 均只保留 `VITE_API_BASE_URL=/api`。

## 8. 边界决策（明确不上后端的部分）

- **购物车/收藏保持 localStorage**：两者是快照型个人偏好数据（Cart/Favorite 存 title/cover/price 快照），无跨端协同需求；对标 newbee-mall-vue3-app 同样放在本地状态。上服务端只会引入快照同步复杂度，无对应业务收益。
- **AI 匹配（aiMatch）保持前端**：纯规则引擎无状态，无数据面。

## 9. 验证计划

1. 后端自测：node 脚本/curl 打全 13+5 接口（含幂等重放、库存不足、状态机非法迁移、403 越权）。
2. 前端三连：eslint 0/0、vue-tsc -b、vitest 95/95。
3. e2e：playwright 51/51（自动拉起前后端与独立测试库 e2e.db）。
4. server 模式手测路径：登录→商品→下单（库存扣减）→支付→发货→退款→地址 CRUD。
