<script setup lang="ts">
import { ref } from "vue";
import { useDark, useToggle } from "@vueuse/core";
import RealTimeMap from "./components/RealTimeMap.vue";
import DroneWidgetWrapper from "./components/DroneWidgetWrapper.vue";
import DroneMapManager from "./components/DroneMapManager.vue";
import FlightPlanner from "./components/FlightPlanner.vue";

const hideCamera = ref<boolean>(true);
const hideMap = ref<boolean>(true);
const hideDroneManager = ref<boolean>(true);
const hideFlightPlanner = ref<boolean>(true);

const isDark = useDark({
  selector: "html",
  attribute: "data-theme",
  valueDark: "dark",
  valueLight: "light",
});

const toggleDark = useToggle(isDark);
const toggleCamera = () => (hideCamera.value = !hideCamera.value);
const toggleMap = () => {
  hideDroneManager.value = true;
  hideFlightPlanner.value = true;
  hideMap.value = !hideMap.value;
};
const toggleDroneManager = () => {
  hideMap.value = true;
  hideFlightPlanner.value = true;
  hideDroneManager.value = !hideDroneManager.value;
};
const toggleFlightPlanner = () => {
  hideMap.value = true;
  hideDroneManager.value = true;
  hideFlightPlanner.value = !hideFlightPlanner.value;
};
</script>

<template>
  <div class="w-full h-screen overflow-hidden">
    <RealTimeMap :hide-map="hideMap" />

    <DroneWidgetWrapper v-show="!hideCamera" />
    <DroneMapManager v-show="!hideDroneManager" />
    <FlightPlanner v-show="!hideFlightPlanner" />

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

      <button
        class="w-full border p-4 cursor-pointer rounded-md transition text-white bg-sky-900 hover:bg-sky-700"
        @click="toggleDroneManager()"
      >
        {{ hideDroneManager ? "🛩️ Gérer les drones" : "🚫 Fermer gestion drones" }}
      </button>

      <button
        class="w-full border p-4 cursor-pointer rounded-md transition text-white bg-sky-900 hover:bg-sky-700"
        @click="toggleFlightPlanner()"
      >
        {{ hideFlightPlanner ? "🗺️ Planifier un vol" : "🚫 Fermer planification" }}
      </button>
    </div>
  </div>
</template>
