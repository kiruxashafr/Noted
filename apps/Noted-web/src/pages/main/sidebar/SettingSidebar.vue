<script setup lang="ts">
import Drawer from "primevue/drawer";
import Menu from "primevue/menu";
import { ref } from "vue";
import { useAuthStore } from "../../../stores/auth.store";
import { useRouter } from "vue-router";


const authStore = useAuthStore()
const router = useRouter()



const visible = defineModel<boolean>('visible');
</script>
<template>
  <div class="card flex justify-center">
    <Drawer
      v-model:visible="visible"
    >
      <template #header>
        <div
          class="user-card"
          @click="router.push('/')"
        >
          <i class="pi pi-chevron-left" />
          <div
            class="user-profile"
          >
            Вернуться в приложение
          </div>
        </div>
      </template>
    </Drawer>
  </div>
</template>

<style scoped>
.user-card {
  display: flex; 
  flex-direction: row; 
  width: 100%;
  padding: 3px;
  border-radius: 6px;
  align-items: center;
  justify-content: flex-start;
}


.user-profile{
    background-color: transparent;
    padding: 5px;
    gap: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.user-card:hover{
    cursor: pointer;
    background-color: var(--neutral-active);
}
.user-profile i {
    font-size: 1rem;
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
