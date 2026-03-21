<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const sidebarVisible = ref(false);

onMounted(() => {
  if (window.innerWidth > 1024) {
    sidebarVisible.value = true;
  }
});
</script>

<template>
  <header class="layout-header flex items-center px-4 py-2 border-b border-gray-200 dark:border-surface-700">
    <div style="align-items: center; display: flex">{{ t('common.app-name') }}</div>
  </header>
</template>

<style scoped>
.layout-header {
  display: flex;
  height: 60px;
}
</style>