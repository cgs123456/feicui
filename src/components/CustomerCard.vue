<template>
  <div
    class="customer-card"
    role="button"
    tabindex="0"
    :aria-label="customer.name"
    @click="emit('click', customer.id)"
  >
    <div class="customer-avatar">
      <van-image
        :src="customer.avatar"
        width="40"
        height="40"
        fit="cover"
        round
        lazy-load
        :show-error="true"
      />
    </div>
    <div class="customer-info">
      <div class="customer-top">
        <span class="customer-name">{{ customer.name }}</span>
        <span class="customer-time">{{ customer.lastTime }}</span>
      </div>
      <div class="customer-middle">
        <span class="customer-message">{{ customer.lastMessage }}</span>
        <span v-if="customer.unread > 0" class="customer-unread">{{
          customer.unread > 99 ? '99+' : customer.unread
        }}</span>
      </div>
      <div class="customer-tags" v-if="customer.tags && customer.tags.length > 0">
        <van-tag
          v-for="(tag, index) in customer.tags"
          :key="index"
          color="#E8F8EE"
          text-color="#07C160"
          size="small"
          plain
        >
          {{ tag }}
        </van-tag>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  customer: {
    type: Object,
    required: true,
    default: () => ({
      id: '',
      name: '',
      avatar: '',
      lastMessage: '',
      lastTime: '',
      tags: [],
      unread: 0
    })
  }
})

const emit = defineEmits(['click'])
</script>

<style scoped>
.customer-card {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;
  background: #fff;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
}

.customer-avatar {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
}

.customer-info {
  flex: 1;
  min-width: 0;
}

.customer-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.customer-name {
  font-size: 15px;
  font-weight: 700;
  color: #333;
}

.customer-time {
  font-size: 12px;
  color: #bbb;
  flex-shrink: 0;
  margin-left: 8px;
}

.customer-middle {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 4px;
}

.customer-message {
  font-size: 13px;
  color: #999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  margin-right: 8px;
}

.customer-unread {
  flex-shrink: 0;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background: #ff4d4f;
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.customer-tags {
  display: flex;
  gap: 4px;
  margin-top: 6px;
  flex-wrap: wrap;
}
</style>
