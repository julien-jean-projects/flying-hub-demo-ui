<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { initMQTT, subscribe, unsubscribe } from "../../services/mqttService";
import type { Telemetry } from "../../types/Telemetry";

const emit = defineEmits<{
  (event: "take-off"): void;
  (event: "recording-finished"): void;
}>();

const apiUrl = import.meta.env.VITE_API_URL;
const videoRef = ref<HTMLVideoElement | null>(null);
const isTakeOff = ref<boolean>(false);

function takeOff() {
  emit("take-off");
  isTakeOff.value = true;

  fetch(`${apiUrl}/camera-play`)
    .then((res) => res.text())
    .then(console.log);
}

onMounted(async () => {
  await initMQTT();

  subscribe("drone/video", (data) => {
    if (videoRef.value) {
      videoRef.value.src = `${apiUrl}${data.url}`;
      videoRef.value.play();

      videoRef.value.addEventListener("ended", () => {
        emit("recording-finished");
      });
    }
  });

  subscribe("drone/telemetry", (data: Telemetry) => {
    if (data.gps) {
      if (!isTakeOff.value) takeOff();
    }
  });
});

onUnmounted(() => {
  unsubscribe("drone/video");
  unsubscribe("drone/telemetry");
});
</script>

<template>
  <div class="text-center">
    <video
      v-if="isTakeOff"
      ref="videoRef"
      class="mx-auto rounded-lg border border-gray-500 w-full"
      autoplay
      muted
      playsinline
    ></video>

    <button
      v-if="!isTakeOff"
      @click="takeOff"
      class="bg-green-800 text-white px-4 py-2 rounded shadow w-full cursor-pointer"
    >
      🚀 Take Off
    </button>
  </div>
</template>
