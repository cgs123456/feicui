<template>
  <van-dialog
    v-model:show="visible"
    :title="title"
    show-cancel-button
    :confirm-button-text="confirmButtonText"
    :confirm-button-color="confirmButtonColor"
    @confirm="handleConfirm"
  >
    <div class="input-dialog__body">
      <van-field v-model="text" :placeholder="placeholder" />
    </div>
  </van-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = defineProps<{
  show: boolean
  title: string
  placeholder?: string
  confirmButtonText?: string
  confirmButtonColor?: string
}>()

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
  (e: 'confirm', value: string): void
}>()

const visible = computed({
  get: () => props.show,
  set: (value: boolean) => emit('update:show', value)
})

const text = ref('')

watch(
  () => props.show,
  show => {
    if (show) text.value = ''
  }
)

function handleConfirm() {
  emit('confirm', text.value.trim())
}
</script>

<style scoped>
.input-dialog__body {
  padding: 8px 0;
}

.input-dialog__body :deep(.van-field) {
  padding: 10px 16px;
}
</style>
