<template>
  <div class="stepper-steps">
    <div
      v-for="(step, idx) in steps"
      :key="step.key"
      class="stepper-item"
      :class="{ active: stepIdx >= idx, current: stepIdx === idx }"
    >
      <div class="step-dot">
        <van-icon v-if="stepIdx > idx" name="success" size="14" />
        <span v-else class="dot-inner" />
      </div>
      <span class="step-label">{{ step.label }}</span>
      <span v-if="step.time" class="step-time">{{ step.time }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  steps: { key: string; label: string; time: string }[]
  stepIdx: number
}>()
</script>

<style scoped>
.stepper-steps {
  display: flex;
  justify-content: space-between;
}

.stepper-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  flex: 1;
  position: relative;
}

.stepper-item::after {
  content: '';
  position: absolute;
  top: 10px;
  left: 50%;
  width: 100%;
  height: 2px;
  background: #eee;
  z-index: 0;
}

.stepper-item:last-child::after {
  display: none;
}

.stepper-item.active::after {
  background: #07c160;
}

.step-dot {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
  background: #fff;
}

.stepper-item.active .step-dot {
  border-color: #07c160;
  background: #07c160;
  color: #fff;
}

.dot-inner {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ddd;
}

.stepper-item.active .dot-inner {
  background: #fff;
}

.step-label {
  font-size: 11px;
  color: #999;
}

.stepper-item.active .step-label,
.stepper-item.current .step-label {
  color: #07c160;
  font-weight: 600;
}

.step-time {
  font-size: 10px;
  color: #bbb;
}
</style>
