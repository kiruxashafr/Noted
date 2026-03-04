<script setup lang="ts">
import Drawer from "primevue/drawer";
import { useRouter } from "vue-router";



const router = useRouter()



const visible = defineModel<boolean>('visible');
</script>
<template>
  <div class="card flex justify-center">
    <Drawer
      v-model:visible="visible"
      :modal="false"
      :dismissable="false"
    >
      <template #closeicon>
        <svg
          class="custom-icon"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
        >
          <g id="chevron-down">
            <path
              d="M6 21a3 3 0 0 1 -3 -3v-12a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v12a3 3 0 0 1 -3 3zm12 -16h-8v14h8a1 1 0 0 0 1 -1v-12a1 1 0 0 0 -1 -1"
              fill="currentColor"
            />
          </g>
        </svg>
      </template>
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
