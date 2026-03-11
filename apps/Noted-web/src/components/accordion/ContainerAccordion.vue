<script setup lang="ts">
import Menu from "primevue/menu";
import { ref } from "vue";
import { useBlockStore } from "../../stores/block.store";
const props = defineProps<{
  blockId: string;
}>();
const menu = ref();
const blockStore = useBlockStore() 
const items = ref([
  {
    label: "Options",
    items: [
      {
        label: "Удалить блок",
        icon: "pi pi-trash",
        command: () => {
          blockStore.deleteContainer(props.blockId)
        },
      },
    ],
  },
]);

const open = (event: any) => {
  event.stopPropagation();
  menu.value.toggle(event);
};

</script>
<template>
  <div
    class="user-card"
    @click="open"
  >
    <i class="pi pi-ellipsis-v" />

    <Menu
      id="overlay_menu"
      ref="menu"
      :model="items"
      :popup="true"
    />
  </div>
</template>
<style scoped>
    .user-card {
        display: flex;
        justify-content: center;
        align-items: center;
        border-radius: 4px;
        padding: 5px;
    }
    .user-card:hover {
        background-color: var(--neutral-color);
    }
</style>