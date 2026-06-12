<template>
  <div class="profile-page">
    <!-- Header -->
    <van-nav-bar title="我的" fixed :border="false" class="profile-navbar" />

    <!-- User Info Card -->
    <div class="user-card">
      <div class="user-card-top">
        <div class="avatar-wrap">
          <div class="avatar-circle">
            <van-icon v-if="!userStore.isLoggedIn" name="user-o" size="28" color="#ccc" />
            <span v-else class="avatar-text">{{ avatarText }}</span>
          </div>
        </div>
        <div class="user-info-text">
          <p class="user-name">
            {{ userStore.isLoggedIn ? userStore.userInfo.name : '翡翠爱好者' }}
          </p>
          <p class="user-phone" v-if="userStore.isLoggedIn">
            {{ maskedPhone }}
          </p>
        </div>
        <button
          v-if="!userStore.isLoggedIn"
          class="login-btn"
          aria-label="点击登录"
          @click="router.push('/login')"
        >
          点击登录
        </button>
      </div>
    </div>

    <!-- Menu List -->
    <div class="menu-card">
      <van-cell-group :border="false">
        <van-cell
          title="我的收藏"
          icon="star-o"
          is-link
          aria-label="我的收藏"
          @click="showFavorites = true"
        />
        <van-cell
          title="浏览记录"
          icon="clock-o"
          is-link
          aria-label="浏览记录"
          @click="showHistory = true"
        />
        <van-cell
          title="我的订单"
          icon="orders-o"
          is-link
          aria-label="我的订单"
          @click="showOrders = true"
        />
        <van-cell
          title="地址管理"
          icon="location-o"
          is-link
          aria-label="地址管理"
          @click="showAddress = true"
        />
        <van-cell
          title="设置"
          icon="setting-o"
          is-link
          aria-label="设置"
          @click="showSettings = true"
        />
      </van-cell-group>
    </div>

    <!-- 收藏列表弹窗 -->
    <van-popup
      v-model:show="showFavorites"
      position="bottom"
      round
      :style="{ height: '60vh' }"
      aria-label="我的收藏"
    >
      <div class="popup-header">
        <span class="popup-title">我的收藏 ({{ favorites.length }})</span>
        <van-icon name="cross" size="20" @click="showFavorites = false" />
      </div>
      <div class="popup-body" v-if="favorites.length > 0">
        <div
          v-for="item in favorites"
          :key="item.id"
          class="fav-item"
          @click="router.push('/products/' + item.id)"
        >
          <van-image :src="item.cover" width="60" height="60" fit="cover" radius="6" lazy-load />
          <div class="fav-info">
            <p class="fav-title">{{ item.title }}</p>
            <p class="fav-price">&yen;{{ formatPrice(item.price) }}</p>
          </div>
        </div>
      </div>
      <van-empty v-else description="暂无收藏" />
    </van-popup>

    <!-- 浏览记录弹窗 -->
    <van-popup
      v-model:show="showHistory"
      position="bottom"
      round
      :style="{ height: '60vh' }"
      aria-label="浏览记录"
    >
      <div class="popup-header">
        <span class="popup-title">浏览记录 ({{ history.length }})</span>
        <van-icon name="cross" size="20" @click="showHistory = false" />
      </div>
      <div class="popup-body" v-if="history.length > 0">
        <div
          v-for="item in history"
          :key="item.id"
          class="fav-item"
          @click="router.push('/products/' + item.id)"
        >
          <van-image :src="item.cover" width="60" height="60" fit="cover" radius="6" lazy-load />
          <div class="fav-info">
            <p class="fav-title">{{ item.title }}</p>
            <p class="fav-time">{{ item.viewTime }}</p>
          </div>
        </div>
      </div>
      <van-empty v-else description="暂无浏览记录" />
    </van-popup>

    <!-- 我的订单弹窗 -->
    <van-popup
      v-model:show="showOrders"
      position="bottom"
      round
      :style="{ height: '60vh' }"
      aria-label="我的订单"
    >
      <div class="popup-header">
        <span class="popup-title">我的订单 ({{ orders.length }})</span>
        <van-icon name="cross" size="20" @click="showOrders = false" />
      </div>
      <div class="popup-body" v-if="orders.length > 0">
        <div v-for="order in orders" :key="order.id" class="order-item">
          <div class="order-header">
            <span class="order-no">订单号：{{ order.orderNo }}</span>
            <van-tag :type="order.status === '已发货' ? 'success' : 'warning'" size="small">
              {{ order.status }}
            </van-tag>
          </div>
          <div class="order-product">
            <van-image :src="order.cover" width="56" height="56" fit="cover" radius="6" lazy-load />
            <div class="order-info">
              <p class="order-title">{{ order.title }}</p>
              <p class="order-price">&yen;{{ formatPrice(order.price) }}</p>
            </div>
          </div>
          <p class="order-time">{{ order.time }}</p>
        </div>
      </div>
      <van-empty v-else description="暂无订单" />
    </van-popup>

    <!-- 地址管理弹窗 -->
    <van-popup
      v-model:show="showAddress"
      position="bottom"
      round
      :style="{ height: '50vh' }"
      aria-label="地址管理"
    >
      <div class="popup-header">
        <span class="popup-title">地址管理</span>
        <van-icon name="cross" size="20" @click="showAddress = false" />
      </div>
      <div class="popup-body">
        <div v-for="addr in addresses" :key="addr.id" class="address-item">
          <div class="addr-header">
            <span class="addr-name">{{ addr.name }}</span>
            <span class="addr-phone">{{ addr.phone }}</span>
            <van-tag v-if="addr.isDefault" type="success" size="small">默认</van-tag>
          </div>
          <p class="addr-detail">{{ addr.fullAddress }}</p>
        </div>
        <van-empty v-if="addresses.length === 0" description="暂无地址" />
      </div>
    </van-popup>

    <!-- 设置弹窗 -->
    <van-popup
      v-model:show="showSettings"
      position="bottom"
      round
      :style="{ height: '40vh' }"
      aria-label="设置"
    >
      <div class="popup-header">
        <span class="popup-title">设置</span>
        <van-icon name="cross" size="20" @click="showSettings = false" />
      </div>
      <van-cell-group>
        <van-cell title="清除缓存" is-link @click="showToast('缓存已清除')" />
        <van-cell title="检查更新" is-link @click="showToast('已是最新版本')" />
        <van-cell title="意见反馈" is-link @click="showToast('感谢反馈')" />
      </van-cell-group>
    </van-popup>

    <!-- Logout -->
    <div v-if="userStore.isLoggedIn" class="logout-wrap">
      <button class="logout-btn" aria-label="退出登录" @click="handleLogout">退出登录</button>
    </div>
    <TabBar />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useUserStore } from '../../stores/user'
import mockProducts from '../../mock/products.json'
import TabBar from '../../components/TabBar.vue'

const router = useRouter()
const userStore = useUserStore()

const showFavorites = ref(false)
const showHistory = ref(false)
const showOrders = ref(false)
const showAddress = ref(false)
const showSettings = ref(false)

// 模拟收藏前3件商品
const favorites = ref(
  mockProducts.slice(0, 3).map(p => ({
    id: p.id,
    title: p.title,
    price: p.price,
    cover: p.cover
  }))
)

// 模拟浏览记录（后3件，不同时间）
const history = ref(
  [
    { ...mockProducts[3], viewTime: '今天 14:30' },
    { ...mockProducts[4], viewTime: '今天 10:15' },
    { ...mockProducts[5], viewTime: '昨天 16:42' },
    { ...mockProducts[6], viewTime: '6月9日 09:00' }
  ].map(p => ({ id: p.id, title: p.title, price: p.price, cover: p.cover, viewTime: p.viewTime }))
)

// 模拟订单
const orders = ref([
  {
    id: 'ORD001',
    orderNo: '202606120001',
    title: mockProducts[0].title,
    price: mockProducts[0].price,
    cover: mockProducts[0].cover,
    status: '已发货',
    time: '2026-06-12'
  },
  {
    id: 'ORD002',
    orderNo: '202606100002',
    title: mockProducts[1].title,
    price: mockProducts[1].price,
    cover: mockProducts[1].cover,
    status: '待发货',
    time: '2026-06-10'
  },
  {
    id: 'ORD003',
    orderNo: '202606050003',
    title: mockProducts[2].title,
    price: mockProducts[2].price,
    cover: mockProducts[2].cover,
    status: '已完成',
    time: '2026-06-05'
  }
])

// 模拟地址
const addresses = ref([
  {
    id: 'ADDR001',
    name: '张三',
    phone: '138****8888',
    fullAddress: '北京市朝阳区建国路88号翡翠大厦A座1201室',
    isDefault: true
  },
  {
    id: 'ADDR002',
    name: '张三',
    phone: '138****8888',
    fullAddress: '上海市浦东新区陆家嘴环路1000号恒生银行大厦32层',
    isDefault: false
  }
])

function formatPrice(price) {
  return (price || 0).toLocaleString()
}

const avatarText = computed(() => {
  const name = userStore.userInfo.name
  return name ? name.charAt(0) : '翡'
})

const maskedPhone = computed(() => {
  const phone = userStore.userInfo.phone
  if (!phone) return ''
  if (phone.length === 11) {
    return phone.slice(0, 3) + '****' + phone.slice(7)
  }
  return phone
})

function handleLogout() {
  userStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.profile-page {
  min-height: 100dvh;
  max-width: 430px;
  margin: 0 auto;
  background: #f5f5f5;
  padding-bottom: 50px;
}

.profile-navbar {
  --van-nav-bar-background: #fff;
  --van-nav-bar-title-font-size: 17px;
}

/* User Card */
.user-card {
  background: #fff;
  border-radius: 10px;
  margin: 12px 16px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.user-card-top {
  background: linear-gradient(135deg, #07c160 0%, #06a050 100%);
  padding: 32px 20px 28px;
  display: flex;
  align-items: center;
  gap: 14px;
}

.avatar-wrap {
  flex-shrink: 0;
}

.avatar-circle {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(255, 255, 255, 0.4);
}

.avatar-text {
  font-size: 22px;
  font-weight: 700;
  color: #fff;
}

.user-info-text {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 4px;
}

.user-phone {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
}

.login-btn {
  flex-shrink: 0;
  border: 1px solid rgba(255, 255, 255, 0.8);
  color: #fff;
  background: transparent;
  border-radius: 20px;
  padding: 6px 16px;
  font-size: 13px;
  cursor: pointer;
}

/* Menu Card */
.menu-card {
  background: #fff;
  border-radius: 10px;
  margin: 12px 16px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

:deep(.van-cell-group) {
  --van-cell-group-background: transparent;
}

:deep(.van-cell) {
  padding: 14px 16px;
  font-size: 15px;
  color: #333;
}

:deep(.van-cell::after) {
  border-color: #f5f5f5;
}

:deep(.van-cell__left-icon) {
  font-size: 20px;
  color: #666;
  margin-right: 10px;
}

/* Logout */
.logout-wrap {
  padding: 32px 16px;
  text-align: center;
}

.logout-btn {
  color: #ff4d4f;
  font-size: 15px;
  cursor: pointer;
  border: none;
  background: none;
}

/* Popup */
.popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #f5f5f5;
}

.popup-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.popup-body {
  padding: 0 16px;
  max-height: calc(60vh - 53px);
  overflow-y: auto;
}

.fav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  cursor: pointer;
  border-bottom: 1px solid #f5f5f5;
}

.fav-item:last-child {
  border-bottom: none;
}

.fav-info {
  flex: 1;
  min-width: 0;
}

.fav-title {
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fav-price {
  font-size: 15px;
  color: #ff4d4f;
  font-weight: 600;
}

.fav-time {
  font-size: 12px;
  color: #999;
}

/* Order */
.order-item {
  padding: 14px 0;
  border-bottom: 1px solid #f5f5f5;
}

.order-item:last-child {
  border-bottom: none;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.order-no {
  font-size: 12px;
  color: #999;
}

.order-product {
  display: flex;
  gap: 12px;
  align-items: center;
}

.order-info {
  flex: 1;
  min-width: 0;
}

.order-time {
  font-size: 12px;
  color: #999;
  margin-top: 8px;
  text-align: right;
}

/* Address */
.address-item {
  padding: 14px 0;
  border-bottom: 1px solid #f5f5f5;
}

.address-item:last-child {
  border-bottom: none;
}

.addr-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.addr-name {
  font-size: 15px;
  font-weight: 500;
  color: #333;
}

.addr-phone {
  font-size: 13px;
  color: #999;
}

.addr-detail {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
  margin: 0;
}
</style>
