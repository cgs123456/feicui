<template>
  <div class="card account-info">
    <van-image
      :src="
        userStore.userInfo.avatar ||
        'https://ui-avatars.com/api/?name=翡&background=07C160&color=fff&size=100'
      "
      width="56"
      height="56"
      fit="cover"
      round
      lazy-load
      class="account-avatar"
    />
    <div class="account-meta">
      <h3 class="account-name">
        {{ userStore.userInfo.name }}
      </h3>
      <p class="account-phone">
        {{ userStore.userInfo.phone }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
</script>

<style scoped>
.card {
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgb(0 0 0 / 6%);
}

.account-info {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px;
}

.account-avatar {
  flex-shrink: 0;
}

.account-meta {
  flex: 1;
  min-width: 0;
}

.account-name {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.account-phone {
  font-size: 13px;
  color: #999;
  margin-top: 4px;
}
</style>
