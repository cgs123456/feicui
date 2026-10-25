<template>
  <van-action-sheet :show="show" title="价格区间" @update:show="$emit('update:show', $event)">
    <div class="price-sheet">
      <div class="price-inputs">
        <van-field
          :model-value="minInput ?? undefined"
          type="number"
          placeholder="最低价"
          @update:model-value="
            (v: string | number) => $emit('update:minInput', v ? Number(v) : null)
          "
        />
        <span class="price-sep">—</span>
        <van-field
          :model-value="maxInput ?? undefined"
          type="number"
          placeholder="最高价"
          @update:model-value="
            (v: string | number) => $emit('update:maxInput', v ? Number(v) : null)
          "
        />
      </div>
      <van-button type="primary" block round @click="$emit('apply')"> 确定 </van-button>
      <div class="quick-prices">
        <span
          v-for="pr in quickPriceRanges"
          :key="pr.label"
          class="sheet-option"
          :class="{ active: activeLabel === pr.label }"
          @click="$emit('quick-set', pr)"
          >{{ pr.label }}</span
        >
      </div>
    </div>
  </van-action-sheet>
</template>

<script setup lang="ts">
defineProps<{
  show: boolean
  minInput: number | null
  maxInput: number | null
  activeLabel: string
}>()

defineEmits<{
  (e: 'update:show', value: boolean): void
  (e: 'update:minInput', value: number | null): void
  (e: 'update:maxInput', value: number | null): void
  (e: 'apply'): void
  (e: 'quick-set', pr: { label: string; min: number; max: number }): void
}>()

const quickPriceRanges = [
  { label: '5000以下', min: 0, max: 5000 },
  { label: '5000-2万', min: 5000, max: 20000 },
  { label: '2万-5万', min: 20000, max: 50000 },
  { label: '5万-10万', min: 50000, max: 100000 },
  { label: '10万以上', min: 100000, max: 99999999 }
]
</script>

<style scoped>
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

.price-sheet {
  padding: 16px;
}
.price-inputs {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}
.price-inputs .van-field {
  flex: 1;
  padding: 8px 12px;
  background: #f5f5f5;
  border-radius: 8px;
}
.price-sep {
  color: #999;
}
.quick-prices {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid #f0f0f0;
}
</style>
