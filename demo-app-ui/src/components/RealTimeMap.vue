<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from "vue";
import type { ComponentPublicInstance } from "vue";
import CesiumMap from "./CesiumMap.vue";
import { useMQTTStore } from "../stores/useMQTTStore";
import type { IComponentCesiumMapExpose } from "../types/CesiumMap";
import type { Telemetry } from "../types/Telemetry";
import type { Drone } from "../types/Drone";

const apiUrl = import.meta.env.VITE_API_URL;

const props = defineProps<{ hideMap?: boolean }>();

const cesiumMapRef = ref<ComponentPublicInstance<IComponentCesiumMapExpose> | null>(null);
const mqttStore = useMQTTStore();

async function fetchDronesFromAPI() {
  try {
    const res = await fetch(`${apiUrl}/api/drones`);
    if (!res.ok) throw new Error("Erreur API");
    const data = await res.json();
    data.forEach((drone: any) => {
      cesiumMapRef.value?.addDrone(drone);
    });
  } catch (e) {
    console.error("Erreur lors de la récupération des drones:", e);
  }
}

async function fetchWaypointsFromAPI() {
  try {
    const res = await fetch(`${apiUrl}/api/waypoints/mission-1`);
    if (!res.ok) throw new Error("Erreur API waypoints");
    const waypoints = await res.json();
    if (Array.isArray(waypoints)) {
      waypoints.forEach((wp: any, idx: number) => {
        cesiumMapRef.value?.addWaypoint(wp, idx === 0);
      });
    }
  } catch (e) {
    console.error("Erreur lors de la récupération des waypoints:", e);
  }
}

watch(
  () => props.hideMap,
  () => window.getSelection()?.removeAllRanges()
);

onMounted(async () => {
  await fetchWaypointsFromAPI();
  await fetchDronesFromAPI();

  mqttStore.getEventCallback("drone/telemetry", (data: Telemetry) => {
    if (data.gps && data.id) {
      cesiumMapRef.value?.updateDronePoseAndCamera({
        id: data.id,
        lon: data.gps.lon,
        lat: data.gps.lat,
        alt: data.altitude ?? 0,
        gimbal: { yaw: data.gimbal?.yaw ?? 0, pitch: data.gimbal?.pitch ?? 0, fov: data.gimbal?.fov ?? 0 },
      });
    }
  });
  mqttStore.getEventCallback("drones/added", (drone: Drone) => {
    if (drone.lon !== undefined && drone.lat !== undefined) {
      cesiumMapRef.value?.addDrone({
        ...drone,
        lon: drone.lon,
        lat: drone.lat,
      });
    }
  });
  mqttStore.getEventCallback("drones/removed", (id: string) => {
    if (cesiumMapRef.value) {
      cesiumMapRef.value.removeDrone(id);
    }
  });
});

onUnmounted(() => {
  mqttStore.unsubscribeMQTT();
});
</script>

<template>
  <div v-show="!hideMap">
    <CesiumMap ref="cesiumMapRef" />

    <div class="absolute top-2.5 left-2.5 z-50 flex flex-col gap-2 min-w-40">
      <button
        class="w-full border p-4 cursor-pointer rounded-md transition text-white bg-sky-900 hover:bg-sky-700"
        @click="cesiumMapRef?.focusOnCesiumEntityById('5e6087eb1b2dc')"
      >
        🔍 Go to Waypoint 5
      </button>
    </div>
  </div>
</template>
