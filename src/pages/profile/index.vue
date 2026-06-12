<template>
  <div class="profile-page">
    <van-nav-bar title="我的" fixed :border="false" class="profile-navbar" />

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
          <p class="user-phone" v-if="userStore.isLoggedIn">{{ maskedPhone }}</p>
        </div>
        <button v-if="!userStore.isLoggedIn" class="login-btn" @click="router.push('/merchant/login')">
          点击登录
        </button>
      </div>
    </div>

    <!-- 订单入口 -->
    <div class="menu-card">
      <div class="order-entry">
        <div class="order-entry-header" @click="router.push('/orders')">
          <span class="entry-title">我的订单</span>
          <span class="entry-all">全部 <van-icon name="arrow" /></span>
        </div>
        <div class="order-status-row">
          <div class="order-status-item" @click="router.push('/orders?status=pending')">
            <van-icon name="balance-pay" size="24" color="#333" />
            <span>待付款</span>
            <span v-if="orderStatusCount.pending" class="status-badge">{{ orderStatusCount.pending }}</span>
          </div>
          <div class="order-status-item" @click="router.push('/orders?status=paid')">
            <van-icon name="logistics" size="24" color="#333" />
            <span>待发货</span>
            <span v-if="orderStatusCount.paid" class="status-badge">{{ orderStatusCount.paid }}</span>
          </div>
          <div class="order-status-item" @click="router.push('/orders?status=shipped')">
            <van-icon name="send-gift-o" size="24" color="#333" />
            <span>待收货</span>
            <span v-if="orderStatusCount.shipped" class="status-badge">{{ orderStatusCount.shipped }}</span>
          </div>
          <div class="order-status-item" @click="router.push('/orders?status=completed')">
            <van-icon name="checked" size="24" color="#333" />
            <span>已完成</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Menu List -->
    <div class="menu-card">
      <van-cell-group :border="false">
        <van-cell title="我的收藏" icon="star-o" is-link :value="`${favoriteStore.favorites.length}件`" @click="router.push('/favorites')" />
        <van-cell title="购物车" icon="cart-o" is-link :value="`${cartStore.totalCount}件`" @click="router.push('/cart')" />
        <van-cell title="地址管理" icon="location-o" is-link @click="showAddress = true" />
        <van-cell title="设置" icon="setting-o" is-link @click="showSettings = true" />
      </van-cell-group>
    </div>

    <!-- 地址管理弹窗 -->
    <van-popup v-model:show="showAddress" position="bottom" round :style="{ height: '50vh' }" aria-label="地址管理">
      <div class="popup-header">
        <span class="popup-title">地址管理</span>
        <van-icon name="cross" size="20" @click="showAddress = false" />
      </div>
      <div class="popup-body">
        <div v-for="addr in addresses" :key="addr.id" class="address-item">
          <div class="addr-header">
            <span class="addr-name">{{ addr.name }}</span>
            <span class="addr-phone">{{ addr.phone }}</span>
            <van-tag v-if="addr.isDefault" type="success">默认</van-tag>
          </div>
          <p class="addr-detail">{{ addr.fullAddress }}</p>
        </div>
        <van-empty v-if="addresses.length === 0" description="暂无地址" />
      </div>
    </van-popup>

    <!-- 设置弹窗 -->
    <van-popup v-model:show="showSettings" position="bottom" round :style="{ height: '40vh' }" aria-label="设置">
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

    <div v-if="userStore.isLoggedIn" class="logout-wrap">
      <button class="logout-btn" @click="handleLogout">退出登录</button>
    </div>
    <TabBar />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useUserStore } from '../../stores/user'
import { useCartStore } from '../../stores/cart'
import { useFavoriteStore } from '../../stores/favorite'
import { useOrderStore } from '../../stores/order'
import TabBar from '../../components/TabBar.vue'

const router = useRouter()
const userStore = useUserStore()
const cartStore = useCartStore()
const favoriteStore = useFavoriteStore()
const orderStore = useOrderStore()

const showAddress = ref(false)
const showSettings = ref(false)

const orderStatusCount = computed(() => {
  const userId = userStore.userInfo.id || 'U001'
  const userOrders = orderStore.getOrdersByUser(userId)
  return {
    pending: userOrders.filter(o => o.status === 'pending').length,
    paid: userOrders.filter(o => o.status === 'paid').length,
    shipped: userOrders.filter(o => o.status === 'shipped').length,
    completed: userOrders.filter(o => o.status === 'completed').length
  }
})

const addresses = ref([
  { id: 'ADDR001', name: '张三', phone: '138****8888', fullAddress: '北京市朝阳区建国路88号翡翠大厦A座1201室', isDefault: true },
  { id: 'ADDR002', name: '张三', phone: '138****8888', fullAddress: '上海市浦东新区陆家嘴环路1000号恒生银行大厦32层', isDefault: false }
])

const avatarText = computed(() => {
  const name = userStore.userInfo.name
  return name ? name.charAt(0) : '翡'
})

const maskedPhone = computed(() => {
  const phone = userStore.userInfo.phone
  if (!phone) return ''
  if (phone.length === 11) return phone.slice(0, 3) + '****' + phone.slice(7)
  return phone
})

function handleLogout() {
  userStore.logout()
  router.push('/merchant/login')
}
</script>

<style scoped>
.profile-page { min-height: 100dvh; max-width: 430px; margin: 0 auto; background: #f5f5f5; padding-bottom: 50px; }
.profile-navbar { --van-nav-bar-background: #fff; --van-nav-bar-title-font-size: 17px; }

.user-card { background: #fff; border-radius: 10px; margin: 12px 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
.user-card-top { background: linear-gradient(135deg, #07c160 0%, #06a050 100%); padding: 32px 20px 28px; display: flex; align-items: center; gap: 14px; }
.avatar-wrap { flex-shrink: 0; }
.avatar-circle { width: 60px; height: 60px; border-radius: 50%; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; border: 2px solid rgba(255,255,255,0.4); }
.avatar-text { font-size: 22px; font-weight: 700; color: #fff; }
.user-info-text { flex: 1; min-width: 0; }
.user-name { font-size: 18px; font-weight: 600; color: #fff; margin-bottom: 4px; }
.user-phone { font-size: 13px; color: rgba(255,255,255,0.8); }
.login-btn { flex-shrink: 0; border: 1px solid rgba(255,255,255,0.8); color: #fff; background: transparent; border-radius: 20px; padding: 6px 16px; font-size: 13px; cursor: pointer; }

.menu-card { background: #fff; border-radius: 10px; margin: 12px 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }

.order-entry { padding: 16px; }
.order-entry-header { display: flex; justify-content: space-between; align-items: center; cursor: pointer; margin-bottom: 16px; }
.entry-title { font-size: 16px; font-weight: 600; color: #333; }
.entry-all { font-size: 13px; color: #999; display: flex; align-items: center; gap: 2px; }
.order-status-row { display: flex; justify-content: space-around; }
.order-status-item { display: flex; flex-direction: column; align-items: center; gap: 6px; font-size: 12px; color: #666; cursor: pointer; position: relative; }
.status-badge { position: absolute; top: -6px; right: -8px; min-width: 16px; height: 16px; border-radius: 8px; background: #ff4d00; color: #fff; font-size: 10px; display: flex; align-items: center; justify-content: center; padding: 0 4px; }

:deep(.van-cell-group) { --van-cell-group-background: transparent; }
:deep(.van-cell) { padding: 14px 16px; font-size: 15px; color: #333; }
:deep(.van-cell::after) { border-color: #f5f5f5; }
:deep(.van-cell__left-icon) { font-size: 20px; color: #666; margin-right: 10px; }

.logout-wrap { padding: 32px 16px; text-align: center; }
.logout-btn { color: #ff4d4f; font-size: 15px; cursor: pointer; border: none; background: none; }

.popup-header { display: flex; align-items: center; justify-content: space-between; padding: 16px; border-bottom: 1px solid #f5f5f5; }
.popup-title { font-size: 16px; font-weight: 600; color: #333; }
.popup-body { padding: 0 16px; max-height: calc(50vh - 53px); overflow-y: auto; }

.address-item { padding: 14px 0; border-bottom: 1px solid #f5f5f5; }
.address-item:last-child { border-bottom: none; }
.addr-header { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.addr-name { font-size: 15px; font-weight: 500; color: #333; }
.addr-phone { font-size: 13px; color: #999; }
.addr-detail { font-size: 13px; color: #666; line-height: 1.5; margin: 0; }
</style>