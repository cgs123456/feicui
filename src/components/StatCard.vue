<template>
  <div class="stat-card" role="region" :aria-label="title + '：' + value">
    <div class="stat-left">
      <div v-if="icon" class="stat-icon-wrap" :style="{ background: `${color}15` }">
        <van-icon :name="icon" :color="color" size="22" />
      </div>
      <div class="stat-text">
        <span class="stat-title">{{ title }}</span>
        <span class="stat-value">{{ value }}</span>
      </div>
    </div>
    <div
      v-if="trend !== undefined"
      class="stat-trend"
      :class="trend >= 0 ? 'trend-up' : 'trend-down'"
    >
      <van-icon :name="trend >= 0 ? 'arrow-up' : 'arrow-down'" size="12" />
      <span>{{ Math.abs(trend) }}%</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: ''
  },
  value: {
    type: [String, Number],
    default: ''
  },
  icon: {
    type: String,
    default: ''
  },
  color: {
    type: String,
    default: '#07C160'
  },
  trend: {
    type: Number,
    default: undefined
  }
})
</script>

<style scoped>
.stat-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-radius: 10px;
  padding: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.stat-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-title {
  font-size: 12px;
  color: #999;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  color: #333;
  line-height: 1;
}

.stat-trend {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 13px;
  font-weight: 600;
  flex-shrink: 0;
  padding: 4px 8px;
  border-radius: 6px;
}

.trend-up {
  color: #07c160;
  background: #ecf9f2;
}

.trend-down {
  color: #ff4d4f;
  background: #fff0f0;
}
</style>
