<script setup lang="ts">
import { onMounted, ref } from 'vue';
import AccountSidebar from '../components/sidebar/AccountSidebar.vue';
import HomeHeader from '../components/header/HomeHeader.vue';

const sidebarVisible = ref(false);
onMounted(() => {
if (window.innerWidth > 1024) {
  sidebarVisible.value = true;
}
});
</script>

<template>
  <div class="layout-wrapper">
    <header class="layout-header flex items-center px-4 py-2 border-b border-gray-200 dark:border-surface-700">
      <Button 
        icon="pi pi-bars" 
        style="background-color: transparent !important;" 
        @click="sidebarVisible = true"
      />
      <div style="align-items: center; display: flex;">
        <HomeHeader />
      </div>
    </header>
    <main class="layout-content">
      <router-view />
    </main>
    <AccountSidebar 
      v-model:visible="sidebarVisible"
    />
  </div>
</template>

<style scoped>
.layout-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.layout-header {
    display: flex;
    height: 60px;
}

.layout-content {
    flex: 1;
    display: flex;
    justify-content: center;
    padding: 3%;
}

.settings-section {
  display: flex;
  flex-direction: column;
  align-items: center;

  gap: 1rem;
}
</style>