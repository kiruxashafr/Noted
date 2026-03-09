<script setup lang="ts">
import { onBeforeUnmount, watch } from 'vue';
import { useEditor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import { TextMetaContent } from '@noted/types';

const meta = defineModel<TextMetaContent>({ required: true });

const editor = useEditor({
  content: (meta.value.payload && Object.keys(meta.value.payload).length > 0) 
    ? meta.value.payload 
    : { type: 'doc', content: [{ type: 'paragraph' }] },
  extensions: [StarterKit],
  editorProps: {
    attributes: {
      class: 'm-0 text-lg leading-relaxed text-800 outline-none min-h-[1.5rem]',
    },
  },
  onUpdate: ({ editor }) => {
    const json = editor.getJSON();
    
    if (!json.content || json.content.length === 0) return;

    if (JSON.stringify(json) === JSON.stringify(meta.value.payload)) return;

    meta.value = {
      ...meta.value,
      payload: json
    };
  },
});

watch(() => meta.value.payload, (newValue) => {
  if (!editor.value || !newValue) return;
  const currentJson = editor.value.getJSON();
  if (JSON.stringify(newValue) === JSON.stringify(currentJson)) return;
  
  editor.value.commands.setContent(newValue, { emitUpdate: false });
});

onBeforeUnmount(() => editor.value?.destroy());
</script>

<template>
  <div class="text-block group relative">
    <div class="p-2 border-round transition-colors hover:bg-gray-100 cursor-text min-h-[2rem]">
      <editor-content :editor="editor" />
      
      <span 
        v-if="editor && editor.isEmpty" 
        class="text-400 italic pointer-events-none absolute top-2 left-2"
      >
        Начните писать...
      </span>
    </div>

    <div class="absolute -left-5 top-3 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">
      <i class="pi pi-ellipsis-v text-400"></i>
    </div>
  </div>
</template>

<style>
/* Чтобы клик по пустой области фокусировал редактор */
.tiptap {
  min-height: 1.5rem;
  outline: none;
}
</style>