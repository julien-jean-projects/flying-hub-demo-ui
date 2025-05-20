<script setup lang="ts">
import { ref } from "vue";
import DroneVideo from "./drone/DroneVideo.vue";
import DroneTelemetry from "./drone/DroneTelemetry.vue";
import DraggableResizable from "./reusable/DraggableResizable.vue";

const isRecording = ref<boolean>(false);

const handleTakeOff = () => (isRecording.value = true);
const handleRecordFinished = () => (isRecording.value = false);
</script>

<template>
  <DraggableResizable :initial-width="25" :initial-height="55" resize>
    <template #header>
      <span class="font-semibold text-sm"
        >Drone <span v-show="isRecording" class="text-red-500 rounded px-1">(Live) 🛑</span></span
      >
    </template>

    <DroneVideo @take-off="handleTakeOff" @recording-finished="handleRecordFinished" />
    <DroneTelemetry />
  </DraggableResizable>
</template>
