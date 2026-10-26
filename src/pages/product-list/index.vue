<template>
  <div class="page-container">
    <AppNavbar
      :title="isMerchant ? '商品管理' : '翡翠商城'"
      :fallback="isMerchant ? '/merchant/dashboard' : '/'"
    >
      <template #right>
        <van-button
          v-if="isMerchant && !batchMode"
          size="small"
          type="primary"
          plain
          @click="enterBatchMode"
        >
          批量管理
        </van-button>
        <van-button v-else-if="batchMode" size="small" plain @click="exitBatchMode">
          取消
        </van-button>
      </template>
    </AppNavbar>
    <div class="search-bar-wrap">
      <van-search
        v-model="searchText"
        placeholder="搜索商品名称、品类、材质"
        shape="round"
        @search="debouncedSearch"
        @update:model-value="debouncedSearch"
      />
    </div>

    <!-- 筛选条件 -->
    <FilterPanel
      v-model:active-status="activeStatus"
      :status-tabs="statusTabs"
      :category="filters.category"
      :material="filters.material"
      :price-label="priceLabel"
      :sort-label="sortLabel"
      :sort-icon="sortIcon"
      @open-category="showCategorySheet = true"
      @open-material="showMaterialSheet = true"
      @open-price="showPriceSheet = true"
      @cycle-sort="cycleSort"
    />

    <!-- 商品列表 -->
    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <van-skeleton v-for="i in 3" :key="i" title avatar :row="3" :loading="loadingSkeleton">
        <template #template>
          <div class="skeleton-item">
            <van-skeleton-paragraph row-width="60%" />
            <van-skeleton-paragraph row-width="40%" />
          </div>
        </template>
      </van-skeleton>

      <van-list
        v-model:loading="listLoading"
        :finished="listFinished"
        finished-text="没有更多了"
        @load="loadMore"
      >
        <div v-for="product in visibleProducts" :key="product.id" class="product-row">
          <van-checkbox v-if="batchMode" v-model="selectedIds[product.id]" class="batch-checkbox" />
          <van-swipe-cell :disabled="!isMerchant || batchMode">
            <ProductCard
              :product="product"
              @click="batchMode ? toggleSelect(product.id) : goDetail(product.id)"
            />
            <template v-if="isMerchant && !batchMode" #right>
              <div class="swipe-actions">
                <van-button
                  square
                  type="primary"
                  text="编辑"
                  class="swipe-btn edit-btn"
                  @click="goEdit(product.id)"
                />
                <van-button
                  square
                  :type="product.status === 'active' ? 'warning' : 'success'"
                  :text="product.status === 'active' ? '下架' : '上架'"
                  class="swipe-btn toggle-btn"
                  @click="toggleStatus(product)"
                />
              </div>
            </template>
          </van-swipe-cell>
        </div>
      </van-list>
    </van-pull-refresh>

    <van-empty
      v-if="!loadingSkeleton && filteredProducts.length === 0"
      description="暂无匹配商品"
    />

    <!-- 批量操作底栏 -->
    <div v-if="batchMode" class="batch-bar">
      <van-checkbox v-model="isAllSelected" @change="toggleSelectAll"> 全选 </van-checkbox>
      <span class="selected-count">已选 {{ selectedCount }} 件</span>
      <div class="batch-actions">
        <van-button
          size="small"
          type="primary"
          :disabled="selectedCount === 0"
          @click="batchOnline"
        >
          上架
        </van-button>
        <van-button
          size="small"
          type="warning"
          :disabled="selectedCount === 0"
          @click="batchOffline"
        >
          下架
        </van-button>
        <van-button
          size="small"
          type="danger"
          plain
          :disabled="selectedCount === 0"
          @click="showPriceDialog = true"
        >
          改价
        </van-button>
      </div>
    </div>

    <!-- 改价弹窗 -->
    <van-dialog
      v-model:show="showPriceDialog"
      title="批量改价"
      show-cancel-button
      :before-close="onPriceDialogClose"
    >
      <div class="price-dialog-content">
        <p class="price-dialog-tip">调整比例：输入 0.9 表示打9折，输入 1.1 表示涨10%</p>
        <van-field
          v-model="priceMultiplierInput"
          type="number"
          placeholder="请输入调整比例，如 0.9"
        />
      </div>
    </van-dialog>

    <!-- 品类筛选弹窗 -->
    <van-action-sheet v-model:show="showCategorySheet" title="选择品类">
      <div class="sheet-options">
        <span
          class="sheet-option"
          :class="{ active: !filters.category }"
          @click="selectCategory('')"
          >全部</span
        >
        <span
          v-for="cat in productStore.allCategories"
          :key="cat"
          class="sheet-option"
          :class="{ active: filters.category === cat }"
          @click="selectCategory(cat)"
          >{{ cat }}</span
        >
      </div>
    </van-action-sheet>

    <!-- 材质筛选弹窗 -->
    <van-action-sheet v-model:show="showMaterialSheet" title="选择材质">
      <div class="sheet-options">
        <span
          class="sheet-option"
          :class="{ active: !filters.material }"
          @click="selectMaterial('')"
          >全部</span
        >
        <span
          v-for="mat in productStore.allMaterials"
          :key="mat"
          class="sheet-option"
          :class="{ active: filters.material === mat }"
          @click="selectMaterial(mat)"
          >{{ mat }}</span
        >
      </div>
    </van-action-sheet>

    <!-- 价格筛选弹窗 -->
    <PriceFilterSheet
      v-model:show="showPriceSheet"
      v-model:min-input="priceMinInput"
      v-model:max-input="priceMaxInput"
      :active-label="priceLabel"
      @apply="applyPrice"
      @quick-set="setQuickPrice"
    />
  </div>
</template>

<script setup lang="ts">
import { formatPrice } from '../../utils/format'
defineOptions({ name: 'ProductListPage' })
import { ref, computed, reactive, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'
import { debounce } from '@/utils/debounce'
import { useProductStore, type SortField, type FilterParams } from '../../stores/product'
import { useUserStore } from '../../stores/user'
import { DEFAULT_MERCHANT_ID } from '../../data/merchants'
import type { Product } from '@/types'
import AppNavbar from '../../components/AppNavbar.vue'
import ProductCard from '../../components/ProductCard.vue'
import FilterPanel from './components/FilterPanel.vue'
import PriceFilterSheet from './components/PriceFilterSheet.vue'

const route = useRoute()
const router = useRouter()
const productStore = useProductStore()
const userStore = useUserStore()

const isMerchant = computed(() => route.path.startsWith('/merchant'))

const searchText = ref('')
const activeStatus = ref('all')
const refreshing = ref(false)
const loadingSkeleton = ref(true)

setTimeout(() => {
  loadingSkeleton.value = false
}, 600)

// 拉取最新商品目录，保证商家编辑对 C/B 端立即可见
onMounted(() => {
  productStore.syncFromServer().catch(() => {
    // 网络失败保持本地镜像
  })
})

// ===== 批量管理 =====
const batchMode = ref(false)
const selectedIds = reactive<Record<string, boolean>>({})
const showPriceDialog = ref(false)
const priceMultiplierInput = ref('')

const selectedCount = computed(() => {
  return Object.values(selectedIds).filter(Boolean).length
})

const isAllSelected = computed({
  get: () =>
    filteredProducts.value.length > 0 && filteredProducts.value.every(p => selectedIds[p.id]),
  set: () => {} // handled by toggleSelectAll
})

function enterBatchMode() {
  batchMode.value = true
  Object.keys(selectedIds).forEach(k => delete selectedIds[k])
}

function exitBatchMode() {
  batchMode.value = false
  Object.keys(selectedIds).forEach(k => delete selectedIds[k])
}

function toggleSelect(id: string) {
  selectedIds[id] = !selectedIds[id]
}

function toggleSelectAll(checked: boolean) {
  filteredProducts.value.forEach(p => {
    selectedIds[p.id] = checked
  })
}

function getSelectedIds(): string[] {
  return Object.entries(selectedIds)
    .filter(([, v]) => v)
    .map(([k]) => k)
}

async function batchOnline() {
  const ids = getSelectedIds()
  if (ids.length === 0) return
  await productStore.batchUpdateStatus(ids, 'active')
  showToast(`已上架 ${ids.length} 件商品`)
  exitBatchMode()
}

async function batchOffline() {
  const ids = getSelectedIds()
  if (ids.length === 0) return
  await productStore.batchUpdateStatus(ids, 'offline')
  showToast(`已下架 ${ids.length} 件商品`)
  exitBatchMode()
}

async function onPriceDialogClose(action: string): Promise<boolean> {
  if (action === 'confirm') {
    const val = parseFloat(priceMultiplierInput.value)
    if (isNaN(val) || val <= 0) {
      showToast('请输入有效的正数比例')
      return false
    }
    const ids = getSelectedIds()
    if (ids.length === 0) return false
    await productStore.batchUpdatePrice(ids, val)
    showToast(`已调整 ${ids.length} 件商品价格`)
    priceMultiplierInput.value = ''
    exitBatchMode()
  } else {
    priceMultiplierInput.value = ''
  }
  return true
}

// 退出批量模式时清空选中
watch(batchMode, val => {
  if (!val) {
    Object.keys(selectedIds).forEach(k => delete selectedIds[k])
  }
})

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
  { key: 'active', label: '在售中' },
  { key: 'sold', label: '已售罄' }
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

function cycleSort() {
  sortIndex.value = (sortIndex.value + 1) % sortOptions.length
  filters.sort = sortOptions[sortIndex.value].key
}

const filteredProducts = computed(() => {
  const list = productStore.getFilteredProducts({
    keyword: searchText.value,
    category: filters.category,
    material: filters.material,
    priceMin: filters.priceMin,
    priceMax: filters.priceMax,
    status: activeStatus.value === 'all' ? '' : activeStatus.value,
    sort: filters.sort
  })
  // 多商户隔离：商家端只见本店商品，C 端不受限
  if (isMerchant.value && userStore.userInfo.id) {
    return list.filter(p => (p.merchantId || DEFAULT_MERCHANT_ID) === userStore.userInfo.id)
  }
  return list
})

const debouncedSearch = debounce(() => {
  filters.keyword = searchText.value
}, 400)

/** 大列表渐进渲染：van-list 触底追加一页，筛选条件变化时回到首页（mock 10 条数据一次性渲染完，行为与直渲一致） */
const PAGE_SIZE = 10
const visibleCount = ref(PAGE_SIZE)
const listLoading = ref(false)
const visibleProducts = computed(() => filteredProducts.value.slice(0, visibleCount.value))
const listFinished = computed(() => visibleCount.value >= filteredProducts.value.length)

function loadMore() {
  setTimeout(() => {
    visibleCount.value += PAGE_SIZE
    listLoading.value = false
  }, 200)
}

watch(
  () => ({ ...filters }),
  () => {
    visibleCount.value = PAGE_SIZE
  }
)

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
    const minStr = priceMinInput.value ? `¥${formatPrice(priceMinInput.value)}` : '0'
    const maxStr = priceMaxInput.value ? `¥${formatPrice(priceMaxInput.value)}` : '不限'
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
  visibleCount.value = PAGE_SIZE
  setTimeout(() => {
    refreshing.value = false
  }, 500)
}

function goDetail(id: string) {
  router.push(`/products/${id}`)
}

function goEdit(id: string) {
  router.push(`/merchant/products/${id}/edit`)
}

async function toggleStatus(product: Product) {
  const newStatus = product.status === 'active' ? 'offline' : 'active'
  await productStore.updateProduct(product.id, { status: newStatus })
  showToast(newStatus === 'active' ? '已上架' : '已下架')
}
</script>

<style scoped>
.page-container {
  min-height: 100dvh;
  background: #f5f5f5;
  padding-bottom: env(safe-area-inset-bottom);
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

.skeleton-item {
  padding: 12px 16px;
  background: #fff;
  border-radius: 10px;
  margin: 8px 16px;
}

.sheet-options {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 16px;
}

.sheet-option {
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  background: #f5f5f5;
  color: #666;
  cursor: pointer;
}

.sheet-option.active {
  background: #e8f8ee;
  color: #07c160;
}

/* 批量管理 */
.product-row {
  display: flex;
  align-items: stretch;
}

.product-row .van-swipe-cell {
  flex: 1;
  min-width: 0;
  width: 100%;
}

.product-row .van-swipe-cell :deep(.van-swipe-cell__wrapper) {
  width: 100%;
}

.batch-checkbox {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  padding: 0 8px 0 12px;
}

.batch-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  padding-bottom: calc(10px + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -2px 8px rgb(0 0 0 / 8%);
}

.selected-count {
  font-size: 13px;
  color: #666;
  flex: 1;
}

.batch-actions {
  display: flex;
  gap: 8px;
}

.price-dialog-content {
  padding: 16px;
}

.price-dialog-tip {
  font-size: 13px;
  color: #999;
  margin: 0 0 12px;
}
</style>
