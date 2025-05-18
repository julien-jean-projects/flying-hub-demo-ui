<script setup lang="ts">
import { ref } from "vue";
import { useDark, useToggle } from "@vueuse/core";
import RealTimeMap from "./components/RealTimeMap.vue";
import DroneWidgetWrapper from "./components/DroneWidgetWrapper.vue";

const hideCamera = ref<boolean>(true);
const hideMap = ref<boolean>(true);

const isDark = useDark({
  selector: "html",
  attribute: "data-theme",
  valueDark: "dark",
  valueLight: "light",
});

const toggleDark = useToggle(isDark);
const toggleCamera = () => (hideCamera.value = !hideCamera.value);
const toggleMap = () => (hideMap.value = !hideMap.value);
</script>

<template>
  <div class="w-full h-screen overflow-hidden">
    <RealTimeMap :hide-map="hideMap" />

    <DroneWidgetWrapper v-show="!hideCamera" />

    <div class="absolute bottom-2.5 right-2.5 z-50 flex flex-col gap-2 min-w-40">
      <button
        class="w-full border p-4 cursor-pointer rounded-md transition text-white bg-sky-900 hover:bg-sky-700"
        @click="toggleDark()"
      >
        Switch to {{ !isDark ? "🌙" : "☀️" }}
      </button>

      <button
        class="w-full border p-4 cursor-pointer rounded-md transition text-white bg-sky-900 hover:bg-sky-700"
        @click="toggleCamera()"
      >
        {{ hideCamera ? "🎥 Show Camera" : "📹 Hide Camera" }}
      </button>

      <button
        class="w-full border p-4 cursor-pointer rounded-md transition text-white bg-sky-900 hover:bg-sky-700"
        @click="toggleMap()"
      >
        {{ hideMap ? "👁️ Show Map" : "🚫 Hide Map" }}
      </button>
    </div>
  </div>
</template>
