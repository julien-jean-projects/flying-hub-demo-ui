<script setup lang="ts">
import { ref, onMounted, watch, computed } from "vue";
import { storeToRefs } from "pinia";
import * as Cesium from "cesium";
import CesiumMap from "./CesiumMap.vue";
import DraggableResizable from "./reusable/DraggableResizable.vue";
import { useMQTTStore } from "../stores/useMQTTStore";
import type { IWaypoint, IExclusionZone } from "../types/CesiumMap";

const apiUrl = import.meta.env.VITE_API_URL;

const cesiumMapRef = ref<InstanceType<typeof CesiumMap> | null>(null);

const mqttStore = useMQTTStore();
const { missionsWaypoints, exclusionZones, selectedMissionId } = storeToRefs(mqttStore);
const { fetchMissionsWaypoints, fetchExclusionZones, getEventCallback } = mqttStore;

const addMode = ref<"waypoint" | "zone" | null>(null);

const creatingMission = ref(false);
const newMission = ref({ id: "", description: "" });

function stopAddWaypoint() {
  addMode.value = null;
}

function handleMapClick({ lon, lat }: { lon: number; lat: number }) {
  if (addMode.value === "waypoint" && selectedMissionId.value) {
    fetch(`${apiUrl}/api/waypoints/${selectedMissionId.value}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lon: lon, lat: lat, alt: 30, gimbal: { yaw: 0, pitch: -10, fov: 68 } }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Erreur API ajout waypoint");
        // Do nothing here: synchronization is handled via MQTT
        stopAddWaypoint();
      })
      .catch(() => {
        alert("Erreur lors de l'ajout du waypoint côté serveur");
        stopAddWaypoint();
      });
  } else if (addMode.value === "zone") {
    if (!exclusionZones.value.length || exclusionZones.value[exclusionZones.value.length - 1].points.length === 0) {
      exclusionZones.value.push({ id: `zone-${Date.now()}`, points: [{ lon: lon, lat: lat }], color: "red" });
    } else {
      exclusionZones.value[exclusionZones.value.length - 1].points.push({ lon: lon, lat: lat });
    }
    cesiumMapRef.value?.addExclusionZone(exclusionZones.value[exclusionZones.value.length - 1]);
  }
}

function finishZone() {
  addMode.value = null;
}

function startAddWaypoint() {
  addMode.value = "waypoint";
}
function startAddZone() {
  addMode.value = "zone";
  exclusionZones.value.push({ id: `zone-${Date.now()}`, points: [], color: "red" });
}

function removeWaypoint(id: string) {
  if (!selectedMissionId.value) return;
  fetch(`${apiUrl}/api/waypoints/${selectedMissionId.value}/${id}`, {
    method: "DELETE",
  });
}

function focusWaypoint(wp: IWaypoint) {
  cesiumMapRef.value?.focusOnCesiumEntityById(wp.id);
}

function removeZone(id: string) {
  exclusionZones.value = exclusionZones.value.filter((z) => z.id !== id);
  cesiumMapRef.value?.removeExclusionZone(id);
}

function focusZone(zone: IExclusionZone) {
  if (zone.points.length > 0) {
    const p = zone.points[0];
    cesiumMapRef.value?.lookAtWaypoint(p.lon, p.lat, 30, { focusDuration: 0, temporary: true });
  }
}

function clearAllWaypointsOnMap() {
  // Direct call to the CesiumMap method for a complete cleanup
  cesiumMapRef.value?.clearAllWaypointsAndPolylines();
}

function selectMission(id: string) {
  selectedMissionId.value = id;
  clearAllWaypointsOnMap();
}

// List of waypoints for the selected mission
const currentWaypoints = computed<IWaypoint[]>(() => {
  const mission = missionsWaypoints.value.find((m) => m.id === selectedMissionId.value);
  return mission ? mission.waypoints : [];
});

function startCreateMission() {
  creatingMission.value = true;
  newMission.value = { id: "", description: "" };
}

function cancelCreateMission() {
  creatingMission.value = false;
}

function saveMission() {
  if (!newMission.value.id) return;
  missionsWaypoints.value.push({
    id: newMission.value.id,
    waypoints: [],
    description: newMission.value.description,
    authorId: -1,
  });
  selectedMissionId.value = newMission.value.id;
  creatingMission.value = false;
}

onMounted(() => {
  exclusionZones.value = [];
  fetchMissionsWaypoints();
  fetchExclusionZones();

  getEventCallback("waypoints/added", (payload: { missionId: string; waypoint: IWaypoint }) => {
    const { missionId, waypoint } = payload;
    if (missionId === selectedMissionId.value) {
      cesiumMapRef.value?.addWaypoint(waypoint, false);
      cesiumMapRef.value?.setAllPositions(
        currentWaypoints.value.map((wp) => Cesium.Cartesian3.fromDegrees(wp.lon, wp.lat, wp.alt))
      );
    }
  });
  getEventCallback("waypoints/removed", (payload: { missionId: string; waypointId: string }) => {
    const { missionId, waypointId } = payload;
    if (missionId === selectedMissionId.value) {
      cesiumMapRef.value?.removeWaypointAndCone(waypointId);
      cesiumMapRef.value?.removeCameraArrowByWaypointId?.(waypointId);
      cesiumMapRef.value?.setAllPositions(
        currentWaypoints.value.map((wp) => Cesium.Cartesian3.fromDegrees(wp.lon, wp.lat, wp.alt))
      );
    }
  });
});

watch(
  currentWaypoints,
  (wps: IWaypoint[]) => {
    clearAllWaypointsOnMap();
    wps.forEach((wp) => cesiumMapRef.value?.addWaypoint(wp, false));
    cesiumMapRef.value?.setAllPositions(wps.map((wp) => Cesium.Cartesian3.fromDegrees(wp.lon, wp.lat, wp.alt)));
  },
  { deep: true }
);
</script>

<template>
  <div class="w-full h-screen relative">
    <CesiumMap ref="cesiumMapRef" :droneCreation="addMode === 'waypoint'" @map-click="handleMapClick" />
    <DraggableResizable :initial-width="36" :initial-height="70" resize>
      <template #header>
        <div class="flex items-between gap-2">
          <h2 class="text-base font-bold flex-1">🗺️ Planification de vol</h2>
        </div>
      </template>
      <div class="flex flex-col gap-2">
        <template v-if="creatingMission">
          <h3 class="font-bold">Créer une mission</h3>
          <div class="flex flex-col gap-2">
            <label class="font-semibold">ID de la mission :</label>
            <input
              v-model="newMission.id"
              type="text"
              class="border rounded px-2 py-1 w-32"
              autocomplete="off"
              spellcheck="false"
            />
            <label class="font-semibold">Description :</label>
            <textarea v-model="newMission.description" class="border rounded px-2 py-1 w-full min-h-[60px]"></textarea>
            <div class="flex gap-2 mt-2">
              <button
                @click="saveMission"
                :disabled="!newMission.id"
                class="bg-green-600 text-white rounded p-2"
                :class="!newMission.id ? 'cursor-not-allowed' : 'cursor-pointer'"
              >
                Créer
              </button>
              <button @click="cancelCreateMission" class="bg-gray-600 text-white rounded p-2 cursor-pointer">
                Annuler
              </button>
            </div>
          </div>
        </template>
        <template v-else>
          <h3 class="font-bold">Missions</h3>
          <ul>
            <li v-for="mission in missionsWaypoints" :key="mission.id" class="flex gap-2 items-center">
              <span>{{ mission.description || mission.id }}</span>
              <button
                @click="selectMission(mission.id)"
                class="text-xs bg-sky-500 text-white rounded px-2"
                :class="[selectedMissionId === mission.id ? 'bg-sky-900' : '', 'cursor-pointer']"
              >
                Voir
              </button>
            </li>
          </ul>
          <button @click="startCreateMission" class="bg-green-600 text-white rounded p-2 mt-2 cursor-pointer">
            Créer une mission
          </button>
          <div v-if="selectedMissionId" class="mt-2">
            <h3 class="font-bold">Waypoints de la mission</h3>
            <ul>
              <li v-for="wp in currentWaypoints" :key="wp.id" class="flex gap-2 items-center">
                <span class="cursor-move select-none" title="Déplacer">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="inline w-4 h-4 mr-1 text-gray-500"
                    fill="none"
                    viewBox="0 0 20 20"
                    stroke="currentColor"
                  >
                    <circle cx="7" cy="6" r="1.5" />
                    <circle cx="7" cy="10" r="1.5" />
                    <circle cx="7" cy="14" r="1.5" />
                    <circle cx="13" cy="6" r="1.5" />
                    <circle cx="13" cy="10" r="1.5" />
                    <circle cx="13" cy="14" r="1.5" />
                  </svg>
                </span>
                <span>{{ wp.id }}</span>
                <button
                  @click="focusWaypoint(wp as IWaypoint)"
                  class="text-xs bg-sky-500 text-white rounded px-2 cursor-pointer"
                >
                  Focus
                </button>
                <button
                  @click="removeWaypoint((wp as IWaypoint).id)"
                  class="text-xs bg-red-500 text-white rounded px-2 cursor-pointer"
                >
                  Supprimer
                </button>
              </li>
            </ul>
          </div>
          <button
            v-if="selectedMissionId && addMode !== 'waypoint'"
            @click="startAddWaypoint"
            class="bg-blue-600 text-white rounded p-2 cursor-pointer"
          >
            Ajouter un waypoint
          </button>
          <button
            v-if="selectedMissionId && addMode === 'waypoint'"
            @click="stopAddWaypoint"
            class="bg-red-600 text-white rounded p-2 cursor-pointer"
          >
            Arrêter
          </button>
          <hr class="my-2" />
          <template v-if="!creatingMission">
            <h3 class="font-bold">Zones d'exclusion</h3>
            <button @click="startAddZone" class="bg-red-600 text-white rounded p-2 cursor-pointer">
              Dessiner une zone d'exclusion
            </button>
            <button
              v-if="addMode === 'zone'"
              @click="finishZone"
              class="bg-gray-600 text-white rounded p-2 cursor-pointer"
            >
              Terminer la zone
            </button>
            <ul>
              <li v-for="zone in exclusionZones" :key="zone.id" class="flex gap-2 items-center">
                <span>Points: {{ zone.points.length }}</span>
                <button @click="focusZone(zone)" class="text-xs bg-sky-500 text-white rounded px-2 cursor-pointer">
                  Focus
                </button>
                <button @click="removeZone(zone.id)" class="text-xs bg-red-500 text-white rounded px-2 cursor-pointer">
                  Supprimer
                </button>
              </li>
            </ul>
          </template>
        </template>
      </div>
    </DraggableResizable>
  </div>
</template>
