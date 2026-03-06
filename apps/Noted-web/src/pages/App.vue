<script setup lang="ts">
import { RouterView } from "vue-router";
import Toast from "primevue/toast";
import { useBlockStore } from "../stores/container.store";
import { onMounted } from "vue";

const blockStore = useBlockStore();

onMounted(() => {
  blockStore.getContainerTitle();
});
</script>

<template>
  <RouterView />
  <Toast position="top-right" />
</template>

<style scoped lang="css"></style>
