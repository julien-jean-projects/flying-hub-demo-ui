<script setup lang="ts">
import { ref, reactive, withDefaults, watch } from "vue";
import { useDraggable, useEventListener, useMousePressed } from "@vueuse/core";

interface Props {
  initialPosition?: { x: number; y: number };
  initialWidth?: number;
  initialHeight?: number;
  resize?: boolean;
  heightAuto?: boolean;
  contentClasses?: string;
}
const props = withDefaults(defineProps<Props>(), {
  initialPosition: () => ({ x: 100, y: 100 }),
  initialWidth: 30,
  initialHeight: 40,
  resize: false,
  contentClasses: "p-4",
});

const containerRef = ref<HTMLElement | null>(null);
const handleRef = ref<HTMLElement | null>(null);
const dimensions = reactive({ width: props.initialWidth, height: props.initialHeight });
const resizeState = reactive({ isResizing: false, startX: 0, startY: 0, startWidth: 0, startHeight: 0 });
const position = reactive({ x: props.initialPosition.x, y: props.initialPosition.y });

const { isDragging } = useDraggable(containerRef, {
  handle: handleRef,
  onMove: ({ x, y }) => {
    position.x = x;
    position.y = y;
  },
});

const { pressed } = useMousePressed();

function onMouseDownResize(e: MouseEvent) {
  resizeState.isResizing = true;
  resizeState.startX = e.clientX;
  resizeState.startY = e.clientY;
  resizeState.startWidth = dimensions.width;
  resizeState.startHeight = dimensions.height;
}

useEventListener(window, "mousemove", (e: MouseEvent) => {
  if (!resizeState.isResizing || !pressed.value) return;

  const dx = e.clientX - resizeState.startX;
  const dy = e.clientY - resizeState.startY;

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const deltaVw = (dx / vw) * 100;
  const deltaVh = (dy / vh) * 100;

  dimensions.width = Math.max(10, resizeState.startWidth + deltaVw); // min 10vw
  dimensions.height = Math.max(10, resizeState.startHeight + deltaVh); // min 10vh
});

useEventListener(window, "mouseup", () => {
  resizeState.isResizing = false;
});

// deselect any selected element to avoid the drag-and-drop & resize window bug
watch(
  () => resizeState.isResizing || isDragging.value,
  () => window.getSelection()?.removeAllRanges()
);
</script>

<template>
  <div
    ref="containerRef"
    :class="[
      'fixed bg-white dark:bg-gray-800 dark:text-white rounded-lg border border-gray-600 shadow-lg',
      { 'select-none': resizeState.isResizing || isDragging },
    ]"
    :style="{
      width: dimensions.width + 'vw',
      ...(props.heightAuto ? {} : { height: dimensions.height + 'vh' }),
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
    <div class="flex flex-col h-[calc(100%-2.5rem)]">
      <div class="overflow-auto grow" :class="props.contentClasses">
        <slot />
      </div>
    </div>

    <!-- Resize Handle Visual -->
    <div v-show="resize" class="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize" @mousedown="onMouseDownResize">
      <svg class="w-full h-full text-gray-400" viewBox="0 0 10 10" fill="none">
        <path d="M10 6L6 10M10 8L8 10M10 4L4 10" stroke="currentColor" stroke-width="1" />
      </svg>
    </div>
  </div>
</template>
