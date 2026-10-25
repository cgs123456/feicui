<template>
  <van-dialog
    v-model:show="show"
    title="关于我们"
    show-cancel-button
    :show-confirm-button="false"
    aria-label="关于我们弹窗"
  >
    <div class="dialog-body">
      <p class="dialog-info">翡翠商城 v1.0.0</p>
      <p class="dialog-info">
        翡翠商城是专业的翡翠珠宝电商平台，致力于为消费者提供高品质的天然翡翠饰品。
      </p>
      <p class="dialog-info">我们与缅甸矿区直接合作，每件翡翠均经过权威鉴定，确保品质如一。</p>
    </div>
  </van-dialog>
</template>

<script setup lang="ts">
const show = defineModel<boolean>('show', { default: false })
</script>

<style scoped>
/* Dialog */
.dialog-body {
  padding: 8px 0;
}

.dialog-info {
  font-size: 14px;
  color: #666;
  line-height: 1.8;
  margin: 0;
  padding: 4px 16px;
}
</style>
