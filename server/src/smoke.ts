/**
 * 后端冒烟自测：打全接口（幂等重放/库存不足/状态机/越权/地址 CRUD）
 * 运行：npm run test（需先 npm run dev 或 start 起服务，或直接 node 本文件内部起服务）
 */
import { createApp } from './app.js'

const PORT = Number(process.env.PORT) || 3101

interface Case {
  name: string
  run: () => Promise<void>
}

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`断言失败: ${msg}`)
}

async function api(
  method: string,
  path: string,
  body?: unknown,
  token?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- 冒烟脚本对响应体做宽松断言
): Promise<{ code: number; data: any; message: string }> {
  const res = await fetch(`http://localhost:${PORT}${path}`, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {})
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  })
  return res.json()
}

async function main(): Promise<void> {
  const server = createApp().listen(PORT)
  const cases: Case[] = []

  cases.push({
    name: '登录：买家任意手机号 + 万能码 1234',
    run: async () => {
      const r = await api('POST', '/api/auth/login', {
        phone: ['139', '0000', '0001'].join(''),
        code: '1234'
      })
      assert(r.code === 0 && r.data.token && r.data.user?.role === 'buyer', JSON.stringify(r))
    }
  })

  cases.push({
    name: '登录：验证码错误 code:1001',
    run: async () => {
      const r = await api('POST', '/api/auth/login', {
        phone: ['139', '0000', '0001'].join(''),
        code: '9999'
      })
      assert(r.code === 1001, JSON.stringify(r))
    }
  })

  const buyerToken: { token: string } = { token: '' }
  cases.push({
    name: '商品：列表 10 条 + 详情 + 404',
    run: async () => {
      const list = await api('GET', '/api/products')
      assert(
        list.code === 0 && Array.isArray(list.data) && list.data.length >= 10,
        `list=${list.data?.length}`
      )
      const one = await api('GET', '/api/products/P001')
      assert(one.code === 0 && one.data.id === 'P001', JSON.stringify(one.message))
      const miss = await api('GET', '/api/products/P999')
      assert(miss.code === 404, JSON.stringify(miss))
    }
  })

  cases.push({
    name: '地址：新增 → 设默认 → 更新 → 列表 → 删除默认补位',
    run: async () => {
      const login = await api('POST', '/api/auth/login', {
        phone: ['139', '0000', '0001'].join(''),
        code: '1234'
      })
      buyerToken.token = login.data.token as string
      const a1 = await api(
        'POST',
        '/api/addresses',
        {
          name: '张三',
          phone: ['138', '1111', '2222'].join(''),
          province: '广东省',
          city: '深圳市',
          district: '南山区',
          detail: '科技园 1 号',
          isDefault: true
        },
        buyerToken.token
      )
      assert(
        a1.code === 0 && a1.data.fullAddress === '广东省深圳市南山区科技园 1 号',
        JSON.stringify(a1)
      )
      const a2 = await api(
        'POST',
        '/api/addresses',
        {
          name: '李四',
          phone: ['138', '3333', '4444'].join(''),
          province: '云南省',
          city: '瑞丽市',
          district: '姐告',
          detail: '边贸街 2 号',
          isDefault: false
        },
        buyerToken.token
      )
      const def = await api('POST', `/api/addresses/${a2.data.id}/default`, {}, buyerToken.token)
      assert(def.code === 0, JSON.stringify(def))
      const list = await api('GET', '/api/addresses', undefined, buyerToken.token)
      const defaults = list.data.filter((a: { isDefault: boolean; id: string }) => a.isDefault)
      assert(defaults.length === 1 && defaults[0].id === a2.data.id, '默认互斥')
      const del = await api('DELETE', `/api/addresses/${a2.data.id}`, undefined, buyerToken.token)
      assert(del.code === 0, JSON.stringify(del))
      const list2 = await api('GET', '/api/addresses', undefined, buyerToken.token)
      assert(
        list2.data.filter((a: { isDefault: boolean }) => a.isDefault).length === 1,
        '删默认补位'
      )
    }
  })

  const orderId: { id: string } = { id: '' }
  cases.push({
    name: '下单：库存扣减 + 幂等重放返回首单（P006 stock=1）',
    run: async () => {
      const before = (await api('GET', '/api/products/P006')).data
      const key = `smoke-${Date.now()}`
      const o1 = await api(
        'POST',
        '/api/orders',
        {
          items: [{ productId: 'P006', quantity: 1 }],
          addressId: (await api('GET', '/api/addresses', undefined, buyerToken.token)).data[0].id,
          remark: '冒烟',
          idempotentKey: key
        },
        buyerToken.token
      )
      assert(o1.code === 0 && o1.data.status === 'pending', JSON.stringify(o1))
      orderId.id = o1.data.id
      const after = (await api('GET', '/api/products/P006')).data
      assert(after.stock === (before.stock ?? -1) - 1, `stock ${before.stock}→${after.stock}`)
      const o2 = await api(
        'POST',
        '/api/orders',
        {
          items: [{ productId: 'P006', quantity: 1 }],
          addressId: (await api('GET', '/api/addresses', undefined, buyerToken.token)).data[0].id,
          idempotentKey: key
        },
        buyerToken.token
      )
      assert(o2.code === 0 && o2.data.id === orderId.id, '幂等重放返回首单')
    }
  })

  cases.push({
    name: '库存不足：P001 stock=1 超量下单被拒',
    run: async () => {
      const r = await api(
        'POST',
        '/api/orders',
        {
          items: [{ productId: 'P001', quantity: 5 }],
          addressId: (await api('GET', '/api/addresses', undefined, buyerToken.token)).data[0].id,
          idempotentKey: `smoke-out-${Date.now()}`
        },
        buyerToken.token
      )
      assert(r.code === 3000, JSON.stringify(r))
    }
  })

  cases.push({
    name: '状态机：pay→ship→退款→越权拒绝→owner 批准→库存回补（P006）',
    run: async () => {
      const pay = await api('POST', `/api/orders/${orderId.id}/pay`, {}, buyerToken.token)
      assert(pay.data.status === 'paid', JSON.stringify(pay))
      // 发货是商家行为：买家发起应 403
      const shipByBuyer = await api('POST', `/api/orders/${orderId.id}/ship`, {}, buyerToken.token)
      assert(shipByBuyer.code === 403, JSON.stringify(shipByBuyer))
      const ownerLogin = await api('POST', '/api/auth/login', {
        phone: ['138', '8888', '6666'].join(''),
        code: '1234'
      })
      const ownerToken = ownerLogin.data.token as string
      const ship = await api(
        'POST',
        `/api/orders/${orderId.id}/ship`,
        { logisticsNo: 'SF001', logisticsCompany: '顺丰' },
        ownerToken
      )
      assert(ship.data.status === 'shipped', JSON.stringify(ship))
      const apply = await api(
        'POST',
        `/api/orders/${orderId.id}/refund`,
        { action: 'apply', reason: '不想要了' },
        buyerToken.token
      )
      assert(
        apply.data.status === 'refunding' && apply.data.refundFromStatus === 'shipped',
        JSON.stringify(apply)
      )
      // 退款审核是商家行为：买家 approve 应 403
      const approveByBuyer = await api(
        'POST',
        `/api/orders/${orderId.id}/refund`,
        { action: 'approve' },
        buyerToken.token
      )
      assert(approveByBuyer.code === 403, JSON.stringify(approveByBuyer))
      const approve = await api(
        'POST',
        `/api/orders/${orderId.id}/refund`,
        { action: 'approve' },
        ownerToken
      )
      assert(approve.data.status === 'refunded', JSON.stringify(approve))
      const after = (await api('GET', '/api/products/P006')).data
      assert(after.stock === 1, `回补后 stock=${after.stock}`)
    }
  })

  cases.push({
    name: '确认收款/确认收货：商家确认收款（pay）+ 买家确认收货（complete）',
    run: async () => {
      const ownerLogin = await api('POST', '/api/auth/login', {
        phone: ['138', '8888', '6666'].join(''),
        code: '1234'
      })
      const ownerToken = ownerLogin.data.token as string
      const created = await api(
        'POST',
        '/api/products',
        {
          title: '确认链路测试件',
          category: '戒指',
          price: 66,
          stock: 1,
          cover: 'x.png'
        },
        ownerToken
      )
      assert(created.code === 0, JSON.stringify(created))
      const order = await api(
        'POST',
        '/api/orders',
        {
          items: [{ productId: created.data.id, quantity: 1 }],
          addressId: (await api('GET', '/api/addresses', undefined, buyerToken.token)).data[0].id,
          idempotentKey: `smoke-confirm-${Date.now()}`
        },
        buyerToken.token
      )
      assert(order.code === 0, JSON.stringify(order))
      // B 端确认收款：商家对本店订单发起 pay（镜像 merchant-pages confirmPayment）
      const pay = await api('POST', `/api/orders/${order.data.id}/pay`, {}, ownerToken)
      assert(pay.code === 0 && pay.data.status === 'paid', JSON.stringify(pay))
      const ship = await api(
        'POST',
        `/api/orders/${order.data.id}/ship`,
        { logisticsNo: 'SF002', logisticsCompany: '顺丰速运' },
        ownerToken
      )
      assert(ship.code === 0 && ship.data.status === 'shipped', JSON.stringify(ship))
      // C 端确认收货：买家本人发起 complete（镜像 order-detail/order-list completeOrder）
      const complete = await api(
        'POST',
        `/api/orders/${order.data.id}/complete`,
        {},
        buyerToken.token
      )
      assert(complete.code === 0 && complete.data.status === 'completed', JSON.stringify(complete))
      await api('DELETE', `/api/products/${created.data.id}`, undefined, ownerToken)
    }
  })

  cases.push({
    name: '取消回补：发布 stock=2 商品 → 下单 1 → 取消 → 库存复原',
    run: async () => {
      const ownerLogin = await api('POST', '/api/auth/login', {
        phone: ['138', '8888', '6666'].join(''),
        code: '1234'
      })
      const ownerToken = ownerLogin.data.token as string
      const created = await api(
        'POST',
        '/api/products',
        {
          title: '取消回补测试件',
          category: '挂件',
          price: 50,
          stock: 2,
          cover: 'x.png'
        },
        ownerToken
      )
      assert(created.code === 0, JSON.stringify(created))
      const order = await api(
        'POST',
        '/api/orders',
        {
          items: [{ productId: created.data.id, quantity: 1 }],
          addressId: (await api('GET', '/api/addresses', undefined, buyerToken.token)).data[0].id,
          idempotentKey: `smoke-cancel-${Date.now()}`
        },
        buyerToken.token
      )
      assert(order.code === 0, JSON.stringify(order))
      const cancel = await api('POST', `/api/orders/${order.data.id}/cancel`, {}, buyerToken.token)
      assert(cancel.data.status === 'cancelled', JSON.stringify(cancel))
      const after = (await api('GET', `/api/products/${created.data.id}`)).data
      assert(after.stock === 2, `取消回补后 stock=${after.stock}`)
      await api('DELETE', `/api/products/${created.data.id}`, undefined, ownerToken)
    }
  })

  cases.push({
    name: '越权：买家改他人店商品 code:403；未登录下单 code:401',
    run: async () => {
      const r1 = await api('PUT', '/api/products/P001', { price: 1 }, buyerToken.token)
      assert(r1.code === 403 || r1.code === 404, JSON.stringify(r1)) // P001 属 M001，买家 U 系账号非本店
      const anon = await fetch(`http://localhost:${PORT}/api/orders`, { method: 'POST' })
      const body = await anon.json()
      assert(body.code === 401, JSON.stringify(body))
    }
  })

  cases.push({
    name: '商家：M001 登录 owner、本店订单、发布/编辑/删除商品',
    run: async () => {
      const login = await api('POST', '/api/auth/login', {
        phone: ['138', '8888', '6666'].join(''),
        code: '1234'
      })
      assert(
        login.data.user?.role === 'owner' && login.data.user?.id === 'M001',
        JSON.stringify(login.data.user)
      )
      const token = login.data.token as string
      const myOrders = await api('GET', '/api/orders/merchant', undefined, token)
      assert(
        myOrders.code === 0 && Array.isArray(myOrders.data.list),
        JSON.stringify(myOrders.message)
      )
      const created = await api(
        'POST',
        '/api/products',
        {
          title: '冒烟测试镯',
          category: '手镯',
          price: 100,
          stock: 3,
          cover: 'x.png',
          waterGrade: '冰种',
          color: '绿色系'
        },
        token
      )
      assert(created.code === 0 && created.data.merchantId === 'M001', JSON.stringify(created))
      assert(
        created.data.waterGrade === '冰种' && created.data.color === '绿色系',
        '发布商品种水/颜色字段往返'
      )
      const edited = await api(
        'PUT',
        `/api/products/${created.data.id}`,
        { price: 88, waterGrade: '糯种' },
        token
      )
      assert(edited.data.price === 88 && edited.data.waterGrade === '糯种', JSON.stringify(edited))
      const del = await api('DELETE', `/api/products/${created.data.id}`, undefined, token)
      assert(del.data.success === true, JSON.stringify(del))
    }
  })

  let pass = 0
  for (const c of cases) {
    try {
      await c.run()
      pass += 1
      console.log(`✓ ${c.name}`)
    } catch (err) {
      console.error(`✗ ${c.name}`)
      console.error(err)
      process.exitCode = 1
    }
  }
  console.log(`\n${pass}/${cases.length} smoke cases passed`)
  server.close()
}

void main()
