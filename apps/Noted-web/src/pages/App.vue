<script setup lang="ts">
import { RouterView } from "vue-router";
import Toast from "primevue/toast";
import { useBlockStore } from "../stores/container.store";
import { onMounted } from "vue";
import { useSocketStore } from "../stores/socket.store";

const blockStore = useBlockStore();
const socketStore = useSocketStore()


onMounted(() => {
  blockStore.getContainerTitle();
  socketStore.connect()
});

</script>

<template>
  <RouterView />
  <Toast position="top-right" />
</template>

<style scoped lang="css"></style>
