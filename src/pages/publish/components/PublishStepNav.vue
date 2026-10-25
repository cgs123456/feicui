<template>
  <div class="publish-steps" role="navigation" aria-label="发布步骤">
    <div
      v-for="(step, idx) in publishSteps"
      :key="idx"
      class="step-item"
      :class="{
        active: currentStep === idx,
        completed: currentStep > idx,
        future: currentStep < idx
      }"
      :aria-label="
        '步骤 ' +
        (idx + 1) +
        ': ' +
        step +
        (currentStep === idx ? '，当前步骤' : currentStep > idx ? '，已完成' : '')
      "
      :aria-current="currentStep === idx ? 'step' : undefined"
    >
      <div class="step-circle">
        <van-icon v-if="currentStep > idx" name="success" size="16" color="#fff" />
        <span v-else>{{ idx + 1 }}</span>
      </div>
      <span class="step-label">{{ step }}</span>
      <div
        v-if="idx < publishSteps.length - 1"
        class="step-line"
        :class="{ done: currentStep > idx }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { publishSteps } from '../constants'

defineProps<{
  currentStep: number
}>()
</script>

<style scoped>
.publish-steps {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 24px;
  background: #fff;
  gap: 0;
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  flex: 1;
}

.step-circle {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  z-index: 1;
}

.step-item.future .step-circle {
  background: #e5e5e5;
  color: #999;
}

.step-item.active .step-circle {
  background: #07c160;
  color: #fff;
}

.step-item.completed .step-circle {
  background: #07c160;
  color: #fff;
}

.step-label {
  font-size: 11px;
  color: #999;
  margin-top: 6px;
}

.step-item.active .step-label {
  color: #07c160;
  font-weight: 600;
}

.step-item.completed .step-label {
  color: #07c160;
}

.step-line {
  position: absolute;
  top: 14px;
  left: calc(50% + 14px);
  width: calc(100% - 28px);
  height: 2px;
  background: #e5e5e5;
}

.step-line.done {
  background: #07c160;
}
</style>
