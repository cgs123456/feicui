<template>
  <div class="state-provider">
    <slot v-if="!loading && !error && hasData" />
    <div v-if="loading" class="state-skeleton">
      <slot name="skeleton" />
    </div>
    <div v-if="!loading && error" class="state-error">
      <slot name="error">
        <van-icon name="warning-o" size="48" color="#ff976a" />
        <p>{{ error }}</p>
        <van-button size="small" type="primary" @click="$emit('retry')">重试</van-button>
      </slot>
    </div>
    <div v-if="!loading && !error && !hasData" class="state-empty">
      <slot name="empty">
        <van-empty :description="emptyText" />
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  loading: boolean
  error: string | null
  hasData: boolean
  emptyText?: string
}>()

defineEmits<{
  retry: []
}>()
</script>

<style scoped>
.state-provider {
  width: 100%;
}

.state-skeleton,
.state-error,
.state-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 16px;
}

.state-error p {
  font-size: 14px;
  color: #666;
  margin: 12px 0 16px;
  text-align: center;
}
</style>
