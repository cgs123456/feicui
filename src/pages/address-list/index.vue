<template>
  <div class="address-list-page">
    <AppNavbar title="收货地址" fallback="/profile" />

    <div v-if="addressStore.addresses.length === 0" class="empty-wrap">
      <van-empty description="还没有收货地址">
        <van-button type="primary" round @click="router.push('/addresses/new')">
          新增地址
        </van-button>
      </van-empty>
    </div>

    <div v-else class="address-items">
      <van-swipe-cell v-for="addr in addressStore.addresses" :key="addr.id">
        <div
          class="card address-card"
          role="button"
          :aria-label="`选择地址 ${addr.name}`"
          @click="onPick(addr)"
        >
          <div class="address-top">
            <span class="address-name">{{ addr.name }}</span>
            <span class="address-phone">{{ formatPhone(addr.phone) }}</span>
            <span v-if="addr.isDefault" class="default-tag"> 默认 </span>
          </div>
          <p class="address-detail">
            {{ addr.fullAddress }}
          </p>
        </div>
        <template #right>
          <van-button
            square
            type="primary"
            text="编辑"
            class="swipe-btn"
            @click="router.push(`/addresses/${addr.id}/edit`)"
          />
          <van-button square type="danger" text="删除" class="swipe-btn" @click="onRemove(addr)" />
        </template>
      </van-swipe-cell>
    </div>

    <div v-if="addressStore.addresses.length > 0" class="footer-bar">
      <van-button
        type="primary"
        round
        block
        icon="plus"
        aria-label="新增地址"
        @click="router.push('/addresses/new')"
      >
        新增地址
      </van-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showConfirmDialog, showToast } from 'vant'
import { useAddressStore } from '../../stores/address'
import { formatPhone } from '../../utils/format'
import AppNavbar from '../../components/AppNavbar.vue'
import type { Address } from '../../types/models'

const route = useRoute()
const router = useRouter()
const addressStore = useAddressStore()

/** 选址模式（从订单确认页跳入）：点选地址写 sessionStorage 回传后返回 */
const selectMode = computed(() => route.query.select === '1')

// 从后端拉取最新地址覆盖内存镜像；失败保持本地镜像
onMounted(() => {
  addressStore.syncFromServer().catch(() => {})
})

function onPick(addr: Address) {
  if (selectMode.value) {
    sessionStorage.setItem('jadeite_selected_address', addr.id)
    router.back()
  }
}

async function onRemove(addr: Address) {
  const ok = await showConfirmDialog({
    title: '删除地址',
    message: `确定删除「${addr.name}」的收货地址吗？`
  })
    .then(() => true)
    .catch(() => false)
  if (!ok) return
  try {
    await addressStore.removeAddress(addr.id)
    showToast('已删除')
  } catch (err) {
    showToast(err instanceof Error && err.message ? err.message : '删除失败，请重试')
  }
}
</script>

<style scoped>
.address-list-page {
  min-height: 100dvh;
  max-width: 430px;
  margin: 0 auto;
  background: #f5f5f5;
  padding-bottom: 90px;
}

.empty-wrap {
  padding-top: 100px;
}

.address-items {
  padding-top: 12px;
}

.card {
  background: #fff;
  border-radius: 10px;
  margin: 0 16px 10px;
  padding: 16px;
  box-shadow: 0 1px 3px rgb(0 0 0 / 4%);
}

.address-card {
  cursor: pointer;
}

.address-top {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.address-name {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.address-phone {
  font-size: 13px;
  color: #999;
}

.default-tag {
  font-size: 11px;
  color: #07c160;
  border: 1px solid #07c160;
  border-radius: 4px;
  padding: 0 4px;
  line-height: 16px;
}

.address-detail {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
  margin: 0;
}

.swipe-btn {
  height: 100%;
}

.footer-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  margin: 0 auto;
  width: 100%;
  max-width: 430px;
  padding: 10px 16px;
  padding-bottom: calc(10px + env(safe-area-inset-bottom, 0px));
  background: #fff;
  border-top: 1px solid #eee;
  box-sizing: border-box;
}
</style>
