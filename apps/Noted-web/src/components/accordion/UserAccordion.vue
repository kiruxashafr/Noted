<script setup lang="ts">
import Menu from "primevue/menu";
import { ref } from "vue";
import { useAuthStore } from "../../stores/auth.store";
import { useRouter } from "vue-router";
import UserPhoto from "../photo/UserPhoto.vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const menu = ref();
const authStore = useAuthStore();
const router = useRouter();
const userName = ref(authStore.user?.name);

const items = ref([
  {
    label: t("user-menu.options"),
    items: [
      {
        label: t("user-menu.edit-profile"),
        icon: "pi pi-pencil",
        command: () => {
          router.push({ name: "setting-account" });
        },
      },
      {
        label: t("user-menu.logout"),
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
</script>

<template>
  <div class="user-card" @click="openProfile">
    <UserPhoto />

    <div class="user-profile">
      {{ userName }}<i class="pi pi-angle-down" />
    </div>
    <Menu id="overlay_menu" ref="menu" :model="items" :popup="true" />
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
</style>