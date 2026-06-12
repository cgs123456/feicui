<template>
  <div class="favorites-page">
    <AppNavbar title="我的收藏" @click-left="router.back" />

    <div v-if="favoriteStore.favorites.length === 0" class="empty-wrap">
      <van-empty description="暂无收藏">
        <van-button type="primary" round @click="router.push('/')">去逛逛</van-button>
      </van-empty>
    </div>

    <div v-else class="favorites-grid">
      <div
        v-for="item in favoriteStore.favorites"
        :key="item.productId"
        class="favorite-card"
        @click="router.push(`/products/${item.productId}`)"
      >
        <div class="card-image">
          <van-image
            :src="item.cover"
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
          <p class="card-title">{{ item.title }}</p>
          <p class="card-price">¥{{ (item.price || 0).toLocaleString() }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { showToast, showDialog } from 'vant'
import { useFavoriteStore } from '../../stores/favorite'
import AppNavbar from '../../components/AppNavbar.vue'

const router = useRouter()
const favoriteStore = useFavoriteStore()

function handleRemove(productId: string) {
  showDialog({
    title: '取消收藏',
    message: '确定要取消收藏该商品吗？',
    showCancelButton: true,
    confirmButtonText: '确定',
    confirmButtonColor: '#ff4d4f'
  }).then(() => {
    favoriteStore.removeFavorite(productId)
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
  cursor: pointer;
}

.card-image {
  position: relative;
  width: 100%;
  height: 160px;
  overflow: hidden;
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
  padding: 10px;
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