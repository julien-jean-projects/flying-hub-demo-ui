<script setup lang="ts">
import { ref, watch, reactive, type ComponentPublicInstance, onMounted, computed } from "vue";
import CesiumMap from "./CesiumMap.vue";
import DraggableResizable from "./reusable/DraggableResizable.vue";
import type { IComponentCesiumMapExpose } from "../types/CesiumMap";
import type { Drone } from "../types/Drone";
import { subscribe } from "../services/mqttService";

const apiUrl = import.meta.env.VITE_API_URL;
const drones = ref<Drone[]>([]);
const editingDrone = ref<Drone | null>(null);
const addingDrone = ref(false);
const droneCreation = ref(false);
const altitudeMax = ref(150);

const cesiumMapRef = ref<ComponentPublicInstance<IComponentCesiumMapExpose> | null>(null);
const currentDrone = reactive<{ added: boolean }>({ added: false });

const isDuplicateDroneId = computed<boolean>(() => {
  if (!editingDrone.value || !editingDrone.value.id) return false;
  return drones.value.some((d) => d.id === editingDrone.value?.id) && !droneCreation.value;
});

function newDrone() {
  addingDrone.value = true;
  editingDrone.value = {
    id: "",
    alt: 0,
    gimbal: { yaw: 0, pitch: 0, fov: 68, zoom: 5 },
  };
}

function handleMapClick({ lon, lat }: { lon: number; lat: number }) {
  if (!addingDrone.value || !editingDrone.value) return;
  editingDrone.value.lon = lon;
  editingDrone.value.lat = lat;
  currentDrone.added = true;
}

function handleGimbalChange({ yaw, pitch }: { yaw: number; pitch: number }) {
  if (!addingDrone.value || !editingDrone.value) return;
  editingDrone.value.gimbal.yaw = yaw;
  editingDrone.value.gimbal.pitch = pitch;
}

function selectCurrentDroneOnMap() {
  let id = null;
  if (addingDrone.value && editingDrone.value?.lon !== null && editingDrone.value?.lat !== null) {
    id = "__TEMP__";
  } else if (editingDrone.value?.id) {
    id = editingDrone.value.id;
  }
  if (id && cesiumMapRef.value) {
    const entity = cesiumMapRef.value.getViewerEntityById(id);
    if (entity) {
      cesiumMapRef.value.selectCesiumEntity(entity, { focus: true });
    }
  }
}

function deselectDroneOnMap() {
  if (cesiumMapRef.value && cesiumMapRef.value.deselectCesiumEntity) {
    cesiumMapRef.value.deselectCesiumEntity();
  }
}

async function fetchDrones() {
  try {
    const res = await fetch(`${apiUrl}/api/drones`);
    const data = await res.json();
    drones.value = (data as Drone[]).map((d) => ({
      ...d,
      lon: d.lon as number,
      lat: d.lat as number,
    }));
    // Afficher tous les drones sur la carte
    if (cesiumMapRef.value) {
      drones.value.forEach((drone) => {
        if (drone.lon !== undefined && drone.lat !== undefined) {
          cesiumMapRef.value?.addDrone({
            ...drone,
            lon: drone.lon!,
            lat: drone.lat!,
          });
        }
      });
    }
  } catch (e) {
    alert("Erreur lors du chargement des drones");
  }
}

async function createDrone(drone: Drone) {
  addingDrone.value = false;
  droneCreation.value = false;

  try {
    const res = await fetch(`${apiUrl}/api/drones`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(drone),
    });
    if (!res.ok) throw new Error();
  } catch {
    alert("Erreur lors de la création du drone");
  }
}

async function updateDrone(drone: Drone) {
  try {
    const res = await fetch(`${apiUrl}/api/drones/${drone.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(drone),
    });
    if (!res.ok) throw new Error();

    fetchDrones();

    editingDrone.value = null;
  } catch {
    alert("Erreur lors de la mise à jour du drone");
  }
}

async function deleteDrone(id: string) {
  if (!confirm("Supprimer ce drone ?")) return;
  try {
    const res = await fetch(`${apiUrl}/api/drones/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error();
  } catch {
    alert("Erreur lors de la suppression du drone");
  }
}

// function editDrone(drone: Drone) {
//   editingDrone.value = {
//     ...drone,
//     gimbal: drone.gimbal ? { ...drone.gimbal } : { yaw: 0, pitch: 0, fov: 0, zoom: 0 },
//   };
// }

function saveEditingDrone() {
  if (!editingDrone.value || !editingDrone.value.id) return;
  cesiumMapRef.value?.removeDrone("__TEMP__");
  if (drones.value.some((d) => d.id === editingDrone.value!.id)) {
    updateDrone(editingDrone.value as Drone);
  } else {
    createDrone(editingDrone.value as Drone);
  }
}
function cancelAddDrone() {
  addingDrone.value = false;
  editingDrone.value = null;
  droneCreation.value = false;
  cesiumMapRef.value?.removeDrone("__TEMP__");
}

function validateDroneId() {
  if (!editingDrone.value || !editingDrone.value.id) {
    droneCreation.value = false;
    return;
  }
  if (drones.value.some((d) => d.id === editingDrone.value?.id)) {
    droneCreation.value = false;
    return;
  }
  droneCreation.value = true;
}

watch(
  () => [
    addingDrone.value,
    editingDrone.value?.id,
    editingDrone.value?.lon,
    editingDrone.value?.lat,
    editingDrone.value?.alt,
    editingDrone.value?.gimbal?.yaw,
    editingDrone.value?.gimbal?.pitch,
    editingDrone.value?.gimbal?.fov,
    editingDrone.value?.gimbal?.zoom,
  ],
  () => {
    if (
      addingDrone.value &&
      editingDrone.value &&
      editingDrone.value.lon !== undefined &&
      editingDrone.value.lat !== undefined
    ) {
      cesiumMapRef.value?.addDrone({
        ...editingDrone.value,
        id: "__TEMP__",
        lon: editingDrone.value.lon,
        lat: editingDrone.value.lat,
      });
    } else {
      cesiumMapRef.value?.removeDrone("__TEMP__");
    }
  },
  { immediate: true }
);

onMounted(() => {
  droneCreation.value = false;
  fetchDrones();

  subscribe("drones/added", (drone: Drone) => {
    if (!drones.value.some((d) => d.id === drone.id)) {
      drones.value.push(drone);
      if (cesiumMapRef.value && drone.lon !== undefined && drone.lat !== undefined) {
        cesiumMapRef.value.addDrone({
          ...drone,
          lon: drone.lon!,
          lat: drone.lat!,
        });
        const entity = cesiumMapRef.value.getViewerEntityById(drone.id);
        if (entity) {
          cesiumMapRef.value.selectCesiumEntity(entity, { focus: false });
        }
      }
    }
  });

  subscribe("drones/removed", (id: string) => {
    const idx = drones.value.findIndex((d) => d.id === id);
    if (idx !== -1) {
      drones.value.splice(idx, 1);
      if (cesiumMapRef.value) {
        cesiumMapRef.value.removeDrone(id);
      }
    }
  });
});
</script>

<template>
  <div class="w-screen h-screen relative">
    <CesiumMap
      ref="cesiumMapRef"
      class="absolute inset-0 w-full h-full z-0"
      :droneCreation="droneCreation"
      @map-click="handleMapClick"
      @gimbal-orient="handleGimbalChange"
    />
    <DraggableResizable :initial-width="30" resize>
      <template #header>
        <div class="flex items-between gap-2">
          <h2 class="text-base font-bold flex-1">🛩️ Drones</h2>
        </div>
      </template>

      <!-- Id & drone info -->
      <div v-if="addingDrone && editingDrone" class="flex flex-col gap-2 mb-2 p-2 rounded shadow">
        <div class="flex flex-col gap-2">
          <span v-if="droneCreation">ID: {{ editingDrone.id }} </span>

          <div v-else class="flex flex-col gap-2">
            <span class="font-semibold">
              Please define your drone ID :
              <!--force indentation  -->
            </span>

            <div class="flex gap-1 items-center">
              <input
                type="text"
                v-model="editingDrone.id"
                class="border rounded px-2 py-1 w-32"
                autocomplete="off"
                spellcheck="false"
              />
              <button
                @click="validateDroneId"
                class="bg-green-600 hover:bg-green-800 text-white rounded p-1 flex items-center"
                :class="{
                  'cursor-pointer': editingDrone.id && !isDuplicateDroneId,
                  'cursor-not-allowed': !editingDrone.id || isDuplicateDroneId,
                }"
                :disabled="!editingDrone.id || isDuplicateDroneId"
              >
                ✔️
              </button>
              <button
                @click="cancelAddDrone"
                class="bg-red-600 hover:bg-red-800 text-white rounded p-1 flex items-center ml-2 cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <span v-show="isDuplicateDroneId" class="text-red-600 text-xs"> ID déjà utilisé </span>
          </div>

          <div class="flex flex-col gap-2" v-if="droneCreation">
            <div
              v-if="editingDrone.lon === undefined || editingDrone.lat === undefined"
              class="text-sm text-sky-700 dark:text-sky-300 font-semibold"
            >
              Cliquez sur la carte pour positionner le drone.
            </div>
            <div v-else class="flex gap-2 items-center">
              <span class="font-semibold">Position :</span>
              <span v-if="editingDrone.lon !== undefined">Lon: {{ editingDrone.lon.toFixed(5) }}</span>
              <span v-if="editingDrone.lat !== undefined">Lat: {{ editingDrone.lat.toFixed(5) }}</span>
            </div>
            <div class="flex gap-2 items-center">
              <span class="font-semibold">Altitude :</span>
              <input type="range" min="0" :max="altitudeMax" v-model.number="editingDrone.alt" class="w-32" />
              <span>{{ editingDrone.alt }} m</span>
              <input type="number" min="1" v-model.number="altitudeMax" class="border w-16 p-1 rounded ml-2" />
              <span class="text-xs">max</span>
            </div>
            <div class="flex gap-2 items-center">
              <span class="font-semibold">FOV :</span>
              <input type="range" min="30" max="120" step="1" v-model.number="editingDrone.gimbal.fov" class="w-24" />
              <span>{{ editingDrone.gimbal.fov }}°</span>
            </div>
            <div class="flex gap-2 items-center">
              <span class="font-semibold">Zoom :</span>
              <input type="range" min="1" max="10" step="1" v-model.number="editingDrone.gimbal.zoom" class="w-24" />
              <span>{{ editingDrone.gimbal.zoom }}</span>
            </div>
            <div class="flex gap-2 items-center">
              <span class="font-semibold">Yaw :</span>
              <input type="range" min="0" max="359" step="1" v-model.number="editingDrone.gimbal.yaw" class="w-24" />
              <span>{{ editingDrone.gimbal.yaw }}°</span>
            </div>
            <div class="flex gap-2 items-center">
              <span class="font-semibold">Pitch :</span>
              <input type="range" min="-90" max="0" step="1" v-model.number="editingDrone.gimbal.pitch" class="w-24" />
              <span>{{ editingDrone.gimbal.pitch }}°</span>
            </div>
            <div class="flex gap-2 mt-1">
              <button
                @click="saveEditingDrone"
                :disabled="
                  !editingDrone ||
                  editingDrone.lon === undefined ||
                  editingDrone.lat === undefined ||
                  !editingDrone.id ||
                  !droneCreation
                "
                class="bg-sky-700 hover:bg-sky-900 text-white px-3 py-1 rounded text-sm"
              >
                Enregistrer
              </button>

              <button
                @click="cancelAddDrone"
                class="bg-gray-300 hover:bg-gray-400 text-black px-3 py-1 rounded text-sm"
              >
                Annuler
              </button>

              <button
                v-if="currentDrone.added && !cesiumMapRef?.isCesiumEntitySelected()"
                @click="selectCurrentDroneOnMap"
                class="bg-green-200 hover:bg-green-400 text-black px-3 py-1 rounded text-sm"
              >
                Sélectionner le drone
              </button>
              <button
                v-if="currentDrone.added && cesiumMapRef?.isCesiumEntitySelected()"
                @click="deselectDroneOnMap"
                class="bg-yellow-200 hover:bg-yellow-400 text-black px-3 py-1 rounded text-sm"
              >
                Désélectionner le drone
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- drones list with create drone button -->
      <div v-else class="flex flex-col gap-1 max-h-[40vh] overflow-y-auto">
        <button
          type="button"
          @click="newDrone"
          class="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-sm self-start mb-2 cursor-pointer"
        >
          Ajouter un drone
        </button>

        <div
          v-for="drone in drones"
          :key="drone.id"
          class="flex flex-wrap items-center gap-2 bg-slate-300 text-black dark:bg-slate-700 dark:text-white rounded px-2 py-1"
        >
          <span class="font-semibold">{{ drone.id }}</span>
          <span class="text-xs">
            (
            <span v-if="drone.lon !== undefined">{{ drone.lon.toFixed(5) }}</span
            >, <span v-if="drone.lat !== undefined">{{ drone.lat.toFixed(5) }}</span
            >, {{ drone.alt }}m)
          </span>
          <span class="text-xs">Yaw: {{ drone.gimbal?.yaw ?? 0 }}</span>
          <span class="text-xs">Pitch: {{ drone.gimbal?.pitch ?? 0 }}</span>
          <span class="text-xs">FOV: {{ drone.gimbal?.fov ?? 0 }}</span>
          <span class="text-xs">Zoom: {{ drone.gimbal?.zoom ?? 0 }}</span>

          <button
            @click="cesiumMapRef?.focusOnCesiumEntityById(drone.id ?? '')"
            class="flex items-center gap-1 bg-blue-600 hover:bg-blue-800 text-white text-xs px-2 py-1 rounded transition-colors duration-100 cursor-pointer"
          >
            <span>👁️</span>
            <span>Voir</span>
          </button>

          <button
            @click="deleteDrone(drone.id)"
            class="flex items-center gap-1 bg-red-600 hover:bg-red-800 text-white text-xs px-2 py-1 rounded transition-colors duration-100 cursor-pointer"
          >
            <span>🗑️</span>
            <span>Supprimer</span>
          </button>
        </div>
      </div>
    </DraggableResizable>
  </div>
</template>
