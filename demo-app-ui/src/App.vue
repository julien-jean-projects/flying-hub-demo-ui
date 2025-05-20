<script setup lang="ts">
import { ref } from "vue";
import { useDark, useToggle } from "@vueuse/core";
import RealTimeMap from "./components/RealTimeMap.vue";
import DroneWidgetWrapper from "./components/DroneWidgetWrapper.vue";
import DroneMapManager from "./components/DroneMapManager.vue";
import FlightPlanner from "./components/FlightPlanner.vue";
import DraggableResizable from "./components/reusable/DraggableResizable.vue";

const hideCamera = ref<boolean>(true);
const mapSelected = ref<null | "realtime" | "drone" | "planner">(null);
const menuReduced = ref(true);

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
const toggleMenuReduced = () => (menuReduced.value = !menuReduced.value);
</script>

<template>
  <div class="w-full h-screen overflow-hidden">
    <RealTimeMap v-show="mapSelected === 'realtime'" />
    <DroneMapManager v-show="mapSelected === 'drone'" />
    <FlightPlanner v-show="mapSelected === 'planner'" />

    <DroneWidgetWrapper v-show="!hideCamera" class="z-50" />

    <DraggableResizable
      :class="[menuReduced ? 'max-w-[40px]' : 'max-w-[200px]', 'z-100']"
      content-classes="flex flex-col gap-2"
      :initial-position="{ x: 0, y: 0 }"
      height-auto
    >
      <template #header>
        <span v-if="!menuReduced" class="w-full text-center font-bold uppercase"> Draggable Menu </span>
        <div v-else class="h-2"></div>
      </template>

      <button
        class="border text-right p-2 cursor-pointer rounded-md transition text-white bg-sky-900 hover:bg-sky-700"
        @click="toggleMenuReduced()"
      >
        <span v-if="!menuReduced">Réduire</span>
        <span class="font-bold px-1"> ☰</span>
      </button>

      <button
        class="border text-right p-2 cursor-pointer rounded-md transition text-white bg-sky-900 hover:bg-sky-700"
        @click="toggleDark()"
      >
        <span v-if="!menuReduced">Thème</span> {{ !isDark ? "🌙" : "☀️" }}
      </button>

      <button
        class="border text-right p-2 cursor-pointer rounded-md transition text-white bg-sky-900 hover:bg-sky-700"
        @click="toggleCamera()"
      >
        <span v-if="!menuReduced">Telemetrie(Camera)</span> {{ hideCamera ? "🎥" : "🚫" }}
      </button>

      <button
        class="border text-right p-2 cursor-pointer rounded-md transition text-white bg-sky-900 hover:bg-sky-700"
        @click="toggleMap()"
      >
        <span v-if="!menuReduced">Realtime Map</span> {{ mapSelected !== "realtime" ? "👁️" : "🚫" }}
      </button>

      <button
        class="border text-right p-2 cursor-pointer rounded-md transition text-white bg-sky-900 hover:bg-sky-700"
        @click="toggleDroneManager()"
      >
        <span v-if="!menuReduced">Gestion drones</span> {{ mapSelected !== "drone" ? "🛩️ " : "🚫" }}
      </button>

      <button
        class="border text-right p-2 cursor-pointer rounded-md transition text-white bg-sky-900 hover:bg-sky-700"
        @click="toggleFlightPlanner()"
      >
        <span v-if="!menuReduced">Planification</span> {{ mapSelected !== "planner" ? "🗺️" : "🚫" }}
      </button>
    </DraggableResizable>
  </div>
</template>
