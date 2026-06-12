<template>
  <van-empty :image="image" :description="description">
    <slot />
  </van-empty>
</template>

<script setup lang="ts">
defineProps<{
  description?: string
  image?: 'default' | 'error' | 'network' | 'search'
}>()
</script>
