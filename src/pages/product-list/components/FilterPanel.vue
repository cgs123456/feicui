<template>
  <div class="filter-section">
    <div class="filter-tags">
      <span
        v-for="tag in statusTabs"
        :key="tag.key"
        class="filter-tag"
        :class="{ active: activeStatus === tag.key }"
        @click="$emit('update:activeStatus', tag.key)"
        >{{ tag.label }}</span
      >
    </div>

    <div class="filter-row">
      <div class="filter-item" @click="$emit('open-category')">
        <span>{{ category || '品类' }}</span>
        <van-icon name="arrow-down" size="12" />
      </div>
      <div class="filter-item" @click="$emit('open-material')">
        <span>{{ material || '材质' }}</span>
        <van-icon name="arrow-down" size="12" />
      </div>
      <div class="filter-item" @click="$emit('open-price')">
        <span>{{ priceLabel || '价格' }}</span>
        <van-icon name="arrow-down" size="12" />
      </div>
      <div class="filter-item sort-item" @click="$emit('cycle-sort')">
        <span>{{ sortLabel }}</span>
        <van-icon :name="sortIcon" size="12" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  statusTabs: { key: string; label: string }[]
  activeStatus: string
  category?: string
  material?: string
  priceLabel?: string
  sortLabel: string
  sortIcon: string
}>()

defineEmits<{
  (e: 'update:activeStatus', key: string): void
  (e: 'open-category'): void
  (e: 'open-material'): void
  (e: 'open-price'): void
  (e: 'cycle-sort'): void
}>()
</script>

<style scoped>
.filter-section {
  background: #fff;
  padding-bottom: 8px;
}
.filter-tags {
  display: flex;
  gap: 8px;
  padding: 8px 16px;
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

.filter-row {
  display: flex;
  gap: 0;
  padding: 0 12px;
}
.filter-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px 4px;
  font-size: 13px;
  color: #333;
  cursor: pointer;
  border-right: 1px solid #f0f0f0;
  overflow: hidden;
  white-space: nowrap;
}
.filter-item:last-child {
  border-right: none;
}
.sort-item {
  color: #07c160;
}
</style>
