<script setup lang="ts">
import { RouterView } from "vue-router";
import Toast from "primevue/toast";
import { onMounted } from "vue";
import { useSocketStore } from "../stores/socket.store";
import { useContainerStore } from "../stores/container.store";

const containerStore = useContainerStore();
const socketStore = useSocketStore();

onMounted(() => {
  containerStore.getContainerTitle();
  socketStore.connect();
});
</script>

<template>
  <RouterView />
  <Toast position="top-right" />
</template>

<style scoped lang="css"></style>
