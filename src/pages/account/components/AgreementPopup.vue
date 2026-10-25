<template>
  <van-popup
    v-model:show="show"
    position="bottom"
    round
    :style="{ height: '60vh' }"
    aria-label="用户协议"
  >
    <div class="popup-header">
      <span class="popup-title">用户协议</span>
      <van-icon name="cross" size="20" @click="show = false" />
    </div>
    <div class="popup-body">
      <h4>一、总则</h4>
      <p>欢迎使用翡翠商城。本协议是您与翡翠商城之间关于使用本平台服务的法律协议。</p>
      <h4>二、账号注册</h4>
      <p>用户应提供真实、准确的注册信息。因信息不实导致的后果由用户自行承担。</p>
      <h4>三、商品交易</h4>
      <p>
        平台展示的商品信息仅供参考，具体以实物为准。翡翠为天然宝石，每件商品存在细微差异属正常现象。
      </p>
      <h4>四、售后服务</h4>
      <p>支持7天无理由退换货，商品需保持原状。定制商品除外。</p>
      <h4>五、免责声明</h4>
      <p>因不可抗力导致的交易中断，平台不承担责任。</p>
    </div>
  </van-popup>
</template>

<script setup lang="ts">
const show = defineModel<boolean>('show', { default: false })
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

.popup-body {
  padding: 16px;
  max-height: calc(60vh - 53px);
  overflow-y: auto;
}

.popup-body h4 {
  font-size: 14px;
  color: #333;
  margin: 14px 0 6px;
}

.popup-body h4:first-child {
  margin-top: 0;
}

.popup-body p {
  font-size: 13px;
  color: #666;
  line-height: 1.8;
  margin: 0;
}
</style>
