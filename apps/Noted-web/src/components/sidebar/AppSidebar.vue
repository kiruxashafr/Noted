<script setup lang="ts">
import Drawer from "primevue/drawer";
import Menu from "primevue/menu";
import { computed, ref } from "vue";
import { useAuthStore } from "../../stores/auth.store";
import { useRoute, useRouter } from "vue-router";

const menu = ref();
const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();
const userName = ref(authStore.user?.name);
const items = ref([
  {
    label: "Options",
    items: [
      {
        label: "Изменить профиль",
        icon: "pi pi-pencil",
        command: () => {
          router.push({ name: "setting-account" });
        },
      },
      {
        label: "Выход",
        icon: "pi pi-sign-out",
        command: () => {
          onLogout();
        },
      },
    ],
  },
]);

const onLogout = () => {
  authStore.logout();
  router.push({ name: "login" });
};

const openProfile = (event: any) => {
  menu.value.toggle(event);
};

const visible = defineModel<boolean>("visible");

const isHomeActive = computed(() => {
  return route.name === "home-dashboard";
});
</script>
<template>
  <div class="card flex justify-center">
    <Drawer v-model:visible="visible" :modal="false" :dismissable="false">
      <template #closeicon>
        <i class="pi my-sidebar-icon" style="font-size: 20px; color: #949aa1" />
      </template>
      <template #header>
        <div class="user-card" @click="openProfile">
          <div class="user-avatar">
            {{ useAuthStore().user?.name?.charAt(0).toUpperCase() }}
          </div>
          <div class="user-profile">{{ userName }}<i class="pi pi-angle-down" /></div>
          <Menu id="overlay_menu" ref="menu" :model="items" :popup="true" />
        </div>
      </template>
      <Button
        label="Домашняя страница"
        icon="pi pi-home"
        class="nav-button"
        :class="{ 'active-route': isHomeActive }"
        @click="router.push({ name: 'home-dashboard' })" />
    </Drawer>
  </div>
</template>

<style scoped>
.user-card {
  display: flex;
  gap: 10px;
  flex-direction: row;
  width: 100%;
  padding: 3px;
  border-radius: 6px;
}

.active-route {
  background: #2196f3;
  color: white;
  border-radius: 8px;
}

.user-profile {
  background-color: transparent;
  padding: 5px;
  gap: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-card:hover {
  cursor: pointer;
  background-color: var(--neutral-active);
}
.user-profile i {
  font-size: 1rem;
}

.user-avatar {
  height: 36px;
  width: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  border: 1px solid var(--border-light);
  background-color: rgb(36 50 205);
}

.nav-button {
  background-color: transparent !important;
  width: 100%;
  justify-content: flex-start;
}

.nav-button:hover {
  background-color: var(--neutral-active) !important;
}
</style>
