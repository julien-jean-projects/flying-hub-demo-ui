<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { useMQTTStore } from "../../stores/useMQTTStore";
import type { Telemetry } from "../../types/Telemetry";

const mqttStore = useMQTTStore();
const { unsubscribeMQTT, subscribeMQTT } = mqttStore;

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
  await subscribeMQTT();

  mqttStore.getEventCallback("drone/video", (data: { url: string }) => {
    if (videoRef.value) {
      // fix DOMException error
      const newSrc = `${apiUrl}${data.url}`;
      if (videoRef.value.src !== newSrc) {
        videoRef.value.src = newSrc;
        videoRef.value.play().catch(() => {});
      } else {
        videoRef.value.currentTime = 0;
        videoRef.value.play().catch(() => {});
      }
      videoRef.value.addEventListener("ended", () => {
        emit("recording-finished");
      });
    }
  });

  mqttStore.getEventCallback("drone/telemetry", (data: Telemetry) => {
    if (data.gps) {
      if (!isTakeOff.value) takeOff();
    }
  });
});

onUnmounted(() => {
  unsubscribeMQTT();
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
