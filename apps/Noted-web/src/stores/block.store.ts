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

    type CreateBlockDTO = Omit<CreateBlockRequest, 'order'>;

      async function createBlock({ blockType, meta, parentId }: CreateBlockDTO) {
        const createData: CreateBlockRequest = {
          blockType,
          meta,
          order: findMaxOrder() + 100,
          parentId
        }
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

async function updateContainerTitle(containerId: string, newTitle: string) {
      const titleIndex = containersTitle.value.findIndex((c) => c.id === containerId);
      if (titleIndex !== -1) {
        containersTitle.value[titleIndex].title = newTitle;
      }

      const blockIndex = blocks.value.findIndex((b) => b.id === containerId);
      if (blockIndex !== -1) {
        const currentMeta = (blocks.value[blockIndex].meta || {}) as Record<string, any>;
        
        blocks.value[blockIndex].meta = { 
          ...currentMeta, 
          title: newTitle 
        };
      }
      const updateData: UpdateBlockRequest = {
        blockId: containerId,
        blockType: "CONTAINER",
        meta: { title: newTitle }
      }

      try {
        await $api.patch("/api/blocks/block", updateData);
      } catch (error) {
        console.error("Ошибка при обновлении заголовка:", error);
        toast.add({
          severity: "error",
          summary: "Ошибка",
          detail: "Не удалось сохранить название",
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

    async function deleteContainer(blockId: string) {
      try {
        await $api.delete("/api/blocks/block", {params: {blockId}});
        containersTitle.value = containersTitle.value.filter(block => block.id !== blockId)
        toast.add({ 
          severity: "success", 
          summary: "Успешно", 
          detail: "<Блок удален>",
          life: 3000 
        });
      } catch (error) {
        console.error("Ошибка при загрузке заголовков:", error);
      }
    }

    async function deleteBlock(blockId: string) {
      try {
        await $api.delete("/api/blocks/block", {params: {blockId}});
        blocks.value = blocks.value.filter(block => block.id !== blockId)
        toast.add({ 
          severity: "success", 
          summary: "Успешно", 
          detail: "<Блок удален>",
          life: 3000 
        });
      } catch (error) {
        console.error("Ошибка при загрузке заголовков:", error);
      }
    }

    const findMaxOrder = () => {
      if (blocks.value.length === 0) return 0;

      return blocks.value.reduce(
        (max, b) => Math.max(max, b.order || 0), 0
      );
    };

    return {
      blocks,
      containersTitle,
      getChildBlocks,
      getContainer,
      getPage,
      deleteBlock,
      deleteContainer,
      updateBlock,
      createBlock,
      createContainer,
      getContainerTitle,
      updateContainerTitle
    };
  },
  {
    persist: {
      storage: localStorage,
      pick: ["blocks", "containersTitle"],
    },
  },
);