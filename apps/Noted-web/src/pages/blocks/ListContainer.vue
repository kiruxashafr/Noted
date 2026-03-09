<script setup lang="ts">
import { useRouter } from "vue-router";
import ContainerTitle from "../../components/blocks/ContainerTitle.vue";
import { useContainerStore } from "../../stores/container.store";

const router = useRouter()
const containerStore = useContainerStore();

const handlePageClick = (id: string) => {
  router.push({ 
    name: "note",
    params: { id } 
  });
};
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
      @click="handlePageClick(page.id)"
       />
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
