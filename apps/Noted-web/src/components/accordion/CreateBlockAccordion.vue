<script setup lang="ts">
import Menu from "primevue/menu";
import { ref } from "vue";
import { useBlockStore } from "../../stores/block.store";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const props = defineProps<{
  parentId: string;
}>();

const menu = ref();
const blockStore = useBlockStore();

const items = ref([
  {
    label: t("create-block.text"),
    icon: "pi pi-align-left",
    command: async () => {
      await blockStore.createBlock({
        blockType: "TEXT",
        parentId: props.parentId,
        meta: {
          payload: {
            type: "doc",
            content: [{ type: "paragraph" }],
          },
        },
      });
    },
  },
]);

const open = (event: any) => {
  event.stopPropagation();
  menu.value.toggle(event);
};
</script>

<template>
  <div style="cursor: pointer" class="add-button" @click="open">
    <i class="pi pi-plus" />
    <span>{{ t("create-block.add-block") }}</span>
  </div>
  <Menu id="overlay_menu" ref="menu" :model="items" :popup="true" />
</template>

<style scoped>
.add-button {
  display: flex;
  gap: 5px;
  align-items: center;
  width: fit-content;
}
</style>