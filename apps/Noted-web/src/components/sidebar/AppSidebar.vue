<script setup lang="ts">
import Drawer from "primevue/drawer";
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import ContainerTitle from "../blocks/ContainerTitle.vue";

import CreateContainerButton from "../buttons/CreateContainerButton.vue";
import UserAccordion from "../accordeon/UserAccordion.vue";
import { useBlockStore } from "../../stores/block.store";

const blockStore = useBlockStore()
const router = useRouter();
const route = useRoute();
const visible = defineModel<boolean>("visible");

const isHomeActive = computed(() => {
  return route.name === "home-dashboard";
});

</script>
<template>
  <div class="card flex justify-center">
    <Drawer
      v-model:visible="visible"
      :modal="false"
      :dismissable="false"
    >
      <template #closeicon>
        <i
          class="pi my-sidebar-icon"
          style="font-size: 20px; color: #949aa1"
        />
      </template>
      <template #header>
        <UserAccordion />
      </template>
      <div class="nav-buttons">
        <Button
          label="Домашняя страница"
          icon="pi pi-home"
          class="nav-button"
          :class="{ 'active-route': isHomeActive }"
          @click="router.push({ name: 'home-dashboard' })"
        />
      </div>
      <div class="containers-list">
        <text style="padding-left: 5px;">
          Страницы:
        </text>
        <div
          v-for="page in blockStore.containersTitle"
          :key="page.id"
          class="container-wrapper"
          :class="{ 'active-route': route.name === 'note' && route.params.id === page.id }"
        >
          <ContainerTitle
            :id="page.id"
            :title="page.title"
            :updated-at="page.updatedAt" 
          />
        </div>
        <CreateContainerButton />
      </div>
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
  background: var(--neutral-active) !important;
  border-radius: 8px;
}

.active-route :deep(*) {
  color: white !important;
  font-weight: 700 !important;
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

.nav-buttons {
  display: flex;
  flex-direction: column;
  margin-bottom: 20px;
  margin-top: 5px;
}

.nav-button {
  background-color: transparent !important;
  width: 100%;
  justify-content: flex-start;
  padding-left: 5px;
}


.containers-list {
  display: flex;
  flex-direction: column;
  font-weight: 700;
  gap: 5px;
}


:deep(.p-card-subtitle) {
  display: none;
}

:deep(.p-card-title) {
  font-size: 1rem;
  font-weight: 200;
}
</style>
