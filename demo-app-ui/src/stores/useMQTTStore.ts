import { defineStore } from "pinia";
import { ref } from "vue";
import { initMQTT, disconnectMQTT, subscribe, unsubscribe } from "../services/mqttService";
import type { Drone } from "../types/Drone";
import type { Telemetry } from "../types/Telemetry";
import type { IExclusionZone, IMission, IWaypoint } from "../types/CesiumMap";

const apiUrl = import.meta.env.VITE_API_URL;

type Topics =
  | "drones/added"
  | "drones/removed"
  | "drones/updated"
  | "drone/telemetry"
  | "drone/video"
  | "waypoints/added"
  | "waypoints/removed";

const eventCallbacks = Object.fromEntries(
  (Object.keys({} as Record<Topics, unknown>) as Topics[]).map((t) => [t, [] as Function[]])
) as Record<Topics, Function[]>;

export const useMQTTStore = defineStore("mqtt", () => {
  const drones = ref<Drone[]>([]);
  const missionsWaypoints = ref<IMission[]>([]);
  const exclusionZones = ref<IExclusionZone[]>([]);
  const selectedMissionId = ref<string | null>(null);

  function getEventCallback(event: Topics, callback: Function) {
    if (!eventCallbacks[event]) {
      eventCallbacks[event] = [];
    }
    eventCallbacks[event].push(callback);
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
    } catch (e) {
      alert("Erreur lors du chargement des drones");
    }
  }

  async function fetchMissionsWaypoints() {
    try {
      const res = await fetch(`${apiUrl}/api/waypoints`);
      if (!res.ok) throw new Error("Erreur API waypoints");
      const data = await res.json();
      if (Array.isArray(data)) {
        missionsWaypoints.value = data;
      }
    } catch (e) {
      console.error("Erreur lors de la récupération des missions waypoints:", e);
    }
  }

  async function fetchExclusionZones() {
    try {
      const res = await fetch(`${apiUrl}/api/exclusion-zones`);
      if (!res.ok) throw new Error("Erreur API exclusion zones");
      const data = await res.json();
      if (Array.isArray(data)) {
        exclusionZones.value = data;
      }
    } catch (e) {
      console.error("Erreur lors de la récupération des zones d'exclusion:", e);
    }
  }

  async function subscribeMQTT() {
    await initMQTT();

    subscribe("drones/added", (drone: Drone) => {
      if (!drones.value.some((d) => d.id === drone.id)) {
        drones.value.push(drone);
        if (eventCallbacks["drones/added"]) eventCallbacks["drones/added"].forEach((cb) => cb(drone));
      }
    });

    subscribe("drones/removed", (id: string) => {
      const idx = drones.value.findIndex((d) => d.id === id);
      if (idx !== -1) {
        drones.value.splice(idx, 1);
        if (eventCallbacks["drones/removed"]) eventCallbacks["drones/removed"].forEach((cb) => cb(id));
      }
    });

    subscribe("drones/updated", (drone: Drone) => {
      const idx = drones.value.findIndex((d) => d.id === drone.id);
      if (idx !== -1) {
        drones.value[idx] = { ...drones.value[idx], ...drone };
        if (eventCallbacks["drones/updated"]) eventCallbacks["drones/updated"].forEach((cb) => cb(drone));
      }
    });

    subscribe("waypoints/added", (payload: { missionId: string; waypoint: IWaypoint }) => {
      const { missionId, waypoint } = payload;
      let mission = missionsWaypoints.value.find((m) => m.id === missionId);
      if (!mission) {
        mission = { id: missionId, waypoints: [], description: "", authorId: -1 };
        missionsWaypoints.value.push(mission);
      }
      if (!mission.waypoints.some((wp) => wp.id === waypoint.id)) {
        mission.waypoints.push(waypoint);
      }
      if (eventCallbacks["waypoints/added"]) eventCallbacks["waypoints/added"].forEach((cb) => cb(payload));
    });

    subscribe("waypoints/removed", (payload: { missionId: string; waypointId: string }) => {
      const { missionId, waypointId } = payload;
      const mission = missionsWaypoints.value.find((m) => m.id === missionId);
      if (mission) {
        mission.waypoints = mission.waypoints.filter((wp) => wp.id !== waypointId);
      }
      if (eventCallbacks["waypoints/removed"]) eventCallbacks["waypoints/removed"].forEach((cb) => cb(payload));
    });

    subscribe("drone/telemetry", (telemetry: Telemetry) => {
      if (eventCallbacks["drone/telemetry"]) eventCallbacks["drone/telemetry"].forEach((cb) => cb(telemetry));
    });

    subscribe("drone/video", (video: { url: string }) => {
      if (eventCallbacks["drone/video"]) eventCallbacks["drone/video"].forEach((cb) => cb(video));
    });
  }

  function unsubscribeMQTT() {
    disconnectMQTT();

    unsubscribe("drones/added");
    unsubscribe("drones/removed");
    unsubscribe("drones/updated");
    unsubscribe("drone/telemetry");
    unsubscribe("drone/video");
  }

  const exportRefs = { drones, missionsWaypoints, exclusionZones, selectedMissionId };
  const exportFunctions = { fetchDrones, fetchMissionsWaypoints, fetchExclusionZones };

  return { ...exportRefs, ...exportFunctions, subscribeMQTT, unsubscribeMQTT, getEventCallback };
});
