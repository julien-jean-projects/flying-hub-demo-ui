<script setup lang="ts">
import { ref, reactive } from "vue";
import { useDraggable } from "@vueuse/core";

interface Props {
  initialWidth?: number;
  resize?: boolean;
}
defineProps<Props>();

const containerRef = ref<HTMLElement | null>(null);
const handleRef = ref<HTMLElement | null>(null);

const position = reactive({ x: 100, y: 100 });

useDraggable(containerRef, {
  handle: handleRef,
  onMove: ({ x, y }) => {
    position.x = x;
    position.y = y;
  },
});
</script>

<template>
  <div
    ref="containerRef"
    :class="[
      'fixed bg-white dark:bg-gray-800 dark:text-white rounded-lg border border-gray-600 shadow-lg overflow-auto w-[30vw]',
      { resize: resize },
    ]"
    :style="{
      width: initialWidth ? `${initialWidth}vw` : '',
      top: position.y + 'px',
      left: position.x + 'px',
    }"
  >
    <!-- Header (Drag handle) -->
    <div
      ref="handleRef"
      class="bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded-t-lg cursor-move flex justify-between items-center"
    >
      <slot name="header">
        <span class="font-semibold text-sm">Draggable Window</span>
      </slot>
    </div>

    <!-- Content -->
    <div class="p-4">
      <slot />
    </div>

    <!-- Resize Handle Visual -->
    <div v-show="resize" class="absolute bottom-1 right-1 cursor-resize pointer-events-none">
      <div class="w-4 h-4 flex flex-col justify-end items-end text-gray-500 rotate-0">
        <div class="w-3 h-0.5 bg-gray-500 mb-0.5 rounded"></div>
        <div class="w-2 h-0.5 bg-gray-500 mb-0.5 rounded"></div>
        <div class="w-1 h-0.5 bg-gray-500 rounded"></div>
      </div>
    </div>
  </div>
</template>
