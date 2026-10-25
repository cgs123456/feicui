<template>
  <van-popup
    v-model:show="show"
    position="bottom"
    round
    :style="{ height: '40vh' }"
    aria-label="隐私设置"
  >
    <div class="popup-header">
      <span class="popup-title">隐私设置</span>
      <van-icon name="cross" size="20" @click="show = false" />
    </div>
    <van-cell-group>
      <van-cell title="显示手机号" center>
        <template #right-icon>
          <van-switch v-model="privacyShowPhone" size="24" />
        </template>
      </van-cell>
      <van-cell title="通过手机号找到我" center>
        <template #right-icon>
          <van-switch v-model="privacySearchByPhone" size="24" />
        </template>
      </van-cell>
      <van-cell title="个性化推荐" center>
        <template #right-icon>
          <van-switch v-model="privacyRecommend" size="24" />
        </template>
      </van-cell>
    </van-cell-group>
  </van-popup>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const show = defineModel<boolean>('show', { default: false })

const privacyShowPhone = ref(true)
const privacySearchByPhone = ref(true)
const privacyRecommend = ref(true)
</script>

<style scoped>
/* Popup */
.popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #f5f5f5;
}

.popup-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}
</style>
