<template>
  <div class="page-container">
    <AppNavbar :title="isMerchant ? '商品管理' : '翡翠商城'" />
    <div class="search-bar-wrap">
      <van-search v-model="searchText" placeholder="搜索商品名称、品类、材质" shape="round" @search="onSearch" />
    </div>

    <!-- 筛选条件 -->
    <div class="filter-section">
      <div class="filter-tags">
        <span
          v-for="tag in statusTabs"
          :key="tag.key"
          class="filter-tag"
          :class="{ active: activeStatus === tag.key }"
          @click="activeStatus = tag.key"
        >{{ tag.label }}</span>
      </div>

      <div class="filter-row">
        <div class="filter-item" @click="showCategorySheet = true">
          <span>{{ filters.category || '品类' }}</span>
          <van-icon name="arrow-down" size="12" />
        </div>
        <div class="filter-item" @click="showMaterialSheet = true">
          <span>{{ filters.material || '材质' }}</span>
          <van-icon name="arrow-down" size="12" />
        </div>
        <div class="filter-item" @click="showPriceSheet = true">
          <span>{{ priceLabel || '价格' }}</span>
          <van-icon name="arrow-down" size="12" />
        </div>
        <div class="filter-item sort-item" @click="cycleSort">
          <span>{{ sortLabel }}</span>
          <van-icon :name="sortIcon" size="12" />
        </div>
      </div>
    </div>

    <!-- 商品列表 -->
    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <van-skeleton title avatar :row="3" :loading="loadingSkeleton" v-for="i in 3" :key="i">
        <template #template>
          <div class="skeleton-item">
            <van-skeleton-paragraph row-width="60%" />
            <van-skeleton-paragraph row-width="40%" />
          </div>
        </template>
      </van-skeleton>

      <div v-for="product in filteredProducts" :key="product.id">
        <van-swipe-cell :disabled="!isMerchant">
          <ProductCard :product="product" @click="goDetail(product.id)" />
          <template v-if="isMerchant" #right>
            <div class="swipe-actions">
              <van-button square type="primary" text="编辑" class="swipe-btn edit-btn" @click="goEdit(product.id)" />
              <van-button square :type="product.status === 'active' ? 'warning' : 'success'" :text="product.status === 'active' ? '下架' : '上架'" class="swipe-btn toggle-btn" @click="toggleStatus(product)" />
            </div>
          </template>
        </van-swipe-cell>
      </div>
    </van-pull-refresh>

    <van-empty v-if="!loadingSkeleton && filteredProducts.length === 0" description="暂无匹配商品" />

    <!-- 品类筛选弹窗 -->
    <van-action-sheet v-model:show="showCategorySheet" title="选择品类">
      <div class="sheet-options">
        <span class="sheet-option" :class="{ active: !filters.category }" @click="selectCategory('')">全部</span>
        <span v-for="cat in productStore.allCategories" :key="cat" class="sheet-option" :class="{ active: filters.category === cat }" @click="selectCategory(cat)">{{ cat }}</span>
      </div>
    </van-action-sheet>

    <!-- 材质筛选弹窗 -->
    <van-action-sheet v-model:show="showMaterialSheet" title="选择材质">
      <div class="sheet-options">
        <span class="sheet-option" :class="{ active: !filters.material }" @click="selectMaterial('')">全部</span>
        <span v-for="mat in productStore.allMaterials" :key="mat" class="sheet-option" :class="{ active: filters.material === mat }" @click="selectMaterial(mat)">{{ mat }}</span>
      </div>
    </van-action-sheet>

    <!-- 价格筛选弹窗 -->
    <van-action-sheet v-model:show="showPriceSheet" title="价格区间">
      <div class="price-sheet">
        <div class="price-inputs">
          <van-field :model-value="priceMinInput ?? undefined" type="number" placeholder="最低价" @update:model-value="(v: string | number) => priceMinInput = v ? Number(v) : null" />
          <span class="price-sep">—</span>
          <van-field :model-value="priceMaxInput ?? undefined" type="number" placeholder="最高价" @update:model-value="(v: string | number) => priceMaxInput = v ? Number(v) : null" />
        </div>
        <van-button type="primary" block round @click="applyPrice">确定</van-button>
        <div class="quick-prices">
          <span v-for="pr in quickPriceRanges" :key="pr.label" class="sheet-option" :class="{ active: priceLabel === pr.label }" @click="setQuickPrice(pr)">{{ pr.label }}</span>
        </div>
      </div>
    </van-action-sheet>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useProductStore, type SortField, type FilterParams } from '../../stores/product'
import type { Product } from '@/types'
import AppNavbar from '../../components/AppNavbar.vue'
import ProductCard from '../../components/ProductCard.vue'

const route = useRoute()
const router = useRouter()
const productStore = useProductStore()

const isMerchant = computed(() => route.path.startsWith('/merchant'))

const searchText = ref('')
const activeStatus = ref('all')
const refreshing = ref(false)
const loadingSkeleton = ref(true)

setTimeout(() => { loadingSkeleton.value = false }, 600)

const filters = reactive<Partial<FilterParams>>({
  keyword: '',
  category: '',
  material: '',
  priceMin: null,
  priceMax: null,
  status: 'all',
  sort: 'newest'
})

const showCategorySheet = ref(false)
const showMaterialSheet = ref(false)
const showPriceSheet = ref(false)
const priceMinInput = ref<number | null>(null)
const priceMaxInput = ref<number | null>(null)

const statusTabs = [
  { key: 'all', label: '全部' },
  { key: 'active', label: '在售' },
  { key: 'sold', label: '已售' }
]

const sortOptions: { key: SortField; label: string; icon: string }[] = [
  { key: 'newest', label: '最新', icon: 'arrow-down' },
  { key: 'price-asc', label: '价格↑', icon: 'arrow-up' },
  { key: 'price-desc', label: '价格↓', icon: 'arrow-down' },
  { key: 'views', label: '热度', icon: 'fire-o' }
]

const sortIndex = ref(0)
const sortLabel = computed(() => sortOptions[sortIndex.value].label)
const sortIcon = computed(() => sortOptions[sortIndex.value].icon)

const priceLabel = ref('')
const quickPriceRanges = [
  { label: '5000以下', min: 0, max: 5000 },
  { label: '5000-2万', min: 5000, max: 20000 },
  { label: '2万-5万', min: 20000, max: 50000 },
  { label: '5万-10万', min: 50000, max: 100000 },
  { label: '10万以上', min: 100000, max: 99999999 }
]

function cycleSort() {
  sortIndex.value = (sortIndex.value + 1) % sortOptions.length
  filters.sort = sortOptions[sortIndex.value].key
}

const filteredProducts = computed(() => {
  return productStore.getFilteredProducts({
    keyword: searchText.value,
    category: filters.category,
    material: filters.material,
    priceMin: filters.priceMin,
    priceMax: filters.priceMax,
    status: activeStatus.value === 'all' ? '' : activeStatus.value,
    sort: filters.sort
  })
})

function onSearch() {
  filters.keyword = searchText.value
}

function selectCategory(cat: string) {
  filters.category = cat
  showCategorySheet.value = false
}

function selectMaterial(mat: string) {
  filters.material = mat
  showMaterialSheet.value = false
}

function applyPrice() {
  filters.priceMin = priceMinInput.value
  filters.priceMax = priceMaxInput.value
  if (priceMinInput.value !== null || priceMaxInput.value !== null) {
    const minStr = priceMinInput.value ? `¥${priceMinInput.value.toLocaleString()}` : '0'
    const maxStr = priceMaxInput.value ? `¥${priceMaxInput.value.toLocaleString()}` : '不限'
    priceLabel.value = `${minStr}-${maxStr}`
  } else {
    priceLabel.value = ''
  }
  showPriceSheet.value = false
}

function setQuickPrice(pr: { label: string; min: number; max: number }) {
  priceMinInput.value = pr.min
  priceMaxInput.value = pr.max
  filters.priceMin = pr.min
  filters.priceMax = pr.max
  priceLabel.value = pr.label
  showPriceSheet.value = false
}

function onRefresh() {
  setTimeout(() => { refreshing.value = false }, 500)
}

function goDetail(id: string) {
  router.push(`/products/${id}`)
}

function goEdit(id: string) {
  router.push(`/merchant/products/${id}/edit`)
}

function toggleStatus(product: Product) {
  const newStatus = product.status === 'active' ? 'offline' : 'active'
  productStore.updateProduct(product.id, { status: newStatus })
  showToast(newStatus === 'active' ? '已上架' : '已下架')
}
</script>

<style scoped>
.page-container { min-height: 100dvh; background: #f5f5f5; }
.search-bar-wrap { padding: 8px 16px; background: #fff; }
.search-bar-wrap :deep(.van-search) { padding: 0; }
.search-bar-wrap :deep(.van-search__content) { background: #f5f5f5; border-radius: 8px; }

.filter-section { background: #fff; padding-bottom: 8px; }
.filter-tags { display: flex; gap: 8px; padding: 8px 16px; overflow-x: auto; -webkit-overflow-scrolling: touch; }
.filter-tag { flex-shrink: 0; padding: 4px 14px; border-radius: 20px; font-size: 13px; color: #666; background: #f5f5f5; cursor: pointer; transition: all 0.2s; }
.filter-tag.active { color: #07c160; background: #e8f8ee; }

.filter-row { display: flex; gap: 0; padding: 0 12px; }
.filter-item { flex: 1; display: flex; align-items: center; justify-content: center; gap: 4px; padding: 8px 4px; font-size: 13px; color: #333; cursor: pointer; border-right: 1px solid #f0f0f0; overflow: hidden; white-space: nowrap; }
.filter-item:last-child { border-right: none; }
.sort-item { color: #07c160; }

.swipe-actions { display: flex; height: 100%; }
.swipe-btn { height: 100%; width: 64px; font-size: 14px; }
.edit-btn { background: #1989fa; }
.toggle-btn { background: #ff976a; }

.skeleton-item { padding: 12px 16px; background: #fff; border-radius: 10px; margin: 8px 16px; }

.sheet-options { display: flex; flex-wrap: wrap; gap: 10px; padding: 16px; }
.sheet-option { padding: 8px 16px; border-radius: 20px; font-size: 14px; background: #f5f5f5; color: #666; cursor: pointer; }
.sheet-option.active { background: #e8f8ee; color: #07c160; }

.price-sheet { padding: 16px; }
.price-inputs { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.price-inputs .van-field { flex: 1; padding: 8px 12px; background: #f5f5f5; border-radius: 8px; }
.price-sep { color: #999; }
.quick-prices { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; padding-top: 14px; border-top: 1px solid #f0f0f0; }
</style>