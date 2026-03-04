<script setup>
import { onMounted, ref } from 'vue';
import Button from 'primevue/button';
import AppSidebar from './sidebar/AppSidebar.vue';
import { useRouter } from 'vue-router';
import AccountSidebar from './sidebar/AccountSidebar.vue';
import HomeHeader from './header/HomeHeader.vue';

const sidebarVisible = ref(false);

const router = useRouter()

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
        <HomeHeader
          v-if="
            router.currentRoute.value.name === 'home' ||
              router.currentRoute.value.name === 'account'" 
        />
      </div>
    </header>

    <main class="layout-content">
      <router-view />
    </main>
    <AccountSidebar 
      v-if="router.currentRoute.value.name === 'account'"
      v-model:visible="sidebarVisible" 
    />
    <AppSidebar
      v-if="router.currentRoute.value.name === 'home'"
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
</style>