<script setup lang="ts">
import { ref } from "vue";
import { useDark, useToggle } from "@vueuse/core";
import RealTimeMap from "./components/RealTimeMap.vue";
import DroneWidgetWrapper from "./components/DroneWidgetWrapper.vue";
import DroneMapManager from "./components/DroneMapManager.vue";
import FlightPlanner from "./components/FlightPlanner.vue";

const hideCamera = ref<boolean>(true);
const mapSelected = ref<null | "realtime" | "drone" | "planner">(null);

const isDark = useDark({
  selector: "html",
  attribute: "data-theme",
  valueDark: "dark",
  valueLight: "light",
});

const toggleDark = useToggle(isDark);
const toggleCamera = () => (hideCamera.value = !hideCamera.value);
const toggleMap = () => {
  mapSelected.value = mapSelected.value === "realtime" ? null : "realtime";
};
const toggleDroneManager = () => {
  mapSelected.value = mapSelected.value === "drone" ? null : "drone";
};
const toggleFlightPlanner = () => {
  mapSelected.value = mapSelected.value === "planner" ? null : "planner";
};
</script>

<template>
  <div class="w-full h-screen overflow-hidden">
    <RealTimeMap v-show="mapSelected === 'realtime'" />
    <DroneMapManager v-show="mapSelected === 'drone'" />
    <FlightPlanner v-show="mapSelected === 'planner'" />

    <DroneWidgetWrapper v-show="!hideCamera" class="z-50" />

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
        {{ mapSelected !== "realtime" ? "👁️ Show Map" : "🚫 Hide Map" }}
      </button>

      <button
        class="w-full border p-4 cursor-pointer rounded-md transition text-white bg-sky-900 hover:bg-sky-700"
        @click="toggleDroneManager()"
      >
        {{ mapSelected !== "drone" ? "🛩️ Gérer les drones" : "🚫 Fermer gestion drones" }}
      </button>

      <button
        class="w-full border p-4 cursor-pointer rounded-md transition text-white bg-sky-900 hover:bg-sky-700"
        @click="toggleFlightPlanner()"
      >
        {{ mapSelected !== "planner" ? "🗺️ Planifier un vol" : "🚫 Fermer planification" }}
      </button>
    </div>
  </div>
</template>
