<script setup lang="ts">
import ContainerTitle from "../../components/blocks/ContainerTitle.vue";
import { useContainerStore } from "../../stores/container.store";
import CreateContainerButton from "../../components/buttons/CreateContainerButton.vue";

const containerStore = useContainerStore();

</script>
<template>
  <div class="pages">
    <h1>Домашняя страница</h1>

    <ContainerTitle
      v-for="page in containerStore.containersTitle"
      :id="page.id"
      :key="page.id"
      :title="page.title"
      :updated-at="page.updatedAt"
       />
      <CreateContainerButton />
  </div>
</template>
<style scoped>
.pages {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 800px;
  gap: 5px;
}
</style>
