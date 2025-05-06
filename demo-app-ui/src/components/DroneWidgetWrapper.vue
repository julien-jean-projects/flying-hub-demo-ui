<script setup lang="ts">
import DroneVideo from "./drone/DroneVideo.vue";
import DroneTelemetry from "./drone/DroneTelemetry.vue";
import DraggableResizable from "./reusable/DraggableResizable.vue";
</script>

<template>
  <DraggableResizable :initial-width="25" resize>
    <template #header>
      <span class="font-semibold text-sm"
        >Drone <span v-show="false" class="bg-red-500 rounded px-1">🎥(Live) </span></span
      >
    </template>

    <DroneVideo />
    <DroneTelemetry />
  </DraggableResizable>
</template>
