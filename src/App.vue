<template>
  <div class="app-container">
    <main>
      <router-view v-slot="{ Component }">
        <keep-alive>
          <component :is="Component" />
        </keep-alive>
      </router-view>
    </main>
  </div>
</template>

<script setup></script>

<style scoped>
.app-container {
  max-width: 430px;
  margin: 0 auto;
  min-height: 100dvh;
  background: var(--bg-color);
  position: relative;
}
</style>
