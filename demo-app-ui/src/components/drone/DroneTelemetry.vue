<script setup lang="ts">
import { reactive, computed, onMounted } from "vue";
import { initMQTT, subscribe } from "../../services/mqttService";
import type { Telemetry } from "../../types/Telemetry";

const telemetry = reactive<Telemetry>({});

function updateDronePosition(lat: number, lon: number, alt: number = 100) {
  console.log("updateDronePosition:", lat, lon, alt);
}

const formattedGPS = computed(() => {
  if (!telemetry.gps) return "--";
  return `${telemetry.gps.lat.toFixed(5)}, ${telemetry.gps.lon.toFixed(5)}`;
});

const formattedGimbal = computed(() => {
  if (!telemetry.gimbal) return "--";
  return `yaw ${telemetry.gimbal.yaw}°, pitch ${telemetry.gimbal.pitch}°`;
});

onMounted(async () => {
  await initMQTT();
  subscribe("drone/telemetry", (data) => {
    Object.assign(telemetry, data);
    if (data.gps) updateDronePosition(data.gps.lat, data.gps.lon, data.altitude);
  });
});
</script>

<template>
  <div class="mt-4 text-sm grid grid-cols-2 gap-x-4 gap-y-2">
    <div class="font-medium">Battery:</div>
    <div>{{ telemetry.battery ?? "--" }}%</div>
    <div class="font-medium">Signal:</div>
    <div>{{ telemetry.signal ?? "--" }}/5</div>
    <div class="font-medium">GPS:</div>
    <div>{{ formattedGPS }}</div>
    <div class="font-medium">Altitude:</div>
    <div>{{ telemetry.altitude ?? "--" }} m</div>
    <div class="font-medium">Gimbal:</div>
    <div>{{ formattedGimbal }}</div>
  </div>
</template>
