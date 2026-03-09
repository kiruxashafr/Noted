import { defineStore } from "pinia";
import $api from "../api/instance";
import { BlockWithPath, CreateBlockRequest, UpdateBlockRequest } from "@noted/types/block.types";
import { ref } from "vue";
import { useToast } from "primevue/usetoast";

export const useBlockStore = defineStore(
  "block",
  () => {
    const toast = useToast();
    const blocks = ref<BlockWithPath[]>([]);

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

    async function updateBlock(updateData: UpdateBlockRequest) {
      // 1. Сохраняем копию для отката (Optimistic UI)
      const previousBlocks = [...blocks.value];
      const index = blocks.value.findIndex((b) => b.id === updateData.blockId);

      if (index !== -1) {
        // 2. Мгновенно обновляем локально
        blocks.value[index] = { 
          ...blocks.value[index], 
          meta: updateData.meta as any, // Приведение к any для совместимости с JsonValue
          order: updateData.order ?? blocks.value[index].order
        };
      }

      try {
        // 3. Запрос в фоне. Теперь бэкенд вернет актуальный BlockWithPath
        const { data } = await $api.patch<BlockWithPath>("/api/blocks/block", updateData);
        upsertItems([data]);
      } catch (error) {
        // 4. В случае ошибки возвращаем как было
        blocks.value = previousBlocks;
        toast.add({ 
          severity: "error", 
          summary: "Ошибка", 
          detail: "Не удалось сохранить изменения, данные откачены",
          life: 3000 
        });
      }
    }

    return {
      blocks,
      getChildBlocks,
      updateBlock,
      createBlock
    };
  },
  {
    persist: {
      storage: localStorage,
      pick: ["blocks"],
    },
  },
);