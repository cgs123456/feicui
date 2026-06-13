<template>
  <div class="favorites-page">
    <AppNavbar title="我的收藏" @click-left="router.back" />

    <div v-if="favoriteStore.favorites.length === 0" class="empty-wrap">
      <van-empty description="暂无收藏">
        <van-button type="primary" round @click="router.push('/')">去逛逛</van-button>
      </van-empty>
    </div>

    <template v-else>
      <!-- Toolbar -->
      <div class="toolbar">
        <div class="toolbar-left">
          <van-button
            type="default"
            plain
            round
            size="small"
            icon="exchange"
            :disabled="selectedIds.length < 2 || selectedIds.length > 3"
            @click="goCompare"
          >
            对比
          </van-button>
          <span class="selected-count">已选 {{ selectedIds.length }}/3</span>
        </div>
        <span class="select-all-btn" @click="toggleSelectAll">
          {{ isAllSelected ? '取消' : '全选' }}
        </span>
      </div>

      <!-- Favorites Grid -->
      <div class="favorites-grid">
        <div
          v-for="item in favoriteStore.favorites"
          :key="item.productId"
          class="favorite-card"
        >
          <div class="card-image" @click="router.push(`/products/${item.productId}`)">
            <van-image
              :src="thumbnail(item.cover)"
              width="100%"
              height="160"
              fit="cover"
              radius="8"
              lazy-load
            />
            <van-icon
              name="cross"
              size="16"
              color="#fff"
              class="remove-btn"
              @click.stop="handleRemove(item.productId)"
            />
          </div>
          <div class="card-info">
            <div class="card-check-row">
              <van-checkbox
                v-model="selectedIds"
                :name="item.productId"
                icon-size="18"
                checked-color="#07c160"
                @click.stop
              />
            </div>
            <div class="card-text" @click="router.push(`/products/${item.productId}`)">
              <p class="card-title">{{ item.title }}</p>
              <p class="card-price">¥{{ (item.price || 0).toLocaleString() }}</p>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showDialog } from 'vant'
import { useFavoriteStore } from '@/stores/favorite'
import { thumbnail } from '@/utils/image'
import type { Favorite } from '@/types'
import AppNavbar from '@/components/AppNavbar.vue'

const router = useRouter()
const favoriteStore = useFavoriteStore()

const selectedIds = ref<string[]>([])

const isAllSelected = computed(() => {
  if (favoriteStore.favorites.length === 0) return false
  return selectedIds.value.length === favoriteStore.favorites.length
})

function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedIds.value = []
  } else {
    selectedIds.value = favoriteStore.favorites.map((f: Favorite) => f.productId)
  }
}

function goCompare() {
  if (selectedIds.value.length < 2) {
    showToast('请至少选择 2 个商品')
    return
  }
  if (selectedIds.value.length > 3) {
    showToast('最多选择 3 个商品')
    return
  }
  router.push(`/compare?ids=${selectedIds.value.join(',')}`)
}

function handleRemove(productId: string) {
  showDialog({
    title: '取消收藏',
    message: '确定要取消收藏该商品吗？',
    showCancelButton: true,
    confirmButtonText: '确定',
    confirmButtonColor: '#ff4d4f'
  }).then(() => {
    favoriteStore.removeFavorite(productId)
    selectedIds.value = selectedIds.value.filter(id => id !== productId)
    showToast('已取消收藏')
  }).catch(() => {})
}
</script>

<style scoped>
.favorites-page {
  min-height: 100dvh;
  max-width: 430px;
  margin: 0 auto;
  background: #f5f5f5;
  padding-bottom: 20px;
}

.empty-wrap {
  padding-top: 80px;
}

/* Toolbar */
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: #fff;
  border-bottom: 1px solid #eee;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.selected-count {
  font-size: 13px;
  color: #999;
}

.select-all-btn {
  font-size: 14px;
  color: #07c160;
  cursor: pointer;
}

/* Favorites Grid */
.favorites-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  padding: 12px 16px;
}

.favorite-card {
  background: #fff;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.card-image {
  position: relative;
  width: 100%;
  height: 160px;
  overflow: hidden;
  cursor: pointer;
}

.card-image .van-image {
  width: 100%;
  height: 100%;
}

.remove-btn {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 22px;
  height: 22px;
  background: rgba(0, 0, 0, 0.45);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3px;
}

.card-info {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 10px;
}

.card-check-row {
  flex-shrink: 0;
  padding-top: 2px;
}

.card-text {
  flex: 1;
  min-width: 0;
  cursor: pointer;
}

.card-title {
  font-size: 13px;
  color: #333;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin: 0 0 6px;
  min-height: 36px;
}

.card-price {
  font-size: 15px;
  font-weight: 700;
  color: #ff4d00;
  margin: 0;
}
</style>