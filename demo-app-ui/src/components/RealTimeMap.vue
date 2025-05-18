<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from "vue";
import type { ComponentPublicInstance } from "vue";
import CesiumMap from "./CesiumMap.vue";
import { waypointsData } from "../data/waypoints";
import { subscribe, initMQTT, unsubscribe } from "../services/mqttService";
import type { IComponentCesiumMapExpose } from "../types/CesiumMap";
import type { Telemetry } from "../types/Telemetry";

const apiUrl = import.meta.env.VITE_API_URL;

const props = defineProps<{ hideMap?: boolean }>();

const cesiumMapRef = ref<ComponentPublicInstance<IComponentCesiumMapExpose> | null>(null);
const waypointsInterval = ref<ReturnType<typeof setInterval> | undefined>();

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

function initWaypointsDrone() {
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

function subscribeMQTT() {
  subscribe("drone/telemetry", (data: Telemetry) => {
    if (data.gps) {
      console.log(data.gps.lat, data.gps.lon, data.altitude);

      cesiumMapRef.value?.updateDronePoseAndCamera({
        id: "705694ff7c7aafb",
        lon: data.gps.lon,
        lat: data.gps.lat,
        alt: data.altitude ?? 0,
        gimbal: { yaw: data.gimbal?.yaw ?? 0, pitch: data.gimbal?.pitch ?? 0, fov: data.gimbal?.fov ?? 0 },
      });
    }
  });

  subscribe("drones/added", (drone: any) => {
    cesiumMapRef.value?.addDrone(drone);
  });

  subscribe("drones/removed", (drone: any) => {
    cesiumMapRef.value?.removeDrone(drone.id);
  });
}

function unsubscribeMQTT() {
  unsubscribe("drone/telemetry");
  unsubscribe("drones/added");
  unsubscribe("drones/removed");
}

watch(
  () => props.hideMap,
  () => window.getSelection()?.removeAllRanges()
);

onMounted(async () => {
  await initMQTT();

  initWaypointsDrone();
  fetchDronesFromAPI();

  subscribeMQTT();
});

onUnmounted(() => {
  unsubscribeMQTT();

  clearInterval(waypointsInterval.value);
});
</script>

<template>
  <div v-show="!hideMap">
    <CesiumMap ref="cesiumMapRef" />

    <div class="absolute top-2.5 left-2.5 z-50 flex flex-col gap-2 min-w-40">
      <button
        class="w-full border p-4 cursor-pointer rounded-md transition text-white bg-sky-900 hover:bg-sky-700"
        @click="cesiumMapRef?.focusOnWaypointById('5e6087eb1b2dc')"
      >
        🔍 Go to Waypoint 5
      </button>
    </div>
  </div>
</template>
