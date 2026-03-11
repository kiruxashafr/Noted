import { defineStore } from "pinia";
import $api from "../api/instance";
import { BlockWithPath, CreateBlockRequest, PageTitle, UpdateBlockRequest } from "@noted/types/block.types";
import { ref } from "vue";
import { useToast } from "primevue/usetoast";

export const useBlockStore = defineStore(
  "block",
  () => {
    const toast = useToast();
    const blocks = ref<BlockWithPath[]>([]);
    const containersTitle = ref<PageTitle[]>([]);

    const upsertItems = (items: BlockWithPath[]) => {
      items.forEach((newItem) => {
        const index = blocks.value.findIndex((b) => b.id === newItem.id);
        if (index !== -1) {
          blocks.value[index] = newItem;
        } else {
          blocks.value.push(newItem);
        }
      });
    };

    async function getContainer(containerId: string) {
      try {
        const { data } = await $api.get<BlockWithPath[]>("/api/blocks/container", {
          params: { containerId }
        });

        upsertItems(data)
        return data;
      } catch (error) {
        toast.add({
          severity: "error",
          summary: "Ошибка",
          detail: "Не удалось получить страницу",
          life: 3000,
        });
        throw error; 
      }
    }

    async function getPage(containerId: string) {
      blocks.value = []
      try {
        const container = await getContainer(containerId);
        if (container) {
          await getChildBlocks(container[0].id);
          return container; 
        }
      } catch (e) {
        console.error("Ошибка при получении страницы:", e);
        return null;
      }
    }

    async function getChildBlocks(blockId: string) {
      try {
        const { data } = await $api.get<BlockWithPath[]>("/api/blocks/child", { 
          params: { blockId } 
        });
        upsertItems(data);
      } catch (error) {
        toast.add({
          severity: "error",
          summary: "Ошибка",
          detail: "Не удалось получить дочерние блоки",
          life: 3000,
        });
      }
    }

    async function createBlock(createData: CreateBlockRequest) {
      try {
        const { data } = await $api.post<BlockWithPath>("/api/blocks/block", createData);
        upsertItems([data]);
      } catch (error) {
        toast.add({
          severity: "error",
          summary: "Ошибка",
          detail: "Не удалось создать блок",
          life: 3000,
        });
      }  
    }

    async function createContainer(createData:CreateBlockRequest) {
      try {
        const { data } = await $api.post<BlockWithPath>("/api/blocks/block", createData);
        await getContainerTitle()
      } catch (error) {
        toast.add({
          severity: "error",
          summary: "Ошибка",
          detail: "Не удалось создать блок",
          life: 3000,
        });
      }  
    }

    async function updateBlock(updateData: UpdateBlockRequest) {
      const previousBlocks = [...blocks.value];
      const index = blocks.value.findIndex((b) => b.id === updateData.blockId);

      if (index !== -1) {
        blocks.value[index] = { 
          ...blocks.value[index], 
          meta: updateData.meta as any, 
          order: updateData.order ?? blocks.value[index].order
        };
      }

      try {
        const { data } = await $api.patch<BlockWithPath>("/api/blocks/block", updateData);
        upsertItems([data]);
      } catch (error) {
        blocks.value = previousBlocks;
        toast.add({ 
          severity: "error", 
          summary: "Ошибка", 
          detail: "Не удалось сохранить изменения, данные откачены",
          life: 3000 
        });
      }
    }

    async function getContainerTitle() {
      try {
        const { data } = await $api.get<PageTitle[]>("/api/blocks/page/title");
        containersTitle.value = data.map((item) => ({
          ...item,
          updatedAt: new Date(item.updatedAt),
        }));
      } catch (error) {
        console.error("Ошибка при загрузке заголовков:", error);
      }
    }

    async function deleteBlock(blockId: string) {
      try {
        await $api.delete("/api/blocks/page/title", {params: {blockId}});
        blocks.value = blocks.value.filter(block => block.id !== blockId)
      } catch (error) {
        console.error("Ошибка при загрузке заголовков:", error);
      }
    }

    return {
      blocks,
      containersTitle,
      getChildBlocks,
      getContainer,
      getPage,
      deleteBlock,
      updateBlock,
      createBlock,
      createContainer,
      getContainerTitle
    };
  },
  {
    persist: {
      storage: localStorage,
      pick: ["blocks", "containersTitle"],
    },
  },
);