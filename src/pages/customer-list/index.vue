<template>
  <div class="page-container">
    <AppNavbar
      title="客资列表"
      fallback="/merchant/dashboard"
    />
    <div class="search-bar-wrap">
      <van-search
        v-model="searchText"
        placeholder="搜索客户"
        shape="round"
      />
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
    <div class="customer-list">
      <van-skeleton
        v-for="i in 4"
        :key="i"
        title
        avatar
        :row="2"
        :loading="loadingSkeleton"
      >
        <template #template>
          <div class="skeleton-item" />
        </template>
      </van-skeleton>
      <CustomerCard
        v-for="customer in filteredCustomers"
        :key="customer.id"
        :customer="customer"
        @click="goDetail(customer.id)"
      />
    </div>
    <van-empty
      v-if="filteredCustomers.length === 0"
      description="暂无客户"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import AppNavbar from '../../components/AppNavbar.vue'
import CustomerCard from '../../components/CustomerCard.vue'
import customerData from '../../mock/customers.json'

const router = useRouter()
const customers = customerData

const searchText = ref('')
const activeFilter = ref('all')
const loadingSkeleton = ref(true)

// 模拟首次加载骨架屏
setTimeout(() => {
  loadingSkeleton.value = false
}, 500)

const filterTabs = [
  { key: 'all', label: '全部' },
  { key: 'following', label: '待跟进' },
  { key: 'done', label: '已成交' },
  { key: 'lost', label: '已流失' }
]

const statusFilterMap = {
  all: null,
  following: '跟进中',
  done: '已成交',
  lost: '已流失'
}

const filteredCustomers = computed(() => {
  let list = customers
  const statusKey = statusFilterMap[activeFilter.value]
  if (statusKey) {
    list = list.filter(c => c.status === statusKey)
  }
  if (searchText.value) {
    const keyword = searchText.value.toLowerCase()
    list = list.filter(
      c => c.name.toLowerCase().includes(keyword) || (c.phone && c.phone.includes(keyword))
    )
  }
  return list
})

function goDetail(id) {
  router.push(`/customers/${id}`)
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

.customer-list {
  padding: 8px 0;
}

/* Skeleton */
.skeleton-item {
  padding: 12px;
  background: #fff;
  border-bottom: 1px solid #f5f5f5;
}
</style>
