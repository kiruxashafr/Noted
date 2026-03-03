
<template>
  <div class="card flex justify-center">
    <Drawer
      v-model:visible="visible"
      header="Menu"
    >
      <div class="card flex justify-content-center">
        <div
          class="user-profile"
          @click="openProfile"
        >
          {{ userName }}<i class="pi pi-angle-down" />
        </div>
        <Menu
          id="overlay_menu"
          ref="menu"
          :model="items"
          :popup="true"
        />
      </div>
    </Drawer>
  </div>
</template>

<script setup lang="ts">
import Drawer from "primevue/drawer";
import Menu from "primevue/menu";
import { ref } from "vue";
import { useAuthStore } from "../../stores/auth.store";
import { useRouter } from "vue-router";

const menu = ref();
const authStore = useAuthStore()
const router = useRouter()
const items = ref([
    {
        label: 'Options',
        items: [
            {
                label: 'Изменить профиль',
                icon: 'pi pi-pencil',
                command: () => {router.push('/account')}
            },
            {
                label: 'Выход',
                icon: 'pi pi-sign-out',
                command: () => {onLogout()}
            }
        ]
    }
]);

const onLogout = () => {
  authStore.logout();
  router.push("/login");
};

const userName = ref(authStore.user?.name)

const openProfile = (event: any) => {
    menu.value.toggle(event);
};

const visible = defineModel<boolean>('visible');
</script>

<style scoped>
.user-profile{
    border: 1px solid var(--border-light);
    border-radius: 10px;
    padding: 10px;
    gap: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.user-profile:hover{
    cursor: pointer;
    background-color: var(--neutral-active);
}
.user-profile i {
    font-size: 1rem;

}
</style>
