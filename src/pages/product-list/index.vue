<template>
  <div class="page-container">
    <AppNavbar title="商品管理" />
    <div class="search-bar-wrap">
      <van-search v-model="searchText" placeholder="搜索商品" shape="round" />
    </div>
    <div class="filter-tags">
      <span
        v-for="tag in filterTabs"
        :key="tag.key"
        class="filter-tag"
        :class="{ active: activeFilter === tag.key }"
        role="button"
        tabindex="0"
        :aria-label="'筛选：' + tag.label"
        @click="activeFilter = tag.key"
      >
        {{ tag.label }}
      </span>
    </div>
    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <van-skeleton title avatar :row="3" :loading="loadingSkeleton" v-for="i in 3" :key="i">
        <template #template>
          <div class="skeleton-item">
            <van-skeleton-paragraph row-width="60%" />
            <van-skeleton-paragraph row-width="40%" />
          </div>
        </template>
      </van-skeleton>
      <van-list
        v-model:loading="loading"
        :finished="finished"
        finished-text="没有更多了"
        @load="onLoad"
      >
        <div v-for="product in filteredProducts" :key="product.id">
          <van-swipe-cell>
            <ProductCard :product="product" @click="goDetail(product.id)" />
            <template #right>
              <div class="swipe-actions">
                <van-button
                  square
                  type="primary"
                  text="编辑"
                  class="swipe-btn edit-btn"
                  aria-label="编辑商品"
                  @click="goEdit(product.id)"
                />
                <van-button
                  square
                  :type="product.status === 'active' ? 'warning' : 'success'"
                  :text="product.status === 'active' ? '下架' : '上架'"
                  class="swipe-btn toggle-btn"
                  :aria-label="product.status === 'active' ? '下架商品' : '上架商品'"
                  @click="toggleStatus(product)"
                />
              </div>
            </template>
          </van-swipe-cell>
        </div>
      </van-list>
    </van-pull-refresh>

    <van-empty v-if="!loading && filteredProducts.length === 0" description="暂无商品" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useProductStore } from '../../stores/product'
import AppNavbar from '../../components/AppNavbar.vue'
import ProductCard from '../../components/ProductCard.vue'

const router = useRouter()
const productStore = useProductStore()

const searchText = ref('')
const activeFilter = ref('all')
const refreshing = ref(false)
const loading = ref(false)
const finished = ref(true)
const loadingSkeleton = ref(true)

// 模拟首次加载骨架屏
setTimeout(() => {
  loadingSkeleton.value = false
}, 600)

const filterTabs = [
  { key: 'all', label: '全部' },
  { key: 'active', label: '在售' },
  { key: 'sold', label: '已售' }
]

const statusMap = { active: '在售', sold: '已售', offline: '下架' }

const filteredProducts = computed(() => {
  let list = productStore.products
  if (activeFilter.value === 'active') {
    list = list.filter(p => p.status === 'active')
  } else if (activeFilter.value === 'sold') {
    list = list.filter(p => p.status === 'sold')
  } else if (activeFilter.value === 'offline') {
    list = list.filter(p => p.status === 'offline')
  }
  if (searchText.value) {
    const keyword = searchText.value.toLowerCase()
    list = list.filter(p => p.title.toLowerCase().includes(keyword))
  }
  return list
})

function onRefresh() {
  setTimeout(() => {
    refreshing.value = false
  }, 500)
}

function onLoad() {
  loading.value = false
  finished.value = true
}

function goDetail(id) {
  router.push(`/products/${id}`)
}

function goEdit(id) {
  router.push(`/merchant/products/${id}/edit`)
}

function toggleStatus(product) {
  const newStatus = product.status === 'active' ? 'offline' : 'active'
  productStore.updateProduct(product.id, { status: newStatus })
  showToast(newStatus === 'active' ? '已上架' : '已下架')
}
</script>

<style scoped>
.page-container {
  min-height: 100dvh;
  background: #f5f5f5;
}

.search-bar-wrap {
  padding: 8px 16px;
  background: #fff;
}

.search-bar-wrap :deep(.van-search) {
  padding: 0;
}

.search-bar-wrap :deep(.van-search__content) {
  background: #f5f5f5;
  border-radius: 8px;
}

.filter-tags {
  display: flex;
  gap: 8px;
  padding: 8px 16px;
  background: #fff;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.filter-tag {
  flex-shrink: 0;
  padding: 4px 14px;
  border-radius: 20px;
  font-size: 13px;
  color: #666;
  background: #f5f5f5;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-tag.active {
  color: #07c160;
  background: #e8f8ee;
}

.swipe-actions {
  display: flex;
  height: 100%;
}

.swipe-btn {
  height: 100%;
  width: 64px;
  font-size: 14px;
}

.edit-btn {
  background: #1989fa;
}

.toggle-btn {
  background: #ff976a;
}

/* Skeleton */
.skeleton-item {
  padding: 12px 16px;
  background: #fff;
  border-radius: 10px;
  margin: 8px 16px;
}
</style>
