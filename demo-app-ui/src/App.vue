<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { useDark, useToggle } from "@vueuse/core";
import type { ComponentPublicInstance } from "vue";
import type { IComponentCesiumMapExpose } from "./types/CesiumMap";

import CesiumMap from "./components/CesiumMap.vue";
import { waypointsData } from "./data/waypoints";

const cesiumMapRef = ref<ComponentPublicInstance<IComponentCesiumMapExpose> | null>(null);
const hideMap = ref<boolean>(false);
const waypointsInterval = ref<ReturnType<typeof setInterval> | undefined>();

const isDark = useDark({
  selector: "html",
  attribute: "data-theme",
  valueDark: "dark",
  valueLight: "light",
});

const toggleDark = useToggle(isDark);

const toggleMap = () => (hideMap.value = !hideMap.value);

function initWaypointsDrone() {
  cesiumMapRef.value?.updateDronePoseAndCamera({
    id: "705694ff7c7aafb",
    lon: 2.36145,
    lat: 48.8592121,
    alt: 154,
    gimbal: { yaw: -70, pitch: -10 },
  });

  cesiumMapRef.value?.addWaypoint({
    id: "9",
    lon: 2.4,
    lat: 48.85,
    alt: 100,
    gimbal: { yaw: 90, pitch: -10 },
  });

  let index = 0;
  cesiumMapRef.value?.addWaypoint(waypointsData[index], true);
  index++;

  waypointsInterval.value = setInterval(() => {
    if (index >= waypointsData.length) {
      clearInterval(waypointsInterval.value);
      return;
    }
    cesiumMapRef.value?.addWaypoint(waypointsData[index]);

    index++;
  }, 1000);
}

onMounted(() => {
  initWaypointsDrone();
});

onUnmounted(() => {
  clearInterval(waypointsInterval.value);
});
</script>

<template>
  <div class="w-full h-screen overflow-hidden">
    <CesiumMap ref="cesiumMapRef" v-show="!hideMap" />

    <div class="absolute bottom-2.5 right-2.5 z-50 flex flex-col gap-2 min-w-40">
      <button
        v-show="!hideMap"
        class="w-full border p-4 cursor-pointer rounded-md transition text-white bg-sky-900 hover:bg-sky-700"
        @click="cesiumMapRef?.focusOnWaypointById('5')"
      >
        🔍 Go to Waypoint 5
      </button>

      <button
        class="w-full border p-4 cursor-pointer rounded-md transition text-white bg-sky-900 hover:bg-sky-700"
        @click="toggleDark()"
      >
        Switch to {{ !isDark ? "🌙" : "☀️" }}
      </button>

      <button
        class="w-full border p-4 cursor-pointer rounded-md transition text-white bg-sky-900 hover:bg-sky-700"
        @click="toggleMap()"
      >
        {{ !hideMap ? "👁️ Show Map" : "🚫 Hide Map" }}
      </button>
    </div>
  </div>
</template>
