<script setup lang="ts">
import { EditorContent, useEditor } from '@tiptap/vue-3'
import { onBeforeUnmount, watch } from "vue";
import StarterKit from "@tiptap/starter-kit";
import { TextMetaContent } from "@noted/types";
import { BubbleMenu } from '@tiptap/vue-3/menus';
import BubbleMenuExtension from '@tiptap/extension-bubble-menu'


const meta = defineModel<TextMetaContent>({ required: true });

const editor = useEditor({
  content:
    meta.value.payload && Object.keys(meta.value.payload).length > 0
      ? meta.value.payload
      : { type: "doc", content: [{ type: "paragraph" }] },
  
  extensions: [
    StarterKit, 
    BubbleMenuExtension,
  ],

  onUpdate: ({ editor }) => {
    const json = editor.getJSON();
    if (!json.content || json.content.length === 0) return;

    if (JSON.stringify(json) === JSON.stringify(meta.value.payload)) return;

    meta.value = {
      ...meta.value,
      payload: json,
    };
  },
});

watch(
  () => meta.value.payload,
  newValue => {
    if (!editor.value || !newValue) return;
    if (editor.value.isFocused) return; 

    const currentJson = editor.value.getJSON();
    if (JSON.stringify(newValue) === JSON.stringify(currentJson)) return;

    editor.value.commands.setContent(newValue, { emitUpdate: false });
  },
  { deep: true }
);

onBeforeUnmount(() => {
  editor.value?.destroy();
});
</script>

<template>
  <div class="text-block group relative">
    <bubble-menu
      v-if="editor"
      :editor="editor"
      :tippy-options="{ duration: 150, zIndex: 9999 }"
      class="bubble-menu"
    >
      <div class="bubble-menu-content">
        <button
          :class="{ 'is-active': editor.isActive('bold') }"
          type="button"
          title="Bold"
          @click="editor.chain().focus().toggleBold().run()"
        >
          <span class="text-xs font-bold">B</span>
        </button>
    
        <button
          :class="{ 'is-active': editor.isActive('italic') }"
          type="button"
          title="Italic"
          @click="editor.chain().focus().toggleItalic().run()"
        >
          <span class="text-xs italic">I</span>
        </button>

        <button
          :class="{ 'is-active': editor.isActive('strike') }"
          type="button"
          title="Strike"
          @click="editor.chain().focus().toggleStrike().run()"
        >
          <span class="text-xs strikethrough">S</span>
        </button>

        <button
          :class="{ 'is-active': editor.isActive('code') }"
          type="button"
          title="Code"
          @click="editor.chain().focus().toggleCode().run()"
        >
          <i class="pi pi-code" />
        </button>

        <div class="divider" />

        <button
          :class="{ 'is-active': editor.isActive('heading', { level: 1 }) }"
          type="button"
          @click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
        >
          H1
        </button>
        <button
          :class="{ 'is-active': editor.isActive('heading', { level: 2 }) }"
          type="button"
          @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
        >
          H2
        </button>

        <div class="divider" />

        <button
          :class="{ 'is-active': editor.isActive('bulletList') }"
          type="button"
          title="Bullet List"
          @click="editor.chain().focus().toggleBulletList().run()"
        >
          <i class="pi pi-list" />
        </button>

        <button
          :class="{ 'is-active': editor.isActive('orderedList') }"
          type="button"
          title="Ordered List"
          @click="editor.chain().focus().toggleOrderedList().run()"
        >
          <i class="pi pi-list-check" />
        </button>

        <button
          :class="{ 'is-active': editor.isActive('blockquote') }"
          type="button"
          title="Quote"
          @click="editor.chain().focus().toggleBlockquote().run()"
        >
          <i class="pi pi-comments" />
        </button>

        <div class="divider" />

        <button
          type="button"
          title="Clear Formatting"
          @click="editor.chain().focus().unsetAllMarks().run()"
        >
          <i class="pi pi-filter-slash" />
        </button>
      </div>
    </bubble-menu>

    <div>
      <editor-content :editor="editor" />
    </div>
  </div>
</template>

<style scoped lang="scss">
:deep(.tiptap) {
  outline: none !important;
  code {
    background-color: #f3f4f6;
    color: #eb5757;          
    border-radius: 0.4rem;
    font-size: 0.85rem;
    padding: 0.25em 0.4em;
    font-family: 'Monaco', 'Courier New', monospace;
  }

  blockquote {
    border-left: 3px solid #e2e8f0;
    padding-left: 1rem;
    margin-left: 0;
    color: #64748b;
    font-style: italic;
  }

  ul, ol {
    padding-left: 1.2rem;
    margin: 0.5em 0;
    
    li {
      margin-bottom: 0.2em;
    }
  }
}

.bubble-menu {
  background-color: #1e293b; 
  border: 1px solid #334155; 
  border-radius: 8px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2);

  .bubble-menu-content {
    display: flex;
    padding: 4px;
    gap: 2px;
    align-items: center;
  }

  button {
    border: none;
    background: transparent;
    color: #e2e8f0;
    padding: 6px 10px;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    font-size: 0.9rem;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      background-color: #334155;
      color: #ffffff;
    }

    &.is-active {
      background-color: #3b82f6;
      color: #ffffff;
      
      &:hover {
        background-color: #2563eb;
      }
    }
    
    i {
      font-size: 0.85rem;
    }
  }

  .divider {
    width: 1px;
    height: 18px;
    background-color: #475569; 
    margin: 0 4px;
  }
}
</style>