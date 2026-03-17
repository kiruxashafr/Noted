<script setup lang="ts">
import { onBeforeUnmount, watch } from "vue";
import { useEditor, EditorContent } from "@tiptap/vue-3";
import StarterKit from "@tiptap/starter-kit";
import { TextMetaContent } from "@noted/types";

// 1. Props и Model
const meta = defineModel<TextMetaContent>({ required: true });

// 2. Инициализация редактора
const editor = useEditor({
  content: meta.value.payload || { type: "doc", content: [{ type: "paragraph" }] },
  extensions: [StarterKit],
  editorProps: {
    attributes: {
      // Ваши стили для области ввода
      class: "m-0 text-lg leading-relaxed text-800 outline-none min-h-[100px] p-3",
    },
  },
  onUpdate: ({ editor }) => {
    const json = editor.getJSON();
    if (JSON.stringify(json) === JSON.stringify(meta.value.payload)) return;
    meta.value = { ...meta.value, payload: json };
  },
});

// 3. Синхронизация внешних изменений
watch(() => meta.value.payload, (newValue) => {
  if (!editor.value || !newValue) return;
  if (JSON.stringify(newValue) === JSON.stringify(editor.value.getJSON())) return;
  editor.value.commands.setContent(newValue, { emitUpdate: false });
});

onBeforeUnmount(() => editor.value?.destroy());
</script>

<template>
  <div class="editor-wrapper border-1 border-300 border-round overflow-hidden bg-white">
    
    <div v-if="editor" class="toolbar flex flex-wrap gap-1 p-2 bg-gray-50 border-bottom-1 border-300">
      <button 
        @click="editor.chain().focus().toggleBold().run()"
        :class="{ 'is-active': editor.isActive('bold') }"
        class="p-button-sm"
        title="Bold"
      >
        <i class="pi pi-bold"></i>
      </button>
      
      <button 
        @click="editor.chain().focus().toggleItalic().run()"
        :class="{ 'is-active': editor.isActive('italic') }"
        class="p-button-sm"
        title="Italic"
      >
        <i class="pi pi-italic"></i>
      </button>

      <span class="divider"></span>

      <button 
        @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
        :class="{ 'is-active': editor.isActive('heading', { level: 2 }) }"
        class="p-button-sm"
      >
        H2
      </button>

      <button 
        @click="editor.chain().focus().toggleBulletList().run()"
        :class="{ 'is-active': editor.isActive('bulletList') }"
        class="p-button-sm"
      >
        <i class="pi pi-list"></i>
      </button>

      <span class="divider"></span>

      <button @click="editor.chain().focus().undo().run()" :disabled="!editor.can().undo()">
        <i class="pi pi-undo"></i>
      </button>
      <button @click="editor.chain().focus().redo().run()" :disabled="!editor.can().redo()">
        <i class="pi pi-redo"></i>
      </button>
    </div>

    <div class="editor-body cursor-text" @click="editor?.commands.focus()">
      <editor-content :editor="editor" />
    </div>

  </div>
</template>

<style scoped>
/* Стили для кнопок (под PrimeVue/PrimeFlex) */
.toolbar button {
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 4px 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  transition: all 0.2s;
}

.toolbar button:hover {
  background: #f0f0f0;
}

.toolbar button.is-active {
  background: #e0e7ff;
  border-color: #6366f1;
  color: #6366f1;
}

.toolbar button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.divider {
  width: 1px;
  background: #ddd;
  margin: 0 4px;
}

/* Стилизация контента Tiptap */
:deep(.tiptap) {
  min-height: 100px;
}

:deep(.tiptap ul) {
  list-style-type: disc;
  padding-left: 1.5rem;
}
</style>