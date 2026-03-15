<script setup lang="ts">
import { RouterView } from "vue-router";
import Toast from "primevue/toast";
import { onMounted } from "vue";
import { useSocketStore } from "../stores/socket.store";
import { useBlockStore } from "../stores/block.store";

const blockStore = useBlockStore();
const socketStore = useSocketStore();

onMounted(() => {
  blockStore.getContainerTitle();
  socketStore.connect();
});
</script>

<template>
  <RouterView />
  <Toast position="top-right" />
</template>

<style scoped lang="css"></style>
