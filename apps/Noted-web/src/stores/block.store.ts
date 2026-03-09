import { defineStore } from "pinia";
import $api from "../api/instance";
import { BlockWithPath, CreateBlockRequest, PageTitle, UpdateBlockRequest } from "@noted/types/block.types";
import { ref } from "vue";
import { useToast } from "primevue/usetoast";
import { BlockType } from "generated/prisma/enums";
import { Block } from "generated/prisma/client";

export const useBlockStore = defineStore(
  "block",
  () => {
    const toast = useToast();
    
    const blocks = ref<BlockWithPath[]>([]);

    const upsertItems = (target: any[], items: any[]) => {
      items.forEach((newItem) => {
        const index = target.findIndex((b) => b.id === newItem.id);
        if (index !== -1) {
          target[index] = newItem;
        } else {
          target.push(newItem);
        }
      });
    };

    async function getChildBlocks(blockId: string) {
      try {
        const { data } = await $api.get<BlockWithPath[]>("/api/blocks/child", { 
          params: { blockId } 
        });
        upsertItems(blocks.value, data);
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
        const { data } = await $api.post<Block>("/api/blocks/block", createData);
        upsertItems(blocks.value, [data]);
 
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
    try {
        const { data } = await $api.patch<Block>("/api/blocks/block", updateData);
        upsertItems(blocks.value, [data]);
 
      } catch (error) {
        toast.add({
          severity: "error",
          summary: "Ошибка",
          detail: "Не удалось обновить блоки",
          life: 3000,
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