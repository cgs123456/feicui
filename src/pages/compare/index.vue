<template>
  <div class="compare-page">
    <AppNavbar title="商品对比" fallback="/" />

    <div v-if="products.length < 2" class="empty-wrap">
      <van-empty description="至少需要 2 个商品才能对比">
        <van-button type="primary" round @click="router.push('/favorites')">去收藏夹选择</van-button>
      </van-empty>
    </div>

    <div v-else class="compare-table-wrap">
      <div class="compare-table">
        <!-- Header: Product Images & Titles -->
        <div class="compare-row">
          <div class="row-label">商品</div>
          <div
            v-for="(p, idx) in products"
            :key="p.id"
            class="compare-cell"
          >
            <van-icon
              name="close"
              size="16"
              color="#999"
              class="remove-cell-btn"
              @click="handleRemove(idx)"
            />
            <van-image
              :src="thumbnail(p.cover)"
              width="100%"
              height="120"
              fit="cover"
              radius="6"
              lazy-load
              class="cell-image"
            />
            <p class="cell-title">{{ p.title }}</p>
          </div>
        </div>

        <!-- Price -->
        <div class="compare-row">
          <div class="row-label">价格</div>
          <div
            v-for="p in products"
            :key="p.id"
            class="compare-cell"
          >
            <span
              class="cell-price"
              :class="{ 'price-lowest': p.price === lowestPrice }"
            >
              ¥{{ (p.price || 0).toLocaleString() }}
            </span>
          </div>
        </div>

        <!-- 种水 -->
        <div class="compare-row">
          <div class="row-label">种水</div>
          <div v-for="p in products" :key="p.id" class="compare-cell">
            <span class="cell-value">{{ p.waterGrade || '--' }}</span>
          </div>
        </div>

        <!-- 颜色 -->
        <div class="compare-row">
          <div class="row-label">颜色</div>
          <div v-for="p in products" :key="p.id" class="compare-cell">
            <span class="cell-value">{{ p.color || '--' }}</span>
          </div>
        </div>

        <!-- 材质 -->
        <div class="compare-row">
          <div class="row-label">材质</div>
          <div v-for="p in products" :key="p.id" class="compare-cell">
            <span class="cell-value">{{ p.material || '--' }}</span>
          </div>
        </div>

        <!-- 尺寸 -->
        <div class="compare-row">
          <div class="row-label">尺寸</div>
          <div v-for="p in products" :key="p.id" class="compare-cell">
            <span class="cell-value">{{ p.size || '--' }}</span>
          </div>
        </div>

        <!-- 重量 -->
        <div class="compare-row">
          <div class="row-label">重量</div>
          <div v-for="p in products" :key="p.id" class="compare-cell">
            <span class="cell-value">{{ p.weight || '--' }}</span>
          </div>
        </div>

        <!-- 款式 -->
        <div class="compare-row">
          <div class="row-label">款式</div>
          <div v-for="p in products" :key="p.id" class="compare-cell">
            <span class="cell-value">{{ p.style || '--' }}</span>
          </div>
        </div>

        <!-- 浏览量 -->
        <div class="compare-row">
          <div class="row-label">浏览量</div>
          <div v-for="p in products" :key="p.id" class="compare-cell">
            <span class="cell-value">{{ p.views ?? '--' }}</span>
          </div>
        </div>

        <!-- 证书 -->
        <div class="compare-row">
          <div class="row-label">证书</div>
          <div v-for="p in products" :key="p.id" class="compare-cell">
            <span class="cell-value">{{ p.certOrg || '--' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Button -->
    <div v-if="products.length >= 2 && products.length < 3" class="bottom-bar">
      <van-button
        type="primary"
        round
        block
        icon="plus"
        @click="router.push('/favorites')"
      >
        添加商品（最多 3 个）
      </van-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useProductStore } from '@/stores/product'
import { thumbnail } from '@/utils/image'
import AppNavbar from '@/components/AppNavbar.vue'
import type { Product } from '@/types'

const route = useRoute()
const router = useRouter()
const productStore = useProductStore()

const idsParam = computed(() => (route.query.ids as string) || '')
const ids = computed(() => idsParam.value.split(',').filter(Boolean))

const products = ref<Product[]>([])

ids.value.forEach(id => {
  const p = productStore.getProductById(id)
  if (p) products.value.push(p)
})

const lowestPrice = computed(() => {
  if (products.value.length === 0) return 0
  return Math.min(...products.value.map((p: Product) => p.price))
})

function handleRemove(idx: number) {
  products.value.splice(idx, 1)
  if (products.value.length < 2) {
    showToast('至少需要 2 个商品才能对比')
  }
  // Update URL
  const newIds = products.value.map((p: Product) => p.id).join(',')
  router.replace({ query: { ids: newIds || undefined } })
}
</script>

<style scoped>
.compare-page {
  min-height: 100dvh;
  max-width: 430px;
  margin: 0 auto;
  background: #f5f5f5;
  padding-bottom: 80px;
}

.empty-wrap {
  padding-top: 80px;
}

.compare-table-wrap {
  overflow-x: auto;
  padding: 12px 16px;
  -webkit-overflow-scrolling: touch;
}

.compare-table {
  display: flex;
  flex-direction: column;
  min-width: 100%;
  border-radius: 10px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.compare-row {
  display: flex;
  border-bottom: 1px solid #f5f5f5;
}

.compare-row:last-child {
  border-bottom: none;
}

.row-label {
  width: 72px;
  min-width: 72px;
  padding: 12px 10px;
  font-size: 13px;
  color: #999;
  background: #fafafa;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  border-right: 1px solid #f0f0f0;
}

.compare-cell {
  flex: 1;
  min-width: 120px;
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  position: relative;
  border-right: 1px solid #f0f0f0;
}

.compare-cell:last-child {
  border-right: none;
}

.remove-cell-btn {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 20px;
  height: 20px;
  background: rgba(0, 0, 0, 0.06);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 2;
}

.cell-image {
  margin-bottom: 8px;
}

.cell-title {
  font-size: 12px;
  color: #333;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin: 0;
  width: 100%;
}

.cell-price {
  font-size: 15px;
  font-weight: 700;
  color: #ff4d00;
}

.cell-price.price-lowest {
  color: #07c160;
}

.cell-value {
  font-size: 13px;
  color: #333;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 430px;
  background: #fff;
  border-top: 1px solid #eee;
  padding: 10px 16px;
  padding-bottom: calc(10px + env(safe-area-inset-bottom, 0px));
  z-index: 100;
}
</style>