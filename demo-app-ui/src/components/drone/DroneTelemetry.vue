<script setup lang="ts">
import { reactive, computed, onMounted, onUnmounted } from "vue";
import { useMQTTStore } from "../../stores/useMQTTStore";
import type { Telemetry } from "../../types/Telemetry";

const mqttStore = useMQTTStore();
const { unsubscribeMQTT, subscribeMQTT } = mqttStore;

const telemetry = reactive<Telemetry>({});

const formattedGPS = computed(() => {
  if (!telemetry.gps) return "--";
  return `${telemetry.gps.lat.toFixed(5)}, ${telemetry.gps.lon.toFixed(5)}`;
});

const formattedGimbal = computed(() => {
  if (!telemetry.gimbal) return "--";
  const { yaw, pitch, fov } = telemetry.gimbal;
  return `yaw ${yaw}°, pitch ${pitch}°, FOV ${fov}°`;
});

onMounted(async () => {
  await subscribeMQTT();

  mqttStore.getEventCallback("drone/telemetry", (data: Telemetry) => {
    Object.assign(telemetry, data);
  });
});

onUnmounted(() => {
  unsubscribeMQTT();
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
