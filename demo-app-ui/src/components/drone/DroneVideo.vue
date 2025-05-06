<script setup lang="ts">
import { onMounted, ref } from "vue";
import { initMQTT, subscribe } from "../../services/mqttService";

const apiUrl = import.meta.env.VITE_API_URL;
const videoRef = ref<HTMLVideoElement | null>(null);

function requestPlayVideo() {
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
    }
  });

  requestPlayVideo();
});
</script>

<template>
  <div class="text-center">
    <video ref="videoRef" class="mx-auto rounded-lg border border-gray-500 w-full" autoplay muted playsinline></video>
  </div>
</template>
