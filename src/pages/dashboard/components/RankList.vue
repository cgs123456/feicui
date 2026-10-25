<template>
  <div class="section-title">商品热度排行</div>
  <div class="ranking-section card">
    <div
      v-for="(product, idx) in topProducts"
      :key="product.id"
      class="ranking-item"
      @click="router.push('/products/' + product.id)"
    >
      <div class="rank-badge" :class="'rank-' + rankClass(idx)">
        <span v-if="idx < 3" class="rank-medal">{{ rankMedals[idx] }}</span>
        <span v-else class="rank-num">{{ idx + 1 }}</span>
      </div>
      <div class="rank-product-info">
        <span class="rank-product-title">{{ product.title }}</span>
        <span class="rank-product-price">¥{{ formatPrice(product.price) }}</span>
      </div>
      <div class="rank-views">
        <van-icon name="eye-o" size="14" color="#999" />
        <span>{{ formatNumber(product.views) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatPrice, formatNumber } from '@/utils/format'
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useProductStore } from '@/stores/product'
import { useUserStore } from '@/stores/user'
import { DEFAULT_MERCHANT_ID } from '@/mock/merchants'

const router = useRouter()
const productStore = useProductStore()
const userStore = useUserStore()

// 商品热度排行（本店口径：按商品归属过滤，server 模式镜像含其他商户商品）
const topProducts = computed(() => {
  const myId = userStore.userInfo.id || DEFAULT_MERCHANT_ID
  return [...productStore.products]
    .filter(p => (p.merchantId || DEFAULT_MERCHANT_ID) === myId)
    .sort((a, b) => (b.popularity || b.views || 0) - (a.popularity || a.views || 0))
    .slice(0, 5)
})

const rankMedals = ['🥇', '🥈', '🥉']

const rankClass = (idx: number): string => {
  if (idx === 0) return 'gold'
  if (idx === 1) return 'silver'
  if (idx === 2) return 'bronze'
  return 'normal'
}
</script>

<style scoped>
.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  padding: 16px 16px 8px;
}

/* 商品热度排行 */
.ranking-section {
  margin: 0 16px;
  padding: 4px 0;
  overflow: hidden;
}

.ranking-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
}

.ranking-item + .ranking-item {
  border-top: 1px solid #f5f5f5;
}

.rank-badge {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.rank-badge.rank-gold {
  background: linear-gradient(135deg, #ffd700, #ffa500);
}

.rank-badge.rank-silver {
  background: linear-gradient(135deg, #c0c0c0, #a8a8a8);
}

.rank-badge.rank-bronze {
  background: linear-gradient(135deg, #cd7f32, #b87333);
}

.rank-badge.rank-normal {
  background: #f5f5f5;
}

.rank-medal {
  font-size: 20px;
}

.rank-num {
  font-size: 14px;
  font-weight: 600;
  color: #999;
}

.rank-product-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.rank-product-title {
  font-size: 14px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rank-product-price {
  font-size: 13px;
  color: #ff4d00;
  font-weight: 600;
}

.rank-views {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #999;
  flex-shrink: 0;
}

.card {
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgb(0 0 0 / 6%);
}
</style>
