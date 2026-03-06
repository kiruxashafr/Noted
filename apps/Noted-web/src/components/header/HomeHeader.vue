<script setup="ts">
import { onMounted, ref } from "vue";

const sidebarVisible = ref(false);

onMounted(() => {
  if (window.innerWidth > 1024) {
    sidebarVisible.value = true;
  }
});
</script>
<template>
  <header class="layout-header flex items-center px-4 py-2 border-b border-gray-200 dark:border-surface-700">
    <div style="align-items: center; display: flex">Noted</div>
  </header>
</template>
<style scoped>
.layout-header {
  display: flex;
  height: 60px;
}
</style>
